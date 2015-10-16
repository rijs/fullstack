"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

module.exports = create;

var backpressure = _interopRequire(require("rijs.backpressure"));

var components = _interopRequire(require("rijs.components"));

var hypermedia = _interopRequire(require("rijs.hypermedia"));

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

var client = _interopRequire(require("utilise/client"));

client && !window.ripple && create();

function create(opts) {
  var ripple = core(); // empty base collection of resources

  // enrich..
  singleton(ripple); // exposes a single instance
  data(ripple); // register data types
  hypermedia(ripple); // register hypermedia types
  html(ripple); // register html types
  css(ripple); // register css types
  fn(ripple); // register fn types
  mysql(ripple); // adds mysql adaptor crud hooks
  db(ripple, opts); // enable external connections
  components(ripple); // invoke web components, fn.call(<el>, data)
  reactive(ripple); // react to changes in resources
  precss(ripple); // preapplies scoped css
  prehtml(ripple); // preapplies html templates
  shadow(ripple); // encapsulates with shadow dom or closes gap
  delay(ripple); // async rendering delay
  serve(opts); // serve client libraries
  sync(ripple, opts); // syncs resources between server/client
  backpressure(ripple); // restricts broadcast to clients based on need
  sessions(ripple, opts); // populates sessionid on each connection
  offline(ripple); // loads/saves from/to localstorage
  resdir(ripple, opts); // loads from resources folder

  return ripple;
}