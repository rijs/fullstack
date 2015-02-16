!function(){ 
  var resources = { versions: [] }
    , socket    = window.io ? io() : { on: noop, emit: noop }
    , log       = console.log.bind(console, '[ripple]')
    
  window.ripple = ripple  
  ripple.socket = socket

  function ripple(thing, v){
    return !arguments.length                ? activateAll()
     : thing[0] instanceof MutationRecord   ? invoke(thing[0].target.parentNode)
     : arguments.length == 2 && isNumber(v) ? rollback({ name: thing, index: v })
     : arguments.length == 2 && isObject(v) ? register({ name: thing, body: v })
     : this.nodeName                        ? invoke(this)
     : thing.nodeName                       ? invoke(thing)
     : this.node                            ? invoke(this.node())
     : isNumber(thing)                      ? travel(thing)
     : isString(thing) && resources[thing]  ? resources[thing].body
     : register(isObject(thing) ? thing : { name: thing })
  }

  function rollback(o) {
    if (!resources[o.name].versions) console.error(o.name, 'does not have a history')

    register({ 
      name: o.name
    , headers: { 'content-type': 'application/data', 'version': o.index }
    , body: resources[o.name].versions[o.index].toJS()
    })

    return ripple(o.name)
  }

  function activateAll(){
    // TODO: :resolved?
    var selector = values(resources)
          .filter(header('content-type', 'application/javascript'))
          .map(key('name'))
          .map(prepend('body /deep/ '))
          .join(',')

    all(selector)
      .map(invoke)
  }

  function activateData(name) {
    all('body /deep/ [data="'+name+'"]:not([inert])')
      .map(invoke)
  }

  function activateCSS(name) {
    all('body /deep/ [css="'+name+'"]:not([inert])')
      .map(invoke)
  }

  function activateHTML(name) {
    all('body /deep/ [html="'+name+'"]:not([inert])')
      .map(invoke)
  }

  function activateNode() {
    invoke(this)
  }

  ripple._resources = function(){
    return resources
  }

  var i = 0;

  function invoke(d){ 
    var delay = attr(d, 'delay')
      , inert = attr(d, 'inert')

    if (inert != null) return;
    if (delay != null) {
      d.setAttribute('inert', '')
      d.removeAttribute('delay')
      return setTimeout(d.removeAttribute.bind(d,'inert'), +delay)
    }

    var root = d.shadowRoot || d.createShadowRoot()
      , name = attr(d, 'is') || d.tagName.toLowerCase()
      , data = attr(d, 'data')
      , html = attr(d, 'template')
      , css  = attr(d, 'css')
      , fn   = resources[name] && resources[name].body
      , data = resources[data] && resources[data].body || d.__data__
      , html = resources[html] && resources[html].body
      , css  = resources[css ] && resources[css ].body
      , start = performance.now()

    try {
      // console.timeStamp('draw-start-'+ (++i))
      // console.group('draw', i)

          fn
      && (data                  || !attr(d, 'data'))
      && (applyhtml(root, html) || !attr(d, 'html'))
      && (applycss(root, css)   || !attr(d, 'css'))
      &&  fn.call(root, data)

      // log(performance.now() - start)
      // console.groupEnd()
      // console.timeStamp('draw-end-'+ (i))

      d.observer &&  Object.unobserve(d.state, d.observer)
      d.state    && (Object.observe  (d.state, d.observer = later(d)))

    } catch (err) {
      console.error(err)
    }

    return d
  }

  function later(d) {
    return function(changes){
      ripple(d)
    }
  }

  function registerElement(res) {
    try {
      var proto = Object.create(HTMLElement.prototype)
        , opts = { prototype: proto }
        , extend = res.headers['extends']

      extend && (opts.extends = extend)
      proto.attachedCallback = 
      proto.attributeChangedCallback =
        activateNode
      document.registerElement(res.name, opts)
    } catch (e){}
  }

  function intepret(res) {
    return isFunction(res.body) ? (res.headers['content-type'] = 'application/javascript')
         : isObject(res.body)   ? (res.headers['content-type'] = 'application/data')
         : false
  }

  // socket.on('draw', activateAll)

  group('localStorage cache', function(){
    var offline = parse(localStorage.ripple)

    values(offline)
      .forEach(register)
  })

  // activateAll()

  function group(label, fn) {
    console.groupCollapsed('[ripple] ', label)
    fn()
    console.groupEnd('[ripple] ', label)
  }

  function call(d, i, a) {
    (d.once ? a.splice(i, 1)[0].fn : d.fn)()
  }

  function listeners(name) {
    var r = resources[name]
    return (r && r.body && r.body.on && r.body.on.response) || []
  }

  function versions(name) {
    return (resources[name] && resources[name].versions) || []
  }

  socket.on('response', register)

  function register(res) { 
    log('registering', res.name)
    res.headers  = res.headers || { 'content-type': 'application/data' }
    res.body     = res.body || []
    var rollback = res.headers.hasOwnProperty('version')
    intepret(res)   
    
    isJS(res) 
      && (res.body = fn(res.body))

    if (isData(res)){
      res.versions = res.versions || versions(res.name)
      !rollback && res.versions.push(m(res.body))
      watch(res)
    }

    resources[res.name] = res 
    localStorage.ripple = freeze(resources) 

    isJS(res)   && registerElement(res)
    isData(res) && activateData(res.name)
    isCSS(res)  && activateCSS(res.name)
    isHTML(res) && activateHTML(res.name)
    
    listeners(res.name).map(call)
    isData(res) && !rollback && history()

    return res.body
  }

  function watch(res) {
    var opts = { type: 'response', listeners: listeners(res.name) }
    
    !res.observer 
     && Array.observe(
          res.body = emitterify(res.body, opts)
        , res.observer = meta(res.name)
        )

    isObject(last(res.body))
     && res.body.forEach(observe)

    function observe(d) {
      if (d.observer) return;
      var fn = ometa(res.name)
      def(d, 'observer', fn)
      Object.observe(d, fn)
    }
  }

  // short-circuit shortcut for two-level observation
  function ometa(name) {
    return function(changes) {
      changes.forEach(function(change){
        if (!change.type == 'update') return;
        var i = ripple(name).indexOf(change.object)
        ripple(name)[i] = clone(change.object)
      })
    }
  }

  function meta(name) {
    log('watching', name)
    return function (changes) {
      log('observed changes in', name, changes)
      watch(resources[name])
      changes.forEach(process(name))
      activateData(name)
    }
  }

  function emitterify(body, opts) {
    return def(body, 'on', on)
         , def(body, 'once', once)
         , opts && (body.on[opts.type] = opts.listeners)
         , body

    function on(type, callback, opts) {
      opts = opts || {}
      opts.fn = callback
      this.on[type] = this.on[type] || []
      this.on[type].push(opts)
      return this
    }

    function once(type, callback){
      this.on.call(this, type, callback, { once: true })
      return this
    }
  }

  function process(name) {
    return function(change) {
      var type    = change.type
        , removed = type == 'delete' ? change.oldValue : change.removed && change.removed[0]
        , data    = change.object
        , key     = change.name || change.index
        , value   = data[key]
        , details = {
            name  : name
          , key   : key
          , value : removed || value 
          , type  : type == 'update'             ? 'update'
                  : type == 'delete'             ? 'remove'
                  : type == 'splice' &&  removed ? 'remove'
                  : type == 'splice' && !removed ? 'push'  
                  : type == 'add'                ? 'push'  
                  : false
          }

      socket.emit('change', record(details))
    }

  }

  function record(details) {
    var resource = resources[details.name]
      , versions = resource.versions
      , previous = last(versions)
      , type     = details.type
      , key      = details.key
      , value    = details.value
      , latest   = type == 'update' ? previous.set(key, value)
                 : type == 'push'   ? previous.set(key, value)
                 : type == 'remove' ? previous.remove(key, value)
                 : false 

    versions.push(latest), history()
    return details
  }

  function history() {
    resources
      .versions
      .push(
        values(resources)
          .filter(header('content-type', 'application/data'))
          .map(index)
      )
    
    function index(r) {
      delete r.headers.version
      return { name: r.name, index: r.versions.length-1 }
    }
  }

  function travel(time) {
    if (time < 0 || time > (resources.versions.length-1))
      return console.error(time, 'time does not exist')

    resources
      .versions
      [time]
      .forEach(rollback)

    ripple()
  }

  function isJS(res){
    return res.headers['content-type'] == 'application/javascript'
    // return isString(resource.body) 
    //     && !resource.body.indexOf('function')
  }

  function isData(res){
    return res.headers['content-type'] == 'application/data'
    // return isObject(resource.body)
  }

  function isHTML(res){
    return res.headers['content-type'] == 'text/html'
    // return isString(resource.body)
  }

  function isCSS(res){
    return res.headers['content-type'] == 'text/css'
    // return isString(resource.body)
    //     && resource.name.contains('.css')
  }
}()

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function all(selector){
  return array(document.querySelectorAll(selector))
}

