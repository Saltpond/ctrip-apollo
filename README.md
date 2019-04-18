[![Build Status](https://travis-ci.org/kaelzhang/ctrip-apollo.svg?branch=master)](https://travis-ci.org/kaelzhang/ctrip-apollo)
[![Coverage](https://codecov.io/gh/kaelzhang/ctrip-apollo/branch/master/graph/badge.svg)](https://codecov.io/gh/kaelzhang/ctrip-apollo)
<!-- optional appveyor tst
[![Windows Build Status](https://ci.appveyor.com/api/projects/status/github/kaelzhang/ctrip-apollo?branch=master&svg=true)](https://ci.appveyor.com/project/kaelzhang/ctrip-apollo)
-->
<!-- optional npm version
[![NPM version](https://badge.fury.io/js/ctrip-apollo.svg)](http://badge.fury.io/js/ctrip-apollo)
-->
<!-- optional npm downloads
[![npm module downloads per month](http://img.shields.io/npm/dm/ctrip-apollo.svg)](https://www.npmjs.org/package/ctrip-apollo)
-->
<!-- optional dependency status
[![Dependency Status](https://david-dm.org/kaelzhang/ctrip-apollo.svg)](https://david-dm.org/kaelzhang/ctrip-apollo)
-->

# ctrip-apollo

The most delightful and handy Node.js client for Ctrip's [apollo](https://github.com/ctripcorp/apollo) configuration service, which

- **Provides easy-to-use APIs** that just leave everything else to `ctrip-apollo`
- **Implements update notifications** by using HTTP long polling, and handles all kinds of network errors.
- **Supports custom retry policy for polling**
- **Implements disk cache** to against the situation that all config services are down.
- **Updates configurations in background** that we could get a specific config property with a synchronous method with **NO** performance issues.

`ctrip-apollo` directly uses `async/await` and requires node >= 7.10.1

## Install

```sh
$ npm i ctrip-apollo
```

## Usage

```js
const apollo = require('ctrip-apollo')

const app = apollo({
  host: 'http://localhost:8070',
  appId: '100004458'
})

// Get the default namespace
const namespace = app.namespace()

await namespace.ready()

console.log(namespace.get('portal.elastic.cluster.name'))
```

## Examples

### Initialize with namespace

```js
const ns = apollo({
  host,
  appId,

  // Save local cache to the current directory
  cachePath: __dirname
})
.ns('my-namespace')

await ns.ready()

console.log(ns.config())
// {
//   'portal.elastic.document.type': 'biz',
//   'portal.elastic.cluster.name': 'hermes-es-fws'
// }
```

### Disable update notifications(HTTP long polling)

and enable fetching on every 3 minutes

```js
const app = apollo({
  host,
  appId,
  enableUpdateNotification: false,
  enableFetch: true,
  fetchInterval: 3 * 60 * 1000
})

client.ready()
.then(() => {
  console.log(client.get('portal.elastic.cluster.name'))
  // might be:
  // hermes-es-fws
})
```

### Chainable

```js

const ns = await apollo({
  host,
  appId
})
.cluster('ap-northeast-1')
.enableUpdateNotification(true)
.namespace('account-service')
.enableFetch(false)
.ready()

console.log(ns.get('account.graphql.cluster.name'))
// might be:
// graph-us-3
```

# APIs

## app `ApolloApplication`

An application can have one or more clusters

### apollo(options): ApolloApplication

- **options** `Object`

Essential options:
  - **host** `URL::host` the host (including protocol, hostname and port) of the apollo config service
  - **appId** `string` apollo application id

Optional options:
  - **enableUpdateNotification?** `boolean=true` set to `false` to disable update notification.
  - **enableFetch?** `boolean=false` set to `true` to enable the feature
  - **fetchInterval?** `number=5 * 60 * 1000` interval in milliseconds to pull the new configurations. Defaults to `5` minutes. Setting this option to `0` will disable the feature.
  - **fetchCachedConfig?** `boolean=true` whether refresh configurations by fetching the restful API with caches. Defaults to `true`. If you want to always fetch the latest configurations (not recommend), set the option to `false`
  - **cachePath?** `path` specify this option to enable the feature to save configurations to the disk
  - **skipInitFetchIfCacheFound?** `boolean=false` whether a namespace should skip the initial fetching if the corresponding cache is found on disk.

Returns `ApolloApplication`

 <!-- and class `ApolloClient` is a subclass of [`EventEmitter`](https://nodejs.org/dist/latest-v11.x/docs/api/events.html#events_class_eventemitter). -->

#### options.enableUpdateNotification

If `options.enableUpdateNotification` is set to `true`(the default value), all clusters will start to receive update notification automatically.

Make sure the timeout of your gateway is configured more than 60 seconds, [via](https://github.com/ctripcorp/apollo/wiki/%E5%85%B6%E5%AE%83%E8%AF%AD%E8%A8%80%E5%AE%A2%E6%88%B7%E7%AB%AF%E6%8E%A5%E5%85%A5%E6%8C%87%E5%8D%97#142-http%E6%8E%A5%E5%8F%A3%E8%AF%B4%E6%98%8E)

#### options.enableFetch

If `options.enableFetch` is set to `true` (default value is `false`), all namespaces will fetch new configurations on every time period of `options.fetchInterval`

### app.cluster(clusterName?): ApolloCluster

- **clusterName?** `string='default'` the cluster name. The cluster name defaults to `'default'`

Creates a new cluster under the current application.

Returns `ApolloCluster`

### app.namespace(namespaceName?): ApolloNamespace

- **namespaceName?** `string='application'` the optional namespace name which defaults to `'application'` which is the default namespace name of Ctrip's Apollo config service.

Create a new namespace under the default cluster of the current application

Returns `ApolloNamespace`.

## cluster `ApolloCluster`

A cluster can have one or more namespaces. And all namespaces of the same cluster use a single polling manager to receive update notifications.

### cluster.namespace(namespaceName?): ApolloNamespace

- **namespaceName?** `string='application'`

Creates a new namespace of the current cluster.

Returns `ApolloNamespace`

### cluster.enableUpdateNotification(enable): this

- **enable** `boolean`

Enable or disable the updateNotification. Returns `this`

```js
// Get the default cluster, which is equivalent to
// app.cluster('default')
const cluster = app.cluster()

// Disable update notification
cluster.enableUpdateNotification(false)
```

## namespace `ApolloNamespace`

A namespace is what a configuration key belongs to.

### await namespace.ready(): this

Read the local cache file if exists, and fetch the configuration from config service for the first time if `options.skipInitFetchIfCacheFound` is set to `false` (the default value).

If there is no cache file and it fails to fetch configurations, this method will reject.

**MAKE SURE** we await `namespace.ready()` before any `namespace.config()` or `namespace.get()` methods are invoked.

### namespace.config(): Object

Returns `Object` all configurations for the current namespace / application.

Notice that, all configuration getters of a namespace are synchronous methods

```js
console.log('application config', namespace.config())
```

### namespace.get(key): string

- **key** `string` config key name

Returns the config value of the corresponding key `key`

```js
console.log('config for host', namespace.get('host'))
```

### namespace.enableFetch(enable): this

- **enable** `boolean`

Enable or disable fetching in every `options.fetchInterval`

## Getters

### Getter: namespace.namespace

Returns `string` the namespace name

### Getter: namespace.cluster

Returns `string` name of the cluster which the current namespace belongs to

### Getter: cluster.cluster

Returns `string` the cluster name

## Namespace Events

### Event: `'change'`

Emits if the any configuration changes.

By default, `ctrip-apollo` uses HTTP long polling to listen the changes of the configurations.

```js
namespace.on('change', e => {
  console.log('key', e.key)
  console.log('oldValue', e.oldValue)
  console.log('newValue', e.newValue)
})
```

If `options.fetchInterval` is set to `0` and `options.updateNotification` is set to `false`, then the event will never emit.

### Event: `'fetch-error'`

Emits if it fails to fetch configurations

### Event: `'save-error'`

Emits if it fails to save configurations to local cache file

### apollo.pollingRetryPolicy `Function(retries): PollingRetryPolicy`

`apollo.pollingRetryPolicy` is a setter to change the global policy to tell the system what to do next if an error occured when polling update notifications.

`apollo.pollingRetryPolicy` accepts a `Function(retries)` which returns an interface of `PollingRetryPolicy`

- **retries** `number` how many times has retried till the last error.

```ts
interface PollingRetryPolicy {
  // `abandon: true` ignores all properties below
  // and stops update notification polling which is a dangerous directive
  // After that,
  // `ctrip-apollo` will fallback to fetching configurations
  // every `fetchInterval` milliseconds
  abandon?: boolean
  // After `delay` milliseconds,
  // it will try to poll the update notification again
  delay?: number
  // Tells the system to reset the `retries` counter.
  // And the `retries` counter always reset to zero if it receives a sucessful notification
  reset?: boolean
}

// If there is no properties set, it will retry immediately.
```

The default `apollo.pollingRetryPolicy` is equivalent to:

```js
// It will reset the `retries` counter after the 6th retry.
// Schedule the first retry in 10 seconds, and adds extra 10s delay everytime.
apollo.pollingRetryPolicy = apollo.DEFAULT_POLLING_RETRY_POLICY
```

And we can define our own policy

```js
apollo.pollingRetryPolicy = retries => ({
  // Stop polling after 11(the first and the latter 10 retries) errors
  abandon: retries >= 10,
  // Longer and longer delays
  delay: retries * 10 * 1000
  // And no reset
})
```

### apollo.AVAILABLE_OPTIONS `Array`

List of available option keys.

## License

[MIT](LICENSE)
