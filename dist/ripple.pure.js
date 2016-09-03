(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = create;

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

var _rijs23 = require('rijs.needs');

var _rijs24 = _interopRequireDefault(_rijs23);

var _rijs25 = require('rijs.sync');

var _rijs26 = _interopRequireDefault(_rijs25);

var _rijs27 = require('rijs.core');

var _rijs28 = _interopRequireDefault(_rijs27);

var _rijs29 = require('rijs.data');

var _rijs30 = _interopRequireDefault(_rijs29);

var _rijs31 = require('rijs.css');

var _rijs32 = _interopRequireDefault(_rijs31);

var _rijs33 = require('rijs.fn');

var _rijs34 = _interopRequireDefault(_rijs33);
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

true && !window.ripple && create();

function create(opts) {
  var ripple = (0, _rijs28.default)(); // empty base collection of resources

  // enrich..
  (0, _rijs8.default)(ripple); // exposes a single instance
  (0, _rijs30.default)(ripple); // register data types
  (0, _rijs32.default)(ripple); // register css types
  (0, _rijs34.default)(ripple); // register fn types
  (0, _rijs16.default)(ripple); // expose helper functions and constants
  (0, _rijs4.default)(ripple); // invoke web components, fn.call(<el>, data)
  (0, _rijs24.default)(ripple); // define default attrs for components
  (0, _rijs18.default)(ripple); // preapplies scoped css 
  (0, _rijs22.default)(ripple, opts); // serve true libraries
  (0, _rijs14.default)(ripple); // loads/saves from/to localstorage
  (0, _rijs26.default)(ripple, opts); // syncs resources between server/true
  (0, _rijs2.default)(ripple); // restricts broadcast to trues based on need
  (0, _rijs12.default)(ripple); // extend components with features
  (0, _rijs6.default)(ripple); // versioning info and time travel
  (0, _rijs10.default)(ripple, opts); // populates sessionid on each connection
  (0, _rijs20.default)(ripple, opts); // loads from resources folder

  return ripple;
}
},{"rijs.backpressure":4,"rijs.components":5,"rijs.core":8,"rijs.css":10,"rijs.data":11,"rijs.features":12,"rijs.fn":13,"rijs.helpers":14,"rijs.needs":15,"rijs.offline":16,"rijs.precss":17,"rijs.resdir":21,"rijs.serve":22,"rijs.sessions":23,"rijs.singleton":18,"rijs.sync":19,"rijs.versioned":20}],2:[function(require,module,exports){

},{}],3:[function(require,module,exports){
module.exports = function scope(styles, prefix) {
  return styles
    .replace(/^(?!.*:host)([^@%\n]*){/gim, function($1){ return prefix+' '+$1 })       // ... {                 -> tag ... {
    .replace(/^(?!.*:host)(.*?),\s*$/gim, function($1){ return prefix+' '+$1 })        // ... ,                 -> tag ... ,
    .replace(/:host\((.*?)\)/gi, function($1, $2){ return prefix+$2 })                 // :host(...)            -> tag...
    .replace(/:host /gi, prefix + ' ')                                                 // :host ...             -> tag ...
    .replace(/^.*:host-context\((.*)\)/gim, function($1, $2){ return $2+' ' +prefix }) // ... :host-context(..) -> ... tag..
}
},{}],4:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = backpressure;

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Applies backpressure on the flow of streams
// -------------------------------------------
function backpressure(ripple) {
  log('creating');
  if (!ripple.io) return ripple;
  if (true) return ripple.render = loaded(ripple)(ripple.render), ripple.pull = emit(ripple), ripple.deps = deps, ripple.requested = {}, (0, ready)(start(ripple)), ripple.io.on('connect', refresh(ripple)), ripple.io.on('reconnect', reconnect(ripple)), ripple;

  ripple.to = limit(ripple.to);
  ripple.from = track(ripple)(ripple.from);
  ripple.io.use(function (socket, next) {
    socket.deps = {}, next();
  });
  return ripple;
}

var start = function start(ripple) {
  return function (d) {
    return scan(ripple)(document.body);
  };
};

var scan = function scan(ripple) {
  return function (el) {
    return !el ? undefined : ((0, all)('*', el).filter((0, by)('nodeName', (0, includes)('-'))).filter((0, by)('nodeName', function (d) {
      return !is.in(ripple.requested)((0, lo)(d));
    })).map(ripple.draw), el);
  };
};

var track = function track(ripple) {
  return function (next) {
    return function (req, res) {
      var name = req.name;
      var type = req.type;
      var socket = req.socket;
      var send = ripple.send;
      var exists = name in socket.deps;

      if (!(name in ripple.resources)) return;
      if (type !== 'pull') return (next || identity)(req, res);
      socket.deps[name] = 1;
      send(socket)(name);
      return false;
    };
  };
};

var reconnect = function reconnect(_ref) {
  var io = _ref.io;
  return function (d) {
    return io.io.disconnect(), io.io.connect();
  };
};

var refresh = function refresh(ripple) {
  return function (d) {
    return (0, group)('refreshing', function (d) {
      return (0, values)(ripple.resources).map(function (_ref2) {
        var name = _ref2.name;
        return emit(ripple)(name);
      });
    });
  };
};

var emit = function emit(ripple) {
  return function (name) {
    log('pulling', name);
    ripple.io.emit('change', { name: name, type: 'pull' });
    ripple.requested[name] = 1;
    return name;
  };
};

var limit = function limit(next) {
  return function (req) {
    return req.name in req.socket.deps ? (next || identity)(req) : false;
  };
};

var deps = function deps(el) {
  return format([(0, key)('nodeName'), (0, attr)('data'), (0, attr)('css'), (0, attr)('is')])(el);
};

var format = function format(arr) {
  return function (el) {
    return arr.map(function (extract) {
      return extract(el);
    }).filter(Boolean).map(lo).map((0, split)(' ')).reduce(flatten, []).filter(unique);
  };
};

var loaded = function loaded(ripple) {
  return function (next) {
    return function (el) {
      return ripple.deps(el).filter((0, not)(is.in(ripple.requested))).map(emit(ripple)).length ? false : scan(ripple)(next(el));
    };
  };
};

var log = window.log('[ri/back]'),
    err = window.err('[ri/back]');
},{}],5:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = components;
var _data = require('./types/data');

