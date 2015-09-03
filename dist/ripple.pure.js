(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = setTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            currentQueue[queueIndex].run();
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    clearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        setTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],3:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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

module.exports = components;

function components(ripple) {
  if (!client) {
    return ripple;
  }log("creating");

  if (!customEls) document.body ? polyfill(ripple)() : document.addEventListener("DOMContentLoaded", polyfill(ripple));

  values(ripple.types).map(function (type) {
    return type.parse = proxy(type.parse || identity, clean(ripple));
  });
  key("types.application/javascript.render", wrap(fn(ripple)))(ripple);
  key("types.application/data.render", wrap(data(ripple)))(ripple);
  ripple.draw = draw(ripple);
  ripple.render = render(ripple);
  ripple.on("change", raf(ripple));
  return ripple;
}

// public draw api
function draw(ripple) {
  return function (thing) {
    return this && this.nodeName ? invoke(ripple)(this) : this && this.node ? invoke(ripple)(this.node()) : !thing ? everything(ripple) : thing instanceof mutation ? invoke(ripple)(thing.target) : thing[0] instanceof mutation ? invoke(ripple)(thing[0].target) : thing.nodeName ? invoke(ripple)(thing) : thing.node ? invoke(ripple)(thing.node()) : thing.name ? resource(ripple)(thing.name) : is.str(thing) ? resource(ripple)(thing) : err("could not update", thing);
  };
}

// render all components
function everything(ripple) {
  var selector = values(ripple.resources).filter(header("content-type", "application/javascript")).map(key("name")).join(",");

  return !selector ? [] : all(selector).map(invoke(ripple));
}

// render all elements that depend on the resource
function resource(ripple) {
  return function (name) {
    var res = ripple.resources[name],
        type = header("content-type")(res);

    return (ripple.types[type].render || noop)(res);
  };
}

// batch renders on render frames
function raf(ripple) {
  return function (res) {
    return !header("pending")(res) && (res.headers.pending = requestAnimationFrame(function () {
      return (delete ripple.resources[res.name].headers.pending, ripple.draw(res));
    }));
  };
}

// main function to render a particular custom element with any data it needs
function invoke(ripple) {
  return function (el) {
    if (el.nodeName == "#document-fragment") return invoke(ripple)(el.host);
    if (el.nodeName == "#text") return invoke(ripple)(el.parentNode);
    if (!el.matches(isAttached)) return;
    if (attr(el, "inert") != null) return;
    return ripple.render.apply(this, arguments);
  };
}

function render(ripple) {
  return function (el) {
    var name = attr(el, "is") || el.tagName.toLowerCase(),
        deps = attr(el, "data"),
        fn = body(ripple)(name),
        data = resourcify(ripple)(deps);

    try {
      fn && (!deps || data) && fn.call(el.shadowRoot || el, data);
    } catch (e) {
      err(e, e.stack);
    }

    return el;
  };
}

// for non-Chrome..
function polyfill(ripple) {
  return function () {
    if (typeof MutationObserver == "undefined") return;
    if (document.body.muto) document.body.muto.disconnect();
    var muto = document.body.muto = new MutationObserver(drawCustomEls(ripple)),
        conf = { childList: true, subtree: true, attributes: true, attributeOldValue: true };

    muto.observe(document.body, conf);
  };
}

// polyfills
function drawCustomEls(ripple) {
  return function (mutations) {
    mutations.filter(key("attributeName")).filter(by("target", isCustomElement)).filter(onlyIfDifferent).map(ripple.draw);

    mutations.map(key("addedNodes")).map(to.arr).reduce(flatten).filter(isCustomElement).map(ripple.draw);
  };
}

// clean local headers for transport
function clean(ripple) {
  return function (res) {
    delete res.headers.pending;
    return res;
  };
}

function onlyIfDifferent(m) {
  return attr(m.target, m.attributeName) != m.oldValue;
}

function isCustomElement(d) {
  return ~d.nodeName.indexOf("-");
}

var resourcify = window['resourcify'];

var includes = window['includes'];

var identity = window['identity'];

var flatten = window['flatten'];

var prepend = window['prepend'];

var header = window['header'];

var client = window['client'];

var values = window['values'];

var proxy = window['proxy'];

var attr = window['attr'];

var body = window['body'];

var noop = window['noop'];

var wrap = window['wrap'];

var key = window['key'];

var err = window['err'];

var all = window['all'];

var log = window['log'];

var is = window['is'];

var by = window['by'];

var lo = window['lo'];

var to = window['to'];

var data = _interopRequire(require("./types/data"));

var fn = _interopRequire(require("./types/fn"));

log = log("[ri/components]");
err = err("[ri/components]");
var mutation = client && window.MutationRecord || noop,
    customEls = client && !!document.registerElement,
    isAttached = customEls ? "html *, :host-context(html) *" : "html *";
client && (Element.prototype.matches = Element.prototype.matches || Element.prototype.msMatchesSelector);
},{"./types/data":4,"./types/fn":5,"utilise/all":6,"utilise/attr":7,"utilise/body":8,"utilise/by":9,"utilise/client":10,"utilise/err":12,"utilise/flatten":14,"utilise/header":17,"utilise/identity":18,"utilise/includes":19,"utilise/is":20,"utilise/key":21,"utilise/lo":23,"utilise/log":24,"utilise/noop":25,"utilise/prepend":27,"utilise/proxy":28,"utilise/resourcify":29,"utilise/to":32,"utilise/values":33,"utilise/wrap":34}],4:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// render all elements that require the specified data
module.exports = data;

function data(ripple) {
  return function (res) {
    return all("[data~=\"" + res.name + "\"]:not([inert])").map(ripple.draw);
  };
}

var all = window['all'];
},{"utilise/all":6}],5:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// register custom element prototype (render is automatic)
module.exports = fn;

function fn(ripple) {
  return function (res) {
    if (!customEls || registered(res)) return all("" + res.name + ":not([inert])\n                 ,[is=\"" + res.name + "\"]:not([inert])").map(ripple.draw);

    var proto = Object.create(HTMLElement.prototype),
        opts = { prototype: proto },
        extend = res.headers["extends"];

    extend && (opts["extends"] = extend);
    proto.attachedCallback = proto.attributeChangedCallback = ripple.draw;
    document.registerElement(res.name, opts);
  };
}

