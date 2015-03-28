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
    parsed = is.data(res) ? data(res)[0] : promise(resources[res.name] = res);
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

    res.versions = res.versions || versions(resources, res.name);
    client && !rollback && max && res.versions.push(immmutable(res.body));

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

    !res.observer && Array.observe(res.body = emitterify(res.body, opts), res.observer = meta(res.name));

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

      client && max && (version.record(details), socket.emit("change", details));
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