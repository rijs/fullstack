var rijs = (function () {
'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var rijs_components = createCommonjsModule(function (module) {
// -------------------------------------------
// API: Renders specific nodes, resources or everything
// -------------------------------------------
// ripple.draw()                 - redraw all components on page
// ripple.draw(element)          - redraw specific element
// ripple.draw.call(element)     - redraw specific element
// ripple.draw.call(selection)   - redraw D3 selection
// ripple.draw('name')           - redraw elements that depend on resource
// ripple.draw({ ... })          - redraw elements that depend on resource
// MutationObserver(ripple.draw) - redraws element being observed

module.exports = function components(ripple){
  if (!client) { return ripple }
  log('creating');
  
  ripple.draw = Node.prototype.draw = draw(ripple);
  ripple.render = render(ripple);
  ripple.on('change.draw', ripple.draw);
  ready(start(ripple));
  return ripple
};

// public draw api
function draw(ripple){
  return function(thing) { 
    return this && this.nodeName        ? invoke(ripple)(this)
         : this && this.node            ? invoke(ripple)(this.node())
         : !thing                       ? everything(ripple)
         : thing    instanceof mutation ? invoke(ripple)(thing.target)
         : thing[0] instanceof mutation ? invoke(ripple)(thing[0].target)
         : thing.nodeName               ? invoke(ripple)(thing)
         : thing.node                   ? invoke(ripple)(thing.node())
         : thing.name                   ? resource(ripple)(thing.name)
         : is.str(thing)                ? resource(ripple)(thing)
         : err('could not update', thing)
  }
}

var start = function (ripple) { return function (d) { return all('*')
  .filter(by('nodeName', includes('-')))
  .map(ripple.draw); }; };

// render all components
var everything = function (ripple) {
  var selector = values(ripple.resources)
    .map(function (res) { return (ripple.types[res.headers['content-type']].selector || noop)(res); })
    .join(',');

  return all(selector || null)
    .map(invoke(ripple))
};

// render all elements that depend on the resource
var resource = function (ripple) { return function (name) { 
  var res  = ripple.resources[name]
      , type = res.headers['content-type'];

  return all((ripple.types[type].selector || noop)(res))
    .map(invoke(ripple))
}; };

// batch renders on render frames
var batch = function (ripple) { return function (el) {
  if (!el.pending) {
    el.pending = [];
    requestAnimationFrame(function (d) {
      el.changes = el.pending;
      delete el.pending;
      ripple.render(el);
    });    
  }

  if (ripple.change) 
    { el.pending.push(ripple.change[1]); }
}; };

// main function to render a particular custom element with any data it needs
var invoke = function (ripple) { return function (el) { 
  if (!includes('-')(el.nodeName)) { return }
  if (el.nodeName == '#document-fragment') { return invoke(ripple)(el.host) }
  if (el.nodeName == '#text') { return invoke(ripple)(el.parentNode) }
  if (!el.matches(isAttached)) { return }
  if (attr(el, 'inert') != null) { return }
  return batch(ripple)(el), el
}; };

var render = function (ripple) { return function (el) {
  var root = el.shadowRoot || el
    , deps = attr(el, 'data')
    , data = bodies(ripple)(deps)
    , fn   = body(ripple)(lo(el.tagName))
    , isClass = fn && fn.prototype && fn.prototype.render;

  if (!fn) { return el }
  if (deps && !data) { return el }
  if (isClass && root.class != fn) {
    Object.getOwnPropertyNames((root.class = fn).prototype)
      .map(function (method) { return root[method] = fn.prototype[method].bind(root); });

    Promise
      .resolve((root.init || noop).call(root, root, root.state = root.state || {}))
      .then(function (d) { return ripple.draw(root.initialised = root); });
    return el
  }
  if (isClass && !root.initialised) { return }

  try {
    (root.render || fn).call(root, root, defaults(el, data));
  } catch (e) {
    err(e, e.stack);
  }

  return el
}; };

// helpers
var defaults = function (el, data) {
  el.state = el.state || {};
  overwrite(el.state)(data);
  overwrite(el.state)(el.__data__);
  el.__data__ = el.state;
  return el.state
};

var bodies = function (ripple) { return function (deps) {
  var o = {}
    , names = deps ? deps.split(' ') : [];

  names.map(function (d) { return o[d] = body(ripple)(d); });

  return !names.length            ? undefined
       : values(o).some(is.falsy) ? undefined 
       : o
}; };

var body = function (ripple) { return function (name) { return ripple.resources[name] && ripple.resources[name].body; }; };

var overwrite = window.overwrite
    , includes = window.includes
    , client = true
    , values = window.values
    , ready = window.ready
    , attr = window.attr
    , noop = window.noop
    , time = window.time
    , key = window.key
    , all = window.all
    , is = window.is
    , by = window.by
    , lo = window.lo
    , log = window.log('[ri/components]')
    , err = window.err('[ri/components]')
    , mutation = client && window.MutationRecord || noop
    , customs = client && !!window.document.registerElement
    , isAttached = customs
                  ? 'html *, :host-context(html) *'
                  : 'html *';
client && (window.Element.prototype.matches = window.Element.prototype.matches || window.Element.prototype.msMatchesSelector);
});

