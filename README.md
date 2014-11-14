# Ripple

Ripple is a reactive, resource-oriented, realtime app architecture built on top of express and socket.io. The philosophy is that _all_ changes ripple across the network to all other connected servers, clients and databases synchronising them in realtime where possible.

## Quick Start

##### Installation

```
npm install pemrouz/github
```

##### index.js
```js
var app    = require('express')()
  , server = require('http').createServer(app)
  , ripple = require('ripple')(server, app)

ripple
  .resource('tweets.data', ['lorem', 'ipsum'])
  .resource('twitter-feed.js', function(d){
    this.style.color = 'green'
    this.innerHTML = '<li>' + d.join('</li><li>') + '</li>'
  })

server.listen(4000)

app.get('/', function(req, res){
  res.render('index.jade')
})
```

##### views/index.jade

```jade
doctype
html
  body
    twitter-feed(data='tweets', ripple)
```

##### Run the app

```shell
nodemon index.js --harmony
```

##### Reactive Data

Now open `localhost:4000` in two tabs and then try doing `ripple('tweets.data').push('new tweet! :o')` to add new data (same API server-side). 

![reactive-data](https://cloud.githubusercontent.com/assets/2184177/4209638/ce377c08-386b-11e4-9e80-362d888842ca.gif)

##### Reactive Component (hot code push)

Or you could try changing the implementation of the renderer by switching `green` to `red`, and watch the component update without a refresh:

![reactive-component](https://cloud.githubusercontent.com/assets/2184177/4209637/ce3396c4-386b-11e4-9c69-7be232382463.gif)

##### Examples 

You can also grab this demo by doing a `git clone` on the [vanilla example from the examples repo](https://github.com/pemrouz/ripple-examples) or explore the other examples.

## API

#### __ripple__(_name_)

This will return the latest value of the resource stored against the provided _name_. Same on server and client.

#### ripple.__db__(_config_)

This method is optional. But if Ripple successfully connects to the database described in _config_, you can easily load tables as arrays of records and persist all changes back to the database. This is obviously only for the server.

```js
var db = {
      port: '3306'
    , host: '127.0.0.1'
    , user: 'root'
    , password: 'pass'
    , database: 'local'
    }

ripple
  .db(db)
  .resource('tweets.data', [], { table: 'tweets' })
```

Later, a `ripple('tweets.data').push({ text: 'new tweet! :o' })` on the client or server would insert a new record in to the database.

#### ripple.__resource__(_name_, _body_, _opts_)

This will register a new resource with as _name_ the name provided. The _body_ can be pretty much anything: a `String`, `Number`, `Boolean`, `Object`, `Array`, `Function`. If the body is an object, array or function, any changes made to it on the server/client will propagate to other nodes. This API only works on the server. Clients may wish to update the value of a resource and whilst it is trivial to enable resource registration on the client, I have not come across a use case for clients pushing back _new_ resources to the server yet. In a proper app, normally you wouldn't define your resources inline as above but load them from external modules, pre-compiling templates:

```js
ripple
  .resource('calendar.js'  , require('./resources/calendar.js'))
  .resource('profiles.js'  , require('./resources/profiles.js'))
  .resource('template.html', jade('./views/template.jade'))
  ...
```

The _opts_ parameter can be an object with any of the following properties:

* `table` (`String`): This is used to link a resource to a particular table for persistence (see [ripple.db API](#rippledbconfig))

```js
ripple.resource('users.data', [], { table: 'users })
```

* `private` (`Boolean`): This is used to exclude sending a resource to clients. For example, you may not want to expose your raw list of users to every client: 

```js
ripple.resource('users.data', [], { private: true })
```

* `to` (`Function`): This is a proxy function applied to the resource body before being sent to clients to enable **different representations** on the client than on the server. For example, you may store a list of likes by users on an article as an array of objects `{ user: Number }`, but you can use the `reduce` function to turn this into a single number count for clients rather than sending it raw. Hence, doing `ripple('likes.data')` will return an array on the server and only number on the client. Changes to the former will invoke the proxy function and still invoke update notifications on the client.

* `from` (`Function`): This is a reverse proxy function applied to the resource body when receiving updates to resources from the client. Extending the likes example, we could simply do `ripple('likes.data')++` on the client, and then in this function interpret that by pushing a new object with the logged in user's ID if one does not already exist.

For an example of using the `to/from` proxy functions, see the [client tests](https://github.com/pemrouz/ripple/blob/master/test/client.js#L36-L43).

#### ripple(_name_).on(_event_, _callback_)

This API is used to receive a confirmation, from the database if used on the server, and from the server if used on the client, when a change to a resource is made. _name_ is the name of the resource, _event_ is the event type (currently only 'response') and callback is the function to be called. Same on server and client.

```js
ripple('fruit.data')
  .on('response', function(){ alert('new fruit added!') })
  .push('apple')
```

In the case of `push` changes, the first parameter to the callback is the ID of the newly created record, if connected to a database.

#### ripple(name).once(event, callback)

Same as above, but the callback is only invoked once. Same on server and client.

```js
ripple('users.data')
  .once('response', renderConfirmationPage('Thank you for signing up!'))
  .push(req.body)
```


## Design Goals
* Maximise realtime interactivity (making it the default pattern rather than afterthought)
* Minimise app development friction (convention over configuration)
* Keep it agnostic (small, high power-to-weight ratio API surface)
* Keep everything native (e.g. Object.observe, Plain Old Javascript Objects)

## Roadmap
* [x] Complete CRUD operations
* [ ] Parameterise Resources
* [ ] ORM Database Adapters
* [ ] Offline Storage Support
* [ ] Web Component Compliant
* [ ] Extend Examples Repo
* [ ] Add Shortcuts
* [ ] Create Components Repo
* [ ] Objective-C (iOS) Client
* [ ] Android Client
* [ ] MutationObservers Change Detection
* [x] Unit Tests
* [ ] Encapsulates Ripple Nodes

## Tests

```
npm run test-server
npm run test-client 
explorer http://localhost:3000
```
