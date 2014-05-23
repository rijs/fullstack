var resources = {}
  , store = {}
  , socket = io()

// init
// activate()
setupListeners()

function ripple(name){
  return resources[name]
}

function activateAll(){
  all('[data-resource]')
    .map(bind)
    .map(invoke)
    .map(log)
}

function activate(name) {
  if (!isJS(name)) return;
  all('[data-resource='+name+']')
    .map(bind)
    .map(invoke)
}

ripple._resources = function(){
  return resources
}

ripple._store = function(){
  return store
}

function invoke(d){ 
  d.__render__ && d.__render__()
  return d
}

function bind(d){
  var name = d.dataset.resource
  ;(!resources[name] && !store[name])
    ? fetch(name)
    : (
        d.__render__ = resources[name]
      , d.__data__ = store[name]
      )

  return d
}

function fetch(name){
  socket.emit('request', { name: name })
}

socket.on('response', function(res) {
  // console.log('res', res.name, res.store)
  res.resource && (resources[res.name] = interpret(res.resource))
  res.store    && (store[res.name]     = res.store)
  // activate(res.name)
})

socket.on('draw', activateAll)

function type(name) {
  return resources[name][0] == '<'
    ? 'text/html'
    : 'application/javascript'
}

function isJS(name) {
  return type(name) == 'application/javascript'
}
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

function extract(from){
  var start = from.indexOf('<body') + 6
    , end = from.indexOf('</body')
  
  return from.slice(start, end)
}

function reinsert(){
  console.debug('reinsert', this)
  var script = this.cloneNode()
  this.parentNode.insertBefore(script, this)
}

function remove(){
  this.remove()
}

function outerHTML(d){
  return d.outerHTML.trim()
}

function delegate(selector, fn){
  return function(){
    d3.event.target.webkitMatchesSelector(selector) && fn.call(d3.event.target)
  }
}

// ----------------------------------------------------------------------------
// NAVIGATION 
// ----------------------------------------------------------------------------
function setupListeners(){
  // console.log('registering listeners')

  d3.selectAll('form')
    .on('submit', function(d, i){
      d3.event.preventDefault()
      document.body.classList.add('exit')

      request(this.action)
        .method(this.method)
        .data(new FormData(this))()
    })

  d3.select(document.body)
    .on(
        'click'
      , delegate('a[href]:not([href^=javascript]):not(.bypass)', function() {
          d3.event.preventDefault()
          document.body.classList.add('exit')
          request(this.href)()
        })
      )

  window.addEventListener("popstate", function(event) {
    if (!event.state) return;
    document.body.classList.add('exit')
    replace(event.state.page)
    document.body.classList.remove('exit')
  })
}

function request(url) {
  var method = 'GET'
    , data
    , node
    , url = (new URL(url)).pathname

  call.node = function(_){
    if (!_) return node
    node = _
    return call
  }

  call.method = function(_){
    if (!_) return method
    method = _
    return call
  }

  call.data = function(_){
    if (!_) return data
    data = _
    return call
  }

  return call

  function call() {
    d3.xhr(url)
      .send(method, data)
      .on('load', done)
  }

  function done(r) {
    console.log('loaded ', r.getResponseHeader('location') || url)
    history.replaceState({page: document.body.innerHTML}, "", document.location.pathname);
    history.pushState({page: replace(extract(r.response)) }, "", r.getResponseHeader('location') || url);
    document.body.classList.remove('exit')
  }
}

function replace(using) {
  d3.select(document.body)
      .selectAll('body > *')
      .datum(function(d){ return this.outerHTML })

  var target = document.createElement('body')
  target.innerHTML = using

  var children = Array.prototype.slice.call(target.children).map(outerHTML)
  
  var join = d3.select(document.body)
      .selectAll('body > *')
      .data(children, String)

  join.exit().remove()
  join.enter().append('div').classed('entering', true)
  join.order()
  d3.selectAll('.entering').select(function(d){ this.outerHTML = d })

  d3.select(document.body)
    .selectAll('script')
    .each(reinsert)
    .each(reinsert)
    .each(remove)

// console.log('reactivating all')
  // activateAll()
  setupListeners()
  return using
}