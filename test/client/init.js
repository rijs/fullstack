ripple.on('ready', function(){
  console.log('ready')
  var text = '<script src="mocha.js"></script>' +
             '<script src="chai.js"></script>' +
             '<script>mocha.setup("bdd")</script>' +
             '<script src="tests.js"></script>' +
             '<script>mocha.run()</script>'
  document.querySelector('#mocha').innerHTML = text
})