function registered(res) {
  var extend = header("extends")(res);

  return extend ? document.createElement(extend, res.name).attachedCallback : document.createElement(res.name).attachedCallback;
}

function node(ripple) {
  return function () {
    ripple.invoke(this);
  };
}

var header = window['header'];

var client = window['client'];

var all = window['all'];

var customEls = client && !!document.registerElement;
},{"utilise/all":6,"utilise/client":10,"utilise/header":17}],6:[function(require,module,exports){
var to = require('utilise/to')

module.exports = function all(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return to.arr((doc || document).querySelectorAll(prefix+selector))
}
},{"utilise/to":32}],7:[function(require,module,exports){
var is = require('utilise/is')

module.exports = function attr(d, name, value) {
  d = d.node ? d.node() : d
  if (is.str(d)) return function(el){ return attr(this.nodeName || this.node ? this : el, d) }

  return arguments.length > 2 && value === false ? d.removeAttribute(name)
       : arguments.length > 2                    ? d.setAttribute(name, value)
       : d.attributes.getNamedItem(name) 
      && d.attributes.getNamedItem(name).value
}

},{"utilise/is":20}],8:[function(require,module,exports){
var key = require('utilise/key')

module.exports = function body(ripple){
  return function(name){
    return key([name, 'body'].join('.'))(ripple.resources)
  }
}
},{"utilise/key":21}],9:[function(require,module,exports){
var key = require('utilise/key')
  , is  = require('utilise/is')

module.exports = function by(k, v){
  var exists = arguments.length == 1
  return function(o){
    var d = key(k)(o)
    
    return d && v && d.toLowerCase && v.toLowerCase ? d.toLowerCase() === v.toLowerCase()
         : exists ? Boolean(d)
         : is.fn(v) ? v(d)
         : d == v
  }
}
},{"utilise/is":20,"utilise/key":21}],10:[function(require,module,exports){
module.exports = typeof window != 'undefined'
},{}],11:[function(require,module,exports){
var sel = require('utilise/sel')

module.exports = function datum(node){
  return sel(node).datum()
}
},{"utilise/sel":30}],12:[function(require,module,exports){
var owner = require('utilise/owner')
  , to = require('utilise/to')

module.exports = function err(prefix){
  return function(d){
    if (!owner.console || !console.error.apply) return d;
    var args = to.arr(arguments)
    args.unshift(prefix.red ? prefix.red : prefix)
    return console.error.apply(console, args), d
  }
}
},{"utilise/owner":26,"utilise/to":32}],13:[function(require,module,exports){
module.exports = function first(d){
  return d[0]
}
},{}],14:[function(require,module,exports){
var is = require('utilise/is')  

module.exports = function flatten(p,v){ 
  is.arr(v) && (v = v.reduce(flatten, []))
  return (p = p || []), p.concat(v) 
}

},{"utilise/is":20}],15:[function(require,module,exports){
var datum = require('utilise/datum')
  , key = require('utilise/key')

module.exports = from
from.parent = fromParent

function from(o){
  return function(k){
    return key(k)(o)
  }
}

function fromParent(k){
  return datum(this.parentNode)[k]
}
},{"utilise/datum":11,"utilise/key":21}],16:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],17:[function(require,module,exports){
var has = require('utilise/has')

module.exports = function header(header, value) {
  var getter = arguments.length == 1
  return function(d){ 
    return !d                      ? null
         : !has(d, 'headers')      ? null
         : !has(d.headers, header) ? null
         : getter                  ? d['headers'][header]
                                   : d['headers'][header] == value
  }
}
},{"utilise/has":16}],18:[function(require,module,exports){
module.exports = function identity(d) {
  return d
}
},{}],19:[function(require,module,exports){
module.exports = function includes(pattern){
  return function(d){
    return d && d.indexOf && ~d.indexOf(pattern)
  }
}
},{}],20:[function(require,module,exports){
module.exports = is
is.fn     = isFunction
is.str    = isString
is.num    = isNumber
is.obj    = isObject
is.lit    = isLiteral
is.bol    = isBoolean
is.truthy = isTruthy
is.falsy  = isFalsy
is.arr    = isArray
is.null   = isNull
is.def    = isDef
is.in     = isIn

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

function isIn(set) {
  return function(d){
    return !set ? false  
         : set.indexOf ? ~set.indexOf(d)
         : d in set
  }
}
},{}],21:[function(require,module,exports){
var is = require('utilise/is')
  , str = require('utilise/str')

module.exports = function key(k, v){ 
  var set = arguments.length > 1
    , keys = str(k).split('.')
    , root = keys.shift()

  return function deep(o){
    var masked = {}
    return !o ? undefined 
         : !k ? o
         : is.arr(k) ? (k.map(copy), masked)
         : o[k] || !keys.length ? (set ? ((o[k] = is.fn(v) ? v(o[k]) : v), o)
                                       :   o[k])
                                : (set ? (key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {})), o)
                                       : key(keys.join('.'))(o[root]))

    function copy(k){
      var val = key(k)(o)
      ;(val != undefined) && key(k, val)(masked)
    }
  }
}
},{"utilise/is":20,"utilise/str":31}],22:[function(require,module,exports){
module.exports = function keys(o) {
  return Object.keys(o || {})
}
},{}],23:[function(require,module,exports){
module.exports = function lo(d){
  return (d || '').toLowerCase()
}

},{}],24:[function(require,module,exports){
var is = require('utilise/is')
  , to = require('utilise/to')
  , owner = require('utilise/owner')

module.exports = function log(prefix){
  return function(d){
    if (!owner.console || !console.log.apply) return d;
    is.arr(arguments[2]) && (arguments[2] = arguments[2].length)
    var args = to.arr(arguments)
    args.unshift(prefix.grey ? prefix.grey : prefix)
    return console.log.apply(console, args), d
  }
}
},{"utilise/is":20,"utilise/owner":26,"utilise/to":32}],25:[function(require,module,exports){
module.exports = function noop(){}
},{}],26:[function(require,module,exports){
(function (global){
module.exports = require('utilise/client') ? /* istanbul ignore next */ window : global
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"utilise/client":10}],27:[function(require,module,exports){
module.exports = function prepend(v) {
  return function(d){
    return v+d
  }
}
},{}],28:[function(require,module,exports){
var is = require('utilise/is')

module.exports = function proxy(fn, ret, ctx){ 
  return function(){
    var result = fn.apply(ctx || this, arguments)
    return is.fn(ret) ? ret(result) : ret || result
  }
}
},{"utilise/is":20}],29:[function(require,module,exports){
var is = require('utilise/is')
  , body = require('utilise/body')
  , first = require('utilise/first')
  , values = require('utilise/values')

module.exports = function resourcify(ripple){
  return function(d) {
    var o = {}
      , names = d ? d.split(' ') : []

    return   names.length == 0 ? undefined
         :   names.length == 1 ? body(ripple)(first(names))
         : ( names.map(function(d) { return o[d] = body(ripple)(d) })
           , values(o).some(is.falsy) ? undefined : o 
           )
  }
}
},{"utilise/body":8,"utilise/first":13,"utilise/is":20,"utilise/values":33}],30:[function(require,module,exports){
module.exports = function sel(){
  return d3.select.apply(this, arguments)
}
},{}],31:[function(require,module,exports){
var is = require('utilise/is') 

module.exports = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is.fn(d) ? '' + d
       : is.obj(d) ? JSON.stringify(d)
       : String(d)
}
},{"utilise/is":20}],32:[function(require,module,exports){
module.exports = { 
  arr: toArray
, obj: toObject
}

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

function toObject(d) {
  var by = 'id'
    , o = {}

  return arguments.length == 1 
    ? (by = d, reduce)
    : reduce.apply(this, arguments)

  function reduce(p,v,i){
    if (i === 0) p = {}
    p[v[by]] = v
    return p
  }
}
},{}],33:[function(require,module,exports){
var keys = require('utilise/keys')
  , from = require('utilise/from')

module.exports = function values(o) {
  return !o ? [] : keys(o).map(from(o))
}
},{"utilise/from":15,"utilise/keys":22}],34:[function(require,module,exports){
module.exports = function wrap(d){
  return function(){
    return d
  }
}
},{}],35:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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

module.exports = core;

function core() {
  log("creating");

  var resources = {};
  ripple.resources = resources;
  ripple.resource = chainable(ripple);
  ripple.register = ripple;
  ripple.types = types();
  return emitterify(ripple);

  function ripple(_x, _x2, _x3) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var name = _x,
          body = _x2,
          headers = _x3;
      if (!name) {
        return ripple;
      } else {
        if (is.arr(name)) {
          return name.map(ripple);
        } else {
          if (is.obj(name) && !name.name) {
            return ripple;
          } else {
            if (is.fn(name) && name.resources) {
              _x = values(name.resources);
              _again = true;
              continue _function;
            } else {
              return is.str(name) && !body && resources[name] ? resources[name].body : is.str(name) && !body && !resources[name] ? register(ripple)({ name: name }) : is.str(name) && body ? register(ripple)({ name: name, body: body, headers: headers }) : is.obj(name) && !is.arr(name) ? register(ripple)(name) : (err("could not find or create resource", name), false);
            }
          }
        }
      }
    }
  }
}

