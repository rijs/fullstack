(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.ripple = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

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

  return all(selector).map(invoke(ripple));
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

function onlyIfDifferent(m) {
  return attr(m.target, m.attributeName) != m.oldValue;
}

function isCustomElement(d) {
  return ~d.nodeName.indexOf("-");
}

var resourcify = window['resourcify'];

var includes = window['includes'];

var flatten = window['flatten'];

var prepend = window['prepend'];

var header = window['header'];

var client = window['client'];

var values = window['values'];

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
},{"./types/data":4,"./types/fn":5,"utilise/all":6,"utilise/attr":7,"utilise/body":8,"utilise/by":9,"utilise/client":10,"utilise/err":11,"utilise/flatten":12,"utilise/header":13,"utilise/includes":14,"utilise/is":15,"utilise/key":16,"utilise/lo":17,"utilise/log":18,"utilise/noop":84,"utilise/prepend":85,"utilise/resourcify":86,"utilise/to":87,"utilise/values":88,"utilise/wrap":89}],4:[function(require,module,exports){
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
},{"utilise/all":6,"utilise/client":10,"utilise/header":13}],6:[function(require,module,exports){
module.exports = require('all')
},{"all":19}],7:[function(require,module,exports){
module.exports = require('attr')
},{"attr":21}],8:[function(require,module,exports){
module.exports = require('body')
},{"body":23}],9:[function(require,module,exports){
module.exports = require('by')
},{"by":28}],10:[function(require,module,exports){
module.exports = require('client')
},{"client":34}],11:[function(require,module,exports){
module.exports = require('err')
},{"err":35}],12:[function(require,module,exports){
module.exports = require('flatten')
},{"flatten":39}],13:[function(require,module,exports){
module.exports = require('header')
},{"header":40}],14:[function(require,module,exports){
module.exports = require('includes')
},{"includes":42}],15:[function(require,module,exports){
module.exports = require('is')
},{"is":43}],16:[function(require,module,exports){
module.exports = require('key')
},{"key":44}],17:[function(require,module,exports){
module.exports = require('lo')
},{"lo":48}],18:[function(require,module,exports){
module.exports = require('log')
},{"log":49}],19:[function(require,module,exports){
var to = require('to')

module.exports = function all(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return to.arr((doc || document).querySelectorAll(prefix+selector))
}
},{"to":20}],20:[function(require,module,exports){
module.exports = { 
  arr : toArray
}

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}
},{}],21:[function(require,module,exports){
var is = require('is')

module.exports = function attr(d, name, value) {
  d = d.node ? d.node() : d
  if (is.str(d)) return function(el){ return attr(this.nodeName || this.node ? this : el, d) }

  return arguments.length > 2 && value === false ? d.removeAttribute(name)
       : arguments.length > 2                    ? d.setAttribute(name, value)
       : d.attributes.getNamedItem(name) 
      && d.attributes.getNamedItem(name).value
}

},{"is":22}],22:[function(require,module,exports){
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
    return  set.indexOf 
         ? ~set.indexOf(d)
         :  d in set
  }
}
},{}],23:[function(require,module,exports){
var key = require('key')

module.exports = function body(ripple){
  return function(name){
    return key([name, 'body'].join('.'))(ripple.resources)
  }
}
},{"key":24}],24:[function(require,module,exports){
var is = require('is')
  , str = require('str')

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
                                : (set ? key(keys.join('.'), v)(o[root] ? o[root] : (o[root] = {}))
                                       : key(keys.join('.'))(o[root]))

    function copy(d){
      key(d, key(d)(o))(masked)
    }
  }
}
},{"is":25,"str":26}],25:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],26:[function(require,module,exports){
var is = require('is') 

module.exports = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is.fn(d) ? '' + d
       : is.obj(d) ? JSON.stringify(d)
       : String(d)
}
},{"is":27}],27:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],28:[function(require,module,exports){
var key = require('key')
  , is  = require('is')

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
},{"is":29,"key":30}],29:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],30:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":31,"str":32}],31:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],32:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":33}],33:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],34:[function(require,module,exports){
module.exports = typeof window != 'undefined'
},{}],35:[function(require,module,exports){
var owner = require('owner')
  , to = require('to')

module.exports = function err(prefix){
  return function(d){
    if (!owner.console || !console.error.apply) return d;
    var args = to.arr(arguments)
    args.unshift(prefix.red ? prefix.red : prefix)
    return console.error.apply(console, args), d
  }
}
},{"owner":36,"to":38}],36:[function(require,module,exports){
(function (global){
module.exports = require('client') ? /* istanbul ignore next */ window : global
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"client":37}],37:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],38:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],39:[function(require,module,exports){
module.exports = function flatten(p,v){ 
  return (p = p || []), p.concat(v) 
}

},{}],40:[function(require,module,exports){
var has = require('has')

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
},{"has":41}],41:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],42:[function(require,module,exports){
module.exports = function includes(pattern){
  return function(d){
    return ~d.indexOf(pattern)
  }
}
},{}],43:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],44:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":45,"str":46}],45:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],46:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":47}],47:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],48:[function(require,module,exports){
module.exports = function lo(d){
  return (d || '').toLowerCase()
}

},{}],49:[function(require,module,exports){
var is = require('is')
  , to = require('to')
  , owner = require('owner')

module.exports = function log(prefix){
  return function(d){
    if (!owner.console || !console.log.apply) return d;
    is.arr(arguments[2]) && (arguments[2] = arguments[2].length)
    var args = to.arr(arguments)
    args.unshift(prefix.grey ? prefix.grey : prefix)
    return console.log.apply(console, args), d
  }
}
},{"is":50,"owner":51,"to":53}],50:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],51:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":52,"dup":36}],52:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],53:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],54:[function(require,module,exports){
module.exports = function noop(){}
},{}],55:[function(require,module,exports){
module.exports = function prepend(v) {
  return function(d){
    return v+d
  }
}
},{}],56:[function(require,module,exports){
var is = require('is')
  , body = require('body')
  , first = require('first')
  , values = require('values')

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
},{"body":57,"first":62,"is":63,"values":64}],57:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23,"key":58}],58:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":59,"str":60}],59:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],60:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":61}],61:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],62:[function(require,module,exports){
module.exports = function first(d){
  return d[0]
}
},{}],63:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],64:[function(require,module,exports){
var keys = require('keys')
  , from = require('from')

module.exports = function values(o) {
  return !o ? [] : keys(o).map(from(o))
}
},{"from":65,"keys":72}],65:[function(require,module,exports){
var datum = require('datum')
  , key = require('key')

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
},{"datum":66,"key":68}],66:[function(require,module,exports){
var sel = require('sel')

module.exports = function datum(node){
  return sel(node).datum()
}
},{"sel":67}],67:[function(require,module,exports){
module.exports = function sel(){
  return d3.select.apply(this, arguments)
}
},{}],68:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":69,"str":70}],69:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],70:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":71}],71:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],72:[function(require,module,exports){
module.exports = function keys(o) {
  return Object.keys(o || {})
}
},{}],73:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],74:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64,"from":75,"keys":82}],75:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"datum":76,"dup":65,"key":78}],76:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66,"sel":77}],77:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],78:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":79,"str":80}],79:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],80:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":81}],81:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],82:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],83:[function(require,module,exports){
module.exports = function wrap(d){
  return function(){
    return d
  }
}
},{}],84:[function(require,module,exports){
module.exports = require('noop')
},{"noop":54}],85:[function(require,module,exports){
module.exports = require('prepend')
},{"prepend":55}],86:[function(require,module,exports){
module.exports = require('resourcify')
},{"resourcify":56}],87:[function(require,module,exports){
module.exports = require('to')
},{"to":73}],88:[function(require,module,exports){
module.exports = require('values')
},{"values":74}],89:[function(require,module,exports){
module.exports = require('wrap')
},{"wrap":83}],90:[function(require,module,exports){
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

  function ripple(name, body, headers) {
    return is.arr(name) ? name.map(ripple) : is.str(name) && !body && resources[name] ? resources[name].body : is.str(name) && !body && !resources[name] ? register(ripple)({ name: name }) : is.str(name) && body ? register(ripple)({ name: name, body: body, headers: headers }) : is.obj(name) && !is.arr(name) ? register(ripple)(name) : (err("could not find or create resource", name), false);
  }
}

function register(ripple) {
  return function (_ref) {
    var name = _ref.name;
    var body = _ref.body;
    var _ref$headers = _ref.headers;
    var headers = _ref$headers === undefined ? {} : _ref$headers;

    if (!name) return err("cannot register nameless resource");
    log("registering", name);
    var res = normalise(ripple)({ name: name, body: body, headers: headers });

    if (!res) return (err("failed to register", name), false);
    ripple.resources[name] = res;
    ripple.emit("change", [ripple.resources[name]]);
    return ripple.resources[name].body;
  };
}

function normalise(ripple) {
  return function (res) {
    if (!header("content-type")(res)) values(ripple.types).some(contentType(res));
    if (!header("content-type")(res)) return (err("could not understand", res), false);
    return parse(ripple)(res);
  };
}

function parse(ripple) {
  return function (res) {
    return ((ripple.types[header("content-type")(res)] || {}).parse || identity)(res);
  };
}

function contentType(res) {
  return function (type) {
    return type.check(res) && (res.headers["content-type"] = type.header);
  };
}

function types() {
  return objectify([text], "header");
}

var emitterify = window['emitterify'];

var colorfill = window['colorfill'];

var chainable = window['chainable'];

var objectify = window['objectify'];

var identity = window['identity'];

var rebind = window['rebind'];

var header = window['header'];

var values = window['values'];

var err = window['err'];

var log = window['log'];

var is = window['is'];

var text = _interopRequire(require("./types/text"));

err = err("[ri/core]");
log = log("[ri/core]");
},{"./types/text":91,"utilise/chainable":92,"utilise/colorfill":93,"utilise/emitterify":94,"utilise/err":95,"utilise/header":96,"utilise/identity":97,"utilise/is":99,"utilise/log":100,"utilise/objectify":152,"utilise/rebind":153,"utilise/values":154}],91:[function(require,module,exports){
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
},{"utilise/includes":98,"utilise/is":99}],92:[function(require,module,exports){
module.exports = require('chainable')
},{"chainable":101}],93:[function(require,module,exports){
module.exports = require('colorfill')
},{"colorfill":102}],94:[function(require,module,exports){
module.exports = require('emitterify')
},{"emitterify":117}],95:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":127}],96:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":131}],97:[function(require,module,exports){
module.exports = require('identity')
},{"identity":133}],98:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"includes":134}],99:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":135}],100:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":136}],101:[function(require,module,exports){
module.exports = function chainable(fn) {
  return function(){
    return fn.apply(this, arguments), fn
  }
}
},{}],102:[function(require,module,exports){
var client = require('client')
  , colors = !client && require('colors')
  , has = require('has')
  , is = require('is')

module.exports = colorfill()

function colorfill(){
  /* istanbul ignore next */
  ['red', 'green', 'bold', 'grey', 'strip'].forEach(function(color) {
    !is.str(String.prototype[color]) && Object.defineProperty(String.prototype, color, {
      get: function() {
        return String(this)
      } 
    })
  })
}


},{"client":103,"colors":108,"has":115,"is":116}],103:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],104:[function(require,module,exports){
/*

The MIT License (MIT)

Original Library 
  - Copyright (c) Marak Squires

Additional functionality
 - Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var colors = {};
module['exports'] = colors;

colors.themes = {};

var ansiStyles = colors.styles = require('./styles');
var defineProps = Object.defineProperties;

colors.supportsColor = require('./system/supports-colors');

if (typeof colors.enabled === "undefined") {
  colors.enabled = colors.supportsColor;
}

colors.stripColors = colors.strip = function(str){
  return ("" + str).replace(/\x1B\[\d+m/g, '');
};


var stylize = colors.stylize = function stylize (str, style) {
  if (!colors.enabled) {
    return str+'';
  }

  return ansiStyles[style].open + str + ansiStyles[style].close;
}

var matchOperatorsRe = /[|\\{}()[\]^$+*?.]/g;
var escapeStringRegexp = function (str) {
  if (typeof str !== 'string') {
    throw new TypeError('Expected a string');
  }
  return str.replace(matchOperatorsRe,  '\\$&');
}

function build(_styles) {
  var builder = function builder() {
    return applyStyle.apply(builder, arguments);
  };
  builder._styles = _styles;
  // __proto__ is used because we must return a function, but there is
  // no way to create a function with a different prototype.
  builder.__proto__ = proto;
  return builder;
}

var styles = (function () {
  var ret = {};
  ansiStyles.grey = ansiStyles.gray;
  Object.keys(ansiStyles).forEach(function (key) {
    ansiStyles[key].closeRe = new RegExp(escapeStringRegexp(ansiStyles[key].close), 'g');
    ret[key] = {
      get: function () {
        return build(this._styles.concat(key));
      }
    };
  });
  return ret;
})();

var proto = defineProps(function colors() {}, styles);

function applyStyle() {
  var args = arguments;
  var argsLen = args.length;
  var str = argsLen !== 0 && String(arguments[0]);
  if (argsLen > 1) {
    for (var a = 1; a < argsLen; a++) {
      str += ' ' + args[a];
    }
  }

  if (!colors.enabled || !str) {
    return str;
  }

  var nestedStyles = this._styles;

  var i = nestedStyles.length;
  while (i--) {
    var code = ansiStyles[nestedStyles[i]];
    str = code.open + str.replace(code.closeRe, code.open) + code.close;
  }

  return str;
}

function applyTheme (theme) {
  for (var style in theme) {
    (function(style){
      colors[style] = function(str){
        if (typeof theme[style] === 'object'){
          var out = str;
          for (var i in theme[style]){
            out = colors[theme[style][i]](out);
          }
          return out;
        }
        return colors[theme[style]](str);
      };
    })(style)
  }
}

colors.setTheme = function (theme) {
  if (typeof theme === 'string') {
    try {
      colors.themes[theme] = require(theme);
      applyTheme(colors.themes[theme]);
      return colors.themes[theme];
    } catch (err) {
      console.log(err);
      return err;
    }
  } else {
    applyTheme(theme);
  }
};

function init() {
  var ret = {};
  Object.keys(styles).forEach(function (name) {
    ret[name] = {
      get: function () {
        return build([name]);
      }
    };
  });
  return ret;
}

var sequencer = function sequencer (map, str) {
  var exploded = str.split(""), i = 0;
  exploded = exploded.map(map);
  return exploded.join("");
};

// custom formatter methods
colors.trap = require('./custom/trap');
colors.zalgo = require('./custom/zalgo');

// maps
colors.maps = {};
colors.maps.america = require('./maps/america');
colors.maps.zebra = require('./maps/zebra');
colors.maps.rainbow = require('./maps/rainbow');
colors.maps.random = require('./maps/random')

for (var map in colors.maps) {
  (function(map){
    colors[map] = function (str) {
      return sequencer(colors.maps[map], str);
    }
  })(map)
}

defineProps(colors, init());
},{"./custom/trap":105,"./custom/zalgo":106,"./maps/america":109,"./maps/rainbow":110,"./maps/random":111,"./maps/zebra":112,"./styles":113,"./system/supports-colors":114}],105:[function(require,module,exports){
module['exports'] = function runTheTrap (text, options) {
  var result = "";
  text = text || "Run the trap, drop the bass";
  text = text.split('');
  var trap = {
    a: ["\u0040", "\u0104", "\u023a", "\u0245", "\u0394", "\u039b", "\u0414"],
    b: ["\u00df", "\u0181", "\u0243", "\u026e", "\u03b2", "\u0e3f"],
    c: ["\u00a9", "\u023b", "\u03fe"],
    d: ["\u00d0", "\u018a", "\u0500" , "\u0501" ,"\u0502", "\u0503"],
    e: ["\u00cb", "\u0115", "\u018e", "\u0258", "\u03a3", "\u03be", "\u04bc", "\u0a6c"],
    f: ["\u04fa"],
    g: ["\u0262"],
    h: ["\u0126", "\u0195", "\u04a2", "\u04ba", "\u04c7", "\u050a"],
    i: ["\u0f0f"],
    j: ["\u0134"],
    k: ["\u0138", "\u04a0", "\u04c3", "\u051e"],
    l: ["\u0139"],
    m: ["\u028d", "\u04cd", "\u04ce", "\u0520", "\u0521", "\u0d69"],
    n: ["\u00d1", "\u014b", "\u019d", "\u0376", "\u03a0", "\u048a"],
    o: ["\u00d8", "\u00f5", "\u00f8", "\u01fe", "\u0298", "\u047a", "\u05dd", "\u06dd", "\u0e4f"],
    p: ["\u01f7", "\u048e"],
    q: ["\u09cd"],
    r: ["\u00ae", "\u01a6", "\u0210", "\u024c", "\u0280", "\u042f"],
    s: ["\u00a7", "\u03de", "\u03df", "\u03e8"],
    t: ["\u0141", "\u0166", "\u0373"],
    u: ["\u01b1", "\u054d"],
    v: ["\u05d8"],
    w: ["\u0428", "\u0460", "\u047c", "\u0d70"],
    x: ["\u04b2", "\u04fe", "\u04fc", "\u04fd"],
    y: ["\u00a5", "\u04b0", "\u04cb"],
    z: ["\u01b5", "\u0240"]
  }
  text.forEach(function(c){
    c = c.toLowerCase();
    var chars = trap[c] || [" "];
    var rand = Math.floor(Math.random() * chars.length);
    if (typeof trap[c] !== "undefined") {
      result += trap[c][rand];
    } else {
      result += c;
    }
  });
  return result;

}

},{}],106:[function(require,module,exports){
// please no
module['exports'] = function zalgo(text, options) {
  text = text || "   he is here   ";
  var soul = {
    "up" : [
      '̍', '̎', '̄', '̅',
      '̿', '̑', '̆', '̐',
      '͒', '͗', '͑', '̇',
      '̈', '̊', '͂', '̓',
      '̈', '͊', '͋', '͌',
      '̃', '̂', '̌', '͐',
      '̀', '́', '̋', '̏',
      '̒', '̓', '̔', '̽',
      '̉', 'ͣ', 'ͤ', 'ͥ',
      'ͦ', 'ͧ', 'ͨ', 'ͩ',
      'ͪ', 'ͫ', 'ͬ', 'ͭ',
      'ͮ', 'ͯ', '̾', '͛',
      '͆', '̚'
    ],
    "down" : [
      '̖', '̗', '̘', '̙',
      '̜', '̝', '̞', '̟',
      '̠', '̤', '̥', '̦',
      '̩', '̪', '̫', '̬',
      '̭', '̮', '̯', '̰',
      '̱', '̲', '̳', '̹',
      '̺', '̻', '̼', 'ͅ',
      '͇', '͈', '͉', '͍',
      '͎', '͓', '͔', '͕',
      '͖', '͙', '͚', '̣'
    ],
    "mid" : [
      '̕', '̛', '̀', '́',
      '͘', '̡', '̢', '̧',
      '̨', '̴', '̵', '̶',
      '͜', '͝', '͞',
      '͟', '͠', '͢', '̸',
      '̷', '͡', ' ҉'
    ]
  },
  all = [].concat(soul.up, soul.down, soul.mid),
  zalgo = {};

  function randomNumber(range) {
    var r = Math.floor(Math.random() * range);
    return r;
  }

  function is_char(character) {
    var bool = false;
    all.filter(function (i) {
      bool = (i === character);
    });
    return bool;
  }
  

  function heComes(text, options) {
    var result = '', counts, l;
    options = options || {};
    options["up"] =   typeof options["up"]   !== 'undefined' ? options["up"]   : true;
    options["mid"] =  typeof options["mid"]  !== 'undefined' ? options["mid"]  : true;
    options["down"] = typeof options["down"] !== 'undefined' ? options["down"] : true;
    options["size"] = typeof options["size"] !== 'undefined' ? options["size"] : "maxi";
    text = text.split('');
    for (l in text) {
      if (is_char(l)) {
        continue;
      }
      result = result + text[l];
      counts = {"up" : 0, "down" : 0, "mid" : 0};
      switch (options.size) {
      case 'mini':
        counts.up = randomNumber(8);
        counts.mid = randomNumber(2);
        counts.down = randomNumber(8);
        break;
      case 'maxi':
        counts.up = randomNumber(16) + 3;
        counts.mid = randomNumber(4) + 1;
        counts.down = randomNumber(64) + 3;
        break;
      default:
        counts.up = randomNumber(8) + 1;
        counts.mid = randomNumber(6) / 2;
        counts.down = randomNumber(8) + 1;
        break;
      }

      var arr = ["up", "mid", "down"];
      for (var d in arr) {
        var index = arr[d];
        for (var i = 0 ; i <= counts[index]; i++) {
          if (options[index]) {
            result = result + soul[index][randomNumber(soul[index].length)];
          }
        }
      }
    }
    return result;
  }
  // don't summon him
  return heComes(text, options);
}

},{}],107:[function(require,module,exports){
var colors = require('./colors');

module['exports'] = function () {

  //
  // Extends prototype of native string object to allow for "foo".red syntax
  //
  var addProperty = function (color, func) {
    String.prototype.__defineGetter__(color, func);
  };

  var sequencer = function sequencer (map, str) {
      return function () {
        var exploded = this.split(""), i = 0;
        exploded = exploded.map(map);
        return exploded.join("");
      }
  };

  addProperty('strip', function () {
    return colors.strip(this);
  });

  addProperty('stripColors', function () {
    return colors.strip(this);
  });

  addProperty("trap", function(){
    return colors.trap(this);
  });

  addProperty("zalgo", function(){
    return colors.zalgo(this);
  });

  addProperty("zebra", function(){
    return colors.zebra(this);
  });

  addProperty("rainbow", function(){
    return colors.rainbow(this);
  });

  addProperty("random", function(){
    return colors.random(this);
  });

  addProperty("america", function(){
    return colors.america(this);
  });

  //
  // Iterate through all default styles and colors
  //
  var x = Object.keys(colors.styles);
  x.forEach(function (style) {
    addProperty(style, function () {
      return colors.stylize(this, style);
    });
  });

  function applyTheme(theme) {
    //
    // Remark: This is a list of methods that exist
    // on String that you should not overwrite.
    //
    var stringPrototypeBlacklist = [
      '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'charAt', 'constructor',
      'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString', 'toString', 'valueOf', 'charCodeAt',
      'indexOf', 'lastIndexof', 'length', 'localeCompare', 'match', 'replace', 'search', 'slice', 'split', 'substring',
      'toLocaleLowerCase', 'toLocaleUpperCase', 'toLowerCase', 'toUpperCase', 'trim', 'trimLeft', 'trimRight'
    ];

    Object.keys(theme).forEach(function (prop) {
      if (stringPrototypeBlacklist.indexOf(prop) !== -1) {
        console.log('warn: '.red + ('String.prototype' + prop).magenta + ' is probably something you don\'t want to override. Ignoring style name');
      }
      else {
        if (typeof(theme[prop]) === 'string') {
          colors[prop] = colors[theme[prop]];
          addProperty(prop, function () {
            return colors[theme[prop]](this);
          });
        }
        else {
          addProperty(prop, function () {
            var ret = this;
            for (var t = 0; t < theme[prop].length; t++) {
              ret = colors[theme[prop][t]](ret);
            }
            return ret;
          });
        }
      }
    });
  }

  colors.setTheme = function (theme) {
    if (typeof theme === 'string') {
      try {
        colors.themes[theme] = require(theme);
        applyTheme(colors.themes[theme]);
        return colors.themes[theme];
      } catch (err) {
        console.log(err);
        return err;
      }
    } else {
      applyTheme(theme);
    }
  };

};
},{"./colors":104}],108:[function(require,module,exports){
var colors = require('./colors');
module['exports'] = colors;

// Remark: By default, colors will add style properties to String.prototype
//
// If you don't wish to extend String.prototype you can do this instead and native String will not be touched
//
//   var colors = require('colors/safe);
//   colors.red("foo")
//
//
require('./extendStringPrototype')();
},{"./colors":104,"./extendStringPrototype":107}],109:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function() {
  return function (letter, i, exploded) {
    if(letter === " ") return letter;
    switch(i%3) {
      case 0: return colors.red(letter);
      case 1: return colors.white(letter)
      case 2: return colors.blue(letter)
    }
  }
})();
},{"../colors":104}],110:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var rainbowColors = ['red', 'yellow', 'green', 'blue', 'magenta']; //RoY G BiV
  return function (letter, i, exploded) {
    if (letter === " ") {
      return letter;
    } else {
      return colors[rainbowColors[i++ % rainbowColors.length]](letter);
    }
  };
})();


},{"../colors":104}],111:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
  };
})();
},{"../colors":104}],112:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = function (letter, i, exploded) {
  return i % 2 === 0 ? letter : colors.inverse(letter);
};
},{"../colors":104}],113:[function(require,module,exports){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var styles = {};
module['exports'] = styles;

var codes = {
  reset: [0, 0],

  bold: [1, 22],
  dim: [2, 22],
  italic: [3, 23],
  underline: [4, 24],
  inverse: [7, 27],
  hidden: [8, 28],
  strikethrough: [9, 29],

  black: [30, 39],
  red: [31, 39],
  green: [32, 39],
  yellow: [33, 39],
  blue: [34, 39],
  magenta: [35, 39],
  cyan: [36, 39],
  white: [37, 39],
  gray: [90, 39],
  grey: [90, 39],

  bgBlack: [40, 49],
  bgRed: [41, 49],
  bgGreen: [42, 49],
  bgYellow: [43, 49],
  bgBlue: [44, 49],
  bgMagenta: [45, 49],
  bgCyan: [46, 49],
  bgWhite: [47, 49],

  // legacy styles for colors pre v1.0.0
  blackBG: [40, 49],
  redBG: [41, 49],
  greenBG: [42, 49],
  yellowBG: [43, 49],
  blueBG: [44, 49],
  magentaBG: [45, 49],
  cyanBG: [46, 49],
  whiteBG: [47, 49]

};

Object.keys(codes).forEach(function (key) {
  var val = codes[key];
  var style = styles[key] = [];
  style.open = '\u001b[' + val[0] + 'm';
  style.close = '\u001b[' + val[1] + 'm';
});
},{}],114:[function(require,module,exports){
(function (process){
/*
The MIT License (MIT)

Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (sindresorhus.com)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

*/

var argv = process.argv;

module.exports = (function () {
  if (argv.indexOf('--no-color') !== -1 ||
    argv.indexOf('--color=false') !== -1) {
    return false;
  }

  if (argv.indexOf('--color') !== -1 ||
    argv.indexOf('--color=true') !== -1 ||
    argv.indexOf('--color=always') !== -1) {
    return true;
  }

  if (process.stdout && !process.stdout.isTTY) {
    return false;
  }

  if (process.platform === 'win32') {
    return true;
  }

  if ('COLORTERM' in process.env) {
    return true;
  }

  if (process.env.TERM === 'dumb') {
    return false;
  }

  if (/^screen|^xterm|^vt100|color|ansi|cygwin|linux/i.test(process.env.TERM)) {
    return true;
  }

  return false;
})();
}).call(this,require('_process'))
},{"_process":2}],115:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],116:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],117:[function(require,module,exports){
var err  = require('err')('[emitterify]')
  , keys = require('keys')
  , def  = require('def')
  , not  = require('not')
  , is   = require('is')
  
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
    try { o[k].apply(body, p) } catch(e) { err(e, e.stack)  }
    o[k].once && (isFinite(k) ? o.splice(k, 1) : delete o[k])
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
},{"def":118,"err":120,"is":124,"keys":125,"not":126}],118:[function(require,module,exports){
var has = require('has')

module.exports = function def(o, p, v, w){
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"has":119}],119:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],120:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":121,"to":123}],121:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":122,"dup":36}],122:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],123:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],124:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],125:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],126:[function(require,module,exports){
module.exports = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}
},{}],127:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":128,"to":130}],128:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":129,"dup":36}],129:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],130:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],131:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40,"has":132}],132:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],133:[function(require,module,exports){
module.exports = function identity(d) {
  return d
}
},{}],134:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],135:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],136:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":137,"owner":138,"to":140}],137:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],138:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":139,"dup":36}],139:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],140:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],141:[function(require,module,exports){
module.exports = function objectify(rows, by) {
  var o = {}, by = by || 'name'
  return rows.forEach(function(d){
    return o[d[by]] = d 
  }), o
}
},{}],142:[function(require,module,exports){
module.exports = function(target, source) {
  var i = 1, n = arguments.length, method
  while (++i < n) target[method = arguments[i]] = rebind(target, source, source[method])
  return target
}

function rebind(target, source, method) {
  return function() {
    var value = method.apply(source, arguments)
    return value === source ? target : value
  }
}
},{}],143:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64,"from":144,"keys":151}],144:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"datum":145,"dup":65,"key":147}],145:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66,"sel":146}],146:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],147:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":148,"str":149}],148:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],149:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":150}],150:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],151:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],152:[function(require,module,exports){
module.exports = require('objectify')
},{"objectify":141}],153:[function(require,module,exports){
module.exports = require('rebind')
},{"rebind":142}],154:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88,"values":143}],155:[function(require,module,exports){
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
},{"utilise/includes":156,"utilise/log":157}],156:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"includes":158}],157:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":159}],158:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],159:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":160,"owner":161,"to":163}],160:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],161:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":162,"dup":36}],162:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],163:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],164:[function(require,module,exports){
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
    arguments[0] = arguments[0].body;
    return header("content-type", "application/data")(res) && ripple.resources[res.name].body.emit("change", to.arr(arguments), not(is["in"](["bubble"])));
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
},{"utilise/emitterify":165,"utilise/extend":166,"utilise/header":167,"utilise/is":168,"utilise/log":169,"utilise/not":195,"utilise/to":196}],165:[function(require,module,exports){
arguments[4][94][0].apply(exports,arguments)
},{"dup":94,"emitterify":170}],166:[function(require,module,exports){
module.exports = require('extend')
},{"extend":180}],167:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":185}],168:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":187}],169:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":188}],170:[function(require,module,exports){
arguments[4][117][0].apply(exports,arguments)
},{"def":171,"dup":117,"err":173,"is":177,"keys":178,"not":179}],171:[function(require,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"dup":118,"has":172}],172:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],173:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":174,"to":176}],174:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":175,"dup":36}],175:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],176:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],177:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],178:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],179:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],180:[function(require,module,exports){
var is = require('is')
  , not = require('not')
  , keys = require('keys')
  , copy = require('copy')

module.exports = function extend(to){ 
  return function(from){
    keys(from)
      .filter(not(is.in(to)))
      .map(copy(from, to))

    return to
  }
}
},{"copy":181,"is":182,"keys":183,"not":184}],181:[function(require,module,exports){
module.exports = function copy(from, to){ 
  return function(d){ 
    return to[d] = from[d], d
  }
}
},{}],182:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],183:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],184:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],185:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40,"has":186}],186:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],187:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],188:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":189,"owner":190,"to":192}],189:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],190:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":191,"dup":36}],191:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],192:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],193:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],194:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],195:[function(require,module,exports){
module.exports = require('not')
},{"not":193}],196:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"dup":87,"to":194}],197:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":198}],198:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],199:[function(require,module,exports){
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
    var delay = attr(el, "delay");
    return delay != null ? (el.setAttribute("inert", ""), el.removeAttribute("delay"), setTimeout(el.removeAttribute.bind(el, "inert"), +delay)) : render.apply(this, arguments);
  };

  return ripple;
}

