import { NativeSocketEvents } from './constants'
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
      onMessage  : this.on.bind(this),
      emitMessage: this.emit.bind(this),
    }

    this.subscriptions = new Subscriptions(socketContext)
    this.methods = new Methods(socketContext)

    this.connectible = true
    this.connected = false
  }


  connectOnMethod = method => (...args) => {
    if (this.connectible) {
      const rtSocketPromise = this.provideConnection()

      if (this.connected) {
        rtSocketPromise.then(rtSocket => rtSocket[method](...args))
      }
    }
  }

  on = this.connectOnMethod('on')
  emit = this.connectOnMethod('emit')

  setConfig(config) {
    this.config.set(config)

    if (this.session) {
      this.disconnect('Re-config socket connection')

      this.connect()
    }
  }

  provideConnection() {
    if (!this.session) {
      this.session = new Session(this.config, this.emitSocketEventListeners, this.onSessionDisconnect)
      this.session.getSocket()
        .then(() => {
          this.connected = true

          this.methods.initialize()

          this.subscriptions.initialize()
          this.subscriptions.restore()
        })
    }

    return this.session.getSocket()
  }

  connect() {
    this.connectible = true

    this.provideConnection()
  }

  disconnect(reason) {
    if (this.session) {
      this.subscriptions.stop()
      this.methods.stop()

      this.session.terminate()

      delete this.session

      this.emitSocketEventListeners(NativeSocketEvents.DISCONNECT, reason || 'disconnected by client')
    }

    this.connectible = false
    this.connected = false
  }

  terminate(reason) {
    this.socketEvents = {}

    this.subscriptions.reset()
    this.methods.reset()

    this.disconnect(reason || 'Terminated by client')
  }

  onSessionDisconnect = () => {
    this.subscriptions.stop()
    this.methods.stop()

    delete this.session

    this.provideConnection()
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

  emitSocketEventListeners = (event, ...args) => {
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
