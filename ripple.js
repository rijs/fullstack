var rijs = (function () {
'use strict';

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var is_1 = is;
is.fn      = isFunction;
is.str     = isString;
is.num     = isNumber;
is.obj     = isObject;
is.lit     = isLiteral;
is.bol     = isBoolean;
is.truthy  = isTruthy;
is.falsy   = isFalsy;
is.arr     = isArray;
is.null    = isNull;
is.def     = isDef;
is.in      = isIn;
is.promise = isPromise;
is.stream  = isStream;

function is(v){
  return function(d){
    return d == v
  }
}

function isFunction(d) {
  return typeof d == 'function'
}

function isBoolean(d) {
  return typeof d == 'boolean'
}

function isString(d) {
  return typeof d == 'string'
}

function isNumber(d) {
  return typeof d == 'number'
}

function isObject(d) {
  return typeof d == 'object'
}

function isLiteral(d) {
  return typeof d == 'object' 
      && !(d instanceof Array)
}

function isTruthy(d) {
  return !!d == true
}

function isFalsy(d) {
  return !!d == false
}

function isArray(d) {
  return d instanceof Array
}

function isNull(d) {
  return d === null
}

function isDef(d) {
  return typeof d !== 'undefined'
}

function isPromise(d) {
  return d instanceof Promise
}

function isStream(d) {
  return !!(d && d.next)
}

function isIn(set) {
  return function(d){
    return !set ? false  
         : set.indexOf ? ~set.indexOf(d)
         : d in set
  }
}

var keys = function keys(o) { 
  return Object.keys(is_1.obj(o) || is_1.fn(o) ? o : {})
};

var copy = function copy(from, to){ 
  return function(d){ 
    return to[d] = from[d], d
  }
};

var overwrite = function overwrite(to){ 
  return function(from){
    keys(from)
      .map(copy(from, to));
        
    return to
  }
};

var includes = function includes(pattern){
  return function(d){
    return d && d.indexOf && ~d.indexOf(pattern)
  }
};

var client = typeof window != 'undefined';

var datum = function datum(node){
  return node.__data__
};

var wrap = function wrap(d){
  return function(){
    return d
  }
};

var str = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is_1.fn(d) ? '' + d
       : is_1.obj(d) ? JSON.stringify(d)
       : String(d)
};

var key = function key(k, v){ 
  var set = arguments.length > 1
    , keys = is_1.fn(k) ? [] : str(k).split('.')
    , root = keys.shift();

  return function deep(o, i){
    var masked = {};
    
    return !o ? undefined 
         : !is_1.num(k) && !k ? o
         : is_1.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys.length ? (set ? (o[k] = is_1.fn(v) ? v(o[k], i) : v, o)
                                       :  (is_1.fn(k) ? k(o) : o[k]))
                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       :  key(keys.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o);
      if (val != undefined) 
        { key(k, is_1.fn(val) ? wrap(val) : val)(masked); }
    }
  }
};

var from_1 = from;
from.parent = fromParent;

function from(o){
  return function(k){
    return key(k)(o)
  }
}

function fromParent(k){
  return datum(this.parentNode)[k]
}

var values = function values(o) {
  return !o ? [] : keys(o).map(from_1(o))
};

var ready = function ready(fn){
  return document.body ? fn() : document.addEventListener('DOMContentLoaded', fn.bind(this))
};

var attr = function attr(name, value) {
  var args = arguments.length;
  
  return !is_1.str(name) && args == 2 ? attr(arguments[1]).call(this, arguments[0])
       : !is_1.str(name) && args == 3 ? attr(arguments[1], arguments[2]).call(this, arguments[0])
       :  function(el){
            var ctx = this || {};
            el = ctx.nodeName || is_1.fn(ctx.node) ? ctx : el;
            el = el.node ? el.node() : el;
            el = el.host || el;

            return args > 1 && value === false ? el.removeAttribute(name)
                 : args > 1                    ? (el.setAttribute(name, value), value)
                 : el.attributes.getNamedItem(name) 
                && el.attributes.getNamedItem(name).value
          } 
};

var noop = function noop(){};

var to = { 
  arr: toArray
, obj: toObject
};

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

