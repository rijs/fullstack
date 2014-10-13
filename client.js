!function(){ 
  var resources = {}
    , socket = io()
    , log = console.log.bind(console, '[ripple]')
  
  window.ripple = ripple  

  function ripple(name){
    if (!resources[name]) return console.error('[ripple] No such "'+name+'" resource exists'), []
    return resources[name].body
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
    console.log('activateAll')
    all('[ripple]')
      .map(bind)
      .map(invoke)
      // .map(log)
  }

  function activate(name) {
    console.log('activate', name)
    all('[data='+strip(name)+']')
      .map(bind)
      .map(invoke)
      // .map(log)
  }

  function strip(d) {
    return d.split('.')[0]
  }

  ripple.activateAll = activateAll

  ripple._resources = function(){
    return resources
  }

  function invoke(d){ 
    try {
          d.__render__ 
      && (d.__data__ || !attr(d, 'data'))
      &&  d.__render__(d.__data__)
    } catch (err) {
      // debugger
      console.error(err)
    }
    return d
  }

  function bind(d){
    var name = d.dataset.resource || d.tagName.toLowerCase()
      , data = attr(d, 'data')
      , idJS = name + '.js'
      , idDB = data ? data + '.data' : ''

    d.__render__ = resources[idJS] && resources[idJS].body
    d.__data__   = resources[idDB] && resources[idDB].body
    return d
  }

  function fetch(name){
    log('fetch', name)
    socket.emit('request', { name: name })
  }

  socket.on('response', function(res, type) {
    var listeners = response(res.name) || []
      , opts = { type: 'response', listeners: listeners }

    isJS(type) && (res.body = fn(res.body))
    isData(type) && Array.observe(emitterify(res.body, opts), meta(res.name))

    resources[res.name] = res 
    isData(type) && activate(res.name)
    listeners.map(call)
  })

  socket.on('draw', activateAll)

  // function replace(name) {
  //   return function(source){
  //     return function(key){
  //       console.log('name', name, key, resources[name][key], source[key])
  //       resources[name].body[key] = source[key]
  //     }
  //   }
  // }

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
      activateAll()
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

  function expand(type) {
    return type == 'js' 
      ? 'application/javascript'
      : type == 'data' 
      ? 'application/data'
      : 'text/html'
  }

  function compress(type) {
    return type == 'application/javascript'
      ? 'js'
      : type == 'application/data' 
      ? 'data'
      : 'html'
  }

  function id(res) {
    return res.name + '.' + res.headers['content-type']
  }

  function isJS(candidate){
    return candidate == 'application/javascript'
  }

  function isData(candidate){
    return candidate == 'application/data'
  }

  function isHTML(candidate){
    return candidate == 'text/html'
  }


  // function type(name) {
  //   return resources[name][0] == '<'
  //     ? 'text/html'
  //     : 'application/javascript'
  // }

  // function isJS(name) {
  //   return type(name) == 'application/javascript'
  // }

  function interpret(resource) {
    return resource[0] == '<'
      ? html(resource)
      : fn(resource)
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

function html(resource){
  return resource
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

function str(d){
  return JSON.stringify(d)
}

function attr(d, name) {
  return d.attributes.getNamedItem(name)
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