function array(d){
  return Array.prototype.slice.call(d, 0)
}

function fn(resource){
  return isFunction(resource) 
      ? resource
      : (new Function("return " + resource))()
}

function matches(k, v){
  return function(d){
    return d[k] && v && d[k].toLowerCase && v.toLowerCase 
      ? d[k].toLowerCase() === v.toLowerCase()
      : d[k] == v
  }
}

function by(){
  return matches.apply(this, arguments)
}

function exists(v){
  return function(d){
    return d == v
  }
}

function match(){
  return exists.apply(this, arguments)
}

function isString(d) {
  return typeof d == 'string'
}

function isNumber(d) {
  return typeof d == 'number'
}

function isObject(d) {
  return typeof d == 'object'
}

function isFunction(d) {
  return typeof d == 'function'
}

function isArray(d) {
  return d instanceof Array
}

function values(o) {
  return !o ? [] : Object
    .keys(o)
    .map(base(o))
}

function base(o) {
  return function(k){
    return o[k]
  }
}

function key(k) {
  return function(o){
    return o[k]
  }
}

function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}

function freeze(r){
  // TODO: This is slow for 100k+. Batch freeze calls.
  var stripped = clone(r)
  delete stripped.versions

  values(r)
    .filter(header('content-type'))
    .map(function(res){ delete stripped[res.name].versions; return res })
    .filter(header('content-type', 'application/javascript'))
    .map(function(res){ return stripped[res.name].body = res.body.toString() })

  return str(stripped)
}

