var io, db, resources = {}

// ----------------------------------------------------------------------------
// INIT
// ----------------------------------------------------------------------------
module.exports = createRipple

function createRipple(server, app, opts) {
  log('creating')
  var opts = opts || {}
    , socketSession = require("socket.io-session-middleware")

  io = require('socket.io')(server)
  if (!opts.noClient) app.use(append)
  if (opts.session) io.use(socketSession(opts.session))
  app.use('/ripple', client)

  io.on('connection', connected)
  return ripple
}

// ----------------------------------------------------------------------------
// API
// ----------------------------------------------------------------------------
function ripple(name){ 
  if (!resources[name]) return console.error('[ripple] No such "'+name+'" resource exists'), []
  return resources[name].body
}

ripple.db = function(config){
  db = require('./db')(config)
  return ripple 
}

ripple.resource = function(name, body, headers){
  isData(headers, name) && store.apply(this, arguments)
  isHTML(headers, name) && html.apply(this, arguments)
  isJS  (headers, name) && js.apply(this, arguments)
  return ripple
}

ripple.emit = emit

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
  
  ;(!body || (isArray(body) && !body.length))
    ? db.all(table).then(register)
    : register(body)

  function register(rows) {
    var observer
      , opts = { type: 'response', listeners: [] }

    resources[name] = { 
      name: name
    , body: Array.observe(emitterify(rows, opts), observer = meta(name))
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
  socket.on('remove' , handle(remove))
  socket.on('update' , handle(update))
  socket.on('push'   , handle(push))

  function request(req){
    log('request', req)
    return !resources[req.name] || resources[req.name].headers.private
      ? log('private or no resource for', req)
      : emit(socket)(req.name)
      , socket.emit('draw')
  }

  function handle(next) {
    return function(req) {
      log('client', next.name, req.name, req.key)

      var name  = req.name
        , key   = req.key
        , value = req.value
        , fn    = resources[name].headers['proxy-from']
        , body  = resources[name].body
        , type  = next.name

      if (!fn || fn(key, value, body, name, type, socket))
        next(key, value, body)
    }
  }

  function push(key, value, body) {
    isArray(body)
      ? body.splice(key, 0, value) 
      : body[key] = value
  }

  function remove(key, value, body) {
    isArray(body)
      ? body.splice(key, 1) 
      : delete body[key]
  }

  function update(key, value, body) {
    body[key] = value
  }
}

function emit(socket) {
  return function (name) {
    var r = resources[name]
    return !r || r.headers.private
      ? log('private or no resource for', name)
      : logSending(name)
      , socket == io
      ? io.of('/').sockets.forEach(sendTo)
      : sendTo(socket)

    function sendTo(s) {
      s.emit('response', to(r, s), type(r) )
    }
  }
}

function type(r) {
  return r.headers['content-type']
}

function to(resource, socket){
  var fn = resource.headers['proxy-to'] || identity
  return { name: resource.name, body: fn(resource.body, socket) }
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
         : type == 'add'                ? crud(name, value  , 'push')
         : false
  }
}

function crud(name, data, type) {
  log('crud', name, type = type || 'noop')

  var t = table(name)
    , f = type && db[type]
    , r = response(name)

  f(t, data).then(function(id){
    emit(io)(name)
    r.map(call(id))    
  })
}

function call(param) {
  return function (d,i,a) {
    (d.once ? a.splice(i, 1).pop().fn : d.fn)(param)
  }
}


function response(name) {
  var r = resources[name]
  return (r && r.body && r.body.on && r.body.on.response) || []
}

function emitterify(body, opts) {
  return body.on = on
       , body.once = once
       , opts && (body.on[opts.type] = opts.listeners)
       , body

  function on(type, callback, opts) {
    log('registering callback', type)
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

function append(req, res, next){
  var end = res.end

  require('on-headers')(res, function () {
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

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
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
}

function compress(type) {
  return type == 'application/javascript'
    ? 'js'
    : type == 'application/data' 
    ? 'data'
    : 'html'
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

function table(name) {
  return resources[name]['headers']['content-location']
}

function promise() {
  var resolve
    , reject
    , p = new Promise(function(res, rej){ 
        resolve = res, reject = rej
      })

  arguments.length && resolve(arguments[0])
  p.resolve = resolve
  p.reject  = reject
  return p
}

global.log = console.log.bind(console, '[ripple]')
global.promise = promise
global.isObject = isObject
