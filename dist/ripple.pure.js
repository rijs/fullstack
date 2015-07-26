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
},{"./types/data":4,"./types/fn":5,"utilise/all":6,"utilise/attr":7,"utilise/body":8,"utilise/by":9,"utilise/client":10,"utilise/err":11,"utilise/flatten":12,"utilise/header":13,"utilise/identity":14,"utilise/includes":15,"utilise/is":16,"utilise/key":17,"utilise/lo":18,"utilise/log":19,"utilise/noop":88,"utilise/prepend":89,"utilise/proxy":90,"utilise/resourcify":91,"utilise/to":92,"utilise/values":93,"utilise/wrap":94}],4:[function(require,module,exports){
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
},{"all":20}],7:[function(require,module,exports){
module.exports = require('attr')
},{"attr":22}],8:[function(require,module,exports){
module.exports = require('body')
},{"body":24}],9:[function(require,module,exports){
module.exports = require('by')
},{"by":29}],10:[function(require,module,exports){
module.exports = require('client')
},{"client":35}],11:[function(require,module,exports){
module.exports = require('err')
},{"err":36}],12:[function(require,module,exports){
module.exports = require('flatten')
},{"flatten":40}],13:[function(require,module,exports){
module.exports = require('header')
},{"header":41}],14:[function(require,module,exports){
module.exports = require('identity')
},{"identity":43}],15:[function(require,module,exports){
module.exports = require('includes')
},{"includes":44}],16:[function(require,module,exports){
module.exports = require('is')
},{"is":45}],17:[function(require,module,exports){
module.exports = require('key')
},{"key":46}],18:[function(require,module,exports){
module.exports = require('lo')
},{"lo":50}],19:[function(require,module,exports){
module.exports = require('log')
},{"log":51}],20:[function(require,module,exports){
var to = require('to')

module.exports = function all(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return to.arr((doc || document).querySelectorAll(prefix+selector))
}
},{"to":21}],21:[function(require,module,exports){
module.exports = { 
  arr : toArray
}

function toArray(d){
  return Array.prototype.slice.call(d, 0)
}
},{}],22:[function(require,module,exports){
var is = require('is')

module.exports = function attr(d, name, value) {
  d = d.node ? d.node() : d
  if (is.str(d)) return function(el){ return attr(this.nodeName || this.node ? this : el, d) }

  return arguments.length > 2 && value === false ? d.removeAttribute(name)
       : arguments.length > 2                    ? d.setAttribute(name, value)
       : d.attributes.getNamedItem(name) 
      && d.attributes.getNamedItem(name).value
}

},{"is":23}],23:[function(require,module,exports){
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
},{}],24:[function(require,module,exports){
var key = require('key')

module.exports = function body(ripple){
  return function(name){
    return key([name, 'body'].join('.'))(ripple.resources)
  }
}
},{"key":25}],25:[function(require,module,exports){
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
},{"is":26,"str":27}],26:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],27:[function(require,module,exports){
var is = require('is') 

module.exports = function str(d){
  return d === 0 ? '0'
       : !d ? ''
       : is.fn(d) ? '' + d
       : is.obj(d) ? JSON.stringify(d)
       : String(d)
}
},{"is":28}],28:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],29:[function(require,module,exports){
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
},{"is":30,"key":31}],30:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],31:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":32,"str":33}],32:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],33:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":34}],34:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],35:[function(require,module,exports){
module.exports = typeof window != 'undefined'
},{}],36:[function(require,module,exports){
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
},{"owner":37,"to":39}],37:[function(require,module,exports){
(function (global){
module.exports = require('client') ? /* istanbul ignore next */ window : global
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"client":38}],38:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],39:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],40:[function(require,module,exports){
module.exports = function flatten(p,v){ 
  return (p = p || []), p.concat(v) 
}

},{}],41:[function(require,module,exports){
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
},{"has":42}],42:[function(require,module,exports){
module.exports = function has(o, k) {
  return k in o
}
},{}],43:[function(require,module,exports){
module.exports = function identity(d) {
  return d
}
},{}],44:[function(require,module,exports){
module.exports = function includes(pattern){
  return function(d){
    return ~d.indexOf(pattern)
  }
}
},{}],45:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],46:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":47,"str":48}],47:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],48:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":49}],49:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],50:[function(require,module,exports){
module.exports = function lo(d){
  return (d || '').toLowerCase()
}

},{}],51:[function(require,module,exports){
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
},{"is":52,"owner":53,"to":55}],52:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],53:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":54,"dup":37}],54:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],55:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],56:[function(require,module,exports){
module.exports = function noop(){}
},{}],57:[function(require,module,exports){
module.exports = function prepend(v) {
  return function(d){
    return v+d
  }
}
},{}],58:[function(require,module,exports){
var is = require('is')

module.exports = function proxy(fn, ret, ctx){ 
  return function(){
    var result = fn.apply(ctx || this, arguments)
    return is.fn(ret) ? ret(result) : ret || result
  }
}
},{"is":59}],59:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],60:[function(require,module,exports){
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
},{"body":61,"first":66,"is":67,"values":68}],61:[function(require,module,exports){
arguments[4][24][0].apply(exports,arguments)
},{"dup":24,"key":62}],62:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":63,"str":64}],63:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],64:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":65}],65:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],66:[function(require,module,exports){
module.exports = function first(d){
  return d[0]
}
},{}],67:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],68:[function(require,module,exports){
var keys = require('keys')
  , from = require('from')

module.exports = function values(o) {
  return !o ? [] : keys(o).map(from(o))
}
},{"from":69,"keys":76}],69:[function(require,module,exports){
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
},{"datum":70,"key":72}],70:[function(require,module,exports){
var sel = require('sel')

module.exports = function datum(node){
  return sel(node).datum()
}
},{"sel":71}],71:[function(require,module,exports){
module.exports = function sel(){
  return d3.select.apply(this, arguments)
}
},{}],72:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":73,"str":74}],73:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],74:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":75}],75:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],76:[function(require,module,exports){
module.exports = function keys(o) {
  return Object.keys(o || {})
}
},{}],77:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],78:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68,"from":79,"keys":86}],79:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"datum":80,"dup":69,"key":82}],80:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70,"sel":81}],81:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"dup":71}],82:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":83,"str":84}],83:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],84:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":85}],85:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],86:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],87:[function(require,module,exports){
module.exports = function wrap(d){
  return function(){
    return d
  }
}
},{}],88:[function(require,module,exports){
module.exports = require('noop')
},{"noop":56}],89:[function(require,module,exports){
module.exports = require('prepend')
},{"prepend":57}],90:[function(require,module,exports){
module.exports = require('proxy')
},{"proxy":58}],91:[function(require,module,exports){
module.exports = require('resourcify')
},{"resourcify":60}],92:[function(require,module,exports){
module.exports = require('to')
},{"to":77}],93:[function(require,module,exports){
module.exports = require('values')
},{"values":78}],94:[function(require,module,exports){
module.exports = require('wrap')
},{"wrap":87}],95:[function(require,module,exports){
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
},{"./types/text":96,"utilise/chainable":97,"utilise/colorfill":98,"utilise/emitterify":99,"utilise/err":100,"utilise/header":101,"utilise/identity":102,"utilise/is":104,"utilise/log":105,"utilise/objectify":157,"utilise/rebind":158,"utilise/values":159}],96:[function(require,module,exports){
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
},{"utilise/includes":103,"utilise/is":104}],97:[function(require,module,exports){
module.exports = require('chainable')
},{"chainable":106}],98:[function(require,module,exports){
module.exports = require('colorfill')
},{"colorfill":107}],99:[function(require,module,exports){
module.exports = require('emitterify')
},{"emitterify":122}],100:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":132}],101:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":136}],102:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":138}],103:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"includes":139}],104:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":140}],105:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":141}],106:[function(require,module,exports){
module.exports = function chainable(fn) {
  return function(){
    return fn.apply(this, arguments), fn
  }
}
},{}],107:[function(require,module,exports){
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


},{"client":108,"colors":113,"has":120,"is":121}],108:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],109:[function(require,module,exports){
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
},{"./custom/trap":110,"./custom/zalgo":111,"./maps/america":114,"./maps/rainbow":115,"./maps/random":116,"./maps/zebra":117,"./styles":118,"./system/supports-colors":119}],110:[function(require,module,exports){
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

},{}],111:[function(require,module,exports){
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

},{}],112:[function(require,module,exports){
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
},{"./colors":109}],113:[function(require,module,exports){
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
},{"./colors":109,"./extendStringPrototype":112}],114:[function(require,module,exports){
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
},{"../colors":109}],115:[function(require,module,exports){
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


},{"../colors":109}],116:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = (function () {
  var available = ['underline', 'inverse', 'grey', 'yellow', 'red', 'green', 'blue', 'white', 'cyan', 'magenta'];
  return function(letter, i, exploded) {
    return letter === " " ? letter : colors[available[Math.round(Math.random() * (available.length - 1))]](letter);
  };
})();
},{"../colors":109}],117:[function(require,module,exports){
var colors = require('../colors');

module['exports'] = function (letter, i, exploded) {
  return i % 2 === 0 ? letter : colors.inverse(letter);
};
},{"../colors":109}],118:[function(require,module,exports){
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
},{}],119:[function(require,module,exports){
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
},{"_process":2}],120:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],121:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],122:[function(require,module,exports){
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
},{"def":123,"err":125,"is":129,"keys":130,"not":131}],123:[function(require,module,exports){
var has = require('has')

module.exports = function def(o, p, v, w){
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

},{"has":124}],124:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],125:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":126,"to":128}],126:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":127,"dup":37}],127:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],128:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],129:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],130:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],131:[function(require,module,exports){
module.exports = function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}
},{}],132:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":133,"to":135}],133:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":134,"dup":37}],134:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],135:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],136:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41,"has":137}],137:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],138:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],139:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],140:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],141:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":142,"owner":143,"to":145}],142:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],143:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":144,"dup":37}],144:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],145:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],146:[function(require,module,exports){
module.exports = function objectify(rows, by) {
  var o = {}, by = by || 'name'
  return rows.forEach(function(d){
    return o[d[by]] = d 
  }), o
}
},{}],147:[function(require,module,exports){
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
},{}],148:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68,"from":149,"keys":156}],149:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"datum":150,"dup":69,"key":152}],150:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70,"sel":151}],151:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"dup":71}],152:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":153,"str":154}],153:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],154:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":155}],155:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],156:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],157:[function(require,module,exports){
module.exports = require('objectify')
},{"objectify":146}],158:[function(require,module,exports){
module.exports = require('rebind')
},{"rebind":147}],159:[function(require,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"dup":93,"values":148}],160:[function(require,module,exports){
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
},{"utilise/includes":161,"utilise/log":162}],161:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"includes":163}],162:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":164}],163:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],164:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":165,"owner":166,"to":168}],165:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],166:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":167,"dup":37}],167:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],168:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],169:[function(require,module,exports){
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
},{"utilise/emitterify":170,"utilise/extend":171,"utilise/header":172,"utilise/is":173,"utilise/log":174,"utilise/not":200,"utilise/to":201}],170:[function(require,module,exports){
arguments[4][99][0].apply(exports,arguments)
},{"dup":99,"emitterify":175}],171:[function(require,module,exports){
module.exports = require('extend')
},{"extend":185}],172:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":190}],173:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":192}],174:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":193}],175:[function(require,module,exports){
arguments[4][122][0].apply(exports,arguments)
},{"def":176,"dup":122,"err":178,"is":182,"keys":183,"not":184}],176:[function(require,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"dup":123,"has":177}],177:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],178:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":179,"to":181}],179:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":180,"dup":37}],180:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],181:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],182:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],183:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],184:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],185:[function(require,module,exports){
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
},{"copy":186,"is":187,"keys":188,"not":189}],186:[function(require,module,exports){
module.exports = function copy(from, to){ 
  return function(d){ 
    return to[d] = from[d], d
  }
}
},{}],187:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],188:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],189:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],190:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41,"has":191}],191:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],192:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],193:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":194,"owner":195,"to":197}],194:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],195:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":196,"dup":37}],196:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],197:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],198:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],199:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],200:[function(require,module,exports){
module.exports = require('not')
},{"not":198}],201:[function(require,module,exports){
arguments[4][92][0].apply(exports,arguments)
},{"dup":92,"to":199}],202:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":203}],203:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],204:[function(require,module,exports){
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
},{"utilise/attr":205,"utilise/client":206,"utilise/err":207,"utilise/log":208}],205:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":209,"dup":7}],206:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":211,"dup":10}],207:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":212}],208:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":216}],209:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"is":210}],210:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],211:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],212:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":213,"to":215}],213:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":214,"dup":37}],214:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],215:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],216:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":217,"owner":218,"to":220}],217:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],218:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":219,"dup":37}],219:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],220:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],221:[function(require,module,exports){
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
},{"utilise/fn":222,"utilise/includes":223,"utilise/is":224,"utilise/log":225}],222:[function(require,module,exports){
module.exports = require('fn')
},{"fn":226}],223:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"includes":228}],224:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":229}],225:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":230}],226:[function(require,module,exports){
var is = require('is')

module.exports = function fn(candid){
  return is.fn(candid) ? candid
       : (new Function("return " + candid))()
}
},{"is":227}],227:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],228:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],229:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],230:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":231,"owner":232,"to":234}],231:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],232:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":233,"dup":37}],233:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],234:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],235:[function(require,module,exports){
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
},{"utilise/includes":236,"utilise/log":237}],236:[function(require,module,exports){
arguments[4][15][0].apply(exports,arguments)
},{"dup":15,"includes":238}],237:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":239}],238:[function(require,module,exports){
arguments[4][44][0].apply(exports,arguments)
},{"dup":44}],239:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":240,"owner":241,"to":243}],240:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],241:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":242,"dup":37}],242:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],243:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],244:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":245}],245:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],246:[function(require,module,exports){
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
},{"utilise/client":247,"utilise/clone":248,"utilise/debounce":249,"utilise/err":250,"utilise/group":251,"utilise/header":252,"utilise/is":253,"utilise/key":254,"utilise/log":255,"utilise/not":298,"utilise/parse":299,"utilise/proxy":300,"utilise/str":301,"utilise/values":302}],247:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":256,"dup":10}],248:[function(require,module,exports){
module.exports = require('clone')
},{"clone":257}],249:[function(require,module,exports){
module.exports = require('debounce')
},{"debounce":262}],250:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":264}],251:[function(require,module,exports){
module.exports = require('group')
},{"group":268}],252:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":271}],253:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":273}],254:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"key":274}],255:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":278}],256:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],257:[function(require,module,exports){
var parse = require('parse')
  , str = require('str')
  , is = require('is')

