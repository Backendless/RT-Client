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

          rtSocket.on(NativeSocketEvents.ERROR, error => {
            rtSocket.log('error', 'received ERROR event while connecting', error)

            closeAndReject(error)
          })

          rtSocket.connect()

          function onConnect() {
            rtSocket.log('log', 'socket connected')

            resolve(rtSocket)
          }

          function onError(error) {
            rtSocket.log(
              'error',
              'received one of [CONNECT_ERROR,CONNECT_TIMEOUT] socket event while connecting',
              error
            )

            closeAndReject(error)
          }

          function closeAndReject(error) {
            rtSocket.log('log', 'close and reject socket with error:', error)

            rtSocket.close()

            reject(error)
          }
        })
      })
      .then(rtSocket => {
        rtSocket.on(NativeSocketEvents.DISCONNECT, onDisconnect)
        rtSocket.on(NativeSocketEvents.ERROR, onDisconnect)

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
    this.log('log', 'close socket')

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
    this.logMessage('FROM SERVER', event, data)

    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }

  emit(event, data) {
    this.logMessage('TO SERVER', event, data)

    this.ioSocket.emit(event, data)
  }

  log(type, ...args) {
    if (this.config.debugMode) {
      // eslint-disable-next-line
      console[type]('[RT Client]:', ...args)
    }
  }

  logMessage(type, event, data) {
    this.log('log', `[${ type }] - [event: ${ event }] - arguments: ${ JSON.stringify(data) } `)
  }

}
