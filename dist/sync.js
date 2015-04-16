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
var str = _utils.str;

var path = _interopRequire(require("path"));

exports["default"] = function (ripple) {
  var resources = ripple._resources(),
      socket = ripple._socket();

  return { emit: emit, connected: connected };

  function emit(s) {
    return function (name) {
      if (!name) return (values(resources).filter(not(header("private"))).map(key("name")).map(emit(s)), ripple);

      var r = resources[name];

      return !r || r.headers["private"] ? log("private or no resource for", name) : typeof s == "string" ? logr(socket.of("/").sockets.filter(by("sessionID", s)).map(sendTo)) : s == socket || !s ? logr(socket.of("/").sockets.map(sendTo)) : logr([sendTo(s)]);

      function logr(results) {
        log(str(results.filter(Boolean).length).green.bold + "/" + str(socket.of("/").sockets.length).green, "sending", name);
      }

      function sendTo(s) {
        var msg = to(r, s);
        msg.body && s.emit("response", msg);
        return !!msg.body;
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

      if (!fn || fn.call(socket, value, body, key, type, name, next)) next(key, value, body);
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
        versions = resource.headers.versions,
        cache = resource.headers["cache-control"],
        body = is.func(resource.body) ? "" + resource.body : resource.body;

    extend && (headers["extends"] = extend);
    cache && (headers.cache = cache);
    !versions && (headers.versions = versions);

    return {
      name: resource.name,
      body: fn.call(socket, body),
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

function serveRender(req, res, next) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  if (!req.accepts("html")) {
    return next();
  }if (req.xhr) {
    return next();
  }var send = res.send,
      jsdom = require("jsdom");

  require("on-headers")(res, function () {
    this.removeHeader("Content-Length");
  });

  res.send = function (html) {
    var self = this;

    jsdom.env({
      html: html,
      url: req.protocol + "://" + req.get("host"),
      features: {
        FetchExternalResources: ["script"],
        ProcessExternalResources: ["script"]
      },
      created: function created(e, window) {
        jsdom.getVirtualConsole(window).sendTo(console);
        window.noripple = true;
      },
      done: function done(e, window) {
        if (e) {
          return err(e);
        }var txt = "\n        !function prerender(){\n          var before = customElements()\n            .map(function(d){\n              var data = resourcify(resources, attr(d, 'data'))\n                , component = '' + body(resources, d.tagName.toLowerCase())\n              \n              try { fn(component).call(d, data) } catch (e) { console.error('prerender', e, e.stack) }\n            })\n\n          log('prerendering', before.length)\n          before.length != customElements().length \n            ? prerender()\n            : onPrerenderDone()\n        }()\n\n        function customElements(){\n          return all('*')\n            .filter(isCustomElement)\n        }\n\n        function isCustomElement(d){ \n          return ~d.tagName.indexOf('-')\n        }\n        ";

        window.utils();
        window.prerender = true;
        window.resources = objectify(values(ripple._resources()).map(function (res) {
          if (!isData(res)) return res;
          var fn = header("proxy-to")(res) || identity,
              body = fn.call(req, res.body);
          return { name: res.name, body: body, headers: res.headers };
        }));

        var scriptEl = window.document.createElement("script");
        scriptEl.innerHTML = txt;
        window.onPrerenderDone = function () {
          window.document.body.removeChild(scriptEl);
          send.call(self, window.document.documentElement.outerHTML);
        };
        window.document.body.appendChild(scriptEl);
      }
    });
  };

  next();
}

var serve = exports.serve = {
  client: serveClient,
  immutable: serveImmutable,
  render: serveRender
};
Object.defineProperty(exports, "__esModule", {
  value: true
});