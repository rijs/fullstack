# [Ripple](https://github.com/pemrouz/ripple)

Ripple is a set of simple modules that compose to form a **modular framework**. This means you can more easily:

* **Extend:** Simply bolt-on a new module, without having to migrate to a whole new framework
* **Upgrade:** Keep up with the diverse and fast-moving world of the Web/JavaScript
* **Control:** Stay on top of how much you want to customise or how close you want to keep to VanillaJS 
* **Adapt:** Many projects (e.g. legacy/enterprise) have different stringent requirements which may evolve
* **Future-Proof:** Avoid lock-in with more control over the framework layer and disposable modules
* **Experiment:** Swap out a module for a different or more performant one
* **Automate:** Abstract your repeated patterns into the framework layer to focus on business logic
* **Integrate:** With a better separation of concerns, write focused adaptors to connect to your infrastructure

It starts off with a super-trivial, but extensible, [core](https://github.com/rijs/core) module. This simply gets/sets things (resources), and emits a change event when something is updated:

```js
var ripple = core()

ripple(name)       // getter
ripple(name, body) // setter
ripple.on('change', function(name[, change]){ .. })
```

All of the other modules build on this simple module to layer in new behaviours and affordances. Read more about how it works end-to-end in the [primer](https://github.com/rijs/docs/blob/master/primer.md#guide-to-building-applications-with-ripple).

<br>
## Links

* [**Official Distributions**](#official-distributions) (I want to see complete out-of-box builds)
* [**Primer**](https://github.com/rijs/docs/blob/master/primer.md#guide-to-building-applications-with-ripple) (I want to build an application end-to-end)
* [**Index of Modules**](#index-of-modules) (I want to see and understand all the modules)
* [**Comparisons**](#comparisons) (I want to understand how this fits in with the rest of the JS ecosystem)
* [**Contributing**](#contributing) (I want to get set up with the development environment to help out)
* [**API Reference**](#api) (I want to lookup details of a specific API)
* [**Quick Examples**](https://github.com/rijs/examples) 
  * [Getting Started (Vanilla)](https://github.com/rijs/examples/tree/master/minimal-vanilla#quick-start)
  * [Core + React](https://github.com/rijs/examples/tree/master/minimal-react#minimal-react)
  * [Core + D3](https://github.com/rijs/examples/tree/master/minimal-react#minimal-d3)
  * [Collaborative Paint Editor (+ Heroku, +Postgres)](https://github.com/rijs/examples/tree/master/heroku-postgres#heroku--postgres)
  * [Building Redux on top of Ripple Core]()
  * [Progressive Fractal Apps]()
  * [DBMonster Performance](http://mathieuancelin.github.io/js-repaint-perfs/ripple)
  * [Time Travel TodoMVC](https://github.com/rijs/examples/tree/master/time-travel-todo#todomvc-and-time-travel)
  * [The Perfect Render]()

<br>
## Official Distributions

You will most likely want to compose your own `ripple.js` in major apps, but the two common out-of-the-box builds are:

* [rijs/fullstack](https://github.com/rijs/fullstack#ripple-fullstack) - all modules included, totals ~5 kB
* [rijs/minimal](https://github.com/rijs/minimal#ripple-minimal) - a minimal core + components build for client-side only apps

For the client, there are four flavours of ripple you can use depending on how you plan to package your application:

* `ripple.js` - all-in-one, unminified
* `ripple.min.js` - all-in-one, minified
* `ripple.pure.js` - does not include external dependencies (socket.io and utilise), unminified
* `ripple.pure.min.js` - does not include external dependencies (socket.io and utilise), minified

These are all also automatically exposed as endpoints on your server (in rijs/fullstack). Bundling is done with Browserify and UglifyJS. If you wish to produce your own bundle, you can start by taking a look at the `npm run build` command.

<br>
## Index of Modules

* [**Core**:](https://github.com/rijs/core#ripple--core) - A simple extensible in-memory data structure of resources. 

* [**Data (type)**:](https://github.com/rijs/data#ripple--data) Extends [core](https://github.com/rijs/core#ripple--core) to register objects and arrays. It also enables per-resource change listeners on those resources, as well versioning info.

* [**Functions (type)**:](https://github.com/rijs/fn#ripple--function) Extends [core](https://github.com/rijs/core#ripple--core) to register functions. For cases when a function resource is registered as a string (e.g. from WS, localStorage), this converts it into a real function before storing.

* [**Hypermedia (type)**:](https://github.com/rijs/hypermedia/#ripple--hypermedia) - Extends [core](https://github.com/rijs/core#ripple--core) to register a HATEOAS API as a resource, traverse links to other resources, and cache them.

* [**Sync**:](https://github.com/rijs/sync#ripple--sync) Synchronises resources between server and client whenever they change. You can specify transformation functions on incoming and outgoing updates to control the flow of data on a per resource, per resource type, or global level. See the [Primer#Sync](https://github.com/rijs/docs/blob/master/primer.md#5-sync) for more info.

* [**Backpressure**:](https://github.com/rijs/backpressure#ripple--backpressure) By default, [the Sync module](https://github.com/rijs/sync#ripple--sync) sends all resources to all clients. Users can limit this or change the representation sent to clients for each resource using the `to` transformation function. This module alters the default behaviour to only send resources and updates to clients for resources that they are using to eliminate over-fetching. You can still use the `to` hook to add extra business logic on top of this.

* [**Components**:](https://github.com/rijs/components#ripple--components) Redraws any custom elements on the page when any of it's dependencies change (either the component definition, data, or styles).

* [**Features (render middleware)**:](https://github.com/rijs/features#ripple--features) Extends the [rendering pipeline](#ripple-draw) to enhance a component with other features (mixins).

* [**Needs (render middleware)**:](https://github.com/rijs/needs#ripple--needs) Extends the [rendering pipeline](#ripple-draw) to apply default attributes defined for a component. 

* [**PreCSS (render middleware)**:](https://github.com/rijs/precss#ripple--precss) Extends the [rendering pipeline](#ripple-draw) to prepend stylesheet(s) for a component. It will be added to either the start of the shadow root if one exists, or scoped and added once in the `head`.

* [**Shadow DOM (render middleware)**:](https://github.com/rijs/shadow#ripple--shadow-dom) Extends the [rendering pipeline](#ripple-draw) to append a shadow root before rendering a custom element. If the browser does not support shadow roots, it sets the `host`/`shadowRoot` pointers so that a component implementation depending on them works both in the context of a shadow root or without.

* [**Delay (render middleware)**:](https://github.com/rijs/delay#ripple--delay) Extends the [rendering pipeline](#ripple-draw) to delay rendering a view by a specified time (ms)

* [**Perf (render middleware)**:](https://github.com/rijs/perf#ripple--perf) Extends the [rendering pipeline](#ripple-draw) to log out time taken for render of every component to help with fine-tuning by highlighting performance bottlenecks. Should only be used in development.

* [**DB**:](https://github.com/rijs/db#ripple--database) Allows connecting a node to external services. For example, when a resource changes, it could update a database, synchronise with other instances over AMQP, or pump to Redis. 

* [**MySQL (adaptor)**:](https://github.com/rijs/mysql#ripple--mysql) Registers a new [database adaptor](https://github.com/rijs/db#ripple--database) to interface with a MySQL DB.

* [**Offline**:](https://github.com/rijs/offline#ripple--offline) Loads resources from `localStorage` on startup (which has _massive_ impact on how fast your application is perceived) - as opposed to waiting for subsequent network events to render things. Asynchronously (debounced) caches resources when they change. 

* [**Helpers**:](https://github.com/rijs/helpers#ripple--helpers) Allows registering helper functions for a resource.

* [**Sessions**:](https://github.com/rijs/sessions#ripple--sessions) Enriches each socket with a uniquely identifying matching `sessionID`.

* [**Auto Serve Client**:](https://github.com/rijs/serve#ripple--serve) Exposes the distribution files as endpoints on your server.

* [**Singleton**:](https://github.com/rijs/singleton#ripple--singleton) Exposes the instance globally on `(window || global).ripple`.

* [**Versioned**:](https://github.com/rijs/versioned#ripple--versioned) - Adds global versioning info and enables rolling back individual resources or the entire application.

* [**Server Side Rendering**:](https://github.com/rijs/ssr#ripple--ssr) This registers a middleware on your server to expand any Custom Elements using the same components logic and available resources at the time before sending the page to the client.

* [**Resources Directory**:](https://github.com/rijs/resdir#ripple--resources-directory) Loads everything in your `./resources` directory on startup so you do not have to require and register each file manually. During development, this will watch for any changes in your resources folder and reregister it on change. So if you change a resource it will be synchronised with the client, then redrawn without any refreshes (hot reload). See [rijs/export](https://github.com/rijs/export#ripple--export) for similar if you are using Ripple without a server.

* [**Export**:](https://github.com/rijs/export#ripple--export) Combines all resources under the `./resources` directory into a single `index.js` file. This is so you can export and import a bundle of resources from separate repos by simplying `require`ing them. Note that this is not the same bundling, since function resources are linked with requires, such that you could subsequently browserify `index.js` to produce a client bundle.

* [**_Deprecated_ - Pre-apply HTML Template**:](https://github.com/rijs/prehtml) In case you like to pre-apply HTML templates before operating on it with JS. I've long [moved away from](https://github.com/pemrouz/vanilla#vanilla) this, but kept it as it serves an example of how modules for other templating types could be supported.

* [**_Deprecated_ - Reactive**:](https://github.com/rijs/reactive) Watches any data resource for changes and emits a change event when it does, to avoid the repetitive boilerplate in manually dispatching events. Uses `Object.observe`, or fallback to polling.

<br>
## Comparisons

#### Flux

Ripple shares some architectural concepts with Flux, such as the single dispatcher, unidirectional data-flow programming, and views updating when the associated data changes, etc. However, **Ripple is an extension to the Flux paradigm**, in that the dispatcher will not update only the data/views on the current page, but on all other clients too. Ripple introduces much less proprietary concepts (everything is a resource) and the API aims to embrace standards (e.g. Custom Elements) rather than invent new ones.

#### Meteor

Ripple and Meteor share some key benefits, such as reactive programming, hot code push, database everywhere, etc. The key difference however is that **Ripple is a _library_ whereas Meteor is a _framework_** - one that deeply takes over your entire development fabric and locks you in. There is no [inversion of control](http://martinfowler.com/bliki/InversionOfControl.html) with Ripple and you can use it many different ways. Besides that, the implementation of the aforementioned benefits is more powerful in Ripple: For example, not being tied to a particular templating engine (Spacebars) and the Meteor 'database everywhere' is just a 'prototyping concept' [removed for production apps](https://www.meteor.com/try/11) requiring [additional wiring that defeats the original friction-reducing purpose of having it](https://www.meteor.com/try/10). In contrast, Ripple's [generic proxies](#rippleresourcename-body-opts) allows you to filter out 'privacy-sensitive data' and the overall architecture gives you 'latency compensation' for free (changes to data update dependent views immediately, and if the change was unsuccessful there will be another invocation to put it in the correct state).

#### Compoxure

Ripple and [Compoxure](https://medium.com/@clifcunn/nodeconf-eu-29dd3ed500ec) are very similar in decomposing applications in terms of independent resources. Like Compoxure, Ripple can call out for resources from separate micro-services, avoiding the monolith criticism (1), it can pre-render views avoiding the SEO-incompatibility criticism (2) and it's doesn't lock you in to using a particular hybrid-approach like React or rendr (i.e. you could call a Java service to generate the resource) (3). The key difference is that whereas Compoxure is only concerned with the first render and requires manually wiring up event listeners and AJAX calls for updates, **resources in Ripple are long-lived and continue to send/receive updates after the first render**. Ripple does not currently cache resources in Redis (but that's on the roadmap).

#### Basket

Ripple and Basket both use localStorage for storing and loading from. Basket does this on a script-level however, whereas Ripple does this on a resource-level. Basket uses localStorage as an alternative to the browser cache, whereas Ripple uses it for the initial page render and then re-renders relevant parts when there is new information available streamed from the server.

#### Polymer 

Ripple and Polymer both embrace Web Components for composing applications, but beyond auto-generating Shadow DOM roots for upgraded Custom Elements and transparently encapsulating styles for non-Shadow DOM users, Ripple does not provide anywhere near the same level of sugar as Polymer on top of Web Components.

#### Redux

The Ripple Core is very comparable to Redux as a single container for application state that you can subscribe to for updates. [Ripple Minimal](https://github.com/rijs/minimal) (core + components module) is architecturally analagous to redux + react. However, core is lighter and more simple that redux in that it only "sets", whereas redux is structured around a reducer API (and other boilerplate). It would be trivial to write a helper function on top of core that feeds the current state and the action to a function that then returns the result to update with.

#### loadCSS

The Ripple architecture results in the same behaviour as loadCSS offers. CSS modules (in fact all resources) are loaded asynchronously (streamed) and appended in order to preserve cascading. If you are using Shadow DOM, they will be added at the start of the shadow root and to the head of the document if not (see [PreCSS](https://github.com/rijs/precss) for more info). In addition (i) only the modules you are currently using will be appended (ii) this is not something you need to manually manage at all but is inferred from a declarative syntax.

#### Cycle

There is a single "change" event in Ripple that hooks into many different focused modules ("drivers"). This leads to a similar pattern with Cycle where you have a declarative flow of data throughout the application and this nervous system may be even more extensive as it creates pipelines across processes, network, and services. The key difference is that **whereas Cycle is based on high-level RxJS as it's primitive, Ripple uses a simple stream of events as it's low-level primitive**. Promises, observables, streams in all their incarnations can be modelled from individual events. This leads to a leaner core and allows users to opt-in using RxJS in their applications or modules. It also has major implications for your application size ([minified todo app > 1MB](https://github.com/cgeorg/todomvp/blob/master/dist/script.js.map)) and performance.

#### GraphQL

GraphQL is about co-locating data requirements of a component with the component itself, which has always been a part of Ripple (`<component data="name">`). The key difference is that **whereas GraphQL deals with making queries by specifying the shape of the response, Ripple prefers "named resources", whose representation on the client is determined by a declarative transformation function**. In this respect, Ripple is more generic since you could build a GraphQL transformation function whose response depends on the incoming query. Furthermore, the **data-fetching in Ripple is inverted (push vs pull), so everything is realtime by default without unnecessary plubming**, and **everything happens over WS rather than HTTP, which avoids expensive round-trips due to headers**.

#### ImmutableJS, Mori

ImmutableJS uses HAMT data structures to efficiently store and update data. This is useful because you can use cheap `===` checks to skip drawing a component if the data has not changed. However, the downside is that it has an expensive startup cost (~3x clone with JSON!). This is non-trivial if you consider how much data crosses the HTTP/WS/localStorage/Worker boundary. In general Ripple is agnostic to whatever data you register. However, as an alternative solution to the `shouldComponentUpdate` problem, Ripple automatically tracks a log of fine-grained changes made on each local resource so the `log.length` can be used as revision counter. Beyond the UI and one VM in particular, the structural sharing of hash map tries doesn't help us with the efficient and reliable replication of data across nodes either, which is where the fundamental log/events structure is very useful.

#### [React](https://github.com/rijs/docs/blob/master/components.md#react)

#### [Virtual DOM](https://github.com/rijs/docs/blob/master/components.md#virtual-dom)

<br>
## Contributing

The best way to currently contribute to Ripple is by creating your own module. Modules (and all extensions below) are simply decorator functions that take in an existing instance, set up new behaviour and then return the instance:

```js
// alerts every change:
export default function alerter(ripple) {
  ripple.on('change', name => alert(name, 'changed!'))
  return ripple
}

// instantiate:
const ripple = alerter(core())
```

Besides listening for and acting on changes, there are a few other key extension points:

#### `ripple.draw`

This function is introduced by the [components module](https://github.com/rijs/components#ripple--components) and on change, simply redraws a component on an element using `component.call(<el>, data)`. There are number of modules that extend this (marked with "render middleware" above). As an example, the following logs out a message everytime a component is drawn before continuing with the rest of the rendering pipeline:

```js
export default function logRenders(ripple) {
  ripple.render = render(ripple.render)
  return ripple
}

const render = next => el => (log('drawing', el), next(el))
```

#### `to | from`

These two transformation functions are introduced by the [sync module](https://github.com/rijs/components#ripple--components) and on change applies `to` before emitting the change or applies `from` on incoming changes. There are actually three levels for both:

* `ripple.(to | from)` - These will be invoked on all incoming/outgoing changes. [Backpressure uses this to limit the resources sent to clients](https://github.com/rijs/backpressure/blob/master/src/index.js#L14-L15) unless they need it to prevent over-fetching.

* `ripple.types[type].(to | from)` - These will be invoked on all incoming/outgoing changes for a certain type. [MySQL for example uses this to delete sensitive DB headers stored data resources](https://github.com/rijs/mysql/blob/master/src/index.js#L7) before sending to clients.

* `ripple.resources[resource].headers.(to | from)` - These will be invoked on all incoming/outgoing changes for a specific resource. You would normally extend these in your application dependending on your business logic:

```js
export default { 
  name: 'users'
, body: []
, headers: { from, to }
}

// simply reject all attempted changes
function from(){ return false } 

// only send the number of users, not the entire array
function to({ body }){ return body.length }
```

It's best to just clone an existing module so you can get all the boilerplate things like babel, builds, tests, coverage, etc out of the way.

#### `ripple.types`

You can create new types by registering the header under `ripple.types`. This primarily allows you to parse a resource that a user attempts to register before storing it. For example, with the [hypermedia module](https://github.com/rijs/hypermedia/#ripple--hypermedia), if a URL is registered, that URL is requested and the response is stored rather than then URL string:

```js
ripple('github', 'https://api.github.com')
// ripple('github') would then return the root object with all the links
```

Each type can also have a `render` method which is what the components module uses to know how to render a resource. This is why [data resources redraw](https://github.com/rijs/components/blob/master/src/types/data.js#L4) all `[data~=name]` but [functions redraw](https://github.com/rijs/components/blob/master/src/types/fn.js#L5) all `component-name`. This method will be important if you want to create your own templating types (e.g. `text/handlebars`).

#### `ripple.adaptors`

This collection is introduced by the [db module](https://github.com/rijs/db#ripple--database), which standardises the way a ripple node connects to external services by taking in a connection string (`type://user:password@host:port/database`), destructuring it, and invoking the corresponding `ripple.adaptors[type]` with the object. The result (object of functions for each change type `{ add, update, remove }`) is stored in `ripple.connections` which will be invoked when the corresponding change type happens. See [MySQL](https://github.com/rijs/mysql#ripple--mysql) as an example which translates atomic changes into SQL statements and executes them.

<br>
## API

This is an overview of the API categorised by each module that introduces it

#### Instantiation

<a name="api-require" href="#api-require">#</a> **`ripple = require('rijs')`**`(opts)`

`opts` is optional and will be passed to each module which may need different things from it 

#### [Core](https://github.com/rijs/core#ripple--core)

<a name="api-core-ripple-1" href="#api-core-ripple-1">#</a> **`ripple`**`(name)`

return the named resource, creating one if it doesn't exist

<a name="api-core-ripple-2" href="#api-core-ripple-2">#</a> **`ripple`**`(name, body)`
 
create or overwrite the named resource with the specified body

<a name="api-core-ripple-3" href="#api-core-ripple-3">#</a> **`ripple`**`(name, body, headers)`

create or overwrite the named resource with the specified body and extra metadata

<a name="api-core-ripple-4" href="#api-core-ripple-4">#</a> **`ripple`**`({ name, body, headers })`

create or overwrite the named resource with the specified body and extra metadata

<a name="api-core-ripple-5" href="#api-core-ripple-5">#</a> **`ripple`**`([ .. ])`

register multiple resources

<a name="api-core-ripple-6" href="#api-core-ripple-6">#</a> **`ripple`**`(ripple2)`

import resources from another ripple node

<a name="api-core-resource" href="#api-core-resource">#</a> **`ripple.resource`**`(name[, `_`body`_`[, `_`headers`_`]])`

alias for ripple as above that allows method chaining for registering multiple resources

<a name="api-core-on" href="#api-core-on">#</a> **`ripple.on`**`('change', function(name, change))`

react to all changes. `change` info, if available, is tuple of `{ key, value, type, time }`

<a name="api-core-once" href="#api-core-once">#</a> **`ripple.once`**`('change', function(name, change))`

react once to a change. `change` info, if available, is tuple of `{ key, value, type, time }`

<a name="api-core-emit" href="#api-core-emit">#</a> **`ripple.emit`**`('change', [name[, `_`change`_`]])`

emit a change for resource `name` and optional `change` info

<a name="api-core-types" href="#api-core-types">#</a> **`ripple.types`**

collection of all registered types

<a name="api-core-resources" href="#api-core-resources">#</a> **`ripple.resources`**

collection of all registered resources

<a name="api-core-content-type" href="#api-core-content-type">#</a> `[header]`**`content-type`**

resource type, usually interpreted based on the body type so not necessary to explicitly set this value

#### [Data (type)](https://github.com/rijs/data#ripple--data)

<a name="api-data-on" href="#api-data-on">#</a> **`ripple(name).on`**`('change', function(change))`

react to changes on the named resource (function receives `name` and `change` object, if any)

<a name="api-data-once" href="#api-data-once">#</a> **`ripple(name).once`**`('change', function(change))`

react once to a change on the named resource

<a name="api-data-emit" href="#api-data-emit">#</a> **`ripple(name).emit`**`('change', [`_`change`_`])`

emit a change for the named resource with optional `change` info

<a name="api-data-log" href="#api-data-log">#</a> `[header]`**`log`**

the max length for the changelog for this resource, [negative values produce hollow log](https://github.com/utilise/utilise#--set). 

#### [Sync](https://github.com/rijs/sync#ripple--sync)

<a name="api-sync-server" href="#api-sync-server">#</a> **`require('rijs')`**`({ server })`

`server` is the `http.Server` instance (express app) to connect to clients on

<a name="api-sync-io" href="#api-sync-io">#</a> **`ripple.io`**

the underlying socket.io instance

<a name="api-sync-stream" href="#api-sync-stream">#</a> **`ripple.stream`**`(sockets)(resources)`

emit all or some resources, to all or some clients. 

values: 
* `sockets` can be nothing (means send to all sockets), a socket, or a sessionID string
* `resources` can be nothing (means send all resources) or name of resource to sync

<a name="api-sync-global-x" href="#api-sync-global-x">#</a> **`ripple.{to | from}`**`({ name, body, headers }, { key, value, type, type })`

transformation function to apply on all outgoing/incoming changes, default: `identity`

<a name="api-sync-type-x" href="#api-sync-type-x">#</a> **`ripple.types[type].{to | from}`**`({ name, body, headers }, { key, value, type, type })`

transformation function to apply on outgoing/incoming changes of each type, default: `identity`

<a name="api-sync-resource-x" href="#api-sync-resource-x">#</a> `[header]`**`[to | from]`**

transformation function to apply on outgoing/incoming changes of specific resource, default: `identity`

#### [Backpressure](https://github.com/rijs/backpressure#ripple--backpressure)

<a name="api-back-deps" href="#api-back-deps">#</a> **`ripple.deps`**`(el)`

returns an array of the dependencies of an element

#### [Components](https://github.com/rijs/components#ripple--components)

<a name="api-components-draw-1" href="#api-components-draw-1">#</a> **`ripple.draw`**`()` 

redraw all components on page

<a name="api-components-draw-2" href="#api-components-draw-2">#</a> **`ripple.draw`**`(element)`

redraw specific element

<a name="api-components-draw-3" href="#api-components-draw-3">#</a> **`ripple.draw`**`.call(element)`

redraw specific element

<a name="api-components-draw-4" href="#api-components-draw-4">#</a> **`ripple.draw`**`(name)` 

redraw elements that depend on named resource

<a name="api-components-draw-5" href="#api-components-draw-5">#</a> `MutationObserver(`**`ripple.draw`**`)`

redraws element being observed

<a name="api-components-render" href="#api-components-render">#</a> **`ripple.render`**`(element)` 

the underlying function that actually renders the element

<a name="api-components-html" href="#api-components-html">#</a> `<component-name>`

invokes the component specified by `nodeName` on the element

<a name="api-components-data" href="#api-components-data">#</a> `[attr]`**`[data]`**
 
passes specified data resources to component on render

<a name="api-components-inert" href="#api-components-inert">#</a> `[attr]`**`[inert]`**
 
always ignore rendering this element

#### [Features](https://github.com/rijs/features#ripple--features)
###### render middleware

<a name="api-features-is" href="#api-features-is">#</a> `[attr]`**`[is]`**

invokes specified mixin(s) in same manner as original component

#### [Needs](https://github.com/rijs/needs#ripple--needs)
###### render middleware

<a name="api-needs" href="#api-needs">#</a> `[header]`**`needs`**

blocks rendering if any specified attributes missing, adds them and retries

#### [PreCSS](https://github.com/rijs/precss#ripple--precss)
###### render middleware

<a name="api-precss" href="#api-precss">#</a> `[attr]`**`[css]`**

adds specified stylesheets to component

#### [Delay](https://github.com/rijs/delay#ripple--delay)
###### render middleware

<a name="api-delay" href="#api-delay">#</a> `[attr]`**`[delay]`**

delays rendering of component by specified time

#### [DB](https://github.com/rijs/db#ripple--database)

<a name="api-db" href="#api-db">#</a> **`require('rijs')`**`({ db: 'type://user:password@host:port/database' })`

connects ripple to something else, synchronishing changes. `type` must exist in `ripple.adaptors`. can be array of strings.

<a name="api-db-adaptors" href="#api-db-adaptors">#</a> **`ripple.adaptors`**

collection of services ripple knows how to connect to. `mysql` only by default. each new adaptor must be a function that takes the destructured connection string `{ type, user, password, host, port, database }` and returns an object with functions `{ add, update, remove }` to be called when the corresponding event occurs.

<a name="api-db-connections" href="#api-db-connections">#</a> **`ripple.connections`**

list of all active connections to external services

#### [MySQL](https://github.com/rijs/mysql#ripple--mysql)
###### adaptor

<a name="api-myqsl-table" href="#api-myqsl-table">#</a> `[header]`**`mysql.table`**

specify which database table/collection to populate the resource with and sync changes with 

<a name="api-mysql-to" href="#api-mysql-to">#</a> `[header]`**`mysql.to`**

transformation function to apply on outgoing db changes

#### [Offline](https://github.com/rijs/offline#ripple--offline)

<a name="api-offline-cache" href="#api-offline-cache">#</a> `[header]`**`cache`**

caching behaviouring for a resource. values: `no-store | undefined (default)`

#### [Helpers](https://github.com/rijs/helpers#ripple--helpers)

<a name="api-helpers" href="#api-helpers">#</a> `[header]`**`helpers`**

collection of helper functions to make accessible on resource

#### [Sessions](https://github.com/rijs/sessions#ripple--sessions)

<a name="api-sessions-name" href="#api-sessions-name">#</a> **`require('rijs')`**`({ name })`

[name of the session ID cookie](https://github.com/expressjs/session#name)

<a name="api-sessions-secret" href="#api-sessions-secret">#</a> **`require('rijs')`**`({ secret })`

[secret used to sign session ID cookie](https://github.com/expressjs/session#secret)

#### [Auto Serve Client](https://github.com/rijs/serve#ripple--serve)

see [distributions](#official-distributions) for list of endpoints this exposes

#### [Singleton](https://github.com/rijs/singleton#ripple--singleton)

<a name="api-singleton" href="#api-singleton">#</a> **`(window | global).ripple`**

makes ripple instance globally accessible

#### [Versioned](https://github.com/rijs/versioned#ripple--versioned)

<a name="api-versioned-1" href="#api-versioned-1">#</a> **`ripple.version`**`(name)`

retrieves the current version index for the named resource

<a name="api-versioned-2" href="#api-versioned-2">#</a> **`ripple.version`**`(name, i)`

rollbacks the named resource to version `i` and returns its value at that time

<a name="api-versioned-3" href="#api-versioned-3">#</a> **`ripple.version`**`()`

retrieves the current historical index for the entire application

<a name="api-versioned-4" href="#api-versioned-4">#</a> **`ripple.version`**`(i)`

rollbacks entire application state to version `i`