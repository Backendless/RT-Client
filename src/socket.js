import { NativeSocketEvents } from './constants'

export default class RTSocket {

  static connect(config, onDisconnect) {
    return Promise.resolve()
      .then(() => config.prepare())
      .then(() => {
        return new Promise((resolve, reject) => {
          const rtSocket = new RTSocket(config)

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

    const { url, options } = config.getSocketConfig()

    this.ioSocket = io(url, options)
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
  // eslint-disable-next-line
  console.log(`[${type}] - [event: ${event}] - arguments: ${JSON.stringify(data)} `)
}
