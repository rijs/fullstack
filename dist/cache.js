"use strict";

var _utils = require("./utils");

var client = _utils.client;
var freeze = _utils.freeze;
var log = _utils.log;
var group = _utils.group;
var parse = _utils.parse;
var values = _utils.values;

module.exports = function (ripple) {
  var resources = ripple._resources(),
      pending = false;

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
    }var count = resources.length;
    return !pending && (pending = true) && setTimeout(function () {
      pending = false;
      if (count == resources.length) {
        log("cached");
        localStorage.ripple = freeze(resources);
      }
    }, 2000);
  }
};