import { NativeSocketEvents } from './constants'
import Utils from './utils'
import Config from './config'
import Subscriptions from './subscriptions'
import Methods from './methods'
import Socket from './socket'

const INCREASE_RECONNECTION_TIMEOUT_STEP = 5
const INITIAL_RECONNECTION_TIMEOUT = 200
const MAX_RECONNECTION_TIMEOUT = 60 * 60 * 1000 // a hour

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export default class RTClient {

  constructor(config) {
    this.config = new Config(config)

    this.nativeEvents = {}

    const socketContext = {
      onMessage              : this.on.bind(this),
      emitMessage            : this.emit.bind(this),
      terminateSocketIfNeeded: this.terminateSocketIfNeeded.bind(this)
    }

    this.subscriptions = new Subscriptions(socketContext)
    this.methods = new Methods(socketContext)
  }

  provideConnectionOnMethod = method => (...args) => {
    this
      .provideConnection()
      .then(rtSocket => {
        if (rtSocket) {
          rtSocket[method](...args)
        }
      })
  }

  on = this.provideConnectionOnMethod('on')
  off = this.provideConnectionOnMethod('off')
  emit = this.provideConnectionOnMethod('emit')

  addConnectingEventListener = callback => this.addNativeEventListener(NativeSocketEvents.CONNECTING, callback)
  removeConnectingEventListener = callback => this.removeNativeEventListener(NativeSocketEvents.CONNECTING, callback)

  addConnectEventListener = callback => this.addNativeEventListener(NativeSocketEvents.CONNECT, callback)
  removeConnectEventListener = callback => this.removeNativeEventListener(NativeSocketEvents.CONNECT, callback)

  addConnectErrorEventListener = callback => this.addNativeEventListener(NativeSocketEvents.CONNECT_ERROR, callback)
  removeConnectErrorEventListener = callback => this.removeNativeEventListener(NativeSocketEvents.CONNECT_ERROR, callback)

  addDisconnectEventListener = callback => this.addNativeEventListener(NativeSocketEvents.DISCONNECT, callback)
  removeDisconnectEventListener = callback => this.removeNativeEventListener(NativeSocketEvents.DISCONNECT, callback)

  addReconnectAttemptEventListener = callback => this.addNativeEventListener(NativeSocketEvents.RECONNECT_ATTEMPT, callback)
  removeReconnectAttemptEventListener = callback => this.removeNativeEventListener(NativeSocketEvents.RECONNECT_ATTEMPT, callback)

  @Utils.deferred()
  terminateSocketIfNeeded() {
    if (!this.subscriptions.hasActivity() && !this.methods.hasActivity()) {
      this.disconnect('there are no active methods/subscriptions')
    }
  }

  reconfig(config) {
    const running = this.isRunning()

    this.destroyConnection('reconfiguration')

    this.config.set(config)

    if (running) {
      //TODO: if there was not provided connection don't need to connect to server
      this.provideConnection()
    }
  }

  terminate() {
    this.disconnect('terminated')

    this.requireRestorePrevConnection = false

    this.nativeEvents = {}
    this.subscriptions.terminate()
    this.methods.terminate()
  }

  disconnect(reason) {
    this.stopped = true

    this.destroyConnection(reason)
  }

  isRunning() {
    return !!this.socketPromise
  }

  addNativeEventListener(event, callback) {
    this.nativeEvents[event] = this.nativeEvents[event] || []
    this.nativeEvents[event].push(callback)
  }

  removeNativeEventListener(event, callback) {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event] = this.nativeEvents[event].filter(cb => cb !== callback)

      if (!this.nativeEvents[event].length) {
        delete this.nativeEvents[event]
      }
    }
  }

  runNativeEventListeners(event, ...args) {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event].forEach(callback => callback(...args))
    }
  }

  provideConnection() {
    if (this.socketPromise) {
      return this.socketPromise
    }

    this.stopped = false
    this.connectAttempt = 0

    return this.socketPromise = this.tryToConnect()
  }

  getNextReconnectionTimeout() {
    const factor = Math.ceil(this.connectAttempt / INCREASE_RECONNECTION_TIMEOUT_STEP)
    const timeout = INITIAL_RECONNECTION_TIMEOUT * Math.pow(2, factor)

    return Math.min(timeout, MAX_RECONNECTION_TIMEOUT)
  }

  tryToConnect() {
    this.connected = false

    if (this.stopped) {
      return
    }

    this.connectAttempt = this.connectAttempt + 1

    const nextReconnectionTimeout = this.getNextReconnectionTimeout()

    this.onConnecting()

    if (this.connectAttempt > 1) {
      this.onReconnectAttempt(this.connectAttempt - 1, nextReconnectionTimeout)
    }

    return Socket.connect(this.config, this.onSocketDisconnect.bind(this))
      .then(rtSocket => {
        this.onConnect()

        return rtSocket
      })
      .catch(error => {
        this.onConnectError(error)

        // wait for 400|800|1600|...|MAX_RECONNECTION_TIMEOUT milliseconds
        return wait(nextReconnectionTimeout).then(() => this.tryToConnect())
      })
  }

  destroyConnection(reason) {
    if (this.isRunning()) {
      this.socketPromise.then(rtSocket => {
        if (rtSocket) {
          rtSocket.close()
        } else {
          this.onDisconnect(reason)
        }
      })

      delete this.socketPromise
    }
  }

  onSocketDisconnect(reason) {
    this.destroyConnection(reason)
    this.provideConnection()
  }

  onDisconnect(reason) {
    this.connected = false

    this.runNativeEventListeners(NativeSocketEvents.DISCONNECT, reason)
  }

  onConnecting() {
    this.runNativeEventListeners(NativeSocketEvents.CONNECTING)
  }

  onConnect() {
    if (this.requireRestorePrevConnection) {
      this.subscriptions.reconnect()
      this.methods.reconnect()
    }

    this.connected = true
    this.connectAttempt = 0
    this.requireRestorePrevConnection = true

    this.runNativeEventListeners(NativeSocketEvents.CONNECT)
  }

  onConnectError(error) {
    this.runNativeEventListeners(NativeSocketEvents.CONNECT_ERROR, error && error.message || error, this.connectAttempt)
  }

  onReconnectAttempt(attempt, timeout) {
    this.runNativeEventListeners(NativeSocketEvents.RECONNECT_ATTEMPT, attempt, timeout)
  }

}