var _data2 = _interopRequireDefault(_data);

var _fn = require('./types/fn');

var _fn2 = _interopRequireDefault(_fn);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// API: Renders specific nodes, resources or everything
// -------------------------------------------
// ripple.draw()                 - redraw all components on page
// ripple.draw(element)          - redraw specific element
// ripple.draw.call(element)     - redraw specific element
// ripple.draw.call(selection)   - redraw D3 selection
// ripple.draw('name')           - redraw elements that depend on resource
// ripple.draw({ ... })          - redraw elements that depend on resource
// MutationObserver(ripple.draw) - redraws element being observed

function components(ripple) {
  if (!true) return ripple;
  log('creating');

  (0, values)(ripple.types).map(function (type) {
    return type.parse = (0, proxy)(type.parse, clean(ripple));
  });
  (0, key)('types.application/javascript.render', function (d) {
    return (0, _fn2.default)(ripple);
  })(ripple);
  (0, key)('types.application/data.render', function (d) {
    return (0, _data2.default)(ripple);
  })(ripple);
  ripple.draw = Node.prototype.draw = draw(ripple);
  ripple.render = render(ripple);
  ripple.on('change.draw', ripple.draw);
  (0, time)(0, ripple.draw);
  return ripple;
}

// public draw api
function draw(ripple) {
  return function (thing) {
    return this && this.nodeName ? invoke(ripple)(this) : this && this.node ? invoke(ripple)(this.node()) : !thing ? everything(ripple) : thing instanceof mutation ? invoke(ripple)(thing.target) : thing[0] instanceof mutation ? invoke(ripple)(thing[0].target) : thing.nodeName ? invoke(ripple)(thing) : thing.node ? invoke(ripple)(thing.node()) : thing.name ? resource(ripple)(thing.name) : is.str(thing) ? resource(ripple)(thing) : err('could not update', thing);
  };
}

// render all components
var everything = function everything(ripple) {
  var selector = (0, values)(ripple.resources).filter((0, header)('content-type', 'application/javascript')).map((0, key)('name')).join(',');

  return !selector ? [] : (0, all)(selector).map(invoke(ripple));
};

// render all elements that depend on the resource
var resource = function resource(ripple) {
  return function (name) {
    var res = ripple.resources[name],
        type = (0, header)('content-type')(res);

    return (ripple.types[type].render || noop)(res);
  };
};

