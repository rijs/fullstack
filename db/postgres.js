module.exports = postgres
var con, log = console.log.bind(console, '[ripple]')

// ----------------------------------------------------------------------------
// API
// ----------------------------------------------------------------------------
function postgres(url){
  var pg = require('pg')
  con = new pg.Client(url)
  con.connect()
  return postgres
}

postgres.all = function(table){
  var p = promise()

  con.query('SELECT * FROM ' + table, function(e, result) {
    if (e) return log('ERROR', table, e)
    log('got', table, result.rows.length)
    p.resolve(result.rows)
  })

  return p
}

postgres.update = function(table, data){
  var sql = sqlu(table, data)
    , p = promise()

  con.query(sql, function(err, result, fields) {
    if (err) return log('update', table, 'failed', err)
    log('update', table, 'done')
    p.resolve()
  })

  return p
}

postgres.push = function(table, data){
  var sql = sqlc(table, data)
    , p = promise()
  log('push', sql)

  con.query(sql, function(err, result, fields) {
    if (err) return log('push', table, 'failed', err)
    log('push', table, 'done')
    p.resolve(data.id = result.rows.insertId)
  })

  return p
}

postgres.remove = function(table, data){
  var sql = sqld(table, data)
    , p = promise()

  con.query(sql, function(err, result, fields) {
    if (err) return log('remove', table, 'failed', err)
    log('remove', table, 'done')
    p.resolve()
  })

  return p
}

// ----------------------------------------------------------------------------
// HELPERS
// ----------------------------------------------------------------------------
function sqlc(name, body) {
  if (!isObject(body)) return;
  var template = 'INSERT INTO {table} ({keys}) VALUES ({values});'
  template = template.replace('{table}', name)
  template = template.replace('{keys}', Object
    .keys(body)
    .filter(skip('id'))
    .join(',')
  )
  template = template.replace('{values}', Object
    .keys(body)
    .filter(skip('id'))
    .map(value(body))
    .join(',')
  )
  log(template)
  return template
}

function sqlu(name, body) {
  if (!isObject(body)) return;
  var template = 'UPDATE {table} SET {kvpairs} WHERE id = {id};'
  template = template.replace('{table}', name)
  template = template.replace('{id}', body['id'])
  template = template.replace('{kvpairs}', Object
    .keys(body)
    .filter(skip('id'))
    .map(kvpair(body))
    .join(',')
  )
  log(template)
  return template
}

function sqld(name, body) {
  if (!isObject(body)) return;
  var template = 'DELETE FROM {table} WHERE id = {id};'
  template = template.replace('{table}', name)
  template = template.replace('{id}', body['id'])
  log(template)
  return template
}

function skip(d) {
  return function(key){
    return key !== d
  }
}

function value(arr) {
  return function(key){
    return escape(arr[key])
  }
}

function kvpair(arr) {
  return function(key){
    return con.escapeIdentifier(key)+'='+escape(arr[key])
  }
}

function escape(d){
  return isString(d)
    ? con.escapeLiteral(d)
    : d
}