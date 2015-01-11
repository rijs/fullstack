!function(){ 
  var resources = {}
    , socket    = io()
    , log       = Function() // console.log.bind(console, '[ripple]')
  
  window.ripple = ripple  

  function ripple(thing){
    return !arguments.length               ? activateAll()
     : this.tagName                        ? invoke(this)
     : thing.tagName                       ? invoke(thing)
     : thing[0] instanceof MutationRecord  ? invoke(thing[0].target.parentNode)
     : isString(thing) && resources[thing] ? resources[thing].body
     : (log('[ripple] No such "'+thing+'" resource exists'), [])
  }

  function emitterify(body, opts) {
    return body.on = on
         , body.once = once
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

  function activateAll(){
    all(':unresolved')
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
      , data = resources[data] && resources[data].body
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

  socket.on('response', register)

  function register(res) { 
    var listeners = response(res.name) || []
      , opts = { type: 'response', listeners: listeners }

    isJS(res) && (res.body = fn(res.body))
    isData(res) && Array.observe(emitterify(res.body, opts), meta(res.name))

    resources[res.name] = res 
    localStorage.ripple = freeze(resources)
    
    isJS(res)   && registerElement(res)
    isData(res) && activateData(res.name)
    isCSS(res)  && activateCSS(res.name)
    isHTML(res) && activateHTML(res.name)
    
    listeners.map(call)
  }

  // socket.on('draw', activateAll)
  var offline = parse(localStorage.ripple)

  values(offline)
    .forEach(register)

  // activateAll()

  function call(d, i, a) {
    (d.once ? a.splice(i, 1)[0].fn : d.fn)()
  }

  function response(name) {
    var r = resources[name]
    return (r && r.body && r.body.on && r.body.on.response) || []
  }

  function meta(name) {
    log('watching', name)
    return function (changes) {
      resources[name].body = changes[0].object
      log('observed changes in', name)
      changes.forEach(process(name))
      // activateAll()
    }
  }

  function process(name) {
    return function(change) {
      var type = change.type
        , removed = type == 'delete' ? change.oldValue : change.removed && change.removed[0]
        , data = change.object
        , key  = change.name || change.index
        , value = data[key]
        , details = {
            name : name
          , key  : key
          , value: removed || value 
          }

      return type == 'update'             ? socket.emit('update', details)
           : type == 'delete'             ? socket.emit('remove', details)
           : type == 'splice' &&  removed ? socket.emit('remove', details)
           : type == 'splice' && !removed ? socket.emit('push'  , details)
           : type == 'add'                ? socket.emit('push'  , details)
           : false
    }
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
  return (new Function("return " + resource))()
}

function matches(k, v){
  return function(d){
    return d[k].toLowerCase && v.toLowerCase
      ? d[k].toLowerCase() == v.toLowerCase()
      : d[k] == v
  }
}

function exists(v){
  return function(d){
    return d == v
  }
}

function isString(d) {
  return typeof d == 'string'
}

function isObject(d) {
  return typeof d == 'object'
}

function isFunction(d) {
  return typeof d == 'function'
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

function freeze(r){
  var stripped = parse(str(r))

  Object.keys(r)
    .map(function(name){ return r[name] })
    .filter(function(res){ return isFunction(res.body) })
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
  return JSON.parse(JSON.stringify(d))
}

function remove(k, v) {
  return function(d, i, a) {
    (d[k] == v) && a.splice(i,1)
  }
}

function last(d) {
  return d[d.length-1]
}

function l(d){
  return d.toLowerCase()
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

function inherit(d) {
  return [d]
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

function once(g, type, data, before) {
  var el = g
    .selectAll(type)
    .data(data || [0])

  el.out = el.exit()
    .remove() 

  el.in = el.enter()
    .insert('xhtml:'+type, before)

  return el
}