// batch renders on render frames
var batch = function batch(ripple) {
  return function (el) {
    return el.pending ? el.pending.push(ripple.change) : (el.pending = [ripple.change], requestAnimationFrame(function (d) {
      el.change = el.pending;
      delete el.pending;
      ripple.render(el);
    }));
  };
};

// main function to render a particular custom element with any data it needs
var invoke = function invoke(ripple) {
  return function (el) {
    if (!(0, includes)('-')(el.nodeName)) return;
    if (el.nodeName == '#document-fragment') return invoke(ripple)(el.host);
    if (el.nodeName == '#text') return invoke(ripple)(el.parentNode);
    if (!el.matches(isAttached)) return;
    if ((0, attr)(el, 'inert') != null) return;
    return batch(ripple)(el), el;
  };
};

var render = function render(ripple) {
  return function (el) {
    var name = (0, lo)(el.tagName),
        deps = (0, attr)(el, 'data'),
        fn = body(ripple)(name),
        data = bodies(ripple)(deps),
        root = el.shadowRoot || el;

    if (!fn) return el;
    if (deps && !data) return el;

    try {
      fn.call(root, root, defaults(el, data));
    } catch (e) {
      err(e, e.stack);
    }

    return el;
  };
};

// clean local headers for transport
var clean = function clean(ripple) {
  return function (res) {
    return delete res.headers.pending, res;
  };
};

// helpers
var defaults = function defaults(el, data) {
  el.state = el.state || {};
  (0, overwrite)(el.state)(data);
  (0, overwrite)(el.state)(el.__data__);
  el.__data__ = el.state;
  return el.state;
};

var bodies = function bodies(ripple) {
  return function (deps) {
    var o = {},
        names = deps ? deps.split(' ') : [];

    names.map(function (d) {
      return o[d] = body(ripple)(d);
    });

    return !names.length ? undefined : (0, values)(o).some(is.falsy) ? undefined : o;
  };
};

var body = function body(ripple) {
  return function (name) {
    return ripple.resources[name] && ripple.resources[name].body;
  };
};

var index = function index(el) {
  return Array.prototype.indexOf.call((0, key)('parentNode.children')(el) || [], el);
};

var log = window.log('[ri/components]'),
    err = window.err('[ri/components]'),
    mutation = true && window.MutationRecord || noop,
    customs = true && !!document.registerElement,
    isAttached = customs ? 'html *, :host-context(html) *' : 'html *';
true && (Element.prototype.matches = Element.prototype.matches || Element.prototype.msMatchesSelector);
},{"./types/data":6,"./types/fn":7}],6:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = data;
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// render all elements that require the specified data
function data(ripple) {
  return function (res) {
    return (0, all)('[data~="' + res.name + '"]:not([inert])').map(ripple.draw);
  };
}
},{}],7:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fn;

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// register custom element prototype (render is automatic)
function fn(ripple) {
  return function (res) {
    if (!customs || !customEl(res) || registered(res)) return (0, all)(res.name + ':not([inert])\n                 ,[is="' + res.name + '"]:not([inert])').map(ripple.draw);

    var proto = Object.create(HTMLElement.prototype),
        opts = { prototype: proto };

    proto.attachedCallback = ripple.draw;
    document.registerElement(res.name, opts);
  };
}

var registered = function registered(res) {
  return document.createElement(res.name).attachedCallback;
};

var customs = true && !!document.registerElement,
    customEl = function customEl(d) {
  return (0, includes)('-')(d.name);
};
},{}],8:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = core;

var _text = require('./types/text');

var _text2 = _interopRequireDefault(_text);

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// API: Gets or sets a resource
// -------------------------------------------
// ripple('name')     - returns the resource body if it exists
// ripple('name')     - creates & returns resource if it doesn't exist
// ripple('name', {}) - creates & returns resource, with specified name and body
// ripple({ ... })    - creates & returns resource, with specified name, body and headers
// ripple.resources   - returns raw resources
// ripple.resource    - alias for ripple, returns ripple instead of resource for method chaining
// ripple.register    - alias for ripple
// ripple.on          - event listener for changes - all resources
// ripple('name').on  - event listener for changes - resource-specific

