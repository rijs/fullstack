# Ripple

Ripple is a reactive, resource-oriented, native-focused, realtime app architecture. The philosophy is that _all_ changes ripple across the network to all other connected servers, clients and databases synchronising them in realtime where possible.

## Quick Start

##### Installation

```
npm install pemrouz/ripple
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

## Rationale

The Ripple pattern evolved naturally from developing web apps as "game-loops" that were recursively composed of [idempotent components](http://ag.svbtle.com/on-d3-components) (i.e. components as simple transformation functions of data - `html = f(data)`). Reinvoking the function with new data would always produce the latest representation of that component, so rather than each component setting up it's own plumbing, listening to data change events to receive/dispatch data, the concern of _streaming data to components_ can be effectively abstracted out. This makes realtime components the default behaviour, not an afterthought. Most alternatives in this area also did not make any attempt to be a lightweight library, embracing standards and native behaviour but went down the road of being a heavyweight framework, inventing concepts and large API surfaces. Applying RESTful principles in the client - the concept of organising applications from _resources and their different representations_ - is also a key part of the philosophy, which currently seems relatively unexplored in other JavaScript projects.

### Ripple vs Flux

Ripple shares key architectural concepts with Flux, such as the single dispatcher, data-flow programming (unidirectional), and views updating when the associated data changes, etc. However, **Ripple is an extension to the Flux paradigm**, in that the dispatcher will not update only the data/views on the current page, but on all other clients too. Ripple introduces much less proprietary concepts (everything is a resource) and the API aims to embrace standards rather than invent new ones.

### Ripple vs Meteor

Ripple and Meteor share some key benefits, such as reactive programming, hot code push, database everywhere, etc. The key difference however is that **Ripple is a _library_ whereas Meteor is a _framework_** - one that takes over your entire development fabric and locks you in. There is no [inversion of control](http://martinfowler.com/bliki/InversionOfControl.html) with Ripple and you can use it many different ways. Besides that, the implementation of the aforementioned benefits is more powerful in Ripple: For example, not being tied to a particular templating engine (Spacebars) and the Meteor 'database everywhere' is just a 'prototyping concept' [removed for production apps](https://www.meteor.com/try/11) requiring [additional wiring that defeats the original friction-reducing purpose of having it](https://www.meteor.com/try/10). In contrast, Ripple's [generic proxies](#rippleresourcename-body-opts) allows you to filter out 'privacy-sensitive data' and the overall architecture gives you 'latency compensation' for free (changes to data update dependent views immediately, and if the change was unsuccessful there will be another invocation to put it in the correct state).

### Ripple vs Compoxure

Ripple and [Compoxure](https://medium.com/@clifcunn/nodeconf-eu-29dd3ed500ec) are very similar in decomposing applications in terms of independent resources. Like Compoxure, Ripple can call out for resources from separate micro-services, avoiding the monolith criticism (1), it can pre-render views avoiding the SEO-incompatibility criticism (2) and it's doesn't lock you in to using a particular hybrid-approach like React or rendr (i.e. you could call a Java service to generate the resource) (3). The key difference is that whereas Compoxure is only concerned with the first render and requires manually wiring up event listeners and AJAX calls for updates, **resources in Ripple are long-lived and continue to send/receive updates after the first render**. Ripple does not currently cache resources in Redis (but that's on the roadmap).

### Ripple vs Basket

Ripple and Basket both using localStorage for storing and loading from. Basket does this on a script-level however, whereas Ripple does this on a resource-level. Basket uses localStorage as an alternative to the browser cache, whereas Ripple uses it for the initial page render and then re-renders relevant parts when there is new information available sent from the server.

### Ripple vs Polymer 

Ripple and Polymer both embrace Web Components for composing applications, but beyond auto-generating Shadow DOM roots for upgraded Custom Elements, Ripple does not provide anywhere near the same level of sugar as Polymer on top of Web Components.

## Design Goals
* Maximise realtime interactivity (making it the default pattern rather than afterthought)
* Minimise app development friction (convention over configuration)
* Keep it agnostic (small, easy to integrate different stacks with, high power-to-weight ratio API surface)
* Keep everything native (e.g. Object.observe, Plain Old Javascript Objects)


## Roadmap
* [x] Complete CRUD operations
* [ ] [Parameterise Resources](https://github.com/pemrouz/ripple/issues/6)
* [ ] [ORM Database Adapters](https://github.com/pemrouz/ripple/issues/4)
* [x] [Offline Storage Support](https://github.com/pemrouz/ripple/issues/5)
* [x] [Web Components: Custom Elements and Shadow Dom](https://github.com/pemrouz/ripple/issues/9)
* [ ] Extend Examples Repo
* [ ] Add Conventional Folder Shortcuts
* [ ] Create Components Repo
* [ ] Objective-C (iOS) Client
* [ ] Android Client
* [x] [MutationObservers Change Detection](https://github.com/pemrouz/ripple/issues/13)
* [x] Unit Tests
* [ ] Encapsulates Ripple Nodes
* [ ] [Immutable Data & Time Travel](https://github.com/pemrouz/ripple/issues/14)
* [ ] Server-Side Rendering as Middleware
* [ ] Expose REST API of Resoures as Middleware
* [ ] Cache Resources in Redis
* [ ] Service Workers: Background Sync and Push
* [ ] [Conflict Resolution: Operational Transforms](https://github.com/pemrouz/ripple/issues/10)
* [ ] [Ripple Scope: Global & Session](https://github.com/pemrouz/ripple/issues/11)
* [ ] [Cache Headers](https://github.com/pemrouz/ripple/issues/12)
* [ ] Extended Time Travel Debugging (middleware)
* [ ] Microservices: Cross-Boundary Resources
* [ ] Polyfill for Older Browsers
* [ ] Version History Bookmarklet
* [ ] Expose Resources as RESTful Endpoints

## Tests

```
npm run test-server
npm run test-client 
explorer http://localhost:3000
```

## API

Note: The below might be slightly out of date. For the latest API, [see the home page](pemrouz.github.io/ripple).

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
  .resource('tweets.data'  , request('localhost:8080/tweets'))
  .resource('template.html', jade('./views/template.jade'))
  ...
```