// -------------------------------------------
// Exposes a convenient global instance 
// -------------------------------------------
var rijs_singleton = function singleton(ripple){
  log('creating');
  if (!owner.ripple) { owner.ripple = ripple; }
  return ripple
};

var owner = window;
var log = window.log('[ri/singleton]');

var rijs_features = createCommonjsModule(function (module) {
// -------------------------------------------
// Extend Components with Features
// -------------------------------------------
module.exports = function features(ripple){
  if (!client) { return }
  log('creating');
  ripple.render = render(ripple)(ripple.render);
  return ripple
};

var render = function (ripple) { return function (next) { return function (el) {
  var features = str(attr(el, 'is'))
          .split(' ')
          .map(from(ripple.resources))
          .filter(header('content-type', 'application/javascript'))
      , css = str(attr('css')(el)).split(' ');

  features
    .filter(by('headers.needs', includes('[css]')))
    .map(key('name'))
    .map(append('.css'))
    .filter(not(is.in(css)))
    .map(function (d) { return attr('css', (str(attr('css')(el)) + ' ' + d).trim())(el); });

  var node = next(el);

  return !node || !node.state ? undefined
       : (features
          .map(key('body'))
          .map(function (d) { return d.call(node.shadowRoot || node, node.shadowRoot || node, node.state); }), node)
}; }; };

var log = window.log('[ri/features]')
    , includes = window.includes
    , client = true
    , header = window.header
    , append = window.append
    , attr = window.attr
    , from = window.from
    , not = window.not
    , str = window.str
    , key = window.key
    , by = window.by
    , is = window.is;
});

// -------------------------------------------
// API: Cache to and Restore from localStorage
// -------------------------------------------
var rijs_offline = function offline(ripple){
  if (!client$1 || !window.localStorage) { return; }
  log$1('creating');
  load(ripple);
  ripple.on('change.cache', debounce(1000)(cache(ripple)));
  return ripple
};

var load = function (ripple) { return group('loading cache', function (d) { return (parse(localStorage.ripple) || [])
    .map(ripple); }); };

var cache = function (ripple) { return function (res) {
  log$1('cached');
  var cachable = values(clone(ripple.resources))
    .filter(not(header('cache', 'no-store')));

  cachable
    .filter(header('content-type', 'application/javascript'))
    .map(function (d) { return d.body = str(ripple.resources[d.name].body); } );

  localStorage.ripple = str(cachable);
}; };

var debounce = window.debounce;
var header = window.header;
var client$1 = true;
var values = window.values;
var clone = window.clone;
var parse = window.parse;
var group = window.group;
var not = window.not;
var str = window.str;
var log$1 = window.log('[ri/offline]');
var err = window.err('[ri/offline]');

