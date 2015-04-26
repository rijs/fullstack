// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
export function all(selector, doc = document){
  return toArray(doc.querySelectorAll(selector))
}

export function raw(selector, context){
  return (context ? context : document).querySelector(selector)
}

export function falsy(){
  return false
}

export function toArray(d){
  return Array.prototype.slice.call(d, 0)
}

export function fn(resource){
  return isFunction(resource) 
      ? resource
      : (new Function("return " + resource))()
}

export function matches(k, v){
  return function(d){
    return deeply(d, k) && v && deeply(d, k).toLowerCase && v.toLowerCase 
      ? deeply(d, k).toLowerCase() === v.toLowerCase()
      : deeply(d, k) == v
  }
}

export function deeply(d, key, value){ 
  var keys = key.split('.')
    , set  = arguments.length > 2

  return keys.length > 1 
       ? (set ? deeply(d[keys.shift()], keys.join('.'), value) 
              : deeply(d[keys.shift()], keys.join('.')))
       : (set ? (d[key] = value)
              :  d[key])
}

// export function by(k, v){
//   return function(d){
//     return !d[k] || !v ? false 
//       : d[k].toLowerCase && v.toLowerCase ? (d[k].toLowerCase() == v.toLowerCase())
//       : d[k] == v
//   }
// }

export var by = matches

export function exists(v){
  return function(d){
    return d == v
  }
}

export var match = exists

export function isString(d) {
  return typeof d == 'string'
}

export function isNumber(d) {
  return typeof d == 'number'
}

export function isObject(d) {
  return typeof d == 'object'
}

export function isFunction(d) {
  return typeof d == 'function'
}

export function isFalsy(d) {
  return !!d == false
}

export function isTruthy(d) {
  return !!d == true
}

export function isArray(d) {
  return d instanceof Array
}

export function values(o) {
  return !o ? [] : Object
    .keys(o)
    .map(base(o))
}

export function spread(...keys) {
  return function(o){
    return Object
      .keys(o)
      .filter(isIn(keys))
      .map(base(o))
  }
}

export function mask(...keys) {
  return function(o){
    var masked = {}
    keys.forEach(key => masked[key] = o[key])
    return masked
  }
}

export function isIn(set) {
  return function(d){
    return set.some(match(d))
  }
}

export function isDef(d) {
  return typeof d !== 'undefined'
}

export function gt(k, v){
  return function(d){
    return d[k] > v
  }
}

export function async(fn){
  return function(o){
    return [o[0], fn(o[1])]
  }
}

export function base(o) {
  return function(k){
    return o[k]
  }
}

export function key(k) {
  return function(o){
    return deeply(o, k)
  }
}

export function not(fn){
  return function(){
    return !fn.apply(this, arguments)
  }
}

export function freeze(r){
  var stripped = clone(r)
  delete stripped.versions
  delete stripped.length
  delete stripped.time

  values(r)
    .filter(header('content-type'))
    .map(function(res){ delete stripped[res.name].versions; return res })
    .filter(header('content-type', 'application/javascript'))
    .map(function(res){ return stripped[res.name].body = res.body.toString() })

  return str(stripped)
}

export function str(d){
  return isNumber(d) 
       ? String(d)
       : JSON.stringify(d)
}

export function parse(d){
  return d && JSON.parse(d)
}

export function attr(d, name, value) {
  d = d.node ? d.node() : d
  if (isString(d)) return function(){ return attr(this, d) }

  return arguments.length > 2 ? d.setAttribute(name, value)
       : d.attributes.getNamedItem(name)
      && d.attributes.getNamedItem(name).value
}

export function clone(d) {
  return !isFunction(d) 
       ? parse(str(d))
       : d
}

export function remove(k, v) {
  return function(d, i, a) {
      !k && !v ? (d)         && a.splice(i,1)
    :       !v ? (d == k)    && a.splice(i,1)
    :            (d[k] == v) && a.splice(i,1)
  }
}

export function last(d) {
  return d[d.length-1]
}

export function l(d){
  return d.toLowerCase()
}

export function immmutable(d) {
  return isArray(d) ? Immutable.List(d)
       : isObject(d) ? Immutable.Map(d)
       : err(d, 'is not an array or object')
}

export function applycss(d, css) {
  if (!css) return false
  var style = d.querySelector('style') || document.createElement('style')
  style.innerHTML = css
  d.insertBefore(style, d.firstChild)
  return true
}

export function applyhtml(d, html) {
  if (!html) return false
  var div = document.createElement('div')
  div.innerHTML = html
  d.innerHTML = div.firstChild.innerHTML
  return true
}

export function isNull(d) {
  return d === null
}

export function inherit(len) {
  return function(d) {
    return new Array((len||1)+1).join('0').split('').map(curry(identity, d))
  }
}