var client = window['client'];

var attr = window['attr'];

var log = window['log'];

var err = window['err'];

log = log("[ri/delay]");
err = err("[ri/delay]");
},{"utilise/attr":200,"utilise/client":201,"utilise/err":202,"utilise/log":203}],200:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":204,"dup":7}],201:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":206,"dup":10}],202:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":207}],203:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":211}],204:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"is":205}],205:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],206:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],207:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":208,"to":210}],208:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":209,"dup":36}],209:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],210:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],211:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":212,"owner":213,"to":215}],212:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],213:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":214,"dup":36}],214:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],215:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],216:[function(require,module,exports){
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
},{"utilise/fn":217,"utilise/includes":218,"utilise/is":219,"utilise/log":220}],217:[function(require,module,exports){
module.exports = require('fn')
},{"fn":221}],218:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"includes":223}],219:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":224}],220:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":225}],221:[function(require,module,exports){
var is = require('is')

module.exports = function fn(candid){
  return is.fn(candid) ? candid
       : (new Function("return " + candid))()
}
},{"is":222}],222:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],223:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],224:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],225:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":226,"owner":227,"to":229}],226:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],227:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":228,"dup":36}],228:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],229:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],230:[function(require,module,exports){
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
},{"utilise/includes":231,"utilise/log":232}],231:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"includes":233}],232:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":234}],233:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],234:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":235,"owner":236,"to":238}],235:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],236:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":237,"dup":36}],237:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],238:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],239:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":240}],240:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],241:[function(require,module,exports){
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
},{"utilise/client":242,"utilise/clone":243,"utilise/debounce":244,"utilise/err":245,"utilise/group":246,"utilise/header":247,"utilise/is":248,"utilise/key":249,"utilise/log":250,"utilise/not":293,"utilise/parse":294,"utilise/proxy":295,"utilise/str":296,"utilise/values":297}],242:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":251,"dup":10}],243:[function(require,module,exports){
module.exports = require('clone')
},{"clone":252}],244:[function(require,module,exports){
module.exports = require('debounce')
},{"debounce":257}],245:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":259}],246:[function(require,module,exports){
module.exports = require('group')
},{"group":263}],247:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":266}],248:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":268}],249:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"key":269}],250:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":273}],251:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],252:[function(require,module,exports){
var parse = require('parse')
  , str = require('str')
  , is = require('is')