function register(ripple) {
  return function (_ref) {
    var name = _ref.name;
    var body = _ref.body;
    var _ref$headers = _ref.headers;
    var headers = _ref$headers === undefined ? {} : _ref$headers;

    log("registering", name);
    var res = normalise(ripple)({ name: name, body: body, headers: headers }),
        type = !ripple.resources[name] ? "load" : "";

    if (!res) return (err("failed to register", name), false);
    ripple.resources[name] = res;
    ripple.emit("change", [ripple.resources[name], { type: type }]);
    return ripple.resources[name].body;
  };
}

function normalise(ripple) {
  return function (res) {
    if (!header("content-type")(res)) values(ripple.types).sort(za("priority")).some(contentType(res));
    if (!header("content-type")(res)) return (err("could not understand resource", res), false);
    return parse(ripple)(res);
  };
}

function parse(ripple) {
  return function (res) {
    var type = header("content-type")(res);
    if (!ripple.types[type]) return (err("could not understand type", type), false);
    return (ripple.types[type].parse || identity)(res);
  };
}

function contentType(res) {
  return function (type) {
    return type.check(res) && (res.headers["content-type"] = type.header);
  };
}

function types() {
  return [text].reduce(to.obj("header"), 1);
}

var emitterify = window['emitterify'];

var colorfill = window['colorfill'];

var chainable = window['chainable'];

var identity = window['identity'];

var rebind = window['rebind'];

var header = window['header'];

var values = window['values'];

var err = window['err'];

var log = window['log'];

var is = window['is'];

var to = window['to'];

var za = window['za'];

var text = _interopRequire(require("./types/text"));

err = err("[ri/core]");
log = log("[ri/core]");
},{"./types/text":36,"utilise/chainable":1,"utilise/colorfill":1,"utilise/emitterify":1,"utilise/err":1,"utilise/header":1,"utilise/identity":1,"utilise/is":1,"utilise/log":1,"utilise/rebind":1,"utilise/to":1,"utilise/values":1,"utilise/za":1}],36:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = {
  header: "text/plain",
  check: function check(res) {
    return !includes(".html")(res.name) && !includes(".css")(res.name) && is.str(res.body);
  }
};

var includes = window['includes'];

var is = window['is'];
},{"utilise/includes":1,"utilise/is":1}],37:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = css;

function css(ripple) {
  log("creating");
  ripple.types["text/css"] = {
    header: "text/css",
    check: function check(res) {
      return includes(".css")(res.name);
    }
  };

  return ripple;
}

var includes = window['includes'];

var log = window['log'];

