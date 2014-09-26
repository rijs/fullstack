var assert  = require('assert')
  , express = require('express')
  , http    = require('http')
  , sinon   = require('sinon')
  , rip     = require('../server')
  , mysql   = require('mysql')
  , app     = express()
  , server  = http.createServer(app)
  , ripple  = rip(server, app, 1)

server.listen(3000)
app.use(express.static(__dirname+'/client'))

var query = sinon.stub().callsArgWith(1, 0, [1,2,3])
mysql.createPool = sinon.stub().returns({ query: query })

ripple
  .db()
  .resource('some.data')