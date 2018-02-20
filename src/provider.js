import { NativeSocketEvents } from './constants'
import Config from './config'
import Subscriptions from './subscriptions'
import Methods from './methods'
import Socket from './socket'

const INITIAL_RECONNECTION_TIMEOUT = 200
const MAX_RECONNECTION_TIMEOUT = 60 * 60 * 1000 // a hour

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

const provideConnectionOnMethod = method => (...args) => {
  RTProvider
    .provideConnection()
    .then(rtSocket => rtSocket[method](...args))
}

const subscribeNativeEvent = event => callback => RTProvider.addNativeEventListener(event, callback)
const unsubscribeNativeEvent = event => callback => RTProvider.removeNativeEventListener(event, callback)

const RTProvider = {

  on  : provideConnectionOnMethod('on'),
  off : provideConnectionOnMethod('off'),
  emit: provideConnectionOnMethod('emit'),

  addConnectEventListener   : subscribeNativeEvent(NativeSocketEvents.CONNECT),
  removeConnectEventListener: unsubscribeNativeEvent(NativeSocketEvents.CONNECT),

  addConnectErrorEventListener   : subscribeNativeEvent(NativeSocketEvents.CONNECT_ERROR),
  removeConnectErrorEventListener: unsubscribeNativeEvent(NativeSocketEvents.CONNECT_ERROR),

  addDisconnectEventListener   : subscribeNativeEvent(NativeSocketEvents.DISCONNECT),
  removeDisconnectEventListener: unsubscribeNativeEvent(NativeSocketEvents.DISCONNECT),

  addReconnectAttemptEventListener   : subscribeNativeEvent(NativeSocketEvents.RECONNECT_ATTEMPT),
  removeReconnectAttemptEventListener: unsubscribeNativeEvent(NativeSocketEvents.RECONNECT_ATTEMPT),

  init(config) {
    this.terminate()

    Config.set(config)

    this.nativeEvents = {}
    this.subscriptions = new Subscriptions(this)
    this.methods = new Methods(this)
  },

  reconfig(config) {
    this.destroyConnection()

    Config.set(config)

    this.provideConnection()
  },

  terminate() {
    this.destroyConnection()

    this.connected = false
    this.connectAttempt = 0
    this.requireRestorePrevConnection = false

    delete this.nativeEvents
    delete this.subscriptions
    delete this.methods
  },

  isRunning() {
    return !!this.socketPromise
  },

  addNativeEventListener(event, callback) {
    this.nativeEvents[event] = this.nativeEvents[event] || []
    this.nativeEvents[event].push(callback)
  },

  removeNativeEventListener(event, callback) {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event] = this.nativeEvents[event].filter(cb => cb !== callback)

      if (!this.nativeEvents[event].length) {
        delete this.nativeEvents[event]
      }
    }
  },

  runNativeEventListeners(event, ...args) {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event].forEach(callback => callback(...args))
    }
  },

  provideConnection() {
    if (this.socketPromise) {
      return this.socketPromise
    }

    return this.socketPromise = this.tryToConnect()
  },

  tryToConnect() {
    this.connectAttempt = this.connectAttempt + 1

    const factor = INITIAL_RECONNECTION_TIMEOUT * Math.pow(2, this.connectAttempt)
    const timeout = Math.min(factor, MAX_RECONNECTION_TIMEOUT)

    if (this.connectAttempt > 1) {
      this.onReconnectAttempt(this.connectAttempt - 1, timeout)
    }

    return Socket.connect(this.onDisconnect.bind(this))
      .then(rtSocket => {
        this.onConnect()

        return rtSocket
      })
      .catch(error => {
        this.onConnectError(error)

        // wait for 400|800|1600|...|MAX_RECONNECTION_TIMEOUT milliseconds
        return wait(timeout).then(() => this.tryToConnect())
      })
  },

  destroyConnection() {
    if (this.socketPromise) {
      this.socketPromise.then(rtSocket => rtSocket.close())

      delete this.socketPromise
    }
  },

  onDisconnect(reason) {
    this.connected = false

    this.destroyConnection()
    this.provideConnection()

    this.runNativeEventListeners(NativeSocketEvents.DISCONNECT, reason)
  },

  onConnect() {
    if (this.requireRestorePrevConnection) {
      this.subscriptions.reconnect()
      this.methods.reconnect()
    }

    this.connected = true
    this.connectAttempt = 0
    this.requireRestorePrevConnection = true

    this.runNativeEventListeners(NativeSocketEvents.CONNECT)
  },

  onConnectError(error) {
    this.runNativeEventListeners(NativeSocketEvents.CONNECT_ERROR, error && error.message || error)
  },

  onReconnectAttempt(attempt, timeout) {
    this.runNativeEventListeners(NativeSocketEvents.RECONNECT_ATTEMPT, attempt, timeout)
  },

}

export default RTProvider
