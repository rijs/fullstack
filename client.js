var resources = {}
  , socket = io()

setupListeners()

function ripple(name){
  return resources[name].body
}

function activateAll(){
  // console.log('activateAll')
  all('[ripple]')
    .map(bind)
    .map(invoke)
    .map(log)
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
    d.__render__ && d.__render__()
  } catch (err) {
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
  socket.emit('request', { name: name })
}

socket.on('response', function(res) {
  isJS(res.headers) && (res.body = fn(res.body))
  isData(res.headers) && Object.observe(res.body, meta(res.name))
  resources[res.name] = res
  // isJS(res.headers) && activate(res.name)
})

socket.on('draw', activateAll)

function meta(name) {
  console.log('watching', name)
  return function (changes) {
    resources[name].body = changes[0].object
    console.log('observed changes in', name, changes)
    changes.forEach(process.bind(name))
    activateAll()
  }
}

function process(change) {
  var type = change.type
    , body = change.object
    , name = this
    , i = change.name

  type == 'add' && socket.emit('push', [name, body[i]])
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

function extract(from){
  var start = from.indexOf('<body') + 6
    , end = from.indexOf('</body')
  
  return from.slice(start, end)
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

function reinsert(){
  console.debug('reinsert', this)
  var script = document.createElement('script')
  script.innerHTML = this.innerHTML
  script.src = this.src
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

}

window.addEventListener("popstate", function(event) {
  console.log('popstate')
  if (!event.state) return;
  document.body.classList.add('exit')
  replace(event.state.page)
  document.body.classList.remove('exit')
})

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
  console.log('replacing')
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
    .selectAll('script:not(.bypass)')
    .each(reinsert)
    .each(remove)

  activateAll()
  setupListeners()
  return using
}