function toObject(d) {
  var by = 'id';

  return arguments.length == 1 
    ? (by = d, reduce)
    : reduce.apply(this, arguments)

  function reduce(p,v,i){
    if (i === 0) { p = {}; }
    p[is_1.fn(by) ? by(v, i) : v[by]] = v;
    return p
  }
}

var all = function all(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : '';
  return to.arr((doc || document).querySelectorAll(prefix+selector))
};

var by = function by(k, v){
  var exists = arguments.length == 1;
  return function(o){
    var d = is_1.fn(k) ? k(o) : key(k)(o);
    
    return d && v && d.toLowerCase && v.toLowerCase ? d.toLowerCase() === v.toLowerCase()
         : exists ? Boolean(d)
         : is_1.fn(v) ? v(d)
         : d == v
  }
};

var lo = function lo(d){
  return (d || '').toLowerCase()
};

var owner = client ? /* istanbul ignore next */ window : global;

var log = function log(ns){
  return function(d){
    if (!owner.console || !console.log.apply) { return d; }
    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
    var args = to.arr(arguments)
      , prefix = '[log][' + (new Date()).toISOString() + ']' + ns;

    args.unshift(prefix.grey ? prefix.grey : prefix);
    return console.log.apply(console, args), d
  }
};

var err = function err(ns){
  return function(d){
    if (!owner.console || !console.error.apply) { return d; }
    is_1.arr(arguments[2]) && (arguments[2] = arguments[2].length);
    var args = to.arr(arguments)
      , prefix = '[err][' + (new Date()).toISOString() + ']' + ns;

    args.unshift(prefix.red ? prefix.red : prefix);
    return console.error.apply(console, args), d
  }
};

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
  log$$1('creating');
  
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
         : is_1.str(thing)                ? resource(ripple)(thing)
         : err$$1('could not update', thing)
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
    err$$1(e, e.stack);
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
       : values(o).some(is_1.falsy) ? undefined 
       : o
}; };

var body = function (ripple) { return function (name) { return ripple.resources[name] && ripple.resources[name].body; }; };

var log$$1 = log('[ri/components]')
    , err$$1 = err('[ri/components]')
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
  log$2('creating');
  if (!owner.ripple) { owner.ripple = ripple; }
  return ripple
};

var log$2 = log('[ri/singleton]');

var identity = function identity(d) {
  return d
};

var header = function header(header$1, value) {
  var getter = arguments.length == 1;
  return function(d){ 
    return !d || !d.headers ? null
         : getter ? key(header$1)(d.headers)
                  : key(header$1)(d.headers) == value
  }
};

var append = function append(v) {
  return function(d){
    return d+v
  }
};

var not = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
};

var rijs_features = createCommonjsModule(function (module) {
// -------------------------------------------
// Extend Components with Features
// -------------------------------------------
module.exports = function features(ripple){
  if (!client) { return }
  log$$2('creating');
  ripple.render = render(ripple)(ripple.render);
  return ripple
};

var render = function (ripple) { return function (next) { return function (el) {
  var features = str(attr(el, 'is'))
          .split(' ')
          .map(from_1(ripple.resources))
          .filter(header('content-type', 'application/javascript'))
      , css = str(attr('css')(el)).split(' ');

  features
    .filter(by('headers.needs', includes('[css]')))
    .map(key('name'))
    .map(append('.css'))
    .filter(not(is_1.in(css)))
    .map(function (d) { return attr('css', (str(attr('css')(el)) + ' ' + d).trim())(el); });

  var node = next(el);

  return !node || !node.state ? undefined
       : (features
          .map(key('body'))
          .map(function (d) { return d.call(node.shadowRoot || node, node.shadowRoot || node, node.state); }), node)
}; }; };

var log$$2 = log('[ri/features]');
});

var debounce = function debounce(d){
  var pending, wait = is_1.num(d) ? d : 100;

  return is_1.fn(d) 
       ? next(d)
       : next

  function next(fn){
    return function(){
      var ctx = this, args = arguments;
      pending && clearTimeout(pending);
      pending = setTimeout(function(){ fn.apply(ctx, args); }, wait);
    }
  }
  
};