module.exports = function clone(d) {
  return !is.fn(d) 
       ? parse(str(d))
       : d
}

},{"is":253,"parse":254,"str":255}],253:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],254:[function(require,module,exports){
module.exports = function parse(d){
  return d && JSON.parse(d)
}
},{}],255:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":256}],256:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],257:[function(require,module,exports){
var is = require('is')

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
},{"is":258}],258:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],259:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":260,"to":262}],260:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":261,"dup":36}],261:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],262:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],263:[function(require,module,exports){
var client = require('client')
  , owner = require('owner')

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
},{"client":251,"owner":264}],264:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":265,"dup":36}],265:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],266:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40,"has":267}],267:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],268:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],269:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":270,"str":271}],270:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],271:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":272}],272:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],273:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":274,"owner":275,"to":277}],274:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],275:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":276,"dup":36}],276:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],277:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],278:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],279:[function(require,module,exports){
arguments[4][254][0].apply(exports,arguments)
},{"dup":254}],280:[function(require,module,exports){
var is = require('is')

module.exports = function proxy(fn, ret, ctx){ 
  return function(){
    var result = fn.apply(ctx || this, arguments)
    return is.fn(ret) ? ret(result) : ret || result
  }
}
},{"is":281}],281:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],282:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":283}],283:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],284:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64,"from":285,"keys":292}],285:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"datum":286,"dup":65,"key":288}],286:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66,"sel":287}],287:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],288:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":289,"str":290}],289:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],290:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":291}],291:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],292:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],293:[function(require,module,exports){
arguments[4][195][0].apply(exports,arguments)
},{"dup":195,"not":278}],294:[function(require,module,exports){
module.exports = require('parse')
},{"parse":279}],295:[function(require,module,exports){
module.exports = require('proxy')
},{"proxy":280}],296:[function(require,module,exports){
module.exports = require('str')
},{"str":282}],297:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88,"values":284}],298:[function(require,module,exports){
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

    // this el does not have a css dep
    if (!css) return render.apply(this, arguments);

    // this el has a css dep, but it is not loaded yet
    if (css && !ripple.resources[css]) return;

    // this el does not have a shadow and css has already been added
    if (noShadow && all("style[resource=\"" + css + "\"]").length) return render.apply(this, arguments);

    style = raw("style", root) || document.createElement("style");
    styles = ripple(css);

    // scope css if no shadow
    if (noShadow) {
      prefix = attr(el, "is") ? "[is=\"" + attr(el, "is") + "\"]" : el.tagName.toLowerCase();
      styles = polyfill(styles, prefix);
    }

    style.innerHTML = styles;
    attr(style, "resource", noShadow ? css : false);
    root.insertBefore(style, root.firstChild);
    render.apply(this, arguments);
  };

  return ripple;
}

