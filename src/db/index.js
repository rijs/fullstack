import { is, promise } from '../utils'
import objectAssign from 'object-assign'
import mysql from './mysql'
import postgres from './postgres'
var adaptors = { mysql, postgres }

export default function(ripple){ 
  var db = {}

  db.all = promise.sync(1)
  db.noop = 
  db.push = 
  db.remove = 
  db.update = 
  promise.null

  return function(config){
    if (!arguments.length) return db

    var type = !config ? undefined
             : is.str(config) ? config.split(':')[0]
             : config.type

    type && objectAssign(db, adaptors[type](config))

    return ripple
  }
}