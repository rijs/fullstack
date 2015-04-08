(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var _utils = require("./utils");

var client = _utils.client;
var freeze = _utils.freeze;
var log = _utils.log;
var group = _utils.group;
var parse = _utils.parse;
var values = _utils.values;
var header = _utils.header;
var not = _utils.not;
var objectify = _utils.objectify;

module.exports = function (ripple) {
  var resources = ripple._resources(),
      pending;

  cache.load = function load() {
    client && group("loading cache", function () {
      var offline = parse(localStorage.ripple);
      values(offline).forEach(ripple);
    });
  };

  return cache;

  // cache all resources in batches
  function cache() {
    // TODO: Cache to Redis if on server
    if (!client) {
      return;
    }clearTimeout(pending);
    var count = resources.length;
    pending = setTimeout(function () {
      if (count == resources.length) {
        log("cached");
        var cachable = values(resources).filter(not(header("cache-control", "no-store")));
        localStorage.ripple = freeze(objectify(cachable));
      }
    }, 2000);
  }
};
},{"./utils":6}],2:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _utils = require("../utils");

var is = _utils.is;
var promise = _utils.promise;

var objectAssign = _interopRequire(require("object-assign"));

var mysql = _interopRequire(require("./mysql"));

var postgres = _interopRequire(require("./postgres"));

var adaptors = { mysql: mysql, postgres: postgres };

module.exports = function (ripple) {
  var db = {};

  db.all = promise.sync(1);
  db.noop = db.push = db.remove = db.update = promise["null"];

  return function (config) {
    if (!arguments.length) return db;

    var type = !config ? undefined : is.str(config) ? config.split(":")[0] : config.type;

    type && objectAssign(db, adaptors[type](config));

    return ripple;
  };
};
},{"../utils":6,"./mysql":8,"./postgres":8,"object-assign":9}],3:[function(require,module,exports){
"use strict";

var _utils = require("./utils");

var all = _utils.all;
var err = _utils.err;
var later = _utils.later;
var client = _utils.client;
var resourcify = _utils.resourcify;
var attr = _utils.attr;
var applyhtml = _utils.applyhtml;
var applycss = _utils.applycss;
var is = _utils.is;
var body = _utils.body;
var values = _utils.values;
var header = _utils.header;
var key = _utils.key;
var prepend = _utils.prepend;

module.exports = function (ripple) {
  var resources = ripple._resources();
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
  return function draw(thing) {
    if (!client) {
      return;
    }return !thing ? components() : thing.nodeName ? invoke(thing) : this && this.nodeName ? invoke(this) : this && this.node ? invoke(this.node()) : is.str(thing) ? resource(thing) : thing.name ? resource(thing) : thing[0] instanceof MutationRecord ? invoke(thing[0].target) : err("Couldn't update", thing);
  };

  // render all components
  function components() {
    var selector = values(resources).filter(header("content-type", "application/javascript")).map(key("name")).map(prepend("body /deep/ ")).join(",");

    all(selector).map(invoke);
  }

  // render all elements that depend on the resource
  function resource(thing) {
    var res = is.str(thing) ? resources[thing] : thing;
    is.js(res) && js(res);
    is.data(res) && data(res.name);
    is.css(res) && css(res.name);
    is.html(res) && html(res.name);
  }

  // render all elements that require the specified data
  function data(name) {
    all("body /deep/ [data~=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // render all elements that require the specified css
  function css(name) {
    all("body /deep/ [css=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // render all elements that require the specified template
  function html(name) {
    all("body /deep/ [template=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // register custom element prototype (render is automatic)
  function js(res) {
    if (is.registered(res)) {
      return;
    }var proto = Object.create(HTMLElement.prototype),
        opts = { prototype: proto },
        extend = res.headers["extends"];

    extend && (opts["extends"] = extend);
    proto.attachedCallback = proto.attributeChangedCallback = node;
    document.registerElement(res.name, opts);
  }

  // renders a particular node
  function node() {
    invoke(this);
  }

  // main function to render a particular custom element with any data it needs
  function invoke(_x) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var d = _x;
      delay = inert = root = name = data = html = css = data = fn = html = css = undefined;

      if (d.nodeName == "#text") {
        _x = d.parentNode;
        _again = true;
        continue _function;
      }

      var delay = attr(d, "delay"),
          inert = attr(d, "inert");

      if (inert != null) {
        return;
      }if (delay != null) {
        d.setAttribute("inert", "");
        d.removeAttribute("delay");
        return setTimeout(d.removeAttribute.bind(d, "inert"), +delay);
      }

      var root = d.shadowRoot || d.createShadowRoot(),
          name = attr(d, "is") || d.tagName.toLowerCase(),
          data = attr(d, "data") || "",
          html = attr(d, "template"),
          css = attr(d, "css"),
          data = resourcify(resources, data) || d.__data__,
          fn = body(resources, name),
          html = body(resources, html),
          css = body(resources, css);

      try {
        fn && (data || !attr(d, "data")) && (applyhtml(root, html) || !attr(d, "template")) && (applycss(root, css) || !attr(d, "css")) && fn.call(root, data);

        d.observer && Object.unobserve(d.state, d.observer);
        d.state && Object.observe(d.state, d.observer = later(ripple, d));
      } catch (e) {
        err(e);
      }

      return d;
    }
  }
};
},{"./utils":6}],4:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var _slicedToArray = function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) { _arr.push(_step.value); if (i && _arr.length === i) break; } return _arr; } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } };

