import { RTSocketEvents, RTSubscriptionTypes } from './constants'
import RTUtils from './utils'

const subscription = type => function (options, callbacks) {
  return this.subscribe(type, options, callbacks)
}

export default class RTSubscriptions {

  constructor({ onMessage, emitMessage, terminateSocketIfNeeded }) {
    this.onMessage = onMessage
    this.emitMessage = emitMessage
    this.terminateSocketIfNeeded = terminateSocketIfNeeded

    this.subscriptions = {}
  }

  initialize() {
    if (!this.initialized) {
      this.onMessage(RTSocketEvents.SUB_RES, data => this.onSubscriptionResponse(data))

      this.initialized = true
    }
  }

  terminate() {
    Object
      .keys(this.subscriptions)
      .forEach(subscriptionId => this.stopSubscription(subscriptionId))
  }

  reconnect() {
    if (this.initialized) {
      this.initialized = false
      this.initialize()
      this.reconnectSubscriptions()
    }
  }

  hasActivity() {
    return !!Object.keys(this.subscriptions).length
  }

  reconnectSubscriptions() {
    Object
      .keys(this.subscriptions)
      .forEach(subscriptionId => {
        const subscription = this.subscriptions[subscriptionId]

        if (subscription.keepAlive === false) {
          delete this.subscriptions[subscriptionId]
        } else {
          subscription.ready = false

          this.startSubscription(subscriptionId)
        }
      })
  }

  subscribe(name, options, { keepAlive, parser, onData, onError, onStop, onReady }) {
    this.initialize()

    const subscriptionId = RTUtils.generateUID()

    this.subscriptions[subscriptionId] = {
      data : { id: subscriptionId, name, options },
      ready: false,
      keepAlive,
      parser,
      onData,
      onError,
      onStop,
      onReady,
    }

    this.startSubscription(subscriptionId)

    return {
      isReady: () => {
        return !!this.subscriptions[subscriptionId] && this.subscriptions[subscriptionId].ready
      },

      stop: () => {
        if (this.subscriptions[subscriptionId]) {
          this.offSubscription(subscriptionId)
        }
      },
    }
  }

  startSubscription(subscriptionId) {
    const subscription = this.subscriptions[subscriptionId]

    this.emitMessage(RTSocketEvents.SUB_ON, subscription.data)
  }

  stopSubscription(subscriptionId) {
    const subscription = this.subscriptions[subscriptionId]

    if (subscription) {
      if (subscription.onStop) {
        subscription.onStop()
      }

      delete this.subscriptions[subscriptionId]

      this.terminateSocketIfNeeded()
    }
  }

  offSubscription(subscriptionId) {
    const subscription = this.subscriptions[subscriptionId]

    if (subscription) {
      this.emitMessage(RTSocketEvents.SUB_OFF, { id: subscriptionId })

      this.stopSubscription(subscriptionId)
    }
  }

  onSubscriptionResponse({ id, data, error }) {
    const subscription = this.subscriptions[id]

    if (subscription) {
      if (error) {

        if (subscription.onError) {
          subscription.onError(error)
        }

        this.stopSubscription(id)

      } else {
        if (!subscription.ready) {
          subscription.ready = true

          if (subscription.onReady) {
            subscription.onReady()
          }
        }

        if (subscription.onData) {
          if (typeof subscription.parser === 'function') {
            data = subscription.parser(data)
          }

          subscription.onData(data)
        }
      }
    }
  }

  /******************************************************************************* **/
  /******************************************************************************* **/
  /** API's SUBSCRIPTIONS ******************************************************** **/

  /***************************************** **/
  /***** DATA SUBSCRIPTIONS **************** **/
  /** */ onObjectsChanges = subscription(RTSubscriptionTypes.OBJECTS_CHANGES).bind(this)
  /***** DATA SUBSCRIPTIONS **************** **/
  /***************************************** **/

  /***************************************** **/
  /***** PUB_SUB SUBSCRIPTIONS ************* **/
  /** */ connectToPubSub = subscription(RTSubscriptionTypes.PUB_SUB_CONNECT).bind(this)
  /** */ onPubSubMessage = subscription(RTSubscriptionTypes.PUB_SUB_MESSAGES).bind(this)
  /** */ onPubSubCommand = subscription(RTSubscriptionTypes.PUB_SUB_COMMANDS).bind(this)
  /** */ onPubSubUserStatus = subscription(RTSubscriptionTypes.PUB_SUB_USERS).bind(this)
  /***** PUB_SUB SUBSCRIPTIONS ************* **/
  /***************************************** **/

  /***************************************** **/
  /***** RSO SUBSCRIPTIONS ***************** **/
  /** */ connectToRSO = subscription(RTSubscriptionTypes.RSO_CONNECT).bind(this)
  /** */ onRSOChanges = subscription(RTSubscriptionTypes.RSO_CHANGES).bind(this)
  /** */ onRSOClear = subscription(RTSubscriptionTypes.RSO_CLEARED).bind(this)
  /** */ onRSOCommand = subscription(RTSubscriptionTypes.RSO_COMMANDS).bind(this)
  /** */ onRSOInvoke = subscription(RTSubscriptionTypes.RSO_INVOKE).bind(this)
  /** */ onRSOUserStatus = subscription(RTSubscriptionTypes.RSO_USERS).bind(this)
  /***** RSO SUBSCRIPTIONS ***************** **/
  /***************************************** **/

  /** API's SUBSCRIPTIONS ******************************************************** **/
  /******************************************************************************* **/
  /******************************************************************************* **/

  /******************************************************************************* **/
  /******************************************************************************* **/
  /** CONSOLE's SUBSCRIPTIONS **************************************************** **/

  /***************************************** **/
  /***** BUSINESS_LOGIC SUBSCRIPTIONS ****** **/
  /** */ onBlLoggingMessages = subscription(RTSubscriptionTypes.BL_LOGGING_MESSAGES).bind(this)
  /***** BUSINESS_LOGIC SUBSCRIPTIONS ****** **/
  /***************************************** **/

  /** CONSOLE's SUBSCRIPTIONS **************************************************** **/
  /******************************************************************************* **/
  /******************************************************************************* **/
}
