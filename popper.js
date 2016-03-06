#!/usr/bin/env node
var uglify     = require('uglify-js').minify
  , browserify = require('browserify')
  , identity   = require('utilise/identity')
  , pause      = require('utilise/pause')
  , keys       = require('utilise/keys')
  , via        = require('utilise/via')
  , mockery    = require('mockery')
  , popper     = require('popper')
  , glob       = require('glob')
  , sql, fn

popper = popper({ 
  watch: '.'
, port: 1945
, tests: tests
, globals: globals() 
, browsers: browsers()
, opts: opts()
})


popper.io.on('connection', function(socket){
  socket.on('beforeEach', function(){
    socket.deps = { 
      'dbres': 1
    , 'foo': 1
    , 'my-component': 1
    , 'object': 1
    , 'array': 1
    , 'proxy': 1
    , 'some.css': 1
    , 'shadow-el': 1
    , 'my-component': 1
    }
    popper('dbres')
    popper('foo'         , 'bar', headers())
    popper('my-component', component, headers())
    popper('object'      , { a:0 , b:1, c:2 }, headers())
    popper('array'       , [{i:0}, {i:1},{i:2}], headers())
    popper('proxy'       , [{i:0}, {i:1},{i:2}], 
          { to: to, from: from, 'cache-control': 'no-cache', silent: true, reactive: false })
    popper('some.css'    , '* { color: red }', headers())
    popper('shadow-el'   , shadowEl, headers())
    popper('my-component', component, headers())
    popper.sync(socket)()
    socket.emit('done')
  })
})

function opts(){
  mockery.enable({
    warnOnReplace: false,
    warnOnUnregistered: false
  })

  mockery.registerMock('mysql', { 
    createPool: function(){ 
      return { 
        escape: identity
      , query: function(sql, then){ 
          if (sql == 'SHOW COLUMNS FROM dbres') return then(null, [{ Field: 'name' }, { Field: 'id' }])
          if (sql == 'SELECT * FROM dbres') return then(null, [1,2,3])
        }
      }
    }
  })

  return { db: 'mysql://user:password@host:port/database' }
}

function headers(argument) {
  return { silent: true, 'cache-control': 'no-cache' }
}

function minify(d){
  return uglify(d.toString(), { fromString: true }).code
}

function replace(d){
  return d.replace(/require\('chai'\)/g, 'window.chai')
}

function envvars(d){
  return d.replace(/process.env.GITHUB_USERNAME/g, '"' + process.env.GITHUB_USERNAME + '"')
          .replace(/process.env.GITHUB_PASSWORD/g, '"' + process.env.GITHUB_PASSWORD + '"')
}

function globals(){
  return '<script src="https://cdn.polyfill.io/v1/polyfill.min.js"></script>'
       + '<script src="https://cdnjs.cloudflare.com/ajax/libs/chai/3.0.0/chai.min.js"></script>'
}

function component(data) {  }

function shadowEl(d){ this.innerHTML = '<my-component data="array" css="some.css"></my-component>' }

function from(val, body, key) {
  if (key != 'length') return;
  for (var i = 0; i < +val; i++) popper('proxy')[i] = { i: i }
  return true
}

function to(d) {
  return { sum: d.reduce(sum, 0), length: d.length }
}

function sum(p, v){ 
  return p + v.i
}

function browsers() {
  return [
    'ie11'
  , 'chrome'
  , 'firefox'
  ]
}

function tests() {
  return pause(browserify()
    .add(glob.sync('./test.js'))
    // .add(glob.sync('./{,node_modules/rijs.*/}test.js'))
    .ignore('chai')
    .ignore('jsdom')
    .ignore('express')
    .ignore('supertest')
    .ignore('socket.io')
    .ignore('jsondiffpatch')
    .ignore('socket.io-client')
    .bundle())
    .pipe(via(replace))
    .pipe(via(envvars))
    // .pipe(via(minify))
}