var _toConsumableArray = function (arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } };

module.exports = createRipple;

require("colors");

var _utils = require("./utils");

var is = _utils.is;
var chain = _utils.chain;
var def = _utils.def;
var log = _utils.log;
var noop = _utils.noop;
var client = _utils.client;
var use = _utils.use;
var sio = _utils.sio;
var attr = _utils.attr;
var expressify = _utils.expressify;

var _sync = require("./sync");

var auth = _sync.auth;
var append = _sync.append;
var serve = _sync.serve;

var register = _interopRequire(require("./register"));

var version = _interopRequire(require("./version"));

var cache = _interopRequire(require("./cache"));

var draw = _interopRequire(require("./draw"));

var sync = _interopRequire(_sync);

var db = _interopRequire(require("./db"));

function createRipple(server) {
  var opts = arguments[1] === undefined ? { client: true } : arguments[1];

  log("creating");

  var resources = {},
      app = expressify(server),
      socket = sio(server);[["versions", []], ["length", 0], ["time", 0]].map(function (_ref) {
    var _ref2 = _slicedToArray(_ref, 2);

    var key = _ref2[0];
    var val = _ref2[1];
    return def(resources, key, val, true);
  });

  ripple._resources = function () {
    return resources;
  };
  ripple._socket = function () {
    return socket;
  };
  ripple._register = register(ripple);
  ripple.resource = chain(ripple._register, ripple);
  ripple.cache = cache(ripple);
  ripple.db = db(ripple);
  ripple.draw = draw(ripple);
  ripple.version = version(ripple);
  ripple.use = use(ripple);
  ripple.emit = !client && sync(ripple).emit;

  setTimeout(ripple.cache.load, 0);

  client ? socket.on("response", ripple._register) : (socket.on("connection", sync(ripple).connected), app.use("/ripple.js", serve.client), app.use("/immutable.min.js", serve.immutable), opts.session && socket.use(auth(opts.session)), opts.client && app.use(append), opts.utils && utils());

  return ripple;

  function ripple() {
    return ripple._register.apply(this, arguments);
  }
}

