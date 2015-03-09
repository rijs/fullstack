"use strict";

var _utils = require("./utils");

var all = _utils.all;
var err = _utils.err;
var later = _utils.later;
var client = _utils.client;
var resourcify = _utils.resourcify;
var attr = _utils.attr;
var applyhtml = _utils.applyhtml;
var applycss = _utils.applycss;
var is = _utils.is;
var body = _utils.body;
var values = _utils.values;
var header = _utils.header;
var key = _utils.key;
var prepend = _utils.prepend;

module.exports = function (ripple) {
  var resources = ripple._resources();
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
  return function draw(thing) {
    if (!client) {
      return;
    }return !thing ? components() : thing.nodeName ? invoke(thing) : this && this.nodeName ? invoke(this) : this && this.node ? invoke(this.node()) : is.str(thing) ? resource(thing) : thing.name ? resource(thing) : thing[0] instanceof MutationRecord ? invoke(thing[0].target) : err("Couldn't update", thing);
  };

  // render all components
  function components() {
    var selector = values(resources).filter(header("content-type", "application/javascript")).map(key("name")).map(prepend("body /deep/ ")).join(",");

    all(selector).map(invoke);
  }

  // render all elements that depend on the resource
  function resource(thing) {
    var res = is.str(thing) ? resources[thing] : thing;
    if (!res) {
      return data(thing);
    }is.js(res) && js(res);
    is.data(res) && data(res.name);
    is.css(res) && css(res.name);
    is.html(res) && html(res.name);
  }

  // render all elements that require the specified data
  function data(name) {
    all("body /deep/ [data~=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // render all elements that require the specified css
  function css(name) {
    all("body /deep/ [css=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // render all elements that require the specified template
  function html(name) {
    all("body /deep/ [template=\"" + name + "\"]:not([inert])").map(invoke);
  }

  // register custom element prototype (render is automatic)
  function js(res) {
    if (is.registered(res)) {
      return;
    }var proto = Object.create(HTMLElement.prototype),
        opts = { prototype: proto },
        extend = res.headers["extends"];

    extend && (opts["extends"] = extend);
    proto.attachedCallback = proto.attributeChangedCallback = node;
    document.registerElement(res.name, opts);
  }

  // renders a particular node
  function node() {
    invoke(this);
  }

  // main function to render a particular custom element with any data it needs
  function invoke(_x) {
    var _again = true;

    _function: while (_again) {
      _again = false;
      var d = _x;
      delay = inert = root = name = data = html = css = data = fn = html = css = undefined;

      if (d.nodeName == "#text") {
        _x = d.parentNode;
        _again = true;
        continue _function;
      }

      var delay = attr(d, "delay"),
          inert = attr(d, "inert");

      if (inert != null) {
        return;
      }if (delay != null) {
        d.setAttribute("inert", "");
        d.removeAttribute("delay");
        return setTimeout(d.removeAttribute.bind(d, "inert"), +delay);
      }

      var root = d.shadowRoot || d.createShadowRoot(),
          name = attr(d, "is") || d.tagName.toLowerCase(),
          data = attr(d, "data") || "",
          html = attr(d, "template"),
          css = attr(d, "css"),
          data = resourcify(data) //|| d.__data__
      ,
          fn = body(name),
          html = body(html),
          css = body(css);

      try {
        fn && (data || !attr(d, "data")) && (applyhtml(root, html) || !attr(d, "template")) && (applycss(root, css) || !attr(d, "css")) && fn.call(root, data);

        d.observer && Object.unobserve(d.state, d.observer);
        d.state && Object.observe(d.state, d.observer = later(ripple, d));
      } catch (e) {
        err(e);
      }

      return d;
    }
  }

  function body(name) {
    return !name ? undefined : is.route(name) ? ripple(name) : resources[name] && resources[name].body;
  }

  function resourcify(d) {
    var o = {},
        names = d.split(" ");

    return names.length == 0 ? undefined : names.length == 1 ? body(first(names)) : (names.map(function (d) {
      o[d] = body(d);
    }), values(o).some(empty) ? undefined : o);
  }
};