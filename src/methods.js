import { RTSocketEvents, RTMethodTypes } from './constants'
import RTUtils from './utils'

const method = type => function (data) {
  return this.send(type, data)
}

export default class RTMethods {

  constructor({ onMessage, emitMessage, terminateSocketIfNeeded }) {
    this.onMessage = onMessage
    this.emitMessage = emitMessage
    this.terminateSocketIfNeeded = terminateSocketIfNeeded

    this.invocations = {}
  }

  initialize() {
    if (!this.initialized) {
      this.onMessage(RTSocketEvents.MET_RES, this.onResponse)

      this.initialized = true
    }
  }

  stop() {
    this.initialized = false
  }

  reset() {
    this.invocations = {}
  }

  hasActivity() {
    return !!Object.keys(this.invocations).length
  }

  send(name, options) {
    this.initialize()

    const methodId = RTUtils.generateUID()
    const methodData = { id: methodId, name, options }

    this.emitMessage(RTSocketEvents.MET_REQ, methodData)

    return new Promise((resolve, reject) => {
      this.invocations[methodId] = { resolve, reject }
    })
  }

  onResponse = ({ id, error, result }) => {
    if (this.invocations[id]) {
      const invocation = this.invocations[id]

      if (error) {
        invocation.reject(error)
      } else {
        invocation.resolve(result)
      }

      delete this.invocations[id]

      this.terminateSocketIfNeeded()
    }
  }

  //---------------------------------//
  //----------- AUTH METHODS --------//

  setUserToken = method(RTMethodTypes.SET_USER_TOKEN).bind(this)

  //----------- AUTH METHODS --------//
  //---------------------------------//

  //---------------------------------//
  //-------- PUB_SUB METHODS --------//

  sendPubSubCommand = method(RTMethodTypes.PUB_SUB_COMMAND).bind(this)

  //-------- PUB_SUB METHODS --------//
  //---------------------------------//

  //---------------------------------//
  //----------- RSO METHODS ---------//

  getRSO = method(RTMethodTypes.RSO_GET).bind(this)
  setRSO = method(RTMethodTypes.RSO_SET).bind(this)
  clearRSO = method(RTMethodTypes.RSO_CLEAR).bind(this)
  sendRSOCommand = method(RTMethodTypes.RSO_COMMAND).bind(this)
  invokeRSOMethod = method(RTMethodTypes.RSO_INVOKE).bind(this)

  //----------- RSO METHODS ---------//
  //---------------------------------//
}