export function first(d) {
  return d[0]
}

export function identity(d) {
  return d
}

export function table(resource){
  return resource['headers']['content-location']
}

export function curry(fn, d) {
  return function(){
    return fn(d)
  }  
}

export function index(d, i) {
  return i
}

export function shift(d) {
  return Array.prototype.shift.apply(d)
} 

export function slice(d) {
  return Array.prototype.slice.apply(d, (shift(arguments), arguments))
} 

export function pop(d) {
  return Array.prototype.pop.apply(d)
} 

export function noop(){
}

export function sel(){
  return d3.select.apply(this, arguments)
}

export function datum(node){
  return d3.select(node).datum()
}

export function def(o, p, v, w){
  !has(o, p) && Object.defineProperty(o, p, { value: v, writable: w })
  return o[p]
}

export function then(fn){
  return function(o){
    return o[0].then(fn.bind(null, o[1])), o[1]
  }
}

promise.sync = promiseSync
promise.null = promiseNull
promise.noop = promiseNoop
promise.second = promiseSecond

export function promise() {
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

export function promiseSecond(table, body){
  return promise(body)
}

export function promiseSync(arg){
  return function() {
    var a = arguments
      , o = { then(cb){ cb(a[arg]); return o } }
    return o
  }
}

export function promiseNoop(){
  return promise()
}

export function promiseNull(){
  return promise(null)
}

export function objectify(rows, by='name') {
  var o = {}
  return rows.forEach(d => o[d[by]] = d), o
}

export function arrayify(o, by='name') {
  return keys(o)
    .map(k => { 
      var t = { value: o[k] } 
      t[by] = k
      return t
    })
}

export function unique(key){
  var matched = {}
  return function(d){
    return matched[d[key]]
      ? false
      : matched[d[key]] = true
  }
}

export function later(ripple, d) {
  return function(changes){
    ripple.draw(d)
  }
}

export function isRoute(d) {
  return first(d) == '/'
}

export function header(header, value) {
  var getter = arguments.length == 1
  return function(d){
    return !has(d, 'headers')      ? null
         : !has(d.headers, header) ? null
         : getter                  ? d['headers'][header]
                                   : d['headers'][header] == value
  }
}

export function prepend(v) {
  return function(d){
    return v+d
  }
}

export function empty(d) {
  return !d || (isArray(d) && !d.length)
}

export function has(o, k) {
  return o.hasOwnProperty(k)
}

export function transform(key, fn){
  return function(d){
    return deeply(d, key, fn(deeply(d, key))), d
  }
}

export function replace(from, to){
  return function(d){
    return d.replace(from, to)
  }
}

export function split(delimiter){
  return function(d){
    return d.split(delimiter)
  }
}

export function el(selector){
  var attrs = selector.split('[')
        .map(replace(']', ''))
        .map(split('='))
    , css  = attrs.shift().shift().split('.')
    , tag  = css.shift()
    , elem = document.createElement(tag)

  attrs.forEach(d => attr(elem, d[0], d[1]))
  css.forEach(d => elem.classList.add(d))
  elem.toString = () => tag + css.map(prepend('.')).join()

  return elem
}

export function once(g, selector, data, before, key) {
  var g       = g.node ? g : d3.select(g)
    , classed = selector instanceof HTMLElement
                  ? selector.className
                  : selector.split('.').slice(1).join(' ')
    , type    = selector instanceof HTMLElement
                  ? () => selector
                  : selector.split('.')[0] || 'div'
    
  var el = g
    .selectAll(selector.toString())
    .data(data || [0], key)

  el.once = (...args) => once(el, ...args)

  el.out = el.exit()
    .remove() 

  el.in = el.enter()
    .insert(type, before)
    .classed(classed, 1)

  return el
}
  
export function perf(fn) {
  var start = performance.now()
  fn()
  log('perf', performance.now() - start)
}

export function group(label, fn) {
  console.groupCollapsed('[ripple] ', label)
  fn()
  console.groupEnd('[ripple] ', label)
}

export function body(resources, name) {
  return resources[name] && resources[name].body
}

export function array(){
  return []
}

export function isJS(res){
  return header('content-type')(res) == 'application/javascript'
}

export function isData(res){
  return header('content-type')(res) == 'application/data'
}

export function isHTML(res){
  return header('content-type')(res) == 'text/html'
}

export function isCSS(res){
  return header('content-type')(res) == 'text/css'
}

export function isRegistered(res) {
  var extend = header('extends')(res)

  return extend 
    ? document.createElement(extend, res.name).attachedCallback
    : document.createElement(res.name).attachedCallback
}

export function call(param) {
  return function (d,i,a) {
    try {
      (d.once ? a.splice(i, 1).pop().fn : d.fn)(param)
    } catch(e) { err(e) }
  }
}

// enhances resource bodies with on/once for imperative usage
export function emitterify(body, opts) {
  return def(body, 'on', on)
       , def(body, 'once', once)
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

export function indexOf(pattern){
  return function(d){
    return ~d.indexOf(pattern)
  }
}

export function listeners(resources, name) {
  var r = resources[name]
  return (r && r.body && r.body.on && r.body.on.response) || []
}

export function versions(resources, name) {
  return (resources[name] && resources[name].versions) || []
}

export function use(ripple) {
  return function(d){
    values(d._resources())
      .map(cloneBody)
      .map(ripple)

    return ripple
  }

  function cloneBody(d){
    isObject(d.body) && (d.body = clone(d.body))
    return d
  }
}

export function chain(fn, value) {
  return function(){
    fn.apply(this, arguments)
    return value
  }
}

export function sio(opts) {
  return !client   ? require('socket.io')(opts) 
       : window.io ? window.io() 
                   : { on: noop, emit: noop }
}

export function parameterise(route) {
  var name = route.split('/')[1]
  return function(params){
    return { name: name, params: params }
  }
}

export function resourcify(resources, d) {
  var o = {}
    , names = d ? d.split(' ') : []

  return   names.length == 0 ? undefined
       :   names.length == 1 ? body(resources, first(names))
       : ( names.map(d => o[d] = body(resources, d))
         , values(o).some(isFalsy) ? undefined : o 
         )
}

export function interpret(res) {
  // interpret resource type
      isString(res.body) 
  && !header('content-type')(res)
  && (res.headers['content-type'] = 'text/html')
  && ~res.name.indexOf('.css') 
  && (res.headers['content-type'] = 'text/css')

      isFunction(res.body) 
  && !header('content-type')(res)
  && (res.headers['content-type'] = 'application/javascript')

     !header('content-type')(res)
  && (res.headers['content-type'] = 'application/data')
    
  // default empty body
     !res.body
  && (res.body = [])

  // parse function bodies
      isJS(res) 
  && (res.body = fn(res.body))

  // type-specific detail
      isData(res)
  && (res.headers = { 
        'content-type'    : 'application/data'
      , 'content-location': res.headers['content-location'] || res.headers['table'] || res.name
      , 'private'         : res.headers['private']
      , 'proxy-to'        : res.headers['proxy-to'] || res.headers['to']
      , 'proxy-from'      : res.headers['proxy-from'] || res.headers['from']
      , 'version'         : res.headers['version']
      , 'cache-control'   : isNull(res.headers['cache']) ? 'no-store' : res.headers['cache-control'] || res.headers['cache']
      , 'max-versions'    : isNumber(header('max-versions')(res)) ? header('max-versions')(res) : Infinity
      })
  
  // remove any undefined headers
  clean(res.headers)
}

export function clean(o) {
  Object
    .keys(o)
    .forEach(function(k){
      !isDef(key(k)(o)) && delete o[k]
    })
}

export function keys(o) {
  return Object.keys(o)
}

export function globalise(d) {
  owner[d] = exports[d]
}

export function expressify(d) {
  return !client && d && d._events.request || { use: noop }
}

export function fromParent(d){
  return datum(this.parentNode)[d]
}

export function fromObj(o){
  return function(k){
    return o[k]
  }
}

export function datify(format){
  return function(date){
    return (global.moment || global.mo)(date).format(format || iso)
  }
}

export function deidify(name, value){
  return ripple(name)
    .filter(by('id', value))
    .map(key('name'))
    .pop()
}

export function join(left, right){
  return function(d){
    d[left] = ripple(right)
      .filter(by('id', clone(d[left])))
      .pop() || {}

    return d
  }
}

export function colorfill(){
  client && ['red', 'green', 'bold', 'grey'].forEach(color => {
    Object.defineProperty(String.prototype, color, {
      get: function () {
        return this
      }
    })
  })
}

export function file(name){
  return require('fs').readFileSync(name, { encoding:'utf8' })
}

export var is = { 
  str        : isString
, data       : isData
, num        : isNumber
, obj        : isObject
, in         : isIn
, def        : isDef
, func       : isFunction
, registered : isRegistered
, js         : isJS
, css        : isCSS
, html       : isHTML
, arr        : isArray
, route      : isRoute
, null       : isNull
}

export var to = { 
  arr        : toArray
}

export var iso = 'YYYY-MM-DD'

export var client = typeof window != 'undefined'
export var owner = client ? window : global
export var min = client ? typeof debug !== 'undefined' && !debug : process.env.NODE_ENV !== 'debug'

colorfill()
export var log = min ? noop : console.log.bind(console, '[ripple]'.grey)
export var err = min ? noop : console.error.bind(console, '[ripple]'.red)
owner.utils = (...d) => (d.length ? d : keys(exports)).forEach(globalise)