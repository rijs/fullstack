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
  return !client ? "" + resource : isFunction(resource) ? resource : new Function("return " + resource)();
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
  return JSON.stringify(d);
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
  var o = {};
  return (rows.forEach(function (d) {
    o[d.id] = d;
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
    values(d._resources())
    // .map(spread('name', 'body', 'headers'))
    .map(ripple);

    return ripple;
  };
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
var log = exports.log = min ? noop : console.log.bind(console, "[ripple]");
var err = exports.err = min ? noop : console.error.bind(console, "[ripple]");
owner.utils = function () {
  for (var _len = arguments.length, d = Array(_len), _key = 0; _key < _len; _key++) {
    d[_key] = arguments[_key];
  }

  return (d.length ? d : keys(exports)).forEach(globalise);
};
Object.defineProperty(exports, "__esModule", {
  value: true
});