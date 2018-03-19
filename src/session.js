import { NativeSocketEvents } from './constants'
import Socket from './socket'

const INCREASE_RECONNECTION_TIMEOUT_STEP = 10
const INITIAL_RECONNECTION_TIMEOUT = 200
const MAX_RECONNECTION_TIMEOUT = 60 * 1000 // a minute

const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

export default class RTSession {

  constructor(config, dispatch, onDisconnect) {
    this.config = config
    this.dispatch = dispatch
    this.onDisconnect = onDisconnect

    this.connectAttempt = 0

    this.socketPromise = this.connect()
  }

  terminate() {
    if (!this.terminated) {
      this.terminated = true

      this.dispatch = () => {
        //if sessions has been terminated don't need to dispatch any events
      }

      this.socketPromise.then(rtSocket => {
        if (rtSocket) {
          rtSocket.close()
        }
      })
    }
  }

  getSocket() {
    return this.socketPromise
      .then(rtSocket => {
        if (this.terminated) {
          return new Promise(() => {
            //return unresolvable promise for preventing errors
            //this connection session has been terminated and a new one will be created if it necessary
          })
        }

        return rtSocket
      })
  }

  connect() {
    if (this.terminated) {
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
        this.connectAttempt = 0

        this.onConnect()

        return rtSocket
      })
      .catch(error => {
        this.onConnectError(error)

        if (!this.terminated) {
          // wait for 400|800|1600|...|MAX_RECONNECTION_TIMEOUT milliseconds
          return wait(nextReconnectionTimeout).then(() => this.connect())
        }
      })
  }

  getNextReconnectionTimeout() {
    const factor = Math.ceil(this.connectAttempt / INCREASE_RECONNECTION_TIMEOUT_STEP)
    const timeout = INITIAL_RECONNECTION_TIMEOUT * Math.pow(2, factor)

    return Math.min(timeout, MAX_RECONNECTION_TIMEOUT)
  }

  onSocketDisconnect(reason) {
    this.dispatch(NativeSocketEvents.DISCONNECT, reason)

    if (!this.terminated) {
      this.terminate()

      this.onDisconnect()
    }
  }

  onConnecting() {
    this.dispatch(NativeSocketEvents.CONNECTING)
  }

  onConnect() {
    this.dispatch(NativeSocketEvents.CONNECT)
  }

  onConnectError(error) {
    this.dispatch(NativeSocketEvents.CONNECT_ERROR, error && error.message || error)
  }

  onReconnectAttempt(attempt, timeout) {
    this.dispatch(NativeSocketEvents.RECONNECT_ATTEMPT, attempt, timeout)
  }
}