log = log("[ri/types/css]");
},{"utilise/includes":39,"utilise/log":41}],38:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],39:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],40:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],41:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":40,"utilise/owner":42,"utilise/to":43}],42:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":38}],43:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],44:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Adds support for data resources
// -------------------------------------------
module.exports = data;

function data(ripple) {
  log("creating");
  ripple.on("change.data", trickle(ripple));
  ripple.types["application/data"] = {
    header: "application/data",
    check: function check(res) {
      return is.obj(res.body) || !res.body ? true : false;
    },
    parse: function parse(res) {
      var existing = ripple.resources[res.name] || {};
      delete res.headers.listeners;
      extend(res.headers)(existing.headers);

      !res.body && (res.body = []);
      !res.body.on && (res.body = emitterify(res.body));
      res.body.on.change = res.headers.listeners = res.headers.listeners || [];
      res.body.on("change.bubble", function () {
        return ripple.emit("change", [res], not(is["in"](["data"])));
      });

      return res;
    }
  };

  return ripple;
}

function trickle(ripple) {
  return function (res) {
    var args = [arguments[0].body, arguments[1]];
    return header("content-type", "application/data")(res) && ripple.resources[res.name].body.emit("change", to.arr(args), not(is["in"](["bubble"])));
  };
}

var emitterify = window['emitterify'];

var header = window['header'];

var extend = window['extend'];

var not = window['not'];

var log = window['log'];

var is = window['is'];

var to = window['to'];

log = log("[ri/types/data]");
},{"utilise/emitterify":48,"utilise/extend":50,"utilise/header":52,"utilise/is":53,"utilise/log":55,"utilise/not":56,"utilise/to":58}],45:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],46:[function(require,module,exports){
module.exports = function copy(from, to){ 
  return function(d){ 
    return to[d] = from[d], d
  }
}
},{}],47:[function(require,module,exports){
var has = require('utilise/has')

module.exports = function def(o, p, v, w){
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"utilise/has":51}],48:[function(require,module,exports){
var err  = require('utilise/err')('[emitterify]')
  , keys = require('utilise/keys')
  , def  = require('utilise/def')
  , not  = require('utilise/not')
  , is   = require('utilise/is')
  
module.exports = function emitterify(body) {
  return def(body, 'on', on)
       , def(body, 'once', once)
       , def(body, 'emit', emit)
       , body

  function emit(type, param, filter) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]
      , li = body.on[id] || []
      , tt = li.length-1
      , pm = is.arr(param) ? param : [param || body]

    if (ns) return invoke(li, ns, pm), body

    for (var i = li.length; i >=0; i--)
      invoke(li, i, pm)

    keys(li)
      .filter(not(isFinite))
      .filter(filter || Boolean)
      .map(function(n){ return invoke(li, n, pm) })

    return body
  }

  function invoke(o, k, p){
    if (!o[k]) return
    var fn = o[k]
    o[k].once && (isFinite(k) ? o.splice(k, 1) : delete o[k])
    try { fn.apply(body, p) } catch(e) { err(e, e.stack)  }
   }

  function on(type, callback) {
    var ns = type.split('.')[1]
      , id = type.split('.')[0]

    body.on[id] = body.on[id] || []
    return !callback && !ns ? (body.on[id])
         : !callback &&  ns ? (body.on[id][ns])
         :  ns              ? (body.on[id][ns] = callback, body)
                            : (body.on[id].push(callback), body)
  }

  function once(type, callback){
    return callback.once = true, body.on(type, callback), body
  }
}
},{"utilise/def":47,"utilise/err":49,"utilise/is":53,"utilise/keys":54,"utilise/not":56}],49:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":57,"utilise/to":58}],50:[function(require,module,exports){
var is = require('utilise/is')
  , not = require('utilise/not')
  , keys = require('utilise/keys')
  , copy = require('utilise/copy')

module.exports = function extend(to){ 
  return function(from){
    keys(from)
      .filter(not(is.in(to)))
      .map(copy(from, to))

    return to
  }
}
},{"utilise/copy":46,"utilise/is":53,"utilise/keys":54,"utilise/not":56}],51:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],52:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"utilise/has":51}],53:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],54:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],55:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":53,"utilise/owner":57,"utilise/to":58}],56:[function(require,module,exports){
module.exports = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}
},{}],57:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":45}],58:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],59:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],60:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Delays the rendering of a component [delay=ms]
// -------------------------------------------
module.exports = delay;

function delay(ripple) {
  if (!client) {
    return ripple;
  }log("creating");

  var render = ripple.render;

  ripple.render = function (el) {
    var delay = attr("delay")(el);
    return delay != null ? (el.setAttribute("inert", ""), el.removeAttribute("delay"), setTimeout(el.removeAttribute.bind(el, "inert"), +delay)) : render(el);
  };

  return ripple;
}

var client = window['client'];

var attr = window['attr'];

var log = window['log'];

var err = window['err'];

log = log("[ri/delay]");
err = err("[ri/delay]");
},{"utilise/attr":61,"utilise/client":62,"utilise/err":63,"utilise/log":65}],61:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7,"utilise/is":64}],62:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],63:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":66,"utilise/to":67}],64:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],65:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":64,"utilise/owner":66,"utilise/to":67}],66:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":62}],67:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],68:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = fn;

function fn(ripple) {
  log("creating");
  ripple.types["application/javascript"] = {
    header: "application/javascript",
    check: function check(res) {
      return is.fn(res.body);
    },
    parse: function parse(res) {
      return (res.body = fn(res.body), res);
    }
  };

  return ripple;
}

var includes = window['includes'];

var log = window['log'];

var is = window['is'];

var fn = window['fn'];

log = log("[ri/types/fn]");
},{"utilise/fn":70,"utilise/includes":71,"utilise/is":72,"utilise/log":73}],69:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],70:[function(require,module,exports){
var is = require('utilise/is')

module.exports = function fn(candid){
  return is.fn(candid) ? candid
       : (new Function("return " + candid))()
}
},{"utilise/is":72}],71:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],72:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],73:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":72,"utilise/owner":74,"utilise/to":75}],74:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":69}],75:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],76:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = html;

