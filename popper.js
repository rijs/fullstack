#!/usr/bin/env node
var env        = process.env
  , uglify     = require('uglify-js').minify
  , browserify = require('browserify')
  , falsy      = require('utilise/falsy')
  , pause      = require('utilise/pause')
  , via        = require('utilise/via')
  , chokidar   = require('chokidar')
  , popper     = require('popper')
  , glob       = require('glob')
  
popper = popper({ 
  watch: '.'
, port: 1945
, tests: tests
, globals: globals() 
, browsers: browsers()
})

popper.io.on('connection', function(socket){
  socket.on('beforeEach', function(){
    popper('foo'          , 'bar', headers())
    popper('object'       , { a:0 , b:1, c:2 }, headers())
    popper('array'        , [{i:0}, {i:1},{i:2}], headers())
    popper({ name: 'proxy', body: [{i:0}, {i:1},{i:2}], headers: { to: to, from: from, 'cache-control': 'no-cache', silent: true, reactive: false }})
    popper('my-component' , component, headers())
    popper.sync(socket)()
    socket.emit('done')
  })
})

function headers(argument) {
  return { from: ack, silent: true, 'cache-control': 'no-cache' }
}

function ack(value, body, index, type, name) {
  return popper.sync(this)(name), false
}

function minify(d){
  return uglify(d.toString(), { fromString: true }).code
}

function replace(d){
  return d.replace(/require\('chai'\)/g, 'window.chai')
}

function globals(){
  return '<script src="https://cdn.polyfill.io/v1/polyfill.min.js"></script>'
       + '<script src="https://cdnjs.cloudflare.com/ajax/libs/chai/3.0.0/chai.min.js"></script>'
}

function component(data) {  }

function from(val, body, key) {
  if (key != 'length') return;
  for (var i = 0; i < +val; i++) body[i] = { i: i }
  return ack.apply(this, arguments)
}

function to(d) {
  return { sum: d.reduce(sum, 0), length: d.length }
}

function sum(p, v){ 
  return p + v.i
}

function browsers() {
  return [
  //   'ie9'
  // , 'android'
  // , 'iphone'
  // , 'opera'
  // , 'safari'
  ]
}

function tests() {
  return pause(browserify()
    .add(glob.sync('./node_modules/*/{test.js,test/client.js}'))
    .ignore('chai')
    .ignore('jsdom')
    .ignore('express')
    .ignore('supertest')
    .ignore('socket.io')
    .ignore('jsondiffpatch')
    .ignore('socket.io-client')
    .bundle())
    .pipe(via(replace))
    .pipe(via(minify))
}