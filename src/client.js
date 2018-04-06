import { NativeSocketEvents } from './constants'
import Utils from './utils'
import Config from './config'
import Subscriptions from './subscriptions'
import Methods from './methods'
import Session from './session'

const CONNECTION_MANAGE_EVENTS = [
  NativeSocketEvents.CONNECTING,
  NativeSocketEvents.CONNECT,
  NativeSocketEvents.CONNECT_ERROR,
  NativeSocketEvents.DISCONNECT,
  NativeSocketEvents.RECONNECT_ATTEMPT,
]

export default class RTClient {

  constructor(config) {
    this.config = new Config(config)

    this.socketEvents = {}

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
      this.session = new Session(this.config, this.runSocketEventListeners, this.onSessionDisconnect)
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
    this.socketEvents = {}

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

      this.runSocketEventListeners(NativeSocketEvents.DISCONNECT, reason || 'disconnected by client')
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

  addSocketEventListener(event, callback) {
    this.socketEvents[event] = this.socketEvents[event] || []
    this.socketEvents[event].push(callback)

    return this
  }

  removeSocketEventListener(event, callback) {
    if (this.socketEvents[event]) {
      this.socketEvents[event] = callback
        ? this.socketEvents[event].filter(cb => cb !== callback)
        : []

      if (!this.socketEvents[event].length) {
        delete this.socketEvents[event]
      }
    }

    return this
  }

  runSocketEventListeners = (event, ...args) => {
    if (this.socketEvents[event]) {
      this.socketEvents[event].forEach(callback => callback(...args))
    }
  }

  addConnectingEventListener = callback => this.addSocketEventListener(NativeSocketEvents.CONNECTING, callback)
  removeConnectingEventListener = callback => this.removeSocketEventListener(NativeSocketEvents.CONNECTING, callback)

  addConnectEventListener = callback => this.addSocketEventListener(NativeSocketEvents.CONNECT, callback)
  removeConnectEventListener = callback => this.removeSocketEventListener(NativeSocketEvents.CONNECT, callback)

  addConnectErrorEventListener = callback => this.addSocketEventListener(NativeSocketEvents.CONNECT_ERROR, callback)
  removeConnectErrorEventListener = callback => this.removeSocketEventListener(NativeSocketEvents.CONNECT_ERROR, callback)

  addDisconnectEventListener = callback => this.addSocketEventListener(NativeSocketEvents.DISCONNECT, callback)
  removeDisconnectEventListener = callback => this.removeSocketEventListener(NativeSocketEvents.DISCONNECT, callback)

  addReconnectAttemptEventListener = callback => this.addSocketEventListener(NativeSocketEvents.RECONNECT_ATTEMPT, callback)
  removeReconnectAttemptEventListener = callback => this.removeSocketEventListener(NativeSocketEvents.RECONNECT_ATTEMPT, callback)

  removeConnectionListeners = () => {
    CONNECTION_MANAGE_EVENTS.forEach(event => this.removeSocketEventListener(event))
  }
}