function str(d){
  return JSON.stringify(d)
}

function parse(d){
  return d && JSON.parse(d)
}

function attr(d, name, value) {
  d = d.node ? d.node() : d
  // value && name == 'value' && (d.value = value)

  return arguments.length > 2 ? d.setAttribute(name, value)
       : d.attributes.getNamedItem(name)
      && d.attributes.getNamedItem(name).value
}

function clone(d) {
  return !isFunction(d) 
       ? parse(str(d))
       : d
}

function remove(k, v) {
  return function(d, i, a) {
      !k && !v ? (d)         && a.splice(i,1)
    :       !v ? (d == k)    && a.splice(i,1)
    :            (d[k] == v) && a.splice(i,1)
  }
}

function last(d) {
  return d[d.length-1]
}

function l(d){
  return d.toLowerCase()
}

function m(d) {
  return isArray(d) ? Immutable.List(d)
       : isObject(d) ? Immutable.Map(d)
       : console.error(d, 'is not an array or object')
}

function applycss(d, css) {
  if (!css) return false
  var style = d.querySelector('style') || document.createElement('style')
  style.innerHTML = css
  d.insertBefore(style, d.firstChild)
  return true
}

function applyhtml(d, html) {
  if (!html) return false
  var div = document.createElement('div')
  div.innerHTML = html
  d.innerHTML = div.firstChild.innerHTML
  return true
}

function isNull(d) {
  return d === null
}

function inherit(len) {
  return function(d) {
    return new Array((len||1)+1).join('0').split('').map(identity(d))
  }
}

function self(d) {
  return d
}

function identity(d) {
  return function(){
    return d
  }
}

function index(d, i) {
  return i
}

function shift(d) {
  return Array.prototype.shift.apply(d)
} 

function slice(d) {
  return Array.prototype.slice.apply(d, (shift(arguments), arguments))
} 

function pop(d) {
  return Array.prototype.pop.apply(d)
} 

function noop(){
}

function sel(){
  return d3.select.apply(this, arguments)
}

function datum(node){
  return d3.select(node).datum()
}

function def(o, p, v){
  Object.defineProperty(o, p, { value: v })
}

function unique(key){
  var matched = {}
  return function(d){
    return matched[d[key]]
      ? false
      : matched[d[key]] = true
  }
}

function header(header, value) {
  return function(d){
    return !d['headers']         ? false
         : !d['headers'][header] ? false
         : !value                ? d['headers'][header]
                                 : d['headers'][header] == value
  }
}

function prepend(v) {
  return function(d){
    return v+d
  }
}

function once(g, selector, data, before, key) {
  var g       = g.node ? g : d3.select(g)
    , type    = selector.split('.')[0]
    , classed = selector.split('.').slice(1).join(' ')

  var el = g
    .selectAll(selector)
    .data(data || [0], key)

  el.out = el.exit()
    .remove() 

  el.in = el.enter()
    .insert('xhtml:'+type, before)
    .classed(classed, 1)

  return el
}