var parse = function parse(d){
  return d && JSON.parse(d)
};

var clone = function clone(d) {
  return !is_1.fn(d) && !is_1.str(d)
       ? parse(str(d))
       : d
};

var group = function group(prefix, fn){
  if (!owner.console) { return fn() }
  if (!console.groupCollapsed) { polyfill(); }
  console.groupCollapsed(prefix);
  var ret = fn();
  console.groupEnd(prefix);
  return ret
};

function polyfill() {
  console.groupCollapsed = console.groupEnd = function(d){
    (console.log || noop)('*****', d, '*****');
  };
}

// -------------------------------------------
// API: Cache to and Restore from localStorage
// -------------------------------------------
var rijs_offline = function offline(ripple){
  if (!client || !window.localStorage) { return; }
  log$3('creating');
  load(ripple);
  ripple.on('change.cache', debounce(1000)(cache(ripple)));
  return ripple
};

var load = function (ripple) { return group('loading cache', function (d) { return (parse(localStorage.ripple) || [])
    .map(ripple); }); };

var cache = function (ripple) { return function (res) {
  log$3('cached');
  var cachable = values(clone(ripple.resources))
    .filter(not(header('cache', 'no-store')));

  cachable
    .filter(header('content-type', 'application/javascript'))
    .map(function (d) { return d.body = str(ripple.resources[d.name].body); } );

  localStorage.ripple = str(cachable);
}; };

var log$3 = log('[ri/offline]');

var raw = function raw(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : '';
  return (doc ? doc : document).querySelector(prefix+selector)
};

var split = function split(delimiter){
  return function(d){
    return d.split(delimiter)
  }
};

var replace = function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
};

var prepend = function prepend(v) {
  return function(d){
    return v+d
  }
};

var el = function el(selector){
  var attrs = []
    , css = selector.replace(/\[(.+?)=(.*?)\]/g, function($1, $2, $3){ attrs.push([$2, $3]); return '' }).split('.')
    , tag  = css.shift()
    , elem = document.createElement(tag);

  attrs.forEach(function(d){ attr(elem, d[0], d[1]); });
  css.forEach(function(d){ elem.classList.add(d);});
  elem.toString = function(){ return tag + css.map(prepend('.')).join('') };

  return elem
};

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
  log$$2('creating');  
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
  if (css.some(not(is_1.in(ripple.resources)))) { return; }

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

var log$$2 = log('[ri/precss]');
});

var rijs_needs = createCommonjsModule(function (module) {
// -------------------------------------------
// Define Default Attributes for Components
// -------------------------------------------
module.exports = function needs(ripple){
  if (!client) { return; }
  log$$2('creating');
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

var log$$2 = log('[ri/needs]');
});

var promise_1 = promise;

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej;
      });

  arguments.length && resolve(arguments[0]);
  p.resolve = resolve;
  p.reject  = reject;
  return p
}

var flatten = function flatten(p,v){ 
  if (v instanceof Array) { v = v.reduce(flatten, []); }
  return p = p || [], p.concat(v) 
};

var has = function has(o, k) {
  return k in o
};

var def = function def(o, p, v, w){
  if (o.host && o.host.nodeName) { o = o.host; }
  if (p.name) { v = p, p = p.name; }
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p]
};

