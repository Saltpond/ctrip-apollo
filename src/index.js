const {
  AVAILABLE_OPTIONS
} = require('./options')

const {
  DEFAULT_POLLING_RETRY_POLICY,
  PollingManager
} = require('./polling')

const ApolloApplication = require('./application')

const apollo = options => new ApolloApplication(options)

Object.defineProperties(apollo, {
  pollingRetryPolicy: {
    set (policy) {
      PollingManager.policy = policy
    }
  },

  DEFAULT_POLLING_RETRY_POLICY: {
    value: DEFAULT_POLLING_RETRY_POLICY
  },

  AVAILABLE_OPTIONS: {
    value: AVAILABLE_OPTIONS
  }
})

module.exports = apollo