function html(ripple) {
  log("creating");
  ripple.types["text/html"] = {
    header: "text/html",
    check: function check(res) {
      return includes(".html")(res.name);
    }
  };

  return ripple;
}

var includes = window['includes'];

var log = window['log'];

log = log("[ri/types/html]");
},{"utilise/includes":78,"utilise/log":80}],77:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],78:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19}],79:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],80:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":79,"utilise/owner":81,"utilise/to":82}],81:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":77}],82:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],83:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],84:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Pre-applies Scoped CSS [css=name]
// -------------------------------------------
module.exports = offline;

function offline(ripple) {
  if (!client || !window.localStorage) {
    return;
  }log("creating");
  load(ripple);
  ripple.on("change.cache", debounce(1000)(cache(ripple)));
  return ripple;
}

function load(ripple) {
  group("loading cache", function () {
    (parse(localStorage.ripple) || []).forEach(silent(ripple));
  });
}

function cache(ripple) {
  return function (res) {
    log("cached");
    var cachable = values(clone(ripple.resources)).filter(not(header("cache-control", "no-store")));

    cachable.filter(header("content-type", "application/javascript")).map(function (d) {
      return d.body = str(ripple.resources[d.name].body);
    });

    localStorage.ripple = str(cachable);
  };
}

function silent(ripple) {
  return function (res) {
    return (res.headers.silent = true, ripple(res));
  };
}

var debounce = window['debounce'];

var header = window['header'];

var client = window['client'];

var values = window['values'];

var clone = window['clone'];

var parse = window['parse'];

var group = window['group'];

var proxy = window['proxy'];

var not = window['not'];

var str = window['str'];

var key = window['key'];

var log = window['log'];

var err = window['err'];

var is = window['is'];

log = log("[ri/offline]");
err = err("[ri/offline]");
},{"utilise/client":85,"utilise/clone":86,"utilise/debounce":88,"utilise/err":89,"utilise/group":91,"utilise/header":93,"utilise/is":94,"utilise/key":95,"utilise/log":97,"utilise/not":98,"utilise/parse":100,"utilise/proxy":101,"utilise/str":103,"utilise/values":105}],85:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],86:[function(require,module,exports){
var parse = require('utilise/parse')
  , str = require('utilise/str')
  , is = require('utilise/is')

module.exports = function clone(d) {
  return !is.fn(d) && !is.str(d)
       ? parse(str(d))
       : d
}

},{"utilise/is":94,"utilise/parse":100,"utilise/str":103}],87:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"utilise/sel":102}],88:[function(require,module,exports){
var is = require('utilise/is')

module.exports = function debounce(d){
  var pending, wait = is.num(d) ? d : 100

  return is.fn(d) 
       ? next(d)
       : next

  function next(fn){
    return function(){
      var ctx = this, args = arguments
      pending && clearTimeout(pending)
      pending = setTimeout(function(){ fn.apply(ctx, args) }, wait)
    }
  }
  
}
},{"utilise/is":94}],89:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":99,"utilise/to":104}],90:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"utilise/datum":87,"utilise/key":95}],91:[function(require,module,exports){
var client = require('utilise/client')
  , owner = require('utilise/owner')

module.exports = function group(prefix, fn){
  if (!owner.console) return fn()
  if (!console.groupCollapsed) polyfill()
  console.groupCollapsed(prefix)
  fn()
  console.groupEnd(prefix)
}

function polyfill() {
  console.groupCollapsed = console.groupEnd = function(d){
    console.log('*****', d, '*****')
  }
}
},{"utilise/client":85,"utilise/owner":99}],92:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],93:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"utilise/has":92}],94:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],95:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"utilise/is":94,"utilise/str":103}],96:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],97:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":94,"utilise/owner":99,"utilise/to":104}],98:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"dup":56}],99:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":85}],100:[function(require,module,exports){
module.exports = function parse(d){
  return d && JSON.parse(d)
}
},{}],101:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28,"utilise/is":94}],102:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30}],103:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"utilise/is":94}],104:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],105:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33,"utilise/from":90,"utilise/keys":96}],106:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Pre-applies Scoped CSS [css=name]
// -------------------------------------------
module.exports = precss;

function precss(ripple) {
  if (!client) {
    return;
  }log("creating");

  var render = ripple.render;

  key("types.text/css.render", wrap(css(ripple)))(ripple);

  ripple.render = function (el) {
    var css = attr(el, "css"),
        root = el.shadowRoot || el,
        style,
        styles,
        prefix = "",
        noShadow = !el.shadowRoot || !document.head.createShadowRoot;

    // this el does not have a css dep, continue with rest of rendering pipeline
    if (!css) return render(el);

    // this el has a css dep, but it is not loaded yet - stop rendering this el
    if (css && !ripple.resources[css]) return;

    // this el does not have a shadow and css has already been added, so reuse that
    if (noShadow && raw("style[resource=\"" + css + "\"]")) style = raw("style[resource=\"" + css + "\"]");

    // reuse or create style tag
    style = style || raw("style", root) || document.createElement("style");

    // mark tag if no shadow for optimisation
    attr(style, "resource", noShadow ? css : false);

    // retrieve styles
    styles = ripple(css);

    // scope css if no shadow
    if (noShadow) styles = polyfill(styles, el);

    // update styles
    style.innerHTML = styles;

    // append if not already attached
    if (!style.parentNode) root.insertBefore(style, root.firstChild);

    // continue with rest of the rendering pipeline
    render(el);
  };

  return ripple;
}

