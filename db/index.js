var adaptors = {
      mysql: require('./mysql')
    , postgres: require('./postgres')
    }

module.exports = function adaptor(config){
  var type = !config ? undefined
           : isString(config) ? config.split(':')[0]
           : config.type

  var adaptor = adaptors[type] || stub
  adaptor.noop = noop
  return adaptor(config)
}

function stub(){ return stub }

stub.all = function(table, body){
  return promise(body)
}

stub.noop = 
stub.push = 
stub.remove = 
stub.update = 
noop

function noop(){
  return promise(null)
}