function core() {
  log('creating');

  var resources = {};
  ripple.resources = resources;
  ripple.resource = chainable(ripple);
  ripple.register = ripple;
  ripple.types = types();
  return (0, emitterify)(ripple);

  function ripple(name, body, headers) {
    return !name ? ripple : is.arr(name) ? name.map(ripple) : is.obj(name) && !name.name ? ripple((0, values)(name)) : is.fn(name) && name.resources ? ripple((0, values)(name.resources)) : is.str(name) && !body && resources[name] ? resources[name].body : is.str(name) && !body && !resources[name] ? register(ripple)({ name: name }) : is.str(name) && body ? register(ripple)({ name: name, body: body, headers: headers }) : is.obj(name) && !is.arr(name) ? register(ripple)(name) : (err('could not find or create resource', name), false);
  }
}

var register = function register(ripple) {
  return function (_ref) {
    var name = _ref.name;
    var body = _ref.body;
    var _ref$headers = _ref.headers;
    var headers = _ref$headers === undefined ? {} : _ref$headers;

    log('registering', name);
    var res = normalise(ripple)({ name: name, body: body, headers: headers });

    if (!res) return err('failed to register', name), false;
    ripple.resources[name] = res;
    ripple.emit('change', [name, {
      type: 'update',
      value: res.body,
      time: now(res)
    }]);
    return ripple.resources[name].body;
  };
};

var normalise = function normalise(ripple) {
  return function (res) {
    if (!(0, header)('content-type')(res)) (0, values)(ripple.types).sort((0, za)('priority')).some(contentType(res));
    if (!(0, header)('content-type')(res)) return err('could not understand resource', res), false;
    return parse(ripple)(res);
  };
};

var parse = function parse(ripple) {
  return function (res) {
    var type = (0, header)('content-type')(res);
    if (!ripple.types[type]) return err('could not understand type', type), false;
    return (ripple.types[type].parse || identity)(res);
  };
};

var contentType = function contentType(res) {
  return function (type) {
    return type.check(res) && (res.headers['content-type'] = type.header);
  };
};

var types = function types() {
  return [_text2.default].reduce(to.obj('header'), 1);
};

var chainable = function chainable(fn) {
  return function () {
    return fn.apply(this, arguments), fn;
  };
};

var err = window.err('[ri/core]'),
    log = window.log('[ri/core]'),
    now = function now(d, t) {
  return t = (0, key)('body.log.length')(d), is.num(t) ? t - 1 : t;
};
},{"./types/text":9}],9:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = {
  header: 'text/plain',
  check: function check(res) {
    return !(0, includes)('.html')(res.name) && !(0, includes)('.css')(res.name) && is.str(res.body);
  }
};
},{}],10:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = css;
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
function css(ripple) {
  log('creating');
  ripple.types['text/css'] = {
    header: 'text/css',
    check: function check(res) {
      return (0, includes)('.css')(res.name);
    }
  };

  return ripple;
}

var log = window.log('[ri/types/css]');
},{}],11:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = data;
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Adds support for data resources
// -------------------------------------------
function data(ripple) {
  log('creating');
  ripple.on('change.data', trickle(ripple));
  ripple.types['application/data'] = {
    header: 'application/data',
    check: function check(res) {
      return is.obj(res.body) || !res.body ? true : false;
    },
    parse: function parse(res) {
      var existing = ripple.resources[res.name] || {};

      (0, extend)(res.headers)(existing.headers);
      res.body = (0, set)()(res.body || [], existing.body && existing.body.log, is.num(res.headers.log) ? res.headers.log : -1);
      (0, overwrite)(res.body.on)(listeners(existing));
      res.body.on('change.bubble', function (change) {
        ripple.emit('change', ripple.change = [res.name, change], (0, not)(is.in(['data'])));
        delete ripple.change;
      });

      return res;
    }
  };

  return ripple;
}

var trickle = function trickle(ripple) {
  return function (name, change) {
    return (0, header)('content-type', 'application/data')(ripple.resources[name]) && ripple.resources[name].body.emit('change', [change || null], (0, not)(is.in(['bubble'])));
  };
};

var log = window.log('[ri/types/data]'),
    listeners = (0, key)('body.on');
},{}],12:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = features;/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Extend Components with Features
// -------------------------------------------
function features(ripple) {
  if (!true) return;
  log('creating');
  ripple.render = render(ripple)(ripple.render);
  return ripple;
}

