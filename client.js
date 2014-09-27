var resources = {}
  , socket = io()

ripple.activateAll = activateAll

function ripple(name){
  return emitterify(resources[name].body)
}

function emitterify(body) {
  return body.on = on, body
}

function on(type, callback) {
  // log('registering callback', type)
  this.on[type] = callback
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
  console.log('fetch', name)
  socket.emit('request', { name: name })
}

socket.on('response', function(res) {
  var r = response(res.name)
  isFunction(res.body) && (res.body = fn(res.body))
  isObject(res.body) 
    && (res.body.on = on, res.body.on.response = r, true)
    && Array.observe(res.body, meta(res.name))
  resources[res.name] = res
  r && r()
})

socket.on('draw', activateAll)

function response(name) {
  var r = resources[name]
  return r && r.body && r.body.on && r.body.on.response
}

function meta(name) {
  console.log('watching', name)
  return function (changes) {
    resources[name].body = changes[0].object
    console.log('observed changes in', name, changes)
    changes.forEach(process(name))
    activateAll()
  }
}

function process(name) {
  return function(change) {
    var type = change.type
      , body = change.object
      , key  = change.name
      , val  = body[key]
      , details = {
          name: name
        , key : key
        , val : val 
        }

    // type == 'add'    && socket.emit('push'  , [name, body[i]])
    // type == 'delete' && socket.emit('remove', [name, body[i]])
    type == 'update' && socket.emit('update', details)
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

function log(d){
  console.log(d)
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