The _opts_ parameter can be an object with any of the following properties:

* `table` (`String`): This is used to link a resource to a particular table for persistence (see [ripple.db API](#rippledbconfig))

```js
ripple.resource('users.data', [], { table: 'users' })
```

* `private` (`Boolean`): This is used to exclude sending a resource to clients. For example, you may not want to expose your raw list of users to every client: 

```js
ripple.resource('users.data', [], { private: true })
```

* `to` (`Function`): This is a proxy function applied to the resource body before being sent to clients to enable **different representations** on the client than on the server. For example, you may store a list of likes by users on an article as an array of objects `{ user: Number }`, but you can use the `reduce` function to turn this into a single number count for clients rather than sending it raw. Hence, doing `ripple('likes.data')` will return an array on the server and only number on the client. Changes to the former will invoke the proxy function and still invoke update notifications on the client.

* `from` (`Function`): This is a reverse proxy function applied to the resource body when receiving updates to resources from the client. Extending the likes example, we could simply do `ripple('likes.data')++` on the client, and then in this function interpret that by pushing a new object with the logged in user's ID if one does not already exist.

For an example of using the `to/from` proxy functions, see the [client tests](https://github.com/pemrouz/ripple/blob/master/test/client.js#L36-L43).

#### ripple(_name_).on(_event_, _callback_)

This API is used to receive a confirmation, from the database if used on the server, and from the server if used on the client, when a change to a resource is made. _name_ is the name of the resource, _event_ is the event type (currently only `'response'`) and callback is the function to be called. Same on server and client.

```js
ripple('fruit.data')
  .on('response', function(){ alert('new fruit added!') })
  .push('apple')
```

In the case of `push` changes, the first parameter to the callback is the ID of the newly created record, if connected to a database.

#### ripple(_name_).once(_event_, _callback_)

Same as above, but the callback is only invoked once. Same on server and client.

```js
ripple('users.data')
  .once('response', res.send('Thank you for signing up!'))
  .push(req.body)
```

# Contact

Twitter: [@pemrouz](https://twitter.com/pemrouz)
