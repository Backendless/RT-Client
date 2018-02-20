import io from 'socket.io-client'
import Request from 'backendless-request'

import Config from './config'
import { NativeSocketEvents } from './constants'

export default class RTSocket {

  static connect(onDisconnect) {
    if (!Config.lookupPath) {
      throw new Error('RTConfig.lookupPath is not configured')
    }

    return Request.get(Config.lookupPath)
      .then(rtServerHost => {
        return new Promise((resolve, reject) => {
          const rtSocket = new RTSocket(rtServerHost)

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

  constructor(host) {
    this.events = {}

    if (!Config.appId) {
      throw new Error('RTConfig.appId is not configured')
    }

    this.ioSocket = io(`${host}/${Config.appId}`, {
      forceNew    : true,
      autoConnect : false,
      reconnection: false,
      path        : `/${Config.appId}`,
      query       : Config.getConnectQuery()
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
    logMessage('FROM SERVER', event, data)

    if (this.events[event]) {
      this.events[event].forEach(callback => callback(data))
    }
  }

  emit(event, data) {
    logMessage('TO SERVER', event, data)

    this.ioSocket.emit(event, data)
  }

}

function logMessage(type, event, data) {
  if (Config.debugMode) {
    console.log(`[${type}] - [event: ${event}] - arguments: ${JSON.stringify(data)} `)
  }
}