var emitterify = function emitterify(body) {
  body = body || {};
  def(body, 'emit', emit, 1);
  def(body, 'once', once, 1);
  def(body, 'off', off, 1);
  def(body, 'on', on, 1);
  body.on['*'] = body.on['*'] || [];
  return body

  function emit(type, pm, filter) {
    var li = body.on[type.split('.')[0]] || []
      , results = [];

    for (var i = 0; i < li.length; i++)
      { if (!li[i].ns || !filter || filter(li[i].ns))
        { results.push(call(li[i].isOnce ? li.splice(i--, 1)[0] : li[i], pm)); } }

    for (var i = 0; i < body.on['*'].length; i++)
      { results.push(call(body.on['*'][i], [type, pm])); }

    return results.reduce(flatten, [])
  }

  function call(cb, pm){
    return cb.next             ? cb.next(pm) 
         : pm instanceof Array ? cb.apply(body, pm) 
                               : cb.call(body, pm) 
  }

  function on(type, opts, isOnce) {
    var id = type.split('.')[0]
      , ns = type.split('.')[1]
      , li = body.on[id] = body.on[id] || []
      , cb = typeof opts == 'function' ? opts : 0;

    return !cb &&  ns ? (cb = body.on[id]['$'+ns]) ? cb : push(observable(body, opts))
         : !cb && !ns ? push(observable(body, opts))
         :  cb &&  ns ? push((remove(li, body.on[id]['$'+ns] || -1), cb))
         :  cb && !ns ? push(cb)
                      : false

    function push(cb){
      cb.isOnce = isOnce;
      cb.type = id;
      if (ns) { body.on[id]['$'+(cb.ns = ns)] = cb; }
      li.push(cb);
      return cb.next ? cb : body
    }
  }

  function once(type, callback){
    return body.on(type, callback, true)
  }

  function remove(li, cb) {
    var i = li.length;
    while (~--i) 
      { if (cb == li[i] || cb == li[i].fn || !cb)
        { li.splice(i, 1); } }
  }

  function off(type, cb) {
    remove((body.on[type] || []), cb);
    if (cb && cb.ns) { delete body.on[type]['$'+cb.ns]; }
    return body
  }

  function observable(parent, opts) {
    opts = opts || {};
    var o = emitterify(opts.base || promise_1());
    o.i = 0;
    o.li = [];
    o.fn = opts.fn;
    o.parent = parent;
    o.source = opts.fn ? o.parent.source : o;
    
    o.on('stop', function(reason){
      return o.type
        ? o.parent.off(o.type, o)
        : o.parent.off(o)
    });

    o.each = function(fn) {
      var n = fn.next ? fn : observable(o, { fn: fn });
      o.li.push(n);
      return n
    };

    o.pipe = function(fn) {
      return fn(o)
    };

    o.map = function(fn){
      return o.each(function(d, i, n){ return n.next(fn(d, i, n)) })
    };

    o.filter = function(fn){
      return o.each(function(d, i, n){ return fn(d, i, n) && n.next(d) })
    };

    o.reduce = function(fn, acc) {
      return o.each(function(d, i, n){ return n.next(acc = fn(acc, d, i, n)) })
    };

    o.unpromise = function(){ 
      var n = observable(o, { base: {}, fn: function(d){ return n.next(d) } });
      o.li.push(n);
      return n
    };

    o.next = function(value) {
      o.resolve && o.resolve(value);
      return o.li.length 
           ? o.li.map(function(n){ return n.fn(value, n.i++, n) })
           : value
    };

    o.until = function(stop){
      stop.each(function(){ o.source.emit('stop'); });
      return o
    };

    o.off = function(fn){
      return remove(o.li, fn), o
    };

    o[Symbol.asyncIterator] = function(){ return { 
      next: function () { return (o.wait = new Promise(function (resolve) {
        o.wait = true;
        o.map(function (d, i, n) {
          delete o.wait;
          o.off(n);
          resolve({ value: d, done: false });
        });

        o.emit('pull', o);
      })); }
    }};

    return o
  }
};

var nanosocket = function(url){
  if ( url === void 0 ) url = location.href.replace('http', 'ws');

  var io = emitterify({ attempt: 0 });
  io.ready = io.once('connected');
  io.connect = connect(io, url);
  io.connect(); 
  io.send = function (data) { return io.ready.then(function (socket) { return socket.send(data); }); };
  return io
};

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