function polyfill(css, el) {
  var prefix = attr(el, "is") ? "[is=\"" + attr(el, "is") + "\"]" : el.tagName.toLowerCase(),
      escaped = prefix.replace(/\[/g, "\\[").replace(/\]/g, "\\]");

  return !prefix ? css : css.replace(/:host\((.+?)\)/gi, function ($1, $2) {
    return prefix + $2;
  }) // :host(...) -> tag...
  .replace(/:host/gi, prefix) // :host      -> tag
  .replace(/^([^@%\n]*){/gim, function ($1) {
    return prefix + " " + $1;
  }) // ... {      -> tag ... {
  .replace(/^(.*?),\s*$/gim, function ($1) {
    return prefix + " " + $1;
  }) // ... ,      -> tag ... ,
  .replace(/\/deep\/ /gi, "") // /deep/     ->
  .replace(new RegExp(escaped + "[\\s]*" + escaped, "g"), prefix) // tag tag    -> tag
  ;
}

function css(ripple) {
  return function (res) {
    return all("[css=\"" + res.name + "\"]:not([inert])").map(ripple.draw);
  };
}

var client = window['client'];

var attr = window['attr'];

var wrap = window['wrap'];

var all = window['all'];

var raw = window['raw'];

var key = window['key'];

var log = window['log'];

var err = window['err'];

log = log("[ri/precss]");
err = err("[ri/precss]");
},{"utilise/all":107,"utilise/attr":108,"utilise/client":109,"utilise/err":110,"utilise/key":112,"utilise/log":113,"utilise/raw":115,"utilise/wrap":118}],107:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6,"utilise/to":117}],108:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7,"utilise/is":111}],109:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],110:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":114,"utilise/to":117}],111:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],112:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"utilise/is":111,"utilise/str":116}],113:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":111,"utilise/owner":114,"utilise/to":117}],114:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":109}],115:[function(require,module,exports){
module.exports = function raw(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return (doc ? doc : document).querySelector(prefix+selector)
}
},{}],116:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"utilise/is":111}],117:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],118:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],119:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Pre-applies HTML Templates [template=name]
// -------------------------------------------
module.exports = prehtml;

function prehtml(ripple) {
  if (!client) {
    return;
  }log("creating");

  var render = ripple.render;

  key("types.text/html.render", wrap(html(ripple)))(ripple);

  ripple.render = function (el) {
    var div,
        html = attr(el, "template");
    if (!html) return render.apply(this, arguments);
    if (html && !ripple(html)) return;
    div = document.createElement("div");
    div.innerHTML = ripple(html);(el.shadowRoot || el).innerHTML = div.innerHTML;
    render.apply(this, arguments);
  };

  return ripple;
}

function html(ripple) {
  return function (res) {
    return all("[template=\"" + res.name + "\"]:not([inert])").map(ripple.draw);
  };
}

var client = window['client'];

var attr = window['attr'];

var wrap = window['wrap'];

var all = window['all'];

var key = window['key'];

var log = window['log'];

var err = window['err'];

log = log("[ri/prehtml]");
err = err("[ri/prehtml]");
},{"utilise/all":120,"utilise/attr":121,"utilise/client":122,"utilise/err":123,"utilise/key":125,"utilise/log":126,"utilise/wrap":130}],120:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6,"utilise/to":129}],121:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"dup":7,"utilise/is":124}],122:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],123:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":127,"utilise/to":129}],124:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],125:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"utilise/is":124,"utilise/str":128}],126:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":124,"utilise/owner":127,"utilise/to":129}],127:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":122}],128:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"utilise/is":124}],129:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],130:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],131:[function(require,module,exports){
(function (process){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: React to data changes - deprecates explicit .emit('change')
// -------------------------------------------
module.exports = reactive;

function reactive(ripple) {
  log("creating");
  ripple.on("change.reactive", react(ripple));
  return ripple;
}

function react(ripple) {
  return function (res) {
    if (!is.obj(res.body)) return;
    if (header("reactive", false)(res)) return;
    if (res.body.observer) return;
    if (!Object.observe) return polyfill(ripple)(res);

    Array.observe(res.body, def(res.body, "observer", changed(ripple)(res)));

    is.arr(res.body) && res.body.forEach(observe(ripple)(res));
  };
}

function observe(ripple) {
  return function (res) {
    return function (d) {
      if (!is.obj(d)) return;
      if (d.observer) return;
      var fn = child(ripple)(res);
      def(d, "observer", fn);
      Object.observe(d, fn);
    };
  };
}

function child(ripple) {
  return function (res) {
    return function (changes) {
      var key = res.body.indexOf(changes[0].object),
          value = res.body[key],
          type = "update",
          change = { key: key, value: value, type: type };

      log("changed (c)".green, res.name.bold, str(key).grey, debug ? changes : "");
      ripple.emit("change", [res, change], not(is["in"](["reactive"])));
    };
  };
}

function changed(ripple) {
  return function (res) {
    return function (changes) {
      changes.map(normalize).filter(Boolean).map(function (change) {
        return (log("changed (p)".green, res.name.bold, change.key.grey), change);
      }).map(function (change) {
        return (is.arr(res.body) && change.type == "push" && observe(ripple)(res)(change.value), change);
      }).map(function (change) {
        return ripple.emit("change", [res, change], not(is["in"](["reactive"])));
      });
    };
  };
}

function polyfill(ripple) {
  return function (res) {
    if (!ripple.observer) ripple.observer = setInterval(check(ripple), 100);
    if (!ripple.cache) ripple.cache = {};
    ripple.cache[res.name] = str(res.body);
  };
}

function check(ripple) {
  return function () {
    if (!ripple || !ripple.resources) return clearInterval(ripple.observer);
    keys(ripple.cache).forEach(function (name) {
      var res = ripple.resources[name];
      if (ripple.cache[name] != str(res.body)) {
        log("changed (x)", name);
        ripple.cache[name] = str(res.body);
        ripple.emit("change", [res], not(is["in"](["reactive"])));
      }
    });
  };
}

// normalize a change
function normalize(change) {
  var type = change.type,
      removed = type == "delete" ? change.oldValue : change.removed && change.removed[0],
      data = change.object,
      key = change.name || str(change.index),
      value = data[key],
      skip = type == "update" && str(value) == str(change.oldValue),
      details = {
    key: key,
    value: removed || value,
    type: type == "update" ? "update" : type == "delete" ? "remove" : type == "splice" && removed ? "remove" : type == "splice" && !removed ? "push" : type == "add" ? "push" : false
  };

  if (skip) {
    return (log("skipping update"), false);
  }return details;
}

var debug = process.env.NODE_ENV == "DEBUG";

var header = window['header'];

var keys = window['keys'];

var str = window['str'];

var not = window['not'];

var def = window['def'];

var err = window['err'];

var log = window['log'];

var has = window['has'];

var is = window['is'];

log = log("[ri/reactive]");
err = err("[ri/reactive]");
}).call(this,require('_process'))
},{"_process":2,"utilise/def":133,"utilise/err":134,"utilise/has":135,"utilise/header":136,"utilise/is":137,"utilise/keys":138,"utilise/log":139,"utilise/not":140,"utilise/str":142}],132:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],133:[function(require,module,exports){
arguments[4][47][0].apply(exports,arguments)
},{"dup":47,"utilise/has":135}],134:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":141,"utilise/to":143}],135:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],136:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"utilise/has":135}],137:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],138:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],139:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":137,"utilise/owner":141,"utilise/to":143}],140:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"dup":56}],141:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":132}],142:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"utilise/is":137}],143:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],144:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],145:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],146:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],147:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Mixes Shadow DOM Encapsulation into rendering pipeline
// -------------------------------------------
module.exports = shadow;