var cssscope = function scope(styles, prefix) {
  return styles
    .replace(/^(?!.*:host)([^@%\n]*){/gim, function($1){ return prefix+' '+$1 })       // ... {                 -> tag ... {
    .replace(/^(?!.*:host)(.*?),\s*$/gim, function($1){ return prefix+' '+$1 })        // ... ,                 -> tag ... ,
    .replace(/:host\((.*?)\)/gi, function($1, $2){ return prefix+$2 })                 // :host(...)            -> tag...
    .replace(/:host([ ,])/gi, function($1, $2){ return prefix+$2 })                                                 // :host ...             -> tag ...
    .replace(/^.*:host-context\((.*)\)/gim, function($1, $2){ return $2+' ' +prefix }) // ... :host-context(..) -> ... tag..
};

var rijs_precss = createCommonjsModule(function (module) {
// -------------------------------------------
// Pre-applies Scoped CSS [css=name]
// -------------------------------------------
module.exports = function precss(ripple){
  if (!client) { return; }
  log('creating');  
  ripple.render = render(ripple)(ripple.render);
  return ripple
};

var render = function (ripple) { return function (next) { return function (host) {
  var css = str(attr(host, 'css')).split(' ').filter(Boolean)
    , root = host.shadowRoot || host
    , head = document.head
    , shadow = head.createShadowRoot && host.shadowRoot;

  // this host does not have a css dep, continue with rest of rendering pipeline
  if (!css.length) { return next(host) }
  
  // this host has a css dep, but it is not loaded yet - stop rendering this host
  if (css.some(not(is.in(ripple.resources)))) { return; }

  css
    // reuse or create style tag
    .map(function (d) { return ({ 
      res: ripple.resources[d] 
    , el: raw(("style[resource=\"" + d + "\"]"), shadow ? root : head) || el(("style[resource=" + d + "]")) 
    }); })
    // check if hash of styles changed
    .filter(function (d, i) { return d.el.hash != d.res.headers.hash; })
    .map(function (d, i) {
      d.el.hash = d.res.headers.hash;
      d.el.innerHTML = shadow ? d.res.body : transform(d.res.body, d.res.name);
      return d.el
    })
    .filter(not(by('parentNode')))
    .map(function (d) { return shadow ? root.insertBefore(d, root.firstChild) : head.appendChild(d); });

  // continue with rest of the rendering pipeline
  return next(host)
}; }; };

var transform = function (styles, name) { return cssscope(styles, '[css~="' + name + '"]'); };

var log = window.log('[ri/precss]')
    , client = true
    , attr = window.attr
    , raw = window.raw
    , str = window.str
    , not = window.not
    , by = window.by
    , is = window.is
    , el = window.el;
});

var rijs_needs = createCommonjsModule(function (module) {
// -------------------------------------------
// Define Default Attributes for Components
// -------------------------------------------
module.exports = function needs(ripple){
  if (!client) { return; }
  log('creating');
  ripple.render = render(ripple)(ripple.render);
  return ripple
};

var render = function (ripple) { return function (next) { return function (el) {
  var component = lo(el.nodeName);
  if (!(component in ripple.resources)) { return }
    
  var headers = ripple.resources[component].headers
      , attrs = headers.attrs = headers.attrs || parse(headers.needs, component);

  return attrs
    .map(function (ref) {
      var name = ref[0];
      var values = ref[1];
 
      return values.some(function (v, i) {
        var from = attr(el, name) || '';
        return includes(v)(from) ? false
             : attr(el, name, (from + ' ' + v).trim())
      }) 
    })
    .some(Boolean) ? el.draw() : next(el)
}; }; };

var parse = function (attrs, component) {
  if ( attrs === void 0 ) attrs = '';

  return attrs
  .split('[')
  .slice(1)
  .map(replace(']', ''))
  .map(split('='))
  .map(function (ref) {
        var k = ref[0];
        var v = ref[1];

        return v          ? [k, v.split(' ')]
    : k == 'css' ? [k, [component + '.css']]
                 : [k, []];
  }
  );
};

var log = window.log('[ri/needs]')
    , err = window.err('[ri/needs]')
    , includes = window.includes
    , replace = window.replace
    , client = true
    , split = window.split
    , attr = window.attr
    , key = window.key
    , lo = window.lo;
});

var nanosocket = function(url){
  if ( url === void 0 ) url = location.href.replace('http', 'ws');

  var io = emitterify({ attempt: 0 });
  io.ready = io.once('connected');
  io.connect = connect(io, url);
  io.connect(); 
  io.send = function (data) { return io.ready.then(function (socket) { return socket.send(data); }); };
  return io
};

var emitterify = window.emitterify;
var min = Math.min;
var pow = Math.pow;

var connect = function (io, url) { return function () {
  var WebSocket = window.WebSocket;
  var location = window.location;
  var setTimeout = window.setTimeout;
  var socket = new WebSocket(url);
  socket.onopen = function (d) { return io.emit('connected', socket); };
  socket.onmessage = function (d) { return io.emit('recv', d.data); };
  socket.onclose = function (d) { 
    io.ready = io.once('connected');
    io.emit('disconnected');
    setTimeout(io.connect, backoff(++io.attempt));
  };
}; };

var backoff = function (attempt, base, cap) {
    if ( base === void 0 ) base = 100;
    if ( cap === void 0 ) cap = 10000;

    return min(cap, base * pow(2, attempt));
};

var cryo = createCommonjsModule(function (module) {
/**
 * JSON + Object references wrapper
 *
 * @author Hunter Loftis <hunter@skookum.com>
 * @license The MIT license.
 * @copyright Copyright (c) 2010 Skookum, skookum.com
 */

(function() {

  var CONTAINER_TYPES = 'object array date function'.split(' ');

  var REFERENCE_FLAG = '_CRYO_REF_';
  var INFINITY_FLAG = '_CRYO_INFINITY_';
  var FUNCTION_FLAG = '_CRYO_FUNCTION_';
  var UNDEFINED_FLAG = '_CRYO_UNDEFINED_';
  var DATE_FLAG = '_CRYO_DATE_';

  var OBJECT_FLAG = '_CRYO_OBJECT_';
  var ARRAY_FLAG = '_CRYO_ARRAY_';

  function typeOf(item) {
    if (typeof item === 'object') {
      if (item === null) { return 'null'; }
      if (item && item.nodeType === 1) { return 'dom'; }
      if (item instanceof Array) { return 'array'; }
      if (item instanceof Date) { return 'date'; }
      return 'object';
    }
    return typeof item;
  }

  // Same as and copied from _.defaults
  function defaults(obj) {
    var arguments$1 = arguments;

    var length = arguments.length;
    if (length < 2 || obj == null) { return obj; }
    for (var index = 1; index < length; index++) {
      var source = arguments$1[index],
          keys = Object.keys(source),
          l = keys.length;
      for (var i = 0; i < l; i++) {
        var key = keys[i];
        if (obj[key] === void 0) { obj[key] = source[key]; }
      }
    }
    return obj;
  }

  function stringify(item, options) {
    var references = [];

    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
    options = typeof options === 'function' ? { prepare: options } : options;
    options = defaults(options || {}, {
      prepare: null,
      isSerializable: function(item, key) {
        return item.hasOwnProperty(key);
      }
    });

    var root = cloneWithReferences(item, references, options);

    return JSON.stringify({
      root: root,
      references: references
    });
  }

  function cloneWithReferences(item, references, options, savedItems) {
    // invoke callback before any operations related to serializing the item
    if (options.prepare) { options.prepare(item); }

    savedItems = savedItems || [];
    var type = typeOf(item);

    // can this object contain its own properties?
    if (CONTAINER_TYPES.indexOf(type) !== -1) {
      var referenceIndex = savedItems.indexOf(item);
      // do we need to store a new reference to this object?
      if (referenceIndex === -1) {
        var clone = {};
        referenceIndex = references.push({
          contents: clone,
          value: wrapConstructor(item)
        }) - 1;
        savedItems[referenceIndex] = item;
        for (var key in item) {
          if (options.isSerializable(item, key)) {
            clone[key] = cloneWithReferences(item[key], references, options, savedItems);
          }
        }
      }

      // return something like _CRYO_REF_22
      return REFERENCE_FLAG + referenceIndex;
    }

    // return a non-container object
    return wrap(item);
  }

  function parse(string, options) {
    var json = JSON.parse(string);

    // Backward compatibility with 0.0.6 that exepects `options` to be a callback.
    options = typeof options === 'function' ? { finalize: options } : options;
    options = defaults(options || {}, { finalize: null });

    return rebuildFromReferences(json.root, json.references, options);
  }

  function rebuildFromReferences(item, references, options, restoredItems) {
    restoredItems = restoredItems || [];
    if (starts(item, REFERENCE_FLAG)) {
      var referenceIndex = parseInt(item.slice(REFERENCE_FLAG.length), 10);
      if (!restoredItems.hasOwnProperty(referenceIndex)) {
        var ref = references[referenceIndex];
        var container = unwrapConstructor(ref.value);
        var contents = ref.contents;
        restoredItems[referenceIndex] = container;
        for (var key in contents) {
          container[key] = rebuildFromReferences(contents[key], references, options, restoredItems);
        }
      }

      // invoke callback after all operations related to serializing the item
      if (options.finalize) { options.finalize(restoredItems[referenceIndex]); }

      return restoredItems[referenceIndex];
    }

    // invoke callback after all operations related to serializing the item
    if (options.finalize) { options.finalize(item); }

    return unwrap(item);
  }

  function wrap(item) {
    var type = typeOf(item);
    if (type === 'undefined') { return UNDEFINED_FLAG; }
    if (type === 'function') { return FUNCTION_FLAG + item.toString(); }
    if (type === 'date') { return DATE_FLAG + item.getTime(); }
    if (item === Infinity) { return INFINITY_FLAG; }
    if (type === 'dom') { return undefined; }
    return item;
  }

  function wrapConstructor(item) {
    var type = typeOf(item);
    if (type === 'function' || type === 'date') { return wrap(item); }
    if (type === 'object') { return OBJECT_FLAG; }
    if (type === 'array') { return ARRAY_FLAG; }
    return item;
  }

  function unwrapConstructor(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) { return undefined; }
      if (starts(val, FUNCTION_FLAG)) {
        return (new Function("return " + val.slice(FUNCTION_FLAG.length)))();
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (starts(val, OBJECT_FLAG)) {
        return {};
      }
      if (starts(val, ARRAY_FLAG)) {
        return [];
      }
      if (val === INFINITY_FLAG) { return Infinity; }
    }
    return val;
  }

  function unwrap(val) {
    if (typeOf(val) === 'string') {
      if (val === UNDEFINED_FLAG) { return undefined; }
      if (starts(val, FUNCTION_FLAG)) {
        var fn = val.slice(FUNCTION_FLAG.length);
        var argStart = fn.indexOf('(') + 1;
        var argEnd = fn.indexOf(')', argStart);
        var args = fn.slice(argStart, argEnd);
        var bodyStart = fn.indexOf('{') + 1;
        var bodyEnd = fn.lastIndexOf('}') - 1;
        var body = fn.slice(bodyStart, bodyEnd);
        return new Function(args, body);
      }
      if (starts(val, DATE_FLAG)) {
        var dateNum = parseInt(val.slice(DATE_FLAG.length), 10);
        return new Date(dateNum);
      }
      if (val === INFINITY_FLAG) { return Infinity; }
    }
    return val;
  }

  function starts(string, prefix) {
    return typeOf(string) === 'string' && string.slice(0, prefix.length) === prefix;
  }

  var Cryo = {
    stringify: stringify,
    parse: parse
  };

  // global on server, window in browser
  var root = this;

  // AMD / RequireJS
  if (typeof undefined !== 'undefined' && undefined.amd) {
    undefined('Cryo', [], function () {
      return Cryo;
    });
  }

  // node.js
  else if ('object' !== 'undefined' && module.exports) {
    module.exports = Cryo;
  }

  // included directly via <script> tag
  else {
    root.Cryo = Cryo;
  }

})();
});

