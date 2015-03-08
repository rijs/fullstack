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
      return { name: r.name, index: r.versions.length - 1 };
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