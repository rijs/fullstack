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