var client$4 = createCommonjsModule(function (module) {
module.exports = function(ref){
  if ( ref === void 0 ) ref = {};
  var socket = ref.socket; if ( socket === void 0 ) socket = nanosocket();

  socket.id = 0;
  
  socket
    .once('disconnected')
    .map(function (d) { return socket
      .on('connected')
      .map(reconnect(socket)); }
    );

  socket
    .on('recv')
    .map(function (d) { return parse(d); })
    .each(function (ref) {
      var id = ref.id;
      var data = ref.data;

      return data.exec
      ? data.exec(socket.on[("$" + id)] && socket.on[("$" + id)][0], data.value)
      : socket.emit(("$" + id), data);
  }
    );

  return Object.defineProperty(send(socket)
    , 'subscriptions'
    , { get: function (d) { return subscriptions(socket); } }
    )
};

var subscriptions = function (socket) { return values(socket.on)
  .map(function (d) { return d && d[0]; })
  .filter(function (d) { return d && d.type && d.type[0] == '$'; }); };

var reconnect = function (socket) { return function () { return subscriptions(socket)
  .map(function (d) { return d.type; })
  .map(function (d) { return socket.send(socket.on[d][0].subscription); }); }; };

var emitterify = window.emitterify
    , values = window.values
    , str = window.str;
var parse = cryo.parse;

var send = function (socket, type) { return function (data, meta) {
  if (data instanceof window.Blob) 
    { return binary(socket, data, meta) }

  var id = str(++socket.id)
      , output = socket.on(("$" + id))
      , next = function (data, count) {
        if ( count === void 0 ) count = 0;

        return socket
          .send(output.source.subscription = str({ id: id, data: data, type: type }))
          .then(function (d) { return output.emit('sent', { id: id, count: count }); });
  };

  data.next 
    ? data.map(next).source.emit('start')
    : next(data);

  output
    .source
    .once('stop')
    .filter(function (reason) { return reason != 'CLOSED'; })
    .map(function (d) { return send(socket, 'UNSUBSCRIBE')(id)
      .filter(function (d, i, n) { return n.source.emit('stop', 'CLOSED'); }); }
    );

  return output
}; };

var binary = function (socket, blob, meta, start, blockSize) {
  if ( start === void 0 ) start = 0;
  if ( blockSize === void 0 ) blockSize = 1024;

  var output = emitterify().on('recv')
      , next = function (id) { return function () { return start >= blob.size 
            ? output.emit('sent', { id: id })
            : ( socket.send(blob.slice(start, start += blockSize)), window.setTimeout(next(id))); }; };

  send(socket, 'BINARY')({ size: blob.size, meta: meta })
    .on('sent', function (ref) {
      var id = ref.id;

      return next(id)();
  })
    .on('progress', function (received) { return output.emit('progress', { received: received, total: blob.size }); })
    .map(output.next)
    .source
    .until(output.once('stop'));

  return output
};
});