module.exports = function clone(d) {
  return !is.fn(d) 
       ? parse(str(d))
       : d
}

},{"is":258,"parse":259,"str":260}],258:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],259:[function(require,module,exports){
module.exports = function parse(d){
  return d && JSON.parse(d)
}
},{}],260:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":261}],261:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],262:[function(require,module,exports){
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
},{"is":263}],263:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],264:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":265,"to":267}],265:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":266,"dup":37}],266:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],267:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],268:[function(require,module,exports){
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
},{"client":256,"owner":269}],269:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":270,"dup":37}],270:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],271:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41,"has":272}],272:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],273:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],274:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":275,"str":276}],275:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],276:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":277}],277:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],278:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":279,"owner":280,"to":282}],279:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],280:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":281,"dup":37}],281:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],282:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],283:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],284:[function(require,module,exports){
arguments[4][259][0].apply(exports,arguments)
},{"dup":259}],285:[function(require,module,exports){
arguments[4][58][0].apply(exports,arguments)
},{"dup":58,"is":286}],286:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],287:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":288}],288:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],289:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68,"from":290,"keys":297}],290:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"datum":291,"dup":69,"key":293}],291:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70,"sel":292}],292:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"dup":71}],293:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":294,"str":295}],294:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],295:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":296}],296:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],297:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],298:[function(require,module,exports){
arguments[4][200][0].apply(exports,arguments)
},{"dup":200,"not":283}],299:[function(require,module,exports){
module.exports = require('parse')
},{"parse":284}],300:[function(require,module,exports){
arguments[4][90][0].apply(exports,arguments)
},{"dup":90,"proxy":285}],301:[function(require,module,exports){
module.exports = require('str')
},{"str":287}],302:[function(require,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"dup":93,"values":289}],303:[function(require,module,exports){
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
},{"utilise/all":304,"utilise/attr":305,"utilise/client":306,"utilise/err":307,"utilise/key":308,"utilise/log":309,"utilise/raw":330,"utilise/wrap":331}],304:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"all":310,"dup":6}],305:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":312,"dup":7}],306:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":314,"dup":10}],307:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":315}],308:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"key":319}],309:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":323}],310:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20,"to":311}],311:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],312:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"is":313}],313:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],314:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],315:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":316,"to":318}],316:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":317,"dup":37}],317:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],318:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],319:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":320,"str":321}],320:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],321:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":322}],322:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],323:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":324,"owner":325,"to":327}],324:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],325:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":326,"dup":37}],326:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],327:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],328:[function(require,module,exports){
module.exports = function raw(selector, doc){
  var prefix = !doc && document.head.createShadowRoot ? 'html /deep/ ' : ''
  return (doc ? doc : document).querySelector(prefix+selector)
}
},{}],329:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"dup":87}],330:[function(require,module,exports){
module.exports = require('raw')
},{"raw":328}],331:[function(require,module,exports){
arguments[4][94][0].apply(exports,arguments)
},{"dup":94,"wrap":329}],332:[function(require,module,exports){
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
},{"utilise/all":333,"utilise/attr":334,"utilise/client":335,"utilise/err":336,"utilise/key":337,"utilise/log":338,"utilise/wrap":358}],333:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"all":339,"dup":6}],334:[function(require,module,exports){
arguments[4][7][0].apply(exports,arguments)
},{"attr":341,"dup":7}],335:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":343,"dup":10}],336:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":344}],337:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"key":348}],338:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":352}],339:[function(require,module,exports){
arguments[4][20][0].apply(exports,arguments)
},{"dup":20,"to":340}],340:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],341:[function(require,module,exports){
arguments[4][22][0].apply(exports,arguments)
},{"dup":22,"is":342}],342:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],343:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],344:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":345,"to":347}],345:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":346,"dup":37}],346:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],347:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],348:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":349,"str":350}],349:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],350:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":351}],351:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],352:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":353,"owner":354,"to":356}],353:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],354:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":355,"dup":37}],355:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],356:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],357:[function(require,module,exports){
arguments[4][87][0].apply(exports,arguments)
},{"dup":87}],358:[function(require,module,exports){
arguments[4][94][0].apply(exports,arguments)
},{"dup":94,"wrap":357}],359:[function(require,module,exports){
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
},{"utilise/def":360,"utilise/err":361,"utilise/has":362,"utilise/header":363,"utilise/is":364,"utilise/keys":365,"utilise/log":366,"utilise/not":386,"utilise/str":387}],360:[function(require,module,exports){
module.exports = require('def')
},{"def":367}],361:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":369}],362:[function(require,module,exports){
module.exports = require('has')
},{"has":373}],363:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":374}],364:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":376}],365:[function(require,module,exports){
module.exports = require('keys')
},{"keys":377}],366:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":378}],367:[function(require,module,exports){
arguments[4][123][0].apply(exports,arguments)
},{"dup":123,"has":368}],368:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],369:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":370,"to":372}],370:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":371,"dup":37}],371:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],372:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],373:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],374:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41,"has":375}],375:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],376:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],377:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],378:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":379,"owner":380,"to":382}],379:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],380:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":381,"dup":37}],381:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],382:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],383:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],384:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":385}],385:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],386:[function(require,module,exports){
arguments[4][200][0].apply(exports,arguments)
},{"dup":200,"not":383}],387:[function(require,module,exports){
arguments[4][301][0].apply(exports,arguments)
},{"dup":301,"str":384}],388:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":389}],389:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],390:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":391}],391:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],392:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":393}],393:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],394:[function(require,module,exports){
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
},{"utilise/client":395,"utilise/err":396,"utilise/log":397}],395:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":398,"dup":10}],396:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":399}],397:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":403}],398:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],399:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":400,"to":402}],400:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":401,"dup":37}],401:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],402:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],403:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":404,"owner":405,"to":407}],404:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],405:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":406,"dup":37}],406:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],407:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],408:[function(require,module,exports){
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
},{"utilise/log":409,"utilise/owner":417}],409:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":410}],410:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":411,"owner":412,"to":414}],411:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],412:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":413,"dup":37}],413:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],414:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],415:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":416,"dup":37}],416:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],417:[function(require,module,exports){
module.exports = require('owner')
},{"owner":415}],418:[function(require,module,exports){
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
},{"jsondiffpatch":1,"socket.io":1,"socket.io-client":1,"utilise/by":419,"utilise/client":420,"utilise/err":421,"utilise/header":422,"utilise/identity":423,"utilise/is":424,"utilise/key":425,"utilise/keys":426,"utilise/log":427,"utilise/matches":428,"utilise/noop":468,"utilise/not":469,"utilise/replace":470,"utilise/str":471,"utilise/values":472}],419:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"by":429,"dup":9}],420:[function(require,module,exports){
arguments[4][10][0].apply(exports,arguments)
},{"client":435,"dup":10}],421:[function(require,module,exports){
arguments[4][11][0].apply(exports,arguments)
},{"dup":11,"err":436}],422:[function(require,module,exports){
arguments[4][13][0].apply(exports,arguments)
},{"dup":13,"header":440}],423:[function(require,module,exports){
arguments[4][14][0].apply(exports,arguments)
},{"dup":14,"identity":442}],424:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16,"is":443}],425:[function(require,module,exports){
arguments[4][17][0].apply(exports,arguments)
},{"dup":17,"key":444}],426:[function(require,module,exports){
arguments[4][365][0].apply(exports,arguments)
},{"dup":365,"keys":448}],427:[function(require,module,exports){
arguments[4][19][0].apply(exports,arguments)
},{"dup":19,"log":449}],428:[function(require,module,exports){
arguments[4][9][0].apply(exports,arguments)
},{"by":429,"dup":9}],429:[function(require,module,exports){
arguments[4][29][0].apply(exports,arguments)
},{"dup":29,"is":430,"key":431}],430:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],431:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":432,"str":433}],432:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],433:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":434}],434:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],435:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],436:[function(require,module,exports){
arguments[4][36][0].apply(exports,arguments)
},{"dup":36,"owner":437,"to":439}],437:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":438,"dup":37}],438:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],439:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],440:[function(require,module,exports){
arguments[4][41][0].apply(exports,arguments)
},{"dup":41,"has":441}],441:[function(require,module,exports){
arguments[4][42][0].apply(exports,arguments)
},{"dup":42}],442:[function(require,module,exports){
arguments[4][43][0].apply(exports,arguments)
},{"dup":43}],443:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],444:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":445,"str":446}],445:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],446:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":447}],447:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],448:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],449:[function(require,module,exports){
arguments[4][51][0].apply(exports,arguments)
},{"dup":51,"is":450,"owner":451,"to":453}],450:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],451:[function(require,module,exports){
arguments[4][37][0].apply(exports,arguments)
},{"client":452,"dup":37}],452:[function(require,module,exports){
arguments[4][35][0].apply(exports,arguments)
},{"dup":35}],453:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],454:[function(require,module,exports){
arguments[4][56][0].apply(exports,arguments)
},{"dup":56}],455:[function(require,module,exports){
arguments[4][131][0].apply(exports,arguments)
},{"dup":131}],456:[function(require,module,exports){
module.exports = function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
}
},{}],457:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":458}],458:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],459:[function(require,module,exports){
arguments[4][68][0].apply(exports,arguments)
},{"dup":68,"from":460,"keys":467}],460:[function(require,module,exports){
arguments[4][69][0].apply(exports,arguments)
},{"datum":461,"dup":69,"key":463}],461:[function(require,module,exports){
arguments[4][70][0].apply(exports,arguments)
},{"dup":70,"sel":462}],462:[function(require,module,exports){
arguments[4][71][0].apply(exports,arguments)
},{"dup":71}],463:[function(require,module,exports){
arguments[4][25][0].apply(exports,arguments)
},{"dup":25,"is":464,"str":465}],464:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],465:[function(require,module,exports){
arguments[4][27][0].apply(exports,arguments)
},{"dup":27,"is":466}],466:[function(require,module,exports){
arguments[4][23][0].apply(exports,arguments)
},{"dup":23}],467:[function(require,module,exports){
arguments[4][76][0].apply(exports,arguments)
},{"dup":76}],468:[function(require,module,exports){
arguments[4][88][0].apply(exports,arguments)
},{"dup":88,"noop":454}],469:[function(require,module,exports){
arguments[4][200][0].apply(exports,arguments)
},{"dup":200,"not":455}],470:[function(require,module,exports){
module.exports = require('replace')
},{"replace":456}],471:[function(require,module,exports){
arguments[4][301][0].apply(exports,arguments)
},{"dup":301,"str":457}],472:[function(require,module,exports){
arguments[4][93][0].apply(exports,arguments)
},{"dup":93,"values":459}],473:[function(require,module,exports){
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

module.exports = client ? create() : create;

function create(opts) {
  var ripple = core(); // empty base collection of resources

  // enrich..
  data(ripple); // register data types
  html(ripple); // register html types
  css(ripple); // register css types
  fn(ripple); // register fn types
  db(ripple); // enable external connections
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
  offline(ripple); // loads/saves from/to localstorage

  return ripple;
}
},{"rijs.components":3,"rijs.core":95,"rijs.css":160,"rijs.data":169,"rijs.db":202,"rijs.delay":204,"rijs.fn":221,"rijs.html":235,"rijs.mysql":244,"rijs.offline":246,"rijs.precss":303,"rijs.prehtml":332,"rijs.reactive":359,"rijs.resdir":388,"rijs.serve":390,"rijs.sessions":392,"rijs.shadow":394,"rijs.singleton":408,"rijs.sync":418,"utilise/client":1}]},{},[473])(473)
});