var io, db, resources = {}, log = console.log.bind(console, '[ripple]')

// ----------------------------------------------------------------------------
// INIT
// ----------------------------------------------------------------------------
module.exports = createRipple

function createRipple(server, app, opts) {
  log('creating')
  if (!server || !app) return ripple;
  var opts = opts || {}

  db = require('./db')()
  io = require('socket.io')(server)
  if (!opts.noClient) app.use(append)
  if (opts.session) io.use(auth(opts.session))
  app.use('/ripple', client)
  app.use('/immutable.min.js', immutable)

  io.on('connection', connected)
  return ripple
}

// ----------------------------------------------------------------------------
// API
// ----------------------------------------------------------------------------
function ripple(name){ 
  return resources[name]
    ? resources[name].body
    : (console.error('[ripple] No such "'+name+'" resource exists'), [])
}

ripple.use = function(d) {
  Object
    .keys(d.resources())
    .map(values(d.resources()))
    .map(middleware)

  return ripple
}

function middleware(res) {
  ripple.resource(res.name, res.body, res.headers)
}

function values(arr) {
  return function(key){
    return arr[key]
  }
}

ripple.resources = function() {
  return resources
}

ripple.db = function(config){
  db = require('./db')(config)
  return ripple 
}

ripple.resource = function(name, body, headers){
    isData.apply(this, arguments) ? store.apply(this, arguments)
  : isCSS.apply(this, arguments)  ? css.apply(this, arguments)
  : isHTML.apply(this, arguments) ? html.apply(this, arguments)
  : isJS.apply(this, arguments)   ? js.apply(this, arguments)
  : ''

  return ripple
}

ripple.emit = emit

function js(name, fn, headers){
  var headers = headers || {}
    , headers = { 
        'content-type': 'application/javascript' 
      , 'extends': headers['extends']
      }

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

function css(name, css, headers){
  var headers = headers || { 'content-type': 'text/css' }

  resources[name] = { 
    name: name
  , body: Object.observe([css], meta(name))[0]
  , headers: headers 
  }
  
  return ripple
}

function store(name, body, headers) {
  var o = name

  typeof name   == 'object'
    && (name    = name.name)
    && (body    = name.body)
    && (headers = name.headers)

  var headers = headers || {}
    , headers = { 
        'content-type': 'application/data'
      , 'content-location': headers['content-location'] || headers['table'] || name
      , 'private': headers['private']
      , 'proxy-to': headers['proxy-to'] || headers['to']
      , 'proxy-from': headers['proxy-from'] || headers['from']
      }
    , table = headers['content-location']

  log('getting', table)
  
  return (~table && (!body || (isArray(body) && !body.length)))
    ? [db.all(table).then(register), o]
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
}

ripple.draw = function() {
  return draw(io), ripple
}

function draw(socket) {
  Object 
    .keys(resources)
    .map(values(resources))
    .filter(not(header('private')))
    .map(key('name'))
    .map(emit(socket))
  socket.emit('draw')
}

function connected(socket){ 
  log('connected', socket.id)
  var types = {
        push: push
      , remove: remove
      , update: update 
      }

  draw(socket)

  socket.on('request', request)
  socket.on('draw'   , draw.bind(null, socket))
  socket.on('change' , change)

  function request(name){
    log('request', name)
    return (!resources[name] || resources[name].headers.private)
      ? log('private or no resource for request', name)
      : emit(socket)(name)
      , socket.emit('draw')
  }

  function change(req) {
    log('client', req.type, req.name, req.key)
    if (!resources[req.name]) return log('no resource', req.name);

    var name  = req.name
      , key   = req.key
      , value = req.value
      , type  = req.type
      , fn    = resources[name].headers['proxy-from']
      , body  = resources[name].body
      , next  = types[req.type]

    if (!fn || fn.call(socket, key, value, body, name, type, next))
      next(key, value, body)
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

    return (!r || r.headers.private)
      ? log('private or no resource for', name)
      : log('sending', name)
      , typeof socket == 'string'
      ? io.of('/').sockets.filter(by('sessionID', socket)).map(sendTo)
      : socket == io
      ? io.of('/').sockets.map(sendTo)
      : sendTo(socket)

    function sendTo(s) {
      return s.emit('response', to(r, s)), s
    }
  }
}

function type(r) {
  return r.headers['content-type']
}

function to(resource, socket){
  var fn = resource.headers['proxy-to'] || identity
    , headers = { 'content-type': resource.headers['content-type'] }
    , extend = resource.headers['extends']
  
  extend && (headers['extends'] = extend)

  return { 
    name: resource.name
  , body: fn.call(socket, resource.body) 
  , headers: headers
  }
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

    Object
      .keys(resources)
      .map(values(resources))
      .filter(header('content-location', t))
      .filter(not(by('name', name)))
      .map(store)
      .map(async(key('name')))
      .map(then(emit(io)))
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
      res.write('<script src="/immutable.min.js" defer></script>')
      res.write('<script src="/socket.io/socket.io.js" defer></script>')
      res.write('<script src="/ripple" defer></script>')
    }
    
    end.apply(this, arguments)
  }

  next()
}

function auth(config) {
  return function(socket, next){
    var req = {
      "headers": {
        "cookie": socket.request.headers.cookie,
      },
    }

    require('cookie-parser')(config.secret)(req, null, function() {})
    var name = config.key
    socket.sessionID = req.signedCookies[name] || req.cookies[name]
    next()
  }
}
// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function acceptsHTML(req){
  return req.headers.accept && !!~req.headers.accept.indexOf('html')
}

function isData(name, body, headers){
  return (headers && (headers['content-type'] == 'application/data') )
      || (typeof body == 'object')
}

function isJS(name, body, headers){
  return (headers && headers['content-type'] == 'application/javascript')
      || (typeof body == 'function')
}

function isCSS(name, body, headers){
  return headers && headers['content-type'] == 'text/css'
      || (typeof body == 'string' && name.contains('.css'))
}

function isHTML(name, body, headers){
  return headers && headers['content-type'] == 'text/html'
      || (typeof body == 'string')
}

function client(req, res){
  res.sendFile(__dirname + '/client.js')
}

function immutable(req, res){
  res.sendFile(__dirname + '/node_modules/immutable/dist/immutable.min.js')
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

function by(k, v){
  return function(d){
    return !d[k] || !v ? false 
      : d[k].toLowerCase && v.toLowerCase ? (d[k].toLowerCase() == v.toLowerCase())
      : d[k] == v
  }
}

function async(fn){
  return function(o){
    return [o[0], fn(o[1])]
  }
}

function key(key) {
  return function(o){
    return o[key]
  }
}

function then(fn){
  return function(o){
    return o[0].then(fn.bind(null, o[1])), o[1]
  }
}

function header(header, value) {
  return function(d){
    return !value 
      ? d['headers'][header]
      : d['headers'][header] == value
  }
}

function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
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

function array(){
  return []
}

global.isObject = isObject
global.isString = isString
global.parse = JSON.parse
global.str = JSON.stringify
global.promise = promise
global.by = by
global.array = array