var client$2 = createCommonjsModule(function (module) {
module.exports = function sync(
  ripple
, ref
, ref$1
){
  if ( ref === void 0 ) ref = {};
  if ( ref$1 === void 0 ) ref$1 = {};
  var xrs = ref$1.xrs; if ( xrs === void 0 ) xrs = client$4;

  ripple.send = send(xrs());
  ripple.subscribe = subscribe(ripple);
  ripple.subscriptions = {};
  ripple.get = get(ripple);
  ripple.upload = upload(ripple);
  ripple.upload.id = 0;
  ripple.render = render(ripple)(ripple.render);
  ripple.deps = deps(ripple);
  return ripple
};

var send = function (xrs) { return function (name, type, value) { return name instanceof Blob ? xrs(name, type)
: is.obj(name)         ? xrs(name)
                       : xrs({ name: name, type: type, value: value }); }; };

var get = function (ripple) { return function (name, k) {
  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
  if (is.arr(k)) { return Promise.all(k.map(function (k) { return ripple.get(name, k); })) }
  var existing = key(k)(key(("resources." + name + ".body"))(ripple));

  return k in ripple.subscriptions[name] && existing 
    ? Promise.resolve(existing)
    : ripple
        .subscribe(name, k)
        .filter(function (d, i, n) { return n.source.emit('stop'); })
        .map(function (d) { return key(k)(key(("resources." + name + ".body"))(ripple)); })
}; }; 

var cache = function (ripple, name, k) { return function (change) {
  // if (k && !change.key && change.type == 'update')
  //   change = { type: 'update', key: k, value: change.value[k] }
  !change.key && change.type == 'update'
    ? ripple(body(extend({ name: name })(change)))
    : set(change)(name in ripple.resources ? ripple(name) : ripple(name, {}));
  return change
}; };

// TODO: factor out
var merge = function (streams) {
  var output = emitterify().on('next')
      , latest = [];

  streams.map(function ($, i) { return $.each(function (value) {
      latest[i] = value;
      output.next(latest);
    }); }
  );

  output
    .once('stop')
    .map(function (d) { return streams.map(function ($) { return $.source.emit('stop'); }); });

  return output
};

var subscribe = function (ripple) { return function (name, k) {
  if (is.arr(name)) { return merge(name.map(function (n) { return ripple.subscribe(n, k); })) }
  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
  if (is.arr(k)) { return merge(k.map(function (k) { return ripple.subscribe(name, k); })).map(function (d) { return key(k)(ripple(name)); }) } // merge(ripple, name, k)
  var output = emitterify().on('next');

  output
    .on('stop')
    .filter(function () { return raw.off(output.next) && !raw.li.length; })
    .map(function () { return raw.source.emit('stop'); })
    .map(function () { ripple.subscriptions[name][k] = undefined; });

  if (ripple.subscriptions[name][k])
    { output
      .on('start')
      .map(function () { return key(k)(ripple(name)); })
      .filter(is.def)
      .map(function (initial) { return output.next(initial); }); }

  var raw = ripple.subscriptions[name][k] = ripple.subscriptions[name][k] || ripple
    .send(name, 'SUBSCRIBE', k)
    .map(cache(ripple, name, k))
    .map(function (d) { return key(k)(ripple(name)); });
    // .reduce((acc = {}, d, i) => i ? set(d)(acc) : d.value)
    
  raw.each(output.next);
  
  return output
}; };

var upload = function (ripple) { return function (name, form) {
  var index = ++ripple.upload.id
    , fields = {}
    , size = 0
    , next = function () {
        if (!files.length) { return true }
        var ref = files.shift();
        var field = ref.field;
        var filename = ref.filename;
        var i = ref.i;
        var blob = ref.blob;
        return ripple
          .send(blob, { filename: filename, field: field, i: i, index: index })
          .on('progress', function (ref) {
            var received = ref.received;
            var total = ref.total;

            return output.emit('progress', {
            total: size
          , received: 
              size
            - (blob.size - received)
            - files.reduce(function (acc, d) { return (acc += d.blob.size); }, 0)
          });
        })
          .then(next)
      };

  var files = keys(form)
    .map(function (field) { return (fields[field] = form[field], field); })
    .filter(function (field) { return form[field] instanceof FileList; })
    .map(function (field) { 
      fields[field] = [];
      return to.arr(form[field])
        .map(function (f) { return (size += f.size, f); })
        .map(function (f, i) { return ({ field: field, filename: f.name, i: i, blob: f, sent: 0 }); })
    })
    .reduce(flatten, []);

  var output = ripple.send({ 
    files: files.length
  , type: 'PREUPLOAD'
  , fields: fields
  , index: index
  , size: size 
  , name: name
  }).once('sent', next);

  return output
}; };

var body = function (ref) {
  var name = ref.name;
  var value = ref.value;
  var headers = ref.headers;

  return ({ name: name, headers: headers, body: value });
};

var render = function (ripple) { return function (next) { return function (el) { return ripple.deps(el)
  .filter(not(is.in(ripple.subscriptions)))
  .map(function (dep) { return ripple
    .subscribe(dep); }
    // TOOO: Should be .until(el.once('removed'))
    // .filter(d => !all(el.nodeName).length)
    // .map((d, i, n) => n.source.unsubscribe())
  )
  .length ? false : next(el); }; }; };

var deps = function (ripple) { return function (el) { return values(ripple.types)
  .filter(function (d) { return d.extract; })
  .map(function (d) { return d.extract(el); })
  .reduce(function (p, v) { return p.concat(v); }, [])
  .filter(Boolean); }; };

var is = window.is
    , to = window.to
    , set = window.set
    , not = window.not
    , key = window.key
    , keys = window.keys
    , flatten = window.flatten
    , extend = window.extend
    , values = window.values
    , emitterify = window.emitterify;

});

