var adaptors = {
      mysql: require('./mysql')
    , postgres: require('./postgres')
    }

module.exports = function adaptor(config){
  var adaptor = adaptors[config.type] || stub
  adaptor.noop = noop
  return adaptor(config)
}

function stub(){ return stub }

stub.all = function(){
  return promise([])
}

stub.noop = 
stub.push = 
stub.remove = 
stub.update = 
noop

function noop(){
  return promise(null)
}