function polyfill(css, prefix) {
  return !prefix ? css : css.replace(/:host\((.+)\)/gi, function ($1, $2) {
    return prefix + $2;
  }).replace(/:host/gi, prefix).replace(/^(.+)[{]/gim, function ($1) {
    return prefix + " " + $1;
  }).replace(/^(.+)(^[:])[,]/gim, function ($1) {
    return prefix + " " + $1;
  }).replace(new RegExp(prefix + " " + prefix, "g"), prefix);
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
},{"utilise/all":299,"utilise/attr":300,"utilise/client":301,"utilise/err":302,"utilise/key":303,"utilise/log":304,"utilise/raw":325,"utilise/wrap":326}],299:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"all":305,"dup":6}],300:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":307,"dup":7}],301:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":309,"dup":10}],302:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":310}],303:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"key":314}],304:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":318}],305:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"to":306}],306:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],307:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"is":308}],308:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],309:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],310:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":311,"to":313}],311:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":312,"dup":36}],312:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],313:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],314:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":315,"str":316}],315:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],316:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":317}],317:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],318:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":319,"owner":320,"to":322}],319:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],320:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":321,"dup":36}],321:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],322:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],323:[function(require,module,exports){
module.exports = function raw(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return (doc ? doc : document).querySelector(prefix+selector)
}
},{}],324:[function(require,module,exports){
arguments[4][83][0].apply(exports,arguments)
},{"dup":83}],325:[function(require,module,exports){
module.exports = require('raw')
},{"raw":323}],326:[function(require,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"dup":89,"wrap":324}],327:[function(require,module,exports){
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
    div.innerHTML = ripple(html);
    el.innerHTML = div.innerHTML;
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
},{"utilise/all":328,"utilise/attr":329,"utilise/client":330,"utilise/err":331,"utilise/key":332,"utilise/log":333,"utilise/wrap":353}],328:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"all":334,"dup":6}],329:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":336,"dup":7}],330:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":338,"dup":10}],331:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":339}],332:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"key":343}],333:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":347}],334:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"to":335}],335:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],336:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21,"is":337}],337:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],338:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],339:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":340,"to":342}],340:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":341,"dup":36}],341:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],342:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],343:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":344,"str":345}],344:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],345:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":346}],346:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],347:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":348,"owner":349,"to":351}],348:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],349:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":350,"dup":36}],350:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],351:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],352:[function(require,module,exports){
arguments[4][83][0].apply(exports,arguments)
},{"dup":83}],353:[function(require,module,exports){
arguments[4][89][0].apply(exports,arguments)
},{"dup":89,"wrap":352}],354:[function(require,module,exports){
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

    is.arr(res.body) && res.body.forEach(observe);

    function observe(d) {
      if (!is.obj(d)) {
        return;
      }if (d.observer) {
        return;
      }var fn = child(ripple)(res);
      def(d, "observer", fn);
      Object.observe(d, fn);
    }
  };
}