var text = {
  header: 'text/plain'
, check: function check(res){ return !includes('.html')(res.name) && !includes('.css')(res.name) && is.str(res.body) }
};

var includes = window.includes;
var is = window.is;

var rijs_core = createCommonjsModule(function (module) {
// -------------------------------------------
// API: Gets or sets a resource
// -------------------------------------------
// ripple('name')     - returns the resource body if it exists
// ripple('name')     - creates & returns resource if it doesn't exist
// ripple('name', {}) - creates & returns resource, with specified name and body
// ripple({ ... })    - creates & returns resource, with specified name, body and headers
// ripple.resources   - returns raw resources
// ripple.resource    - alias for ripple, returns ripple instead of resource for method chaining
// ripple.register    - alias for ripple
// ripple.on          - event listener for changes - all resources
// ripple('name').on  - event listener for changes - resource-specific

module.exports = function core(){
  log('creating');

  var resources = {};
  ripple.resources = resources;
  ripple.resource  = chainable(ripple);
  ripple.register  = ripple;
  ripple.types     = types();
  return emitterify(ripple)

  function ripple(name, body, headers){
    return !name                                            ? ripple
         : is.arr(name)                                     ? name.map(ripple)
         : is.promise(name)                                 ? name.then(ripple).catch(err)
         : is.obj(name) && !name.name                       ? ripple(values(name))
         : is.fn(name)  &&  name.resources                  ? ripple(values(name.resources))
         : is.str(name) && !body &&  ripple.resources[name] ? ripple.resources[name].body
         : is.str(name) && !body && !ripple.resources[name] ? undefined //register(ripple)({ name })
         : is.str(name) &&  body                            ? register(ripple)({ name: name, body: body, headers: headers })
         : is.obj(name) && !is.arr(name)                    ? register(ripple)(name)
         : (err('could not find or create resource', name), false)
  }
};

var register = function (ripple) { return function (ref) {
  var name = ref.name;
  var body = ref.body;
  var headers = ref.headers; if ( headers === void 0 ) headers = {};

  log('registering', name);
  if (is.promise(body)) { return body.then(function (body) { return register(ripple)({ name: name, body: body, headers: headers }); }).catch(err) }
  var res = normalise(ripple)({ name: name, body: body, headers: headers });

  if (!res) { return err('failed to register', name), false }
  ripple.resources[name] = res;
  ripple.emit('change', [name, { 
    type: 'update'
  , value: res.body
  , time: now(res)
  }]);
  return ripple.resources[name].body
}; };

var normalise = function (ripple) { return function (res) {
  if (!header('content-type')(res)) { values(ripple.types).sort(za('priority')).some(contentType(res)); }
  if (!header('content-type')(res)) { return err('could not understand resource', res), false }
  return parse(ripple)(res)
}; };

var parse = function (ripple) { return function (res) {
  var type = header('content-type')(res);
  if (!ripple.types[type]) { return err('could not understand type', type), false }
  return (ripple.types[type].parse || identity)(res)
}; };

var contentType = function (res) { return function (type) { return type.check(res) && (res.headers['content-type'] = type.header); }; };

var types = function () { return [text].reduce(to.obj('header'), 1); };

var chainable = function (fn) { return function() {
  return fn.apply(this, arguments), fn
}; };

var emitterify = window.emitterify
    , colorfill  = window.colorfill
    , identity   = window.identity
    , header     = window.header
    , values     = window.values
    , key        = window.key
    , is         = window.is
    , to         = window.to
    , za         = window.za
    , err = window.err('[ri/core]')
    , log = window.log('[ri/core]')
    , now = function (d, t) { return (t = key('body.log.length')(d), is.num(t) ? t - 1 : t); };
});