var client$5 = createCommonjsModule(function (module) {
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

var act = { add: add, update: update, remove: remove };
var str$3 = JSON.stringify;
var parse$3 = JSON.parse;

var set = function set(d, skipEmit) {
  return function(o, existing, max) {
    if (!is_1.obj(o) && !is_1.fn(o))
      { return o }

    if (!is_1.obj(d)) { 
      var log = existing || o.log || []
        , root = o;

      if (!is_1.def(max)) { max = log.max || 0; }
      if (!max)    { log = []; }
      if (max < 0) { log = log.concat(null); }
      if (max > 0) {
        var s = str$3(o);
        root = parse$3(s); 
        log = log.concat({ type: 'update', value: parse$3(s), time: log.length });
      } 

      def(log, 'max', max);
      
      root.log 
        ? (root.log = log)
        : def(emitterify(root, null), 'log', log, 1);

      return root
    }

    if (is_1.def(d.key)) {
      if (!apply(o, d.type, (d.key = '' + d.key).split('.'), d.value))
        { return false }
    } else
      { return false }

    if (o.log && o.log.max) 
      { o.log.push((d.time = o.log.length, o.log.max > 0 ? d : null)); }

    if (!skipEmit && o.emit)
      { o.emit('change', d); }

    return o
  }
};

function apply(body, type, path, value) {
  var next = path.shift();

  if (!act[type]) 
    { return false }
  if (path.length) { 
    if (!(next in body)) 
      { if (type == 'remove') { return true }
      else { body[next] = {}; } }
    return apply(body[next], type, path, value)
  }
  else {
    act[type](body, next, value);
    return true
  }
}

function add(o, k, v) {
  is_1.arr(o) 
    ? o.splice(k, 0, v) 
    : (o[k] = v);
}

function update(o, k, v) { 
  o[k] = v; 
}

function remove(o, k, v) { 
  is_1.arr(o) 
    ? o.splice(k, 1)
    : delete o[k];
}

var extend = function extend(to){ 
  return function(from){
    keys(from)
      .filter(not(is_1.in(to)))
      .map(copy(from, to));

    return to
  }
};

var client$3 = createCommonjsModule(function (module) {
module.exports = function sync(
  ripple
, ref
, ref$1
){
  if ( ref === void 0 ) ref = {};
  if ( ref$1 === void 0 ) ref$1 = {};
  var xrs = ref$1.xrs; if ( xrs === void 0 ) xrs = client$5;

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
: is_1.obj(name)         ? xrs(name)
                       : xrs({ name: name, type: type, value: value }); }; };

var get = function (ripple) { return function (name, k) {
  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
  if (is_1.arr(k)) { return Promise.all(k.map(function (k) { return ripple.get(name, k); })) }
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
  if (is_1.arr(name)) { return merge(name.map(function (n) { return ripple.subscribe(n, k); })) }
  ripple.subscriptions[name] = ripple.subscriptions[name] || {};
  if (is_1.arr(k)) { return merge(k.map(function (k) { return ripple.subscribe(name, k); })).map(function (d) { return key(k)(ripple(name)); }) } // merge(ripple, name, k)
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
      .filter(is_1.def)
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
  .filter(not(is_1.in(ripple.subscriptions)))
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


});

var colorfill_1 = colorfill();

function colorfill(){
  /* istanbul ignore next */
  ['red', 'green', 'bold', 'grey', 'strip'].forEach(function(color) {
    !is_1.str(String.prototype[color]) && Object.defineProperty(String.prototype, color, {
      get: function() {
        return String(this)
      } 
    });
  });
}

var za = function za(k) {
  return function(a, b){
    var ka = key(k)(a) || ''
      , kb = key(k)(b) || '';

    return ka > kb ? -1 
         : ka < kb ?  1 
                   :  0
  }
};

var text = {
  header: 'text/plain'
, check: function check(res){ return !includes('.html')(res.name) && !includes('.css')(res.name) && is_1.str(res.body) }
};

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
  log$$2('creating');

  var resources = {};
  ripple.resources = resources;
  ripple.resource  = chainable(ripple);
  ripple.register  = ripple;
  ripple.types     = types();
  return emitterify(ripple)

  function ripple(name, body, headers){
    return !name                                            ? ripple
         : is_1.arr(name)                                     ? name.map(ripple)
         : is_1.promise(name)                                 ? name.then(ripple).catch(err$$2)
         : is_1.obj(name) && !name.name                       ? ripple(values(name))
         : is_1.fn(name)  &&  name.resources                  ? ripple(values(name.resources))
         : is_1.str(name) && !body &&  ripple.resources[name] ? ripple.resources[name].body
         : is_1.str(name) && !body && !ripple.resources[name] ? undefined //register(ripple)({ name })
         : is_1.str(name) &&  body                            ? register(ripple)({ name: name, body: body, headers: headers })
         : is_1.obj(name) && !is_1.arr(name)                    ? register(ripple)(name)
         : (err$$2('could not find or create resource', name), false)
  }
};

var register = function (ripple) { return function (ref) {
  var name = ref.name;
  var body = ref.body;
  var headers = ref.headers; if ( headers === void 0 ) headers = {};

  log$$2('registering', name);
  if (is_1.promise(body)) { return body.then(function (body) { return register(ripple)({ name: name, body: body, headers: headers }); }).catch(err$$2) }
  var res = normalise(ripple)({ name: name, body: body, headers: headers });

  if (!res) { return err$$2('failed to register', name), false }
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
  if (!header('content-type')(res)) { return err$$2('could not understand resource', res), false }
  return parse(ripple)(res)
}; };

var parse = function (ripple) { return function (res) {
  var type = header('content-type')(res);
  if (!ripple.types[type]) { return err$$2('could not understand type', type), false }
  return (ripple.types[type].parse || identity)(res)
}; };

var contentType = function (res) { return function (type) { return type.check(res) && (res.headers['content-type'] = type.header); }; };

var types = function () { return [text].reduce(to.obj('header'), 1); };

var chainable = function (fn) { return function() {
  return fn.apply(this, arguments), fn
}; };

var err$$2 = err('[ri/core]')
    , log$$2 = log('[ri/core]')
    , now = function (d, t) { return (t = key('body.log.length')(d), is_1.num(t) ? t - 1 : t); };
});

