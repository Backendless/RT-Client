import { NativeSocketEvents } from './constants'
import Utils from './utils'
import Config from './config'
import Subscriptions from './subscriptions'
import Methods from './methods'
import Session from './session'

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

  connectOnMethod = method => (...args) => {
    this.connect().then(rtSocket => rtSocket[method](...args))
  }

  on = this.connectOnMethod('on')
  emit = this.connectOnMethod('emit')

  setConfig(config) {
    this.config.set(config)

    if (this.session) {
      this.disconnect()

      this.connect(true)
    }
  }

  connect(restoreSubscriptions) {
    if (!this.session) {
      this.session = new Session(this.config, this.runNativeEventListeners, this.onSessionDisconnect)
      this.session.getSocket()
        .then(() => {
          this.subscriptions.initialize()
          this.methods.initialize()

          if (restoreSubscriptions) {
            this.subscriptions.restore()
          }
        })
    }

    return this.session.getSocket()
  }

  terminate() {
    this.nativeEvents = {}

    this.subscriptions.reset()
    this.methods.reset()

    this.disconnect()
  }

  disconnect(reason) {
    if (this.session) {
      this.subscriptions.stopped()
      this.methods.stopped()

      this.session.terminate()

      delete this.session

      this.runNativeEventListeners(NativeSocketEvents.DISCONNECT, reason || 'disconnected by client')
    }
  }

  @Utils.deferred(1000)
  terminateSocketIfNeeded() {
    if (!this.subscriptions.hasActivity() && !this.methods.hasActivity()) {
      this.disconnect('disconnected because of there are no active methods/subscriptions')
    }
  }

  onSessionDisconnect = () => {
    this.subscriptions.stopped()
    this.methods.stopped()

    delete this.session

    this.connect(true)
  }

  addNativeEventListener(event, callback) {
    this.nativeEvents[event] = this.nativeEvents[event] || []
    this.nativeEvents[event].push(callback)

    return this
  }

  removeNativeEventListener(event, callback) {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event] = this.nativeEvents[event].filter(cb => cb !== callback)

      if (!this.nativeEvents[event].length) {
        delete this.nativeEvents[event]
      }
    }

    return this
  }

  runNativeEventListeners = (event, ...args) => {
    if (this.nativeEvents[event]) {
      this.nativeEvents[event].forEach(callback => callback(...args))
    }
  }

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


}


