export default class RTListeners {

  constructor() {
    this.subscriptions = {}
    this.simpleListeners = {}
  }

  addSubscription(type, subscriberFn, { callback, onError, parser, extraOptions, keepAlive }) {
    const subscriptionsStack = this.subscriptions[type] = this.subscriptions[type] || []

    const options = {
      ...this.getSubscriptionOptions(),
      ...extraOptions
    }

    const run = () => {
      const subscription = subscriberFn(options, {
        keepAlive,
        parser,
        onData : callback,
        onError: onError,
        onStop : () => this.subscriptions[type] = this.subscriptions[type].filter(s => s.subscription !== subscription),
      })

      subscriptionStore.subscription = subscription
    }

    //TODO: rename "extraOptions" to "params"
    const subscriptionStore = {
      callback,
      extraOptions,
      restore: run,
      stop   : () => subscriptionStore.subscription.stop()
    }

    subscriptionsStack.push(subscriptionStore)

    run()

    return subscriptionStore
  }

  getSubscriptionOptions() {
    return {}
  }

  stopSubscription(type, { callback, argumentsMatcher }) {
    const subscriptionsStack = this.subscriptions[type] = this.subscriptions[type] || []

    if (argumentsMatcher) {
      subscriptionsStack.forEach(s => {
        if (argumentsMatcher(s)) {
          s.subscription.stop()
        }
      })

    } else {
      subscriptionsStack.forEach(s => {
        if (!callback || s.callback === callback) {
          s.subscription.stop()
        }
      })
    }
  }

  addSimpleListener(type, callback) {
    const listenersStack = this.simpleListeners[type] = this.simpleListeners[type] || []

    listenersStack.push(callback)
  }

  removeSimpleListener(type, callback) {
    if (this.simpleListeners[type]) {
      this.simpleListeners[type] = callback
        ? this.simpleListeners[type].filter(cb => cb !== callback)
        : []
    }
  }

  runSimpleListeners(type, ...args) {
    if (this.simpleListeners[type]) {
      this.simpleListeners[type].forEach(callback => callback(...args))
    }
  }

  removeAllListeners() {
    Object.keys(this.subscriptions).map(listenerType => {
      this.subscriptions[listenerType].forEach(({ subscription }) => subscription.stop())
    })

    Object.keys(this.simpleListeners).map(listenerType => {
      this.simpleListeners[listenerType] = []
    })
  }
}
