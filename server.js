var resources = {}
  , fs = require('fs')
  , q = require('q')
  , io
  , log = console.log.bind(console, '[ripple]')
  , onHeaders = require('on-headers')
  , apn = require('apn')
  , con

// ----------------------------------------------------------------------------
// APNS
// ----------------------------------------------------------------------------
var options = { }
var apnConnection = new apn.Connection(options)

module.exports = createRipple

function createRipple(server, app, noClient) {
  log('creating')
  if (!noClient) app.use(append)
  app.use('/ripple', client)
  io = require('socket.io')(server)
  io.on('connection', connected)
  return ripple
}

function ripple(name){ 
  if (!resources[name]) return console.error('[ripple] No such "'+name+'" resource exists'), []
  return resources[name].body
}

ripple._resources = function(){
  return resources
}

ripple._drop = function(){
  resources = {}
}

ripple._flush = function(name){
  Object.deliverChangeRecords(resources[name].observer)
}

ripple.db = function(config){
  con = require('mysql').createPool(config)
  // con.query('show tables', function(err, rows, fields) {
  //   rows.map(value)
  // })
  return ripple 
}

ripple.resource = function(name, body, headers){
  isData(headers, name) && store.apply(this, arguments)
  isHTML(headers, name) && html.apply(this, arguments)
  isJS  (headers, name) && js.apply(this, arguments)
  return ripple
}

function table(name) {
  return resources[name]['headers']['content-location']
}

function sqlc(name, body) {
  var template = 'INSERT INTO {table} ({keys}) VALUES ({values});'
  template = template.replace('{table}', name)
  template = template.replace('{keys}', Object.keys(body).filter(noId).join(','))
  template = template.replace('{values}', Object.keys(body).filter(noId).map(value(body)).join(','))
  log(template)
  return template
}

function sqlu(name, body) {
  var template = 'UPDATE {table} SET {kvpairs} WHERE id = {id};'
  template = template.replace('{table}', name)
  template = template.replace('{id}', body['id'])
  template = template.replace('{kvpairs}', Object.keys(body).filter(noId).map(kvpair(body)).join(','))
  log(template)
  return template
}

function sqld(name, body) {
  var template = 'DELETE FROM {table} WHERE id = {id};'
  template = template.replace('{table}', name)
  template = template.replace('{id}', body['id'])
  log(template)
  return template
}

function noId(key) {
  return key !== 'id'
}

function value(arr) {
  return function(key){
    return con.escape(arr[key])
  }
}

function kvpair(arr) {
  return function(key){
    return key+'='+con.escape(arr[key])
  }
}

function js(name, fn, headers){
  var headers = headers || { 'content-type': 'application/javascript' }

  resources[name] = { 
    name: name
  , body: '' + Object.observe(fn, meta(name))
  , headers: headers 
  }
  
  return ripple
}

function html(name, html, headers){
  var headers = headers || { 'content-type': 'text/html' }

  resources[name] = { 
    name: name
  , body: Object.observe([html], meta(name))[0]
  , headers: headers 
  }
  
  return ripple
}

function store(name, body, headers) {
  var headers = headers || {}
    , headers = { 
        'content-type': 'application/data'
      , 'content-location': headers['table'] || name.split('.')[0] 
      , 'private': headers['private']
      , 'proxy-to': headers['to']
      , 'proxy-from': headers['from']
      }
    , table = headers['content-location']

  log('getting', table)
  con && (!body || (isArray(body) && !body.length))
  ? con.query('select * from ' + table, function(e, rows) {
      if (e) return log('ERROR', table, e)
      log('got', table, rows.length)
      register(rows)
    })
  : register(body)

  function register(rows) {
    var observer
    resources[name] = { 
      name: name
    , body: Array.observe(emitterify(rows), observer = meta(name))
    , headers: headers
    , observer: observer
    }
  }

  return ripple
}

ripple.draw = function() {
  return draw(io), ripple
}

function draw(socket) {
  Object 
    .keys(resources)
    .filter(notPrivate)
    .map(emit(socket))
  socket.emit('draw')
}