var render = function render(ripple) {
  return function (next) {
    return function (el) {
      var features = (0, str)((0, attr)(el, 'is')).split(' ').map((0, from)(ripple.resources)).filter((0, header)('content-type', 'application/javascript')),
          css = (0, str)((0, attr)('css')(el)).split(' ');

      features.filter((0, by)('headers.needs', (0, includes)('[css]'))).map((0, key)('name')).map((0, append)('.css')).filter((0, not)(is.in(css))).map(function (d) {
        return (0, attr)('css', ((0, str)((0, attr)('css')(el)) + ' ' + d).trim())(el);
      });

      var node = next(el);

      return !node || !node.state ? undefined : (features.map((0, key)('body')).map(function (d) {
        return d.call(node.shadowRoot || node, node.shadowRoot || node, node.state);
      }), node);
    };
  };
};

var log = window.log('[ri/features]');
},{}],13:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = fnc;

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Adds support for function resources
// -------------------------------------------
function fnc(ripple) {
  log('creating');
  ripple.types['application/javascript'] = { header: header, check: check, parse: parse, to: to };
  return ripple;
}

var header = 'application/javascript';
var check = function check(res) {
  return is.fn(res.body);
};
var parse = function parse(res) {
  return res.body = (0, fn)(res.body), res;
};
var log = window.log('[ri/types/fn]');
var to = function to(res) {
  return res.value = (0, str)(res.value), res;
};
},{}],14:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = helpers;

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Attach Helper Functions for Resources
// -------------------------------------------
function helpers(ripple) {
  log('creating');

  var type = ripple.types['application/data'];
  type.parse = attach(type.parse);
  if (!true) type.to = serialise(type.to);
  return ripple;
}

var attach = function attach(next) {
  return function (res) {
    if (next) res = next(res);
    var helpers = res.headers.helpers;

    (0, keys)(helpers).map(function (name) {
      return helpers[name] = (0, fn)(helpers[name]), name;
    }).map(function (name) {
      return (0, def)(res.body, name, helpers[name]);
    });

    return res;
  };
};

var serialise = function serialise(next) {
  return function (req) {
    if (!req.headers) return (next || identity)(req);

    var helpers = req.headers.helpers;    (0, keys)(helpers).filter(function (name) {
      return is.fn(helpers[name]);
    }).map(function (name) {
      return helpers[name] = (0, str)(helpers[name]);
    });

    return (next || identity)(req);
  };
};

var log = window.log('[ri/helpers]');
},{}],15:[function(require,module,exports){
'use strict';

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = needs;
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Define Default Attributes for Components
// -------------------------------------------
function needs(ripple) {
  if (!true) return;
  log('creating');
  ripple.render = render(ripple)(ripple.render);
  return ripple;
}

var render = function render(ripple) {
  return function (next) {
    return function (el) {
      var component = (0, lo)(el.nodeName);
      if (!(component in ripple.resources)) return;

      var headers = ripple.resources[component].headers,
          attrs = headers.attrs = headers.attrs || parse(headers.needs, component);

      return attrs.map(function (_ref) {
        var _ref2 = _slicedToArray(_ref, 2);

        var name = _ref2[0];
        var values = _ref2[1];
        return values.some(function (v, i) {
          var from = (0, attr)(el, name) || '';
          return (0, includes)(v)(from) ? false : (0, attr)(el, name, (from + ' ' + v).trim());
        });
      }).some(Boolean) ? el.draw() : next(el);
    };
  };
};

var parse = function parse() {
  var attrs = arguments.length <= 0 || arguments[0] === undefined ? '' : arguments[0];
  var component = arguments[1];
  return attrs.split('[').slice(1).map((0, replace)(']', '')).map((0, split)('=')).map(function (_ref3) {
    var _ref4 = _slicedToArray(_ref3, 2);

    var k = _ref4[0];
    var v = _ref4[1];
    return v ? [k, v.split(' ')] : k == 'css' ? [k, [component + '.css']] : [k, []];
  });
};

var log = window.log('[ri/needs]'),
    err = window.err('[ri/needs]');
},{}],16:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = offline;

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// API: Cache to and Restore from localStorage
// -------------------------------------------
function offline(ripple) {
  if (!true || !window.localStorage) return;
  log('creating');
  load(ripple);
  ripple.on('change.cache', (0, debounce)(1000)(cache(ripple)));
  return ripple;
}

var load = function load(ripple) {
  return (0, group)('loading cache', function (d) {
    return ((0, parse)(localStorage.ripple) || []).map(ripple);
  });
};