// -------------------------------------------
// Adds support for data resources
// -------------------------------------------
var rijs_data = function data(ripple){
  log$2('creating');
  ripple
    .on('change.data')
    .filter(function (ref) {
      var name = ref[0];
      var change = ref[1];

      return header$1('content-type', 'application/data')(ripple.resources[name]);
  })
    .filter(function (ref) {
      var name = ref[0];
      var change = ref[1];

      return change && change.key;
  })
    .map(function (ref) {
      var name = ref[0];
      var change = ref[1];

      return ripple
      .resources[name]
      .body
      .emit('change', (change || null), not$1(is$1.in(['bubble'])));
  });

  ripple.types['application/data'] = {
    header: 'application/data'
  , selector: function (res) { return ("[data~=\"" + (res.name) + "\"]"); }
  , extract: function (el) { return (attr("data")(el) || '').split(' '); }
  , check: function (res) { return is$1.obj(res.body) ? true : false; }
  , parse: function parse(res){ 
      if (is$1.str(res.body)) { res.body = fn(res.body); }
      var existing = ripple.resources[res.name] || {};

      extend(res.headers)(existing.headers);
      res.body = set()(
        res.body || []
      , existing.body && existing.body.log
      , is$1.num(res.headers.log) ? res.headers.log : -1
      );
      overwrite(res.body.on)(listeners(existing));
      res.body.on('change.bubble', function (change) {
        ripple.emit('change', ripple.change = [res.name, change], not$1(is$1.in(['data'])));
        delete ripple.change;
      });
      
      return res
    }
  };

  return ripple
};