function connected(socket){
  
  draw(socket)

  socket.on('request', request)
  socket.on('remove' , remove)
  socket.on('update' , update)
  socket.on('push'   , push)

  function request(req){
    log('request', req)
    return !resources[req.name] || resources[req.name].headers.private
      ? log('private or no resource for', req)
      : emit(socket)(req.name)
      , socket.emit('draw')
  }

  function push(req) {
    log('client push', req)

    var name  = req.name
      , key   = req.key
      , value = req.value
      , fn    = resources[name].headers['proxy-from']

    fn 
      ? fn(key, value, resources[name].body, socket.request, 'push')
      : isArray(resources[name].body)
      ? resources[name].body.splice(key, 0, value) 
      : resources[name].body[key] = value
  }

  function remove(req) {
    log('client remove', req)

    var name  = req.name
      , key   = req.key
      , value = req.value
      , fn    = resources[name].headers['proxy-from']

    fn 
      ? fn(key, value, resources[name].body, socket.request, 'remove')
      : isArray(resources[name].body)
      ? resources[name].body.splice(key, 1) 
      : delete resources[name].body[key]
  }

  function update(req) {
    log('client update', req)

    var name  = req.name
      , key   = req.key
      , value = req.value
      , fn    = resources[name].headers['proxy-from']

    fn 
      ? fn(key, value, resources[name].body, socket.request, 'update')
      : resources[name].body[key] = value
  }
}

function emit(socket) {
  return function (name) {
    var r = resources[name]
    return !r || r.headers.private
      ? log('private or no resource for', name)
      : logSending(name)
      , socket.emit('response', to(r), type(r) )
  }
}

function type(r) {
  return r.headers['content-type']
}

function to(resource){
  var fn = resource.headers['proxy-to'] || identity
  return { name: resource.name, body: fn(resource.body) }
}

function logSending(name) {
  log('sending', name)
  return name
}

function notPrivate(name) {
  return !resources[name].headers.private
}

function meta(name) {
  return function (changes) {
    log('observed changes in', name)
    changes.forEach(process(name))
  }
}

function process(name) {
  return function(change){
    var type = change.type
      , removed = change.removed && change.removed[0]
      , data = change.object
      , key = change.name || change.index
      , value = data[key]

    return !isArray(data)               ? crud(name)
         : type == 'update'             ? crud(name, value  , 'update')
         : type == 'splice' &&  removed ? crud(name, removed, 'remove')
         : type == 'splice' && !removed ? crud(name, value  , 'push')
         : false
  }
}

function crud(name, data, type) {
  log('crud', name, type || '[none]')

  var d = q.defer()
    , t = table(name)
    , f = type == 'update' ? sqlu
        : type == 'remove' ? sqld
        : type == 'push'   ? sqlc
        : false
    , s = f && f(t, data)
    , r = response(name)

  con && s
  ? con.query(s, function(err, rows, fields) {
      if (err) return log(type, name, 'failed', err)
      log(type, name, 'done')
      
      emit(io)(name)
      io.emit('draw')
      r(rows.insertId || [name, type, 'done'].join(' '))
    })
  : emit(io)(name), io.emit('draw')
}

function response(name){
  return resources[name].body.on && resources[name].body.on.response
}

function emitterify(body) {
  return body.on = on, body
}

function on(type, callback) {
  log('registering callback', type)
  this.on[type] = callback
  return this
}

function append(req, res, next){
  var end = res.end

  onHeaders(res, function () {
    this.removeHeader('Content-Length')
  })

  res.end = function() {
    if (acceptsHTML(this.req)) {
      res.write('<script src="/socket.io/socket.io.js" defer></script>')
      res.write('<script src="/ripple" defer></script>')      
    }
    
    end.apply(this, arguments)
  }

  next()
}

function acceptsHTML(req){
  return req.headers.accept && !!~req.headers.accept.indexOf('html')
}

function isData(headers, name){
  return headers && (headers['content-type'] == 'application/data') 
    || name.contains('.data')
}

function isJS(headers, name){
  return (typeof headers !== 'undefined') 
    && headers['content-type'] == 'application/javascript'
    || name.contains('.js')
}

function isHTML(headers, name){
  return (typeof headers !== 'undefined') 
    && headers['content-type'] == 'text/html'
    || name.contains('.html')
}

function client(req, res){
  res.sendfile(__dirname + '/client.js')
}

function id(req) {
  return req.name + '.' + compress(req.headers['content-type'])
  // return type 
  //   ? name + '.' + type
  //   : name.headers 
  //   ? name.headers['name'] + '.' + name.headers['content-type']
  //   : name['name'] + '.' + name['content-type']
}

function compress(type) {
  return type == 'application/javascript'
    ? 'js'
    : type == 'application/data' 
    ? 'data'
    : 'html'
}


// function value(d){ 
//   return d[Object.keys(d)[0]]
// }

function log(d){
  log(d)
}

function objectify(rows) {
  var o = {}
  return rows.forEach(function(d){ o[d.id] = d }), o
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

function isArray(d) {
  return d instanceof Array
}

function identity(d){ return d }