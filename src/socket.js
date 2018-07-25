import { NativeSocketEvents } from './constants'

export default class RTSocket {

  static connect(config, onDisconnect) {
    const Request = require('backendless-request')

    if (!config.lookupPath) {
      throw new Error('config.lookupPath is not configured')
    }

    return Request.get(config.lookupPath)
      .set(config.lookupHeaders)
      .then(rtServerHost => {
        return new Promise((resolve, reject) => {
          const rtSocket = new RTSocket(config, rtServerHost)

          rtSocket.on(NativeSocketEvents.CONNECT, onConnect)
          rtSocket.on(NativeSocketEvents.CONNECT_ERROR, onError)
          rtSocket.on(NativeSocketEvents.CONNECT_TIMEOUT, onError)
          rtSocket.on(NativeSocketEvents.ERROR, onError)

          rtSocket.connect()

          function onConnect() {
            resolve(rtSocket)
          }

          function onError(error) {
            rtSocket.close()

            reject(error)
          }
        })
      })
      .then(rtSocket => {
        rtSocket.on(NativeSocketEvents.DISCONNECT, onDisconnect)

        return rtSocket
      })
  }

  constructor(config, host) {
    const io = require('socket.io-client')

    this.config = config

    this.events = {}

    if (!config.appId) {
      throw new Error('config.appId is not configured')
    }

    this.ioSocket = io(`${host}/${this.config.appId}`, {
      forceNew    : true,
      autoConnect : false,
      reconnection: false,
      path        : `/${this.config.appId}`,
      query       : this.config.getConnectQuery()
    })
  }

  connect() {
    this.ioSocket.connect()
  }

  close() {
    this.events = {}
    this.ioSocket.off()
    this.ioSocket.close()
  }

  on(event, callback) {
    if (!this.events[event]) {
      this.ioSocket.on(event, data => this.onEvent(event, data))
    }

    this.events[event] = this.events[event] || []
    this.events[event].push(callback)
  }

  off(event, callback) {
    this.events[event] = callback
      ? this.events[event].filter(f => f !== callback)
      : []

    if (!this.events[event].length) {
      delete this.events[event]
    }

    if (!this.events[event]) {
      this.ioSocket.off(event)
    }
  }

  onEvent(event, data) {
    if (this.config.debugMode) {
      logMessage('FROM SERVER', event, data)
    }

    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }

  emit(event, data) {
    if (this.config.debugMode) {
      logMessage('TO SERVER', event, data)
    }

    this.ioSocket.emit(event, data)
  }

}

function logMessage(type, event, data) {
  console.log(`[${type}] - [event: ${event}] - arguments: ${JSON.stringify(data)} `)
}