if (client) {
  var expose = attr(document.currentScript, "utils");
  is.str(expose) && utils.apply(undefined, _toConsumableArray(expose.split(" ").filter(Boolean)));
  client && (window.createRipple = createRipple) && (window.ripple = createRipple());
}
},{"./cache":1,"./db":2,"./draw":3,"./register":5,"./sync":8,"./utils":6,"./version":7,"colors":9}],5:[function(require,module,exports){
"use strict";

var _utils = require("./utils");

var is = _utils.is;
var err = _utils.err;
var clone = _utils.clone;
var promise = _utils.promise;
var emitterify = _utils.emitterify;
var table = _utils.table;
var interpret = _utils.interpret;
var log = _utils.log;
var parameterise = _utils.parameterise;
var header = _utils.header;
var has = _utils.has;
var immmutable = _utils.immmutable;
var listeners = _utils.listeners;
var call = _utils.call;
var def = _utils.def;
var versions = _utils.versions;
var client = _utils.client;
var first = _utils.first;

module.exports = function (ripple) {
  var resources = ripple._resources(),
      socket = ripple._socket();

  // -------------------------------------------
  // Gets or sets a resource
  // -------------------------------------------
  // ripple('name')     - returns the resource body if it exists
  // ripple('name')     - creates & returns resource if it doesn't exist
  // ripple('name', {}) - creates & returns resource, with specified name and body
  // ripple({ ... })    - creates & returns resource, with specified name, body and headers
  return function (name, body, headers) {
    return is.str(name) && !body && resources[name] ? resources[name].body : is.str(name) && !body && !resources[name] ? register({ name: name }) : is.str(name) && body ? register({ name: name, body: body, headers: headers }) : is.obj(name) ? register(name) : err("Couldn't find or create resource", name);
  };

  function register() {
    var _ref = arguments[0] === undefined ? {} : arguments[0];

    var name = _ref.name;
    var body = _ref.body;
    var _ref$headers = _ref.headers;
    var headers = _ref$headers === undefined ? {} : _ref$headers;
    var draw = ripple.draw;
    var cache = ripple.cache;
    var emit = ripple.emit;
    var res = { name: name, body: body, headers: headers };
    var parsed;

    interpret(res);
    log("registering", res.name);
    // is.route(name) && !resources[name] && rhumb.add(res.name, parameterise(res.name))

    !(res.name in resources) && resources.length++;
    parsed = is.data(res) ? first(data(res)) : promise(resources[res.name] = res);
    parsed.then(function () {
      client ? draw(res) : emit()(res.name);
      cache();
    });

    return res.body;
  }

  function data(res) {
    var db = ripple.db;
    var version = ripple.version;
    var table = header("content-location")(res);
    var max = header("max-versions")(res);
    var rollback = has(res.headers, "version");

    client && (max = max && window.Immutable);
    max && (res.versions = res.versions || versions(resources, res.name));
    client && !rollback && max && res.versions.push(immmutable(res.body));
    resources[res.name] = watch(res);

    return [db().all(table, res.body).then(commit), res];

    function commit(rows) {
      res.body = rows;
      resources[res.name] = watch(res);
      listeners(resources, res.name).map(call());
      client && !rollback && max && version.history();
    }
  }

  // observe a resource for changes
  function watch(res) {
    var opts = { type: "response", listeners: listeners(resources, res.name) };

    !res.body.observer && Array.observe(res.body = emitterify(res.body, opts), def(res.body, "observer", meta(res.name)));

    is.arr(res.body) && res.body.forEach(observe);

    return res;

    function observe(d) {
      if (!is.obj(d)) {
        return;
      }if (d.observer) {
        return;
      }var fn = ometa(res.name);
      def(d, "observer", fn);
      Object.observe(d, fn);
    }
  }

  // short-circuit shortcut for two-level observation
  function ometa(name) {
    return function (changes) {
      changes.forEach(function (change) {
        if (!change.type == "update") return;
        var i = resources[name].body.indexOf(change.object);
        resources[name].body[i] = clone(change.object);
      });
    };
  }

  // top-level observer
  function meta(name) {
    return function (changes) {
      var draw = ripple.draw;

      log("observed changes in", name, changes.length);
      watch(resources[name]);
      changes.forEach(normalize(name));
      draw(name);
    };
  }

  // normalize a change
  function normalize(name) {
    return function (change) {
      var version = ripple.version;
      var type = change.type;
      var removed = type == "delete" ? change.oldValue : change.removed && change.removed[0];
      var data = change.object;
      var key = change.name || change.index;
      var value = data[key];
      var max = header("max-versions")(resources[name]);
      var skip = !is.arr(data);
      var details = {
        name: name,
        key: key,
        value: removed || value,
        type: type == "update" ? "update" : type == "delete" ? "remove" : type == "splice" && removed ? "remove" : type == "splice" && !removed ? "push" : type == "add" ? "push" : false
      };

      client && (max = max && window.Immutable);
      client && max && version.record(details);
      client && socket.emit("change", details);
      !client && crud(skip ? { name: name } : details);
    };
  }

  function crud(_ref) {
    var name = _ref.name;
    var value = _ref.value;
    var type = _ref.type;
    var emit = ripple.emit;
    var db = ripple.db;

    log("crud", name, type = type || "noop");

    var t = table(resources[name]),
        f = type && db()[type],
        r = listeners(resources, name);

    f(t, value).then(function (id) {
      emit()(name);
      r.map(call(id));

      values(resources).filter(header("content-location", t)).filter(not(by("name", name))).map(data).map(async(key("name"))).map(then(emit()));
    });
  }
};

// log('registered', res.name)
},{"./utils":6}],6:[function(require,module,exports){
(function (process,global){
"use strict";

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
exports.all = all;
exports.raw = raw;
exports.toArray = toArray;
exports.fn = fn;
exports.matches = matches;
exports.exists = exists;
exports.isString = isString;
exports.isNumber = isNumber;
exports.isObject = isObject;
exports.isFunction = isFunction;
exports.isArray = isArray;
exports.values = values;
exports.spread = spread;
exports.mask = mask;
exports.isIn = isIn;
exports.isDef = isDef;
exports.gt = gt;
exports.async = async;
exports.base = base;
exports.key = key;
exports.not = not;
exports.freeze = freeze;
exports.str = str;
exports.parse = parse;
exports.attr = attr;
exports.clone = clone;
exports.remove = remove;
exports.last = last;
exports.l = l;
exports.immmutable = immmutable;
exports.applycss = applycss;
exports.applyhtml = applyhtml;
exports.isNull = isNull;
exports.inherit = inherit;
exports.first = first;
exports.identity = identity;
exports.table = table;
exports.curry = curry;
exports.index = index;
exports.shift = shift;
exports.slice = slice;
exports.pop = pop;
exports.noop = noop;
exports.sel = sel;
exports.datum = datum;
exports.def = def;
exports.then = then;
exports.promise = promise;
exports.promiseSecond = promiseSecond;
exports.promiseSync = promiseSync;
exports.promiseNoop = promiseNoop;
exports.promiseNull = promiseNull;
exports.objectify = objectify;
exports.unique = unique;
exports.later = later;
exports.isRoute = isRoute;
exports.header = header;
exports.prepend = prepend;
exports.empty = empty;
exports.has = has;
exports.once = once;
exports.perf = perf;
exports.group = group;
exports.body = body;
exports.array = array;
exports.isJS = isJS;
exports.isData = isData;
exports.isHTML = isHTML;
exports.isCSS = isCSS;
exports.isRegistered = isRegistered;
exports.call = call;

// enhances resource bodies with on/once for imperative usage
exports.emitterify = emitterify;
exports.indexOf = indexOf;
exports.listeners = listeners;
exports.versions = versions;
exports.use = use;
exports.chain = chain;
exports.sio = sio;
exports.parameterise = parameterise;
exports.resourcify = resourcify;
exports.interpret = interpret;
exports.clean = clean;
exports.keys = keys;
exports.globalise = globalise;
exports.expressify = expressify;
exports.fromParent = fromParent;
exports.deidify = deidify;
exports.colorfill = colorfill;
exports.file = file;

function all(selector) {
  return toArray(document.querySelectorAll(selector));
}

function raw(selector, context) {
  return (context ? context : document).querySelector(selector);
}

function toArray(d) {
  return Array.prototype.slice.call(d, 0);
}

function fn(resource) {
  return isFunction(resource) ? resource : new Function("return " + resource)();
}

function matches(k, v) {
  return function (d) {
    return d[k] && v && d[k].toLowerCase && v.toLowerCase ? d[k].toLowerCase() === v.toLowerCase() : d[k] == v;
  };
}

// export function by(k, v){
//   return function(d){
//     return !d[k] || !v ? false
//       : d[k].toLowerCase && v.toLowerCase ? (d[k].toLowerCase() == v.toLowerCase())
//       : d[k] == v
//   }
// }

var by = exports.by = matches;

function exists(v) {
  return function (d) {
    return d == v;
  };
}

var match = exports.match = exists;

function isString(d) {
  return typeof d == "string";
}

function isNumber(d) {
  return typeof d == "number";
}

function isObject(d) {
  return typeof d == "object";
}

function isFunction(d) {
  return typeof d == "function";
}

function isArray(d) {
  return d instanceof Array;
}

function values(o) {
  return !o ? [] : Object.keys(o).map(base(o));
}

function spread() {
  for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
    keys[_key] = arguments[_key];
  }

  return function (o) {
    return Object.keys(o).filter(isIn(keys)).map(base(o));
  };
}

function mask() {
  for (var _len = arguments.length, keys = Array(_len), _key = 0; _key < _len; _key++) {
    keys[_key] = arguments[_key];
  }

  return function (o) {
    var masked = {};
    keys.forEach(function (key) {
      return masked[key] = o[key];
    });
    return masked;
  };
}

function isIn(set) {
  return function (d) {
    return set.some(match(d));
  };
}

function isDef(d) {
  return typeof d !== "undefined";
}

function gt(k, v) {
  return function (d) {
    return d[k] > v;
  };
}

function async(fn) {
  return function (o) {
    return [o[0], fn(o[1])];
  };
}

function base(o) {
  return function (k) {
    return o[k];
  };
}

function key(k) {
  return function (o) {
    return o[k];
  };
}

function not(fn) {
  return function () {
    return !fn.apply(this, arguments);
  };
}

function freeze(r) {
  var stripped = clone(r);
  delete stripped.versions;
  delete stripped.length;
  delete stripped.time;

  values(r).filter(header("content-type")).map(function (res) {
    delete stripped[res.name].versions;return res;
  }).filter(header("content-type", "application/javascript")).map(function (res) {
    return stripped[res.name].body = res.body.toString();
  });

  return str(stripped);
}

function str(d) {
  return isNumber(d) ? String(d) : JSON.stringify(d);
}

function parse(d) {
  return d && JSON.parse(d);
}

function attr(d, name, value) {
  d = d.node ? d.node() : d;
  if (isString(d)) {
    return function () {
      return attr(this, d);
    };
  }return arguments.length > 2 ? d.setAttribute(name, value) : d.attributes.getNamedItem(name) && d.attributes.getNamedItem(name).value;
}

function clone(d) {
  return !isFunction(d) ? parse(str(d)) : d;
}

function remove(k, v) {
  return function (d, i, a) {
    !k && !v ? d && a.splice(i, 1) : !v ? d == k && a.splice(i, 1) : d[k] == v && a.splice(i, 1);
  };
}

function last(d) {
  return d[d.length - 1];
}

function l(d) {
  return d.toLowerCase();
}

function immmutable(d) {
  return isArray(d) ? Immutable.List(d) : isObject(d) ? Immutable.Map(d) : err(d, "is not an array or object");
}

function applycss(d, css) {
  if (!css) {
    return false;
  }var style = d.querySelector("style") || document.createElement("style");
  style.innerHTML = css;
  d.insertBefore(style, d.firstChild);
  return true;
}

function applyhtml(d, html) {
  if (!html) {
    return false;
  }var div = document.createElement("div");
  div.innerHTML = html;
  d.innerHTML = div.firstChild.innerHTML;
  return true;
}

function isNull(d) {
  return d === null;
}

function inherit(len) {
  return function (d) {
    return new Array((len || 1) + 1).join("0").split("").map(curry(identity, d));
  };
}

function first(d) {
  return d[0];
}

function identity(d) {
  return d;
}

function table(resource) {
  return resource.headers["content-location"];
}

function curry(fn, d) {
  return function () {
    return fn(d);
  };
}

function index(d, i) {
  return i;
}

function shift(d) {
  return Array.prototype.shift.apply(d);
}

function slice(d) {
  return Array.prototype.slice.apply(d, (shift(arguments), arguments));
}

function pop(d) {
  return Array.prototype.pop.apply(d);
}

function noop() {}

function sel() {
  return d3.select.apply(this, arguments);
}

function datum(node) {
  return d3.select(node).datum();
}

function def(o, p, v, w) {
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w });
  return o[p];
}

function then(fn) {
  return function (o) {
    return (o[0].then(fn.bind(null, o[1])), o[1]);
  };
}

promise.sync = promiseSync;
promise["null"] = promiseNull;
promise.noop = promiseNoop;
promise.second = promiseSecond;

function promise() {
  var resolve,
      reject,
      p = new Promise(function (res, rej) {
    resolve = res, reject = rej;
  });

  arguments.length && resolve(arguments[0]);
  p.resolve = resolve;
  p.reject = reject;
  return p;
}

function promiseSecond(table, body) {
  return promise(body);
}

function promiseSync(arg) {
  return function () {
    var a = arguments,
        o = { then: function then(cb) {
        cb(a[arg]);return o;
      } };
    return o;
  };
}

function promiseNoop() {
  return promise();
}

function promiseNull() {
  return promise(null);
}

function objectify(rows) {
  var by = arguments[1] === undefined ? "name" : arguments[1];

  var o = {};
  return (rows.forEach(function (d) {
    return o[d[by]] = d;
  }), o);
}

function unique(key) {
  var matched = {};
  return function (d) {
    return matched[d[key]] ? false : matched[d[key]] = true;
  };
}

function later(ripple, d) {
  return function (changes) {
    ripple.draw(d);
  };
}

function isRoute(d) {
  return first(d) == "/";
}

function header(header, value) {
  var getter = arguments.length == 1;
  return function (d) {
    return !has(d, "headers") ? null : !has(d.headers, header) ? null : getter ? d.headers[header] : d.headers[header] == value;
  };
}

function prepend(v) {
  return function (d) {
    return v + d;
  };
}

function empty(d) {
  return !d || isArray(d) && !d.length;
}

function has(o, k) {
  return o.hasOwnProperty(k);
}

function once(g, selector, data, before, key) {
  var g = g.node ? g : d3.select(g),
      type = selector.split(".")[0] || "div",
      classed = selector.split(".").slice(1).join(" ");

  var el = g.selectAll(selector).data(data || [0], key);

  el.once = function () {
    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    return once.apply(undefined, [el].concat(args));
  };

  el.out = el.exit().remove();

  el["in"] = el.enter().insert("xhtml:" + type, before).classed(classed, 1);

  return el;
}

function perf(fn) {
  var start = performance.now();
  fn();
  log("perf", performance.now() - start);
}

function group(label, fn) {
  console.groupCollapsed("[ripple] ", label);
  fn();
  console.groupEnd("[ripple] ", label);
}

function body(resources, name) {
  return resources[name] && resources[name].body;
}

function array() {
  return [];
}

function isJS(res) {
  return header("content-type")(res) == "application/javascript";
}

function isData(res) {
  return header("content-type")(res) == "application/data";
}

function isHTML(res) {
  return header("content-type")(res) == "text/html";
}

function isCSS(res) {
  return header("content-type")(res) == "text/css";
}

function isRegistered(res) {
  var extend = header("extends")(res);

  return extend ? document.createElement(extend, res.name).attachedCallback : document.createElement(res.name).attachedCallback;
}

function call(param) {
  return function (d, i, a) {
    try {
      (d.once ? a.splice(i, 1).pop().fn : d.fn)(param);
    } catch (e) {
      err(e);
    }
  };
}

function emitterify(body, opts) {
  return (def(body, "on", on), def(body, "once", once), opts && (body.on[opts.type] = opts.listeners), body);

  function on(type, callback, opts) {
    log("registering callback", type);
    opts = opts || {};
    opts.fn = callback;
    this.on[type] = this.on[type] || [];
    this.on[type].push(opts);
    return this;
  }

  function once(type, callback) {
    this.on.call(this, type, callback, { once: true });
    return this;
  }
}

function indexOf(pattern) {
  return function (d) {
    return ~d.indexOf(pattern);
  };
}

function listeners(resources, name) {
  var r = resources[name];
  return r && r.body && r.body.on && r.body.on.response || [];
}

function versions(resources, name) {
  return resources[name] && resources[name].versions || [];
}

function use(ripple) {
  return function (d) {
    values(d._resources()).map(cloneBody).map(ripple);

    return ripple;
  };

  function cloneBody(d) {
    isObject(d.body) && (d.body = clone(d.body));
    return d;
  }
}

function chain(fn, value) {
  return function () {
    fn.apply(this, arguments);
    return value;
  };
}

function sio(opts) {
  return !client ? require("socket.io")(opts) : window.io ? window.io() : { on: noop, emit: noop };
}

function parameterise(route) {
  var name = route.split("/")[1];
  return function (params) {
    return { name: name, params: params };
  };
}

function resourcify(resources, d) {
  var o = {},
      names = d.split(" ");

  return names.length == 0 ? undefined : names.length == 1 ? body(resources, first(names)) : (names.map(function (d) {
    return o[d] = body(resources, d);
  }), values(o).some(empty) ? undefined : o);
}

function interpret(res) {
  // interpret resource type
  isString(res.body) && !header("content-type")(res) && (res.headers["content-type"] = "text/html") && ~res.name.indexOf(".css") && (res.headers["content-type"] = "text/css");

  isFunction(res.body) && !header("content-type")(res) && (res.headers["content-type"] = "application/javascript");

  !header("content-type")(res) && (res.headers["content-type"] = "application/data");

  // default empty body
  !res.body && (res.body = []);

  // parse function bodies
  isJS(res) && (res.body = fn(res.body));

  // type-specific detail
  isData(res) && (res.headers = {
    "content-type": "application/data",
    "content-location": res.headers["content-location"] || res.headers.table || res.name,
    "private": res.headers["private"],
    "proxy-to": res.headers["proxy-to"] || res.headers.to,
    "proxy-from": res.headers["proxy-from"] || res.headers.from,
    version: res.headers.version,
    "cache-control": isNull(res.headers.cache) ? "no-store" : res.headers["cache-control"] || res.headers.cache,
    "max-versions": isNumber(header("max-versions")(res)) ? header("max-versions")(res) : Infinity
  });

  // remove any undefined headers
  clean(res.headers);
}

function clean(o) {
  Object.keys(o).forEach(function (k) {
    !isDef(key(k)(o)) && delete o[k];
  });
}

function keys(o) {
  return Object.keys(o);
}

function globalise(d) {
  owner[d] = exports[d];
}

function expressify(d) {
  return !client && d && d._events.request || { use: noop };
}

function fromParent(d) {
  return datum(this.parentNode)[d];
}

function deidify(name, value) {
  return ripple(name).filter(by("id", value)).map(key("name")).pop();
}

function colorfill() {
  client && ["red", "green", "bold", "grey"].forEach(function (color) {
    Object.defineProperty(String.prototype, color, {
      get: function get() {
        return this;
      }
    });
  });
}

function file(name) {
  return require("fs").readFileSync("./" + name, { encoding: "utf8" });
}

var is = exports.is = {
  str: isString,
  data: isData,
  num: isNumber,
  obj: isObject,
  "in": isIn,
  def: isDef,
  func: isFunction,
  registered: isRegistered,
  js: isJS,
  css: isCSS,
  html: isHTML,
  arr: isArray,
  route: isRoute,
  "null": isNull
};

var to = exports.to = {
  arr: toArray
};

var client = exports.client = typeof window != "undefined";
var owner = exports.owner = client ? window : global;
var min = exports.min = client ? typeof debug !== "undefined" && !debug : process.env.NODE_ENV !== "debug";

colorfill();
var log = exports.log = min ? noop : console.log.bind(console, "[ripple]".grey);
var err = exports.err = min ? noop : console.error.bind(console, "[ripple]".red);
owner.utils = function () {
  for (var _len = arguments.length, d = Array(_len), _key = 0; _key < _len; _key++) {
    d[_key] = arguments[_key];
  }

  return (d.length ? d : keys(exports)).forEach(globalise);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});
}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":10,"fs":8,"socket.io":9}],7:[function(require,module,exports){
"use strict";

