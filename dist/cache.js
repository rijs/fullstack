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