var cache = function cache(ripple) {
  return function (res) {
    log('cached');
    var cachable = (0, values)((0, clone)(ripple.resources)).filter((0, not)((0, header)('cache', 'no-store')));

    cachable.filter((0, header)('content-type', 'application/javascript')).map(function (d) {
      return d.body = (0, str)(ripple.resources[d.name].body);
    });

    localStorage.ripple = (0, str)(cachable);
  };
};

var log = window.log('[ri/offline]'),
    err = window.err('[ri/offline]');
},{}],17:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = precss;
var _cssscope = require('cssscope');

var _cssscope2 = _interopRequireDefault(_cssscope);

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Pre-applies Scoped CSS [css=name]
// -------------------------------------------
function precss(ripple) {
  if (!true) return;
  log('creating');

  ripple.render = render(ripple)(ripple.render);

  (0, values)(ripple.types).filter((0, by)('header', 'text/css')).map(function (type) {
    return type.render = (0, proxy)(type.render, css(ripple));
  });

  return ripple;
}

var render = function render(ripple) {
  return function (next) {
    return function (host) {
      var css = (0, str)((0, attr)(host, 'css')).split(' ').filter(Boolean),
          root = host.shadowRoot || host,
          head = document.head,
          shadow = head.createShadowRoot && host.shadowRoot,
          styles;

      // this host does not have a css dep, continue with rest of rendering pipeline
      if (!css.length) return next(host);

      // this host has a css dep, but it is not loaded yet - stop rendering this host
      if (css.some((0, not)(is.in(ripple.resources)))) return;

      // retrieve styles
      styles = css.map((0, from)(ripple.resources)).map(function (d) {
        return d.body;
      }).map(shadow ? identity : transform(css));

      // reuse or create style tag
      css.map(function (d) {
        return (0, raw)('style[resource="' + d + '"]', shadow ? root : head) || (0, el)('style[resource=' + d + ']');
      }).map(function (d, i) {
        return d.innerHTML = styles[i], d;
      }).filter((0, not)((0, by)('parentNode'))).map(function (d) {
        return shadow ? root.insertBefore(d, root.firstChild) : head.appendChild(d);
      });

      // continue with rest of the rendering pipeline
      return next(host);
    };
  };
};

var transform = function transform(names) {
  return function (styles, i) {
    return (0, _cssscope2.default)(styles, '[css~="' + names[i] + '"]');
  };
};

var css = function css(ripple) {
  return function (res) {
    return (0, all)('[css~="' + res.name + '"]:not([inert])').map(ripple.draw);
  };
};

var log = window.log('[ri/precss]'),
    err = window.err('[ri/precss]');
},{"cssscope":3}],18:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = singleton;
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Exposes a convenient global instance
// -------------------------------------------
function singleton(ripple) {
  log('creating');
  if (!owner.ripple) owner.ripple = ripple;
  return ripple;
}

var log = window.log('[ri/singleton]');
},{}],19:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = sync;

var _to = window.to;

/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Synchronises resources between server/true
// -------------------------------------------
function sync(ripple, server) {
  log('creating');

/* istanbul ignore next */
  if (!true && !server) return ripple;
/* istanbul ignore next */
  if (!true) ripple.to = clean(ripple.to), (0, values)(ripple.types).map(function (type) {
    return type.parse = headers(ripple)(type.parse);
  });

  ripple.io = io(server);
  ripple.io.use(ip);
  ripple.req = send(ripple)(ripple);
/* istanbul ignore next */
  ripple.send = true ? send(ripple)(ripple.io) : send(ripple);
  ripple.on('change.send', broadcast(ripple));
  ripple.io.on('change', consume(ripple));
  ripple.io.on('connection', connected(ripple));
  return ripple;
}

var connected = function connected(ripple) {
  return function (socket) {
    log('connected'.green, (0, str)(socket.ip).grey);
    socket.on('change', consume(ripple));
    ripple.send(socket)();
  };
};

var broadcast = function broadcast(ripple) {
  return function (name, change) {
/* istanbul ignore next */
    (true ? ripple.send : ripple.send())((0, extend)({ name: name })(change || {}));
  };
};

