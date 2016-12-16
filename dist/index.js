'use strict';

var _rijs = require('rijs.backpressure');

var _rijs2 = _interopRequireDefault(_rijs);

var _rijs3 = require('rijs.components');

var _rijs4 = _interopRequireDefault(_rijs3);

var _rijs5 = require('rijs.versioned');

var _rijs6 = _interopRequireDefault(_rijs5);

var _rijs7 = require('rijs.singleton');

var _rijs8 = _interopRequireDefault(_rijs7);

var _rijs9 = require('rijs.sessions');

var _rijs10 = _interopRequireDefault(_rijs9);

var _rijs11 = require('rijs.features');

var _rijs12 = _interopRequireDefault(_rijs11);

var _rijs13 = require('rijs.offline');

var _rijs14 = _interopRequireDefault(_rijs13);

var _rijs15 = require('rijs.helpers');

var _rijs16 = _interopRequireDefault(_rijs15);

var _rijs17 = require('rijs.precss');

var _rijs18 = _interopRequireDefault(_rijs17);

var _rijs19 = require('rijs.resdir');

var _rijs20 = _interopRequireDefault(_rijs19);

var _rijs21 = require('rijs.serve');

var _rijs22 = _interopRequireDefault(_rijs21);

var _rijs23 = require('rijs.pages');

var _rijs24 = _interopRequireDefault(_rijs23);

var _rijs25 = require('rijs.needs');

var _rijs26 = _interopRequireDefault(_rijs25);

var _rijs27 = require('rijs.sync');

var _rijs28 = _interopRequireDefault(_rijs27);

var _rijs29 = require('rijs.core');

var _rijs30 = _interopRequireDefault(_rijs29);

var _rijs31 = require('rijs.data');

var _rijs32 = _interopRequireDefault(_rijs31);

var _rijs33 = require('rijs.css');

var _rijs34 = _interopRequireDefault(_rijs33);

var _rijs35 = require('rijs.fn');

var _rijs36 = _interopRequireDefault(_rijs35);

var _client = require('utilise/client');

var _client2 = _interopRequireDefault(_client);

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_client2.default && !window.ripple && create();

module.exports = create;

function create(opts) {
  var ripple = (0, _rijs30.default)(); // empty base collection of resources

  // enrich..
  (0, _rijs8.default)(ripple); // exposes a single instance
  (0, _rijs32.default)(ripple); // register data types
  (0, _rijs34.default)(ripple); // register css types
  (0, _rijs36.default)(ripple); // register fn types
  (0, _rijs16.default)(ripple); // expose helper functions and constants
  (0, _rijs4.default)(ripple); // invoke web components, fn.call(<el>, data)
  (0, _rijs26.default)(ripple); // define default attrs for components
  (0, _rijs18.default)(ripple); // preapplies scoped css 
  (0, _rijs14.default)(ripple); // loads/saves from/to localstorage
  (0, _rijs28.default)(ripple, opts); // syncs resources between server/client  
  (0, _rijs2.default)(ripple); // restricts broadcast to clients based on need
  (0, _rijs22.default)(ripple, opts); // serve client libraries
  (0, _rijs24.default)(ripple, opts); // serve pages directory 
  (0, _rijs12.default)(ripple); // extend components with features
  (0, _rijs6.default)(ripple); // versioning info and time travel
  (0, _rijs10.default)(ripple, opts); // populates sessionid on each connection
  (0, _rijs20.default)(ripple, opts); // loads from resources folder

  return ripple;
}