function child(ripple) {
  return function (res) {
    return function (changes) {
      var key = res.body.indexOf(changes[0].object),
          value = res.body,
          type = "update",
          change = { key: key, value: value, type: type };

      ripple.emit("change", [res, change], not(is["in"](["reactive"])));
    };
  };
}

function changed(ripple) {
  return function (res) {
    return function (changes) {
      changes.map(normalize).filter(Boolean).map(function (change) {
        return ripple.emit("change", [res, change], not(is["in"](["reactive"])));
      });
    };
  };
}

function polyfill(ripple) {
  return function (res) {
    if (!ripple.observer) ripple.observer = setInterval(check(ripple), 100);
    if (!ripple.cache) ripple.cache = {};
    if (!has(ripple.cache, res.name)) ripple.cache[res.name] = str(res.body);
  };
}

function check(ripple) {
  return function () {
    if (!ripple || !ripple.resources) return clearInterval(ripple.observer);
    keys(ripple.cache).forEach(function (name) {
      var res = ripple.resources[name];
      if (ripple.cache[name] != str(res.body)) {
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
},{"utilise/def":355,"utilise/err":356,"utilise/has":357,"utilise/header":358,"utilise/is":359,"utilise/keys":360,"utilise/log":361,"utilise/not":381,"utilise/str":382}],355:[function(require,module,exports){
module.exports = require('def')
},{"def":362}],356:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":364}],357:[function(require,module,exports){
module.exports = require('has')
},{"has":368}],358:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":369}],359:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":371}],360:[function(require,module,exports){
module.exports = require('keys')
},{"keys":372}],361:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":373}],362:[function(require,module,exports){
arguments[4][118][0].apply(exports,arguments)
},{"dup":118,"has":363}],363:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],364:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":365,"to":367}],365:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":366,"dup":36}],366:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],367:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],368:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],369:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40,"has":370}],370:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],371:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],372:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],373:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":374,"owner":375,"to":377}],374:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],375:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":376,"dup":36}],376:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],377:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],378:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],379:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":380}],380:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],381:[function(require,module,exports){
arguments[4][195][0].apply(exports,arguments)
},{"dup":195,"not":378}],382:[function(require,module,exports){
arguments[4][296][0].apply(exports,arguments)
},{"dup":296,"str":379}],383:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":384}],384:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],385:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":386}],386:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],387:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":388}],388:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],389:[function(require,module,exports){
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
},{"utilise/client":390,"utilise/err":391,"utilise/log":392}],390:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":393,"dup":10}],391:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":394}],392:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":398}],393:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],394:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":395,"to":397}],395:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":396,"dup":36}],396:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],397:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],398:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":399,"owner":400,"to":402}],399:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],400:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":401,"dup":36}],401:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],402:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],403:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
module.exports = singleton;