function shadow(ripple) {
  if (!client) {
    return;
  }log("creating", document.head.createShadowRoot ? "encapsulation" : "closing gap");

  var render = ripple.render;

  ripple.render = function (el) {
    el.createShadowRoot ? !el.shadowRoot && el.createShadowRoot() && reflect(el) : (el.shadowRoot = el, el.shadowRoot.host = el);

    render(el);
  };

  return ripple;
}

function reflect(el) {
  el.shadowRoot.innerHTML = el.innerHTML;
}

var client = window['client'];

var log = window['log'];

var err = window['err'];

log = log("[ri/shadow]");
err = err("[ri/shadow]");
},{"utilise/client":148,"utilise/err":149,"utilise/log":151}],148:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],149:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":152,"utilise/to":153}],150:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],151:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":150,"utilise/owner":152,"utilise/to":153}],152:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":148}],153:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],154:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = singleton;

function singleton(ripple) {
  log("creating");
  if (!owner.ripple) owner.ripple = ripple;
  return ripple;
}

var owner = window['owner'];

var log = window['log'];

log = log("[ri/singleton]");
},{"utilise/log":157,"utilise/owner":158}],155:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],156:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],157:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":156,"utilise/owner":158,"utilise/to":159}],158:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":155}],159:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],160:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Synchronises resources between server/client
// -------------------------------------------
module.exports = sync;

function sync(ripple, server) {
  log("creating");

  if (!client && !server) {
    return;
  }values(ripple.types).map(headers(ripple));
  ripple.sync = emit(ripple);
  ripple.io = io(server);
  ripple.on("change", function (res) {
    return emit(ripple)()(res.name);
  });
  ripple.io.on("change", silent(ripple));
  ripple.io.on("connection", function (s) {
    return s.on("change", change(ripple));
  });
  ripple.io.on("connection", function (s) {
    return emit(ripple)(s)();
  });
  ripple.io.use(setIP);
  return ripple;
}

function change(ripple) {
  return function (req) {
    log("receiving", req.name);

    var socket = this,
        res = ripple.resources[req.name];

    if (!res) return log("no resource", req.name);
    if (!is.obj(res.body)) return silent(ripple)(req);

    var to = header("proxy-to")(res) || identity,
        from = header("proxy-from")(res),
        body = to.call(socket, key("body")(res)),
        deltas = diff(body, req.body);

    if (is.arr(deltas)) return delta("") && res.body.emit("change");

    keys(deltas).reverse().filter(not(is("_t"))).map(paths(deltas)).reduce(flatten, []).map(delta).some(Boolean) && res.body.emit("change");

    function delta(k) {
      var d = key(k)(deltas),
          name = req.name,
          body = res.body,
          index = k.replace(/(^|\.)_/g, "$1"),
          type = d.length == 1 ? "push" : d.length == 2 ? "update" : d[2] === 0 ? "remove" : "",
          value = type == "update" ? d[1] : d[0],
          next = types[type];

      if (!type) {
        return false;
      }if (!from || from.call(socket, value, body, index, type, name, next)) {
        !index ? silent(ripple)(req) : next(index, value, body, name, res);
        return true;
      }
    }
  };
}

function paths(base) {
  return function (k) {
    var d = key(k)(base);
    k = is.arr(k) ? k : [k];

    return is.arr(d) ? k.join(".") : keys(d).map(prepend(k.join(".") + ".")).map(paths(base));
  };
}

function push(k, value, body, name) {
  var path = k.split("."),
      tail = path.pop(),
      o = key(path.join("."))(body) || body;

  is.arr(o) ? o.splice(tail, 0, value) : o[k] = value;
}

function remove(k, value, body, name) {
  var path = k.split("."),
      tail = path.pop(),
      o = key(path.join("."))(body) || body;

  is.arr(o) ? o.splice(tail, 1) : delete o[tail];
}

function update(k, value, body, name) {
  key(k, value)(body);
}

function headers(ripple) {
  return function (type) {
    var parse = type.parse || noop;
    type.parse = function (res) {
      if (client) return (parse.apply(this, arguments), res);
      var existing = ripple.resources[res.name],
          from = header("proxy-from")(existing),
          to = header("proxy-to")(existing);

      res.headers["proxy-from"] = header("proxy-from")(res) || header("from")(res) || from;
      res.headers["proxy-to"] = header("proxy-to")(res) || header("to")(res) || to;
      return (parse.apply(this, arguments), res);
    };
  };
}

function silent(ripple) {
  return function (res) {
    return (res.headers.silent = true, ripple(res));
  };
}

function io(opts) {
  var r = !client ? require("socket.io")(opts.server || opts) : window.io ? window.io() : is.fn(require("socket.io-client")) ? require("socket.io-client")() : { on: noop, emit: noop };
  r.use = r.use || noop;
  return r;
}

