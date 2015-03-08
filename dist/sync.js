"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

// auto-appends the client + deps
exports.append = append;

// populates session id on socket
exports.auth = auth;

var _utils = require("./utils");

var values = _utils.values;
var log = _utils.log;
var min = _utils.min;
var not = _utils.not;
var header = _utils.header;
var key = _utils.key;
var by = _utils.by;
var is = _utils.is;
var identity = _utils.identity;

var path = _interopRequire(require("path"));

exports["default"] = function (ripple) {
  var resources = ripple._resources(),
      socket = ripple._socket();

  return { emit: emit, connected: connected };

  function emit(s) {
    return function (name) {
      if (!name) return (values(resources).filter(not(header("private"))).map(key("name")).map(emit(s)), ripple);

      var r = resources[name];

      return !r || r.headers["private"] ? log("private or no resource for", name) : (log("sending", name), typeof s == "string") ? socket.of("/").sockets.filter(by("sessionID", s)).map(sendTo) : s == socket || !s ? socket.of("/").sockets.map(sendTo) : sendTo(s);

      function sendTo(s) {
        return (s.emit("response", to(r, s)), s);
      }
    };
  }

  function connected(socket) {
    log("connected", socket.id);
    var types = {
      push: push,
      remove: remove,
      update: update
    };

    emit(socket)();

    socket.on("request", request);
    socket.on("change", change);

    function request(name) {
      log("request", name);
      return !resources[name] || resources[name].headers["private"] ? log("private or no resource for request", name) : emit(socket)(name);
    }

    function change(req) {
      log("client", req.type, req.name, req.key);
      if (!resources[req.name]) {
        return log("no resource", req.name);
      }var name = req.name,
          key = req.key,
          value = req.value,
          type = req.type,
          fn = resources[name].headers["proxy-from"],
          body = resources[name].body,
          next = types[req.type];

      if (!fn || fn.call(socket, key, value, body, name, type, next)) next(key, value, body);
    }

    function push(key, value, body) {
      is.arr(body) ? body.splice(key, 0, value) : body[key] = value;
    }

    function remove(key, value, body) {
      is.arr(body) ? body.splice(key, 1) : delete body[key];
    }

    function update(key, value, body) {
      body[key] = value;
    }
  }

  function to(resource, socket) {
    var fn = resource.headers["proxy-to"] || identity,
        headers = { "content-type": resource.headers["content-type"] },
        extend = resource.headers["extends"],
        versions = resource.headers.versions;

    extend && (headers["extends"] = extend);
    !versions && (headers.versions = versions);

    return {
      name: resource.name,
      body: fn.call(socket, resource.body),
      headers: headers
    };
  }
};

function append(req, res, next) {
  var end = res.end;

  require("on-headers")(res, function () {
    this.removeHeader("Content-Length");
  });

  res.end = function () {
    req.accepts("html") && ! ~req.originalUrl.indexOf(".js") && ! ~req.originalUrl.indexOf(".css") && res.write("<script src=\"/immutable.min.js\" defer></script>\n                  <script src=\"/socket.io/socket.io.js\" defer></script>\n                  <script src=\"/ripple.js\" defer></script>");

    end.apply(this, arguments);
  };

  next();
}

function auth(config) {
  return function (socket, next) {
    var req = {
      headers: {
        cookie: socket.request.headers.cookie } };

    require("cookie-parser")(config.secret)(req, null, function () {});
    var name = config.key;
    socket.sessionID = req.signedCookies[name] || req.cookies[name];
    next();
  };
}

function serveClient(req, res) {
  res.sendFile(path.resolve(__dirname, "client." + (min ? "min.js" : "js")));
}

function serveImmutable(req, res) {
  res.sendFile(path.resolve(__dirname, "../node_modules/immutable/dist/immutable.min.js"));
}

var serve = exports.serve = {
  client: serveClient,
  immutable: serveImmutable
};
Object.defineProperty(exports, "__esModule", {
  value: true
});