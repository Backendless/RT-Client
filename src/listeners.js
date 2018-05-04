export default class RTListeners {

  constructor() {
    this.subscriptions = {}
    this.simpleListeners = {}
  }

  addSubscription(type, subscriberFn, { callback, onError, parser, params }) {
    const subscriptionsStack = this.subscriptions[type] = this.subscriptions[type] || []

    const subscription = subscriberFn({ ...params, ...this.getSubscriptionOptions() }, {
      parser,
      onData : callback,
      onError: onError,
      onStop : () => {
        this.subscriptions[type] = subscriptionsStack.filter(s => s.subscription !== subscription)
      }
    })

    const subscriptionStore = {
      callback,
      params,
      subscription,
      stop: () => subscription.stop()
    }

    subscriptionsStack.push(subscriptionStore)

    return subscriptionStore
  }

  getSubscriptionOptions() {
    return {}
  }

  stopSubscription(type, { callback, matcher }) {
    const subscriptionsStack = this.subscriptions[type] = this.subscriptions[type] || []

    if (matcher) {
      subscriptionsStack.forEach(subscriptionStore => {
        if (matcher(subscriptionStore)) {
          subscriptionStore.subscription.stop()
        }
      })

    } else {
      subscriptionsStack.forEach(subscriptionStore => {
        if (!callback || subscriptionStore.callback === callback) {
          subscriptionStore.subscription.stop()
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
    Object
      .keys(this.subscriptions)
      .forEach(listenerType => {
        this.subscriptions[listenerType].forEach(({ subscription }) => subscription.stop())
      })

    this.simpleListeners = {}
  }
}