// emit all or some resources, to all or some clients
function emit(ripple) {
  return function (socket) {
    return function (name) {
      if (arguments.length && !name) return;
      if (!name) return (values(ripple.resources).map(key("name")).map(emit(ripple)(socket)), ripple);

      var res = ripple.resources[name],
          sockets = client ? [ripple.io] : ripple.io.of("/").sockets,
          lgt = stats(sockets.length, name),
          silent = header("silent", true)(res);

      return silent ? delete res.headers.silent : !res ? log("no resource to emit: ", name) : is.str(socket) ? lgt(sockets.filter(by("sessionID", socket)).map(to(res))) : !socket ? lgt(sockets.map(to(res))) : lgt([to(res)(socket)]);
    };
  };
}

function to(res) {
  return function (socket) {
    var fn = res.headers["proxy-to"] || identity,
        body = is.fn(res.body) ? "" + res.body : res.body,
        body = fn.call(socket, body);

    body && socket.emit("change", {
      name: res.name,
      body: body,
      headers: res.headers
    });

    return !!body;
  };
}

function stats(total, name) {
  return function (results) {
    log(str(results.filter(Boolean).length).green.bold + "/" + str(total).green, "sending", name);
  };
}

function setIP(socket, next) {
  socket.ip = socket.request.headers["x-forwarded-for"] || socket.request.connection.remoteAddress;
  next();
}

var identity = window['identity'];

var replace = window['replace'];

var prepend = window['prepend'];

var flatten = window['flatten'];

var values = window['values'];

var header = window['header'];

var client = window['client'];

var noop = window['noop'];

var keys = window['keys'];

var key = window['key'];

var str = window['str'];

var not = window['not'];

var log = window['log'];

var err = window['err'];

var by = window['by'];

var is = window['is'];

var diff = require("jsondiffpatch").diff;

log = log("[ri/sync]");
err = err("[ri/sync]");
var types = { push: push, remove: remove, update: update };
},{"jsondiffpatch":1,"socket.io":1,"socket.io-client":1,"utilise/by":161,"utilise/client":162,"utilise/err":164,"utilise/flatten":165,"utilise/header":168,"utilise/identity":169,"utilise/is":170,"utilise/key":171,"utilise/keys":172,"utilise/log":173,"utilise/noop":174,"utilise/not":175,"utilise/prepend":177,"utilise/replace":178,"utilise/str":180,"utilise/values":182}],161:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"dup":9,"utilise/is":170,"utilise/key":171}],162:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"dup":10}],163:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"utilise/sel":179}],164:[function(require,module,exports){
arguments[4][12][0].apply(exports,arguments)
},{"dup":12,"utilise/owner":176,"utilise/to":181}],165:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"utilise/is":170}],166:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"utilise/datum":163,"utilise/key":171}],167:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],168:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"utilise/has":167}],169:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18}],170:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],171:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"utilise/is":170,"utilise/str":180}],172:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],173:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"utilise/is":170,"utilise/owner":176,"utilise/to":181}],174:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25}],175:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"dup":56}],176:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"utilise/client":162}],177:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27}],178:[function(require,module,exports){
module.exports = function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
}
},{}],179:[function(require,module,exports){
arguments[4][30][0].apply(exports,arguments)
},{"dup":30}],180:[function(require,module,exports){
arguments[4][31][0].apply(exports,arguments)
},{"dup":31,"utilise/is":170}],181:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"dup":32}],182:[function(require,module,exports){
arguments[4][33][0].apply(exports,arguments)
},{"dup":33,"utilise/from":166,"utilise/keys":172}],183:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = create;

var components = _interopRequire(require("rijs.components"));

var singleton = _interopRequire(require("rijs.singleton"));

var sessions = _interopRequire(require("rijs.sessions"));

var reactive = _interopRequire(require("rijs.reactive"));

var prehtml = _interopRequire(require("rijs.prehtml"));

var offline = _interopRequire(require("rijs.offline"));

var precss = _interopRequire(require("rijs.precss"));

var shadow = _interopRequire(require("rijs.shadow"));

var resdir = _interopRequire(require("rijs.resdir"));

var mysql = _interopRequire(require("rijs.mysql"));

var serve = _interopRequire(require("rijs.serve"));

var delay = _interopRequire(require("rijs.delay"));

var sync = _interopRequire(require("rijs.sync"));

var core = _interopRequire(require("rijs.core"));

var data = _interopRequire(require("rijs.data"));

var html = _interopRequire(require("rijs.html"));

var css = _interopRequire(require("rijs.css"));

var fn = _interopRequire(require("rijs.fn"));

var db = _interopRequire(require("rijs.db"));

var client = window['client'];

client && !window.ripple && create();

function create(opts) {
  var ripple = core(); // empty base collection of resources

  // enrich..
  singleton(ripple); // exposes a single instance
  data(ripple); // register data types
  html(ripple); // register html types
  css(ripple); // register css types
  fn(ripple); // register fn types
  db(ripple); // enable external connections
  components(ripple); // invoke web components, fn.call(<el>, data)
  reactive(ripple); // react to changes in resources
  precss(ripple); // preapplies scoped css
  prehtml(ripple); // preapplies html templates
  shadow(ripple); // encapsulates with shadow dom or closes gap
  delay(ripple); // async rendering delay
  mysql(ripple); // adds mysql adaptor crud hooks
  serve(opts); // serve client libraries
  sync(ripple, opts); // syncs resources between server/client
  sessions(ripple, opts); // populates sessionid on each connection
  resdir(ripple, opts); // loads from resources folder
  offline(ripple); // loads/saves from/to localstorage

  return ripple;
}
},{"rijs.components":3,"rijs.core":35,"rijs.css":37,"rijs.data":44,"rijs.db":59,"rijs.delay":60,"rijs.fn":68,"rijs.html":76,"rijs.mysql":83,"rijs.offline":84,"rijs.precss":106,"rijs.prehtml":119,"rijs.reactive":131,"rijs.resdir":144,"rijs.serve":145,"rijs.sessions":146,"rijs.shadow":147,"rijs.singleton":154,"rijs.sync":160,"utilise/client":1}]},{},[183]);