var overwrite = window.overwrite;
var header$1 = window.header;
var extend = window.extend;
var attr = window.attr;
var not$1 = window.not;
var key = window.key;
var set = window.set;
var fn = window.fn;
var is$1 = window.is;
var log$2 = window.log('[ri/types/data]');
var listeners = key('body.on');

var rijs_css = createCommonjsModule(function (module) {
// -------------------------------------------
// Exposes a convenient global instance 
// -------------------------------------------
module.exports = function css(ripple){
  log('creating');
  ripple.types['text/css'] = {
    header: 'text/css'
  , selector: function (res) { return ("[css~=\"" + (res.name) + "\"]"); }
  , extract: function (el) { return (attr("css")(el) || '').split(' '); }
  , check: function check(res){ return includes('.css')(res.name) }
  , parse: function parse(res){ 
      res.headers.hash = djb(res.body);
      return res
    }
  };

  return ripple
};

var includes = window.includes
    , attr = window.attr
    , log = window.log('[ri/types/css]');

var djb = function (str) {
  var hash = 5381
    , i = str.length;

  while (i)
    { hash = (hash * 33) ^ str.charCodeAt(--i); }

  return hash >>> 0
};
});

// -------------------------------------------
// Adds support for function resources
// -------------------------------------------
var rijs_fn = function fnc(ripple){
  log$3('creating');
  ripple.types['application/javascript'] = { 
    selector: selector
  , extract: extract
  , header: header$2
  , check: check
  , parse: parse$1
  };
  return ripple
};

var selector = function (res) { return ((res.name) + ",[is~=\"" + (res.name) + "\"]"); };
var extract = function (el) { return (attr$1('is')(el) || '').split(' ').concat(lo(el.nodeName)); };
var header$2 = 'application/javascript';
var check = function (res) { return is$2.fn(res.body); };
var parse$1 = function (res) { return (res.body = fn$1(res.body), res); };
var log$3   = window.log('[ri/types/fn]');
  
var attr$1 = window.attr;
var str$1 = window.str;
var is$2 = window.is;
var lo = window.lo;
var fn$1 = window.fn;

var client = true;

client && !window.ripple && create();

var fullstack = create;

function create(opts){
  var ripple = rijs_core();    // empty base collection of resources
 
  // enrich..
  rijs_singleton(ripple);      // exposes a single instance
  rijs_data(ripple);           // register data types
  rijs_css(ripple);            // register css types
  rijs_fn(ripple);             // register fn types
  rijs_components(ripple);     // invoke web components, fn.call(<el>, data)
  rijs_needs(ripple);          // define default attrs for components
  rijs_precss(ripple);         // preapplies scoped css 
  rijs_offline(ripple);        // loads/saves from/to localstorage
  client$2(ripple, opts);     // syncs resources between server/client  
  rijs_features(ripple);       // extend components with features
  return ripple
}

return fullstack;

}());