var _utils = require("./utils");

var is = _utils.is;
var header = _utils.header;
var versions = _utils.versions;
var log = _utils.log;
var err = _utils.err;
var last = _utils.last;
var values = _utils.values;
var client = _utils.client;

module.exports = function (ripple) {
  var resources = ripple._resources();

  // record a new historical value for a resource
  version.record = function (_ref) {
    var name = _ref.name;
    var key = _ref.key;
    var value = _ref.value;
    var type = _ref.type;

    if (!client) return;
    var resource = resources[name],
        versions = resource.versions,
        previous = last(versions),
        latest = type == "update" ? previous.set(key, value) : type == "push" ? previous.set(key, value) : type == "remove" ? previous.remove(key, value) : false;

    return (versions.push(latest), version.history());
  };

  // record a new historical value for the entire application
  version.history = function () {
    if (!client) return;
    resources.versions.push(values(resources).filter(header("content-type", "application/data")).map(index));
    resources.time = resources.versions.length - 1;

    function index(r) {
      delete r.headers.version;
      return { name: r.name, index: (r.versions || []).length - 1 };
    }
  };

  // -------------------------------------------
  // API: Rollbacks specific resource or entire application state to version
  // -------------------------------------------
  // ripple.version('name', i) - rollbacks specific resource to version i and returns it
  // ripple.version(i)         - rollbacks entire application state to version i
  // ripple.version('name')    - retrieves the current historical index for this resource
  // ripple.version()          - retrieves the current historical index for this set of resources
  return version;

  function version(name, version) {
    if (!client) {
      return;
    }return arguments.length == 2 ? resource({ name: name, index: version }) : arguments.length == 1 && is.str(name) ? resource(name) : arguments.length == 1 && is.num(name) ? application(name) : arguments.length == 0 ? application() : err("Couldn't rollback", name, version);
  }

  // rollbacks resource to the specified time, or retrieves its current time
  function resource(o) {
    var register = ripple._register;

    if (is.str(o)) {
      return is.num(header("version")(resources[o])) ? header("version")(resources[o]) : versions(resources, o).length - 1;
    }if (!resources[o.name].versions || !resources[o.name].versions.length) {
      return log(o.name, "does not have a history");
    }if (o.index < 0 || o.index > resources[o.name].versions.length - 1) {
      return err(o.index, "time does not exist for", o.name);
    }register({
      name: o.name,
      headers: { "content-type": "application/data", version: o.index },
      body: resources[o.name].versions[o.index].toJS()
    });

    return ripple(o.name);
  }

  // rollbacks all resources to the specified time, or retrieves current time
  function application(time) {
    var draw = ripple.draw;

    if (!arguments.length) {
      return resources.time;
    }if (time < 0 || time > resources.versions.length - 1) {
      return err(time, "time does not exist");
    }log("travelling to", time);
    resources.versions[resources.time = time].forEach(resource);

    draw();
  }
};
},{"./utils":6}],8:[function(require,module,exports){

},{}],9:[function(require,module,exports){
arguments[4][8][0].apply(exports,arguments)
},{"dup":8}],10:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};
var queue = [];
var draining = false;

function drainQueue() {
    if (draining) {
        return;
    }
    draining = true;
    var currentQueue;
    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        var i = -1;
        while (++i < len) {
            currentQueue[i]();
        }
        len = queue.length;
    }
    draining = false;
}
process.nextTick = function (fun) {
    queue.push(fun);
    if (!draining) {
        setTimeout(drainQueue, 0);
    }
};

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues

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

},{}]},{},[4]);
