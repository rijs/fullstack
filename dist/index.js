"use strict";

/* istanbul ignore next */
var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

var components = _interopRequire(require("components"));

var singleton = _interopRequire(require("singleton"));

var sessions = _interopRequire(require("sessions"));

var reactive = _interopRequire(require("reactive"));

var prehtml = _interopRequire(require("prehtml"));

var offline = _interopRequire(require("offline"));

var precss = _interopRequire(require("precss"));

var shadow = _interopRequire(require("shadow"));

var resdir = _interopRequire(require("resdir"));

var mysql = _interopRequire(require("mysqlr"));

var serve = _interopRequire(require("serve"));

var delay = _interopRequire(require("delay"));

var sync = _interopRequire(require("sync"));

var core = _interopRequire(require("core"));

var data = _interopRequire(require("data"));

var html = _interopRequire(require("html"));

var css = _interopRequire(require("css"));

var fn = _interopRequire(require("fn"));

var db = _interopRequire(require("db"));

var client = _interopRequire(require("utilise/client"));

module.exports = client ? createRipple() : createRipple;

function createRipple(opts) {
  var ripple = core(); // empty base collection of resources

  // enrich..
  data(ripple); // register data types
  html(ripple); // register html types
  css(ripple); // register css types
  fn(ripple); // register fn types
  db(ripple); // register fn types
  components(ripple); // invoke web components, fn.call(<el>, data)
  singleton(ripple); // exposes a single instance
  reactive(ripple); // react to changes in resources
  prehtml(ripple); // preapplies html templates
  precss(ripple); // preapplies scoped css
  shadow(ripple); // encapsulates with shadow dom or closes gap
  delay(ripple); // async rendering delay
  mysql(ripple); // adds mysql adaptor crud hooks
  serve(opts); // serve client libraries
  sync(ripple, opts); // syncs resources between server/client
  sessions(ripple, opts); // populates sessionid on each connection
  resdir(ripple); // loads from resources folder
  offline(ripple); // loads from resources folder

  return ripple;
}