function singleton(ripple) {
  log("creating");
  owner.ripple = ripple;
  return ripple;
}

var owner = window['owner'];

var log = window['log'];

log = log("[ri/singleton]");
},{"utilise/log":404,"utilise/owner":412}],404:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":405}],405:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":406,"owner":407,"to":409}],406:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],407:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":408,"dup":36}],408:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],409:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],410:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":411,"dup":36}],411:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],412:[function(require,module,exports){
module.exports = require('owner')
},{"owner":410}],413:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// -------------------------------------------
// API: Synchronises resources between server/client
// -------------------------------------------
module.exports = sync;

function sync(ripple, server) {
  log("creating");

  values(ripple.types).map(headers(ripple));
  ripple.sync = emit(ripple);
  ripple.io = io(server);
  ripple.on("change", function (res) {
    return emit(ripple)()(res.name);
  });
  ripple.io.on("change", silent(ripple));
  ripple.io.on("connection", function (s) {
    return s.on("change", change(ripple));
  });
  // ripple.io.on('connection', s => s.on('change', res => emit(ripple)()(res.name)))
  ripple.io.on("connection", function (s) {
    return emit(ripple)(s)();
  });
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

    if (is.arr(deltas)) return delta("");

    keys(deltas).reverse().filter(not(is("_t"))).map(flatten(deltas)).map(delta);

    function delta(k) {

      var d = key(k)(deltas),
          name = req.name,
          body = res.body,
          index = k.replace(/_/g, ""),
          type = d.length == 1 ? "push" : d.length == 2 ? "update" : d[2] === 0 ? "remove" : "",
          value = type == "update" ? d[1] : d[0],
          next = types[type];

      if (!type) {
        return;
      }if (!from || from.call(socket, value, body, index, type, name, next)) {
        if (!index) {
          return silent(ripple)(req);
        }next(index, value, body, name, res);
        // res.headers.silent = true
        ripple(name).emit("change");
      }
    }
  };
}