var fn = function fn(candid){
  return is_1.fn(candid) ? candid
       : (new Function("return " + candid))()
};

// -------------------------------------------
// Adds support for data resources
// -------------------------------------------
var rijs_data = function data(ripple){
  log$4('creating');
  ripple
    .on('change.data')
    .filter(function (ref) {
      var name = ref[0];
      var change = ref[1];

      return header('content-type', 'application/data')(ripple.resources[name]);
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
      .emit('change', (change || null), not(is_1.in(['bubble'])));
  });

  ripple.types['application/data'] = {
    header: 'application/data'
  , selector: function (res) { return ("[data~=\"" + (res.name) + "\"]"); }
  , extract: function (el) { return (attr("data")(el) || '').split(' '); }
  , check: function (res) { return is_1.obj(res.body) ? true : false; }
  , parse: function parse(res){ 
      if (is_1.str(res.body)) { res.body = fn(res.body); }
      var existing = ripple.resources[res.name] || {};

      extend(res.headers)(existing.headers);
      res.body = set()(
        res.body || []
      , existing.body && existing.body.log
      , is_1.num(res.headers.log) ? res.headers.log : -1
      );
      overwrite(res.body.on)(listeners(existing));
      res.body.on('change.bubble', function (change) {
        ripple.emit('change', ripple.change = [res.name, change], not(is_1.in(['data'])));
        delete ripple.change;
      });
      
      return res
    }
  };

  return ripple
};

var log$4 = log('[ri/types/data]');
var listeners = key('body.on');

var rijs_css = createCommonjsModule(function (module) {
// -------------------------------------------
// Exposes a convenient global instance 
// -------------------------------------------
module.exports = function css(ripple){
  log$$2('creating');
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

var log$$2 = log('[ri/types/css]');

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
  log$5('creating');
  ripple.types['application/javascript'] = { 
    selector: selector
  , extract: extract
  , header: header$3
  , check: check
  , parse: parse$4
  };
  return ripple
};

var selector = function (res) { return ((res.name) + ",[is~=\"" + (res.name) + "\"]"); };
var extract = function (el) { return (attr('is')(el) || '').split(' ').concat(lo(el.nodeName)); };
var header$3 = 'application/javascript';
var check = function (res) { return is_1.fn(res.body); };
var parse$4 = function (res) { return (res.body = fn(res.body), res); };
var log$5   = log('[ri/types/fn]');

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
  client$3(ripple, opts);     // syncs resources between server/client  
  rijs_features(ripple);       // extend components with features
  return ripple
}

return fullstack;

}());