var normalize = function normalize(ripple) {
  var next = arguments.length <= 1 || arguments[1] === undefined ? identity : arguments[1];
  return function (name, type, value) {
    var req = is.obj(name) ? name : { name: name, type: type, value: value },
        resource = ripple.resources[req.name];

    if (!req.name) return next((0, values)(ripple.resources).map(normalize(ripple)));

    if (!resource) return Promise.resolve([404, err('cannot find ' + req.name)]);

    if (!req.type) req = {
      name: req.name,
      type: 'update',
      headers: resource.headers,
      value: resource.body,
      time: now(resource)
    };

    if (req.type == 'update' && !req.key) req.headers = resource.headers;

    return next(req);
  };
};

// send all or some req, to all or some sockets
var send = function send(ripple) {
  var l = arguments.length <= 1 || arguments[1] === undefined ? log : arguments[1];
  return function (who) {
    return normalize(ripple, function (req) {
      var count = function count(sent) {
        return (0, str)(sent.length).green.bold + '/' + (0, str)(everyone.length).green;
      },
          all = function all(d) {
        return req.length && log('send'.grey, count(sockets), 'all'.bold, ('(' + req.length + ')').grey);
      },
/* istanbul ignore next */
          everyone = true ? [ripple.io] : (0, values)(ripple.io.of('/').sockets),
          sockets = is.arr(who) ? who : is.str(who) ? everyone.filter((0, by)('sessionID', who)) : !who ? everyone : [who],
/* istanbul ignore next */
          promises = is.arr(req) ? (all(), req.map(send(ripple, l = noop)(sockets))) : sockets.map(function (s) {
        return to(ripple, req, s);
      }).filter(Boolean);

      if (promises.length) l('send'.grey, count(promises), req.name);
      return Promise.all(promises);
    });
  };
};

// outgoing transforms
var to = function to(ripple, req, socket, resource) {
  if ((0, header)('silent', socket)(resource = ripple.resources[req.name])) return delete resource.headers.silent, false;

  var nametype = '(' + req.name + ', ' + req.type + ')',
      xres = (0, header)('to')(resource) || identity,
      xtyp = type(ripple)(resource).to || identity,
      xall = ripple.to || identity,
      p = (0, promise)();

  Promise.resolve(xall((0, extend)({ socket: socket })(req))).then(function (req) {
    return req && xtyp(req);
  }).then(function (req) {
    return req && xres(req);
  }).then(function (req) {
    return !strip(req) ? p.resolve([false]) : socket == ripple ? consume(ripple)(req, res) : socket.emit('change', req, res);
  }).catch(function (e) {
    throw new Error(err('to failed'.red, e));
  });

  return p;

  function res() {
    deb('ack'.grey, nametype, (0, str)(socket.ip).grey);
    p.resolve((0, _to.arr)(arguments));
  }
};

// incoming transforms
var consume = function consume(ripple) {
  return function (req) {
/* istanbul ignore next */
    var res = arguments.length <= 1 || arguments[1] === undefined ? noop : arguments[1];

    var nametype = '(' + req.name + ', ' + req.type + ')',
        resource = ripple.resources[req.name],
        silent = silence(req.socket = this),
        xres = (0, header)('from')(resource) || identity,
        xtyp = type(ripple)(resource).from || identity,
        xall = ripple.from || identity;

    log('recv'.grey, nametype);
    try {
      !req.name ? res(404, err('not found'.red, req.name)) : !(req = xall(req, res)) ? deb('skip', 'global', nametype) : !(req = xtyp(req, res)) ? deb('skip', 'type', nametype) : !(req = xres(req, res)) ? deb('skip', 'resource', nametype) : !req.key && req.type == 'update' ? (ripple(silent(body(req))), res(200, deb('ok ' + nametype))) : isStandardVerb(req.type) ? ((0, set)(req)(silent(resource).body), res(200, deb('ok ' + nametype, key.grey))) : !isStandardVerb(req.type) ? res(405, err('method not allowed', nametype)) : res(400, err('cannot process', nametype));
    } catch (e) {
      res(e.status || 500, err(e.message, nametype, '\n', e.stack));
    }
  };
};

var body = function body(_ref) {
  var name = _ref.name;
  var _body = _ref.body;
  var value = _ref.value;
  var headers = _ref.headers;
  return { name: name, headers: headers, body: value };
};

var headers = function headers(ripple) {
  return function (next) {
    return function (res) {
      var existing = ripple.resources[res.name],
          from = (0, header)('from')(res) || (0, header)('from')(existing),
          to = (0, header)('to')(res) || (0, header)('to')(existing);
      if (from) res.headers.from = from;
      if (to) res.headers.to = to;
      return next ? next(res) : res;
    };
  };
};