function flatten(base) {
  return function (k) {
    var d = key(k)(base);
    k = is.arr(k) ? k : [k];

    return is.arr(d) ? k.join(".") : flatten(base)(k.concat(keys(d)).join("."));
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
  return !client ? require("socket.io")(opts.server || opts) : window.io ? window.io() : is.fn(require("socket.io-client")) ? require("socket.io-client")() : { on: noop, emit: noop };
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

var identity = window['identity'];

var replace = window['replace'];

var matches = window['matches'];

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
},{"jsondiffpatch":1,"socket.io":1,"socket.io-client":1,"utilise/by":414,"utilise/client":415,"utilise/err":416,"utilise/header":417,"utilise/identity":418,"utilise/is":419,"utilise/key":420,"utilise/keys":421,"utilise/log":422,"utilise/matches":423,"utilise/noop":463,"utilise/not":464,"utilise/replace":465,"utilise/str":466,"utilise/values":467}],414:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"by":424,"dup":9}],415:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":430,"dup":10}],416:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":431}],417:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":435}],418:[function(require,module,exports){
arguments[4][97][0].apply(exports,arguments)
},{"dup":97,"identity":437}],419:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"is":438}],420:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"key":439}],421:[function(require,module,exports){
arguments[4][360][0].apply(exports,arguments)
},{"dup":360,"keys":443}],422:[function(require,module,exports){
arguments[4][18][0].apply(exports,arguments)
},{"dup":18,"log":444}],423:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"by":424,"dup":9}],424:[function(require,module,exports){
arguments[4][28][0].apply(exports,arguments)
},{"dup":28,"is":425,"key":426}],425:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],426:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":427,"str":428}],427:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],428:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":429}],429:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],430:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],431:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35,"owner":432,"to":434}],432:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":433,"dup":36}],433:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],434:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],435:[function(require,module,exports){
arguments[4][40][0].apply(exports,arguments)
},{"dup":40,"has":436}],436:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41}],437:[function(require,module,exports){
arguments[4][133][0].apply(exports,arguments)
},{"dup":133}],438:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],439:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":440,"str":441}],440:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],441:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":442}],442:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],443:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],444:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"dup":49,"is":445,"owner":446,"to":448}],445:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],446:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"client":447,"dup":36}],447:[function(require,module,exports){
arguments[4][34][0].apply(exports,arguments)
},{"dup":34}],448:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20}],449:[function(require,module,exports){
arguments[4][54][0].apply(exports,arguments)
},{"dup":54}],450:[function(require,module,exports){
arguments[4][126][0].apply(exports,arguments)
},{"dup":126}],451:[function(require,module,exports){
module.exports = function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
}
},{}],452:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":453}],453:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],454:[function(require,module,exports){
arguments[4][64][0].apply(exports,arguments)
},{"dup":64,"from":455,"keys":462}],455:[function(require,module,exports){
arguments[4][65][0].apply(exports,arguments)
},{"datum":456,"dup":65,"key":458}],456:[function(require,module,exports){
arguments[4][66][0].apply(exports,arguments)
},{"dup":66,"sel":457}],457:[function(require,module,exports){
arguments[4][67][0].apply(exports,arguments)
},{"dup":67}],458:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"is":459,"str":460}],459:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],460:[function(require,module,exports){
arguments[4][26][0].apply(exports,arguments)
},{"dup":26,"is":461}],461:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22}],462:[function(require,module,exports){
arguments[4][72][0].apply(exports,arguments)
},{"dup":72}],463:[function(require,module,exports){
arguments[4][84][0].apply(exports,arguments)
},{"dup":84,"noop":449}],464:[function(require,module,exports){
arguments[4][195][0].apply(exports,arguments)
},{"dup":195,"not":450}],465:[function(require,module,exports){
module.exports = require('replace')
},{"replace":451}],466:[function(require,module,exports){
arguments[4][296][0].apply(exports,arguments)
},{"dup":296,"str":452}],467:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88,"values":454}],468:[function(require,module,exports){
"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

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

module.exports = client ? createRipple() : createRipple;

function createRipple(opts) {
  var ripple = core(); // empty base collection of resources

  // enrich..
  data(ripple); // register data types
  html(ripple); // register html types
  css(ripple); // register css types
  fn(ripple); // register fn types
  db(ripple); // register fn types
  components(ripple); // invoke web components, fn.call(<el>, data)
  singleton(ripple); // exposes a single instance
  reactive(ripple); // react to changes in resources
  prehtml(ripple); // preapplies html templates
  precss(ripple); // preapplies scoped css
  shadow(ripple); // encapsulates with shadow dom or closes gap
  delay(ripple); // async rendering delay
  mysql(ripple); // adds mysql adaptor crud hooks
  serve(opts); // serve client libraries
  sync(ripple, opts); // syncs resources between server/client
  sessions(ripple, opts); // populates sessionid on each connection
  resdir(ripple); // loads from resources folder
  offline(ripple); // loads from resources folder

  return ripple;
}
},{"rijs.components":3,"rijs.core":90,"rijs.css":155,"rijs.data":164,"rijs.db":197,"rijs.delay":199,"rijs.fn":216,"rijs.html":230,"rijs.mysql":239,"rijs.offline":241,"rijs.precss":298,"rijs.prehtml":327,"rijs.reactive":354,"rijs.resdir":383,"rijs.serve":385,"rijs.sessions":387,"rijs.shadow":389,"rijs.singleton":403,"rijs.sync":413,"utilise/client":1}]},{},[468])(468)
});