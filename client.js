var resources = {}
  , socket = io()
  , log = console.log.bind(console, '[ripple]')
  
ripple.activateAll = activateAll

function ripple(name){
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
  }

  function once(type, callback){
    this.on.call(this, type, callback, { once: true })
  }
}

function activateAll(){
  // console.log('activateAll')
  all('[ripple]')
    .map(bind)
    .map(invoke)
    // .map(log)
}

// function activate(name) {
//   console.log('activate', name)
//   all('[data-resource='+name+']')
//     .map(bind)
//     .map(invoke)
//     .map(log)
// }

ripple._resources = function(){
  return resources
}

function invoke(d){ 
  try {
    d.__render__ && d.__render__(d.__data__)
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

  idJS && !resources[idJS] && fetch(idJS)
  idDB && !resources[idDB] && fetch(idDB)

  d.__render__ = resources[idJS] && resources[idJS].body
  d.__data__   = resources[idDB] && resources[idDB].body
  
  return d
}

function fetch(name){
  log('fetch', name)
  socket.emit('request', { name: name })
}

socket.on('response', function(res) {
  var listeners = response(res.name) || []
    , opts = { type: 'response', listeners: listeners }

  isFunction(res.body) && (res.body = fn(res.body))
  isObject(res.body) 
    && Array.observe(emitterify(res.body, opts), meta(res.name))

  resources[res.name] = res
  listeners.map(call)
})

socket.on('draw', activateAll)

function call(d, i, a) {
  (d.once ? a.splice(i, 1)[0].fn : d.fn)()
}

function response(name) {
  var r = resources[name]
  return r && r.body && r.body.on && r.body.on.response
}

function meta(name) {
  log('watching', name)
  return function (changes) {
    resources[name].body = changes[0].object
    log('observed changes in', name, changes)
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

function isJS(headers){
  return headers && headers['content-type'] == 'application/javascript'
}

function isData(headers){
  return headers && headers['content-type'] == 'application/data'
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

function attr(d, name) {
  return d.attributes.getNamedItem(name)
      && d.attributes.getNamedItem(name).value
}

function matches(k, v){
  return function(d){
    return d[k].toLowerCase && v.toLowerCase
      ? d[k].toLowerCase() == v.toLowerCase()
      : d[k] == v
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