var io = function io(opts) {
/* istanbul ignore next */
  var r = !true ? require('socket.io')(opts.server || opts) : window.io ? window.io({ transports: ['websocket', 'polling'] }) : is.fn(require('socket.io-client')) ? require('socket.io-client')({ transports: ['websocket', 'polling'] }) : { on: noop, emit: noop };
/* istanbul ignore next */
  r.use = r.use || noop;
  return r;
};

var ip = function ip(socket, next) {
  socket.ip = socket.request.headers['x-forwarded-for'] || socket.request.connection.remoteAddress;
  next();
};

var strip = function strip(req) {
  return delete req.socket, req;
};

var clean = function clean(next) {
  return function (req, res) {
    if (is.obj(req.value)) try {
      req.value = (0, clone)(req.value);
    } catch (e) {
      err('cannot send circular structure');
      return false;
    }

    if (!req.headers || !req.headers.silent) return (next || identity)(req, res);

    var stripped = {};

    (0, keys)(req.headers).filter((0, not)((0, is)('silent'))).map(function (header) {
      return stripped[header] = req.headers[header];
    });

    req.headers = stripped;
    return (next || identity)(req, res);
  };
};

var type = function type(ripple) {
  return function (res) {
    return ripple.types[(0, header)('content-type')(res)] || {};
  };
},
    now = function now(d, t) {
  return t = (0, key)('body.log.length')(d), is.num(t) ? t - 1 : t;
},
    silence = function silence(socket) {
  return function (res) {
    return (0, key)('headers.silent', socket)(res);
  };
},
    isStandardVerb = is.in(['update', 'add', 'remove']),
    log = window.log('[ri/sync]'),
    err = window.err('[ri/sync]'),
    deb = window.deb('[ri/sync]');
},{"socket.io":2,"socket.io-client":2}],20:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = version;
/* istanbul ignore next */
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// -------------------------------------------
// Global Versioning and Time Travel
// -------------------------------------------
function version(ripple) {
  log('creating');

  var type = ripple.types['application/data'];
  ripple.on('change.version', commit(ripple));
  ripple.version = checkout(ripple);
  ripple.version.calc = calc(ripple);
  ripple.version.log = [];
  return ripple;
}

var commit = function commit(ripple) {
  return function (name, change) {
    return logged(ripple.resources[name]) && ripple.version.log.push((0, values)(ripple.resources).filter((0, by)(logged)).map(index));
  };
};

var index = function index(_ref) {
  var name = _ref.name;
  var body = _ref.body;
  return { name: name, index: body.log.length - 1 };
};

var checkout = function checkout(ripple) {
  return function (name, index) {
    return arguments.length == 2 ? resource(ripple)({ name: name, index: index }) : arguments.length == 1 && is.str(name) ? ripple.resources[name].body.log.length - 1 : arguments.length == 1 && is.num(name) ? application(ripple)(name) : arguments.length == 0 ? ripple.version.log.length - 1 : err('could not rollback', name, index);
  };
};

var application = function application(ripple) {
  return function (index) {
    return ripple.version.log[rel(ripple.version.log, index)].map(resource(ripple));
  };
};

var resource = function resource(ripple) {
  return function (_ref2) {
    var name = _ref2.name;
    var index = _ref2.index;
    return ripple(name, ripple.version.calc(name, index));
  };
};

var calc = function calc(ripple) {
  return function (name, index) {
    var log = ripple.resources[name].body.log,
        end = rel(log, index),
        i = end;

    if (log[end].cache) return log[end].cache;

    while (is.def(log[i].key)) {
      i--;
    }var root = (0, clone)(log[i].value);
    while (i !== end) {
      (0, set)(log[++i])(root);
    }return (0, def)(log[end], 'cache', root);
  };
};

var rel = function rel(log, index) {
  return index < 0 ? log.length + index - 1 : index;
};

var logged = function logged(res) {
  return res.body.log && res.body.log.max > 0;
};

var log = window.log('[ri/versioned]'),
    err = window.err('[ri/versioned]');
},{}],21:[function(require,module,exports){
module.exports = function identity(d) {
  return d
}
},{}],22:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}],23:[function(require,module,exports){
arguments[4][21][0].apply(exports,arguments)
},{"dup":21}]},{},[1]);
