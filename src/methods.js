import { RTSocketEvents, RTMethodTypes } from './constants'
import RTUtils from './utils'

const method = type => function (data) {
  return this.send(type, data)
}

export default class RTMethods {

  constructor({ onMessage, emitMessage }) {
    this.onMessage = onMessage
    this.emitMessage = emitMessage

    this.invocations = {}
  }

  initialize() {
    this.onMessage(RTSocketEvents.MET_RES, this.onResponse)
  }

  stop() {
  }

  reset() {
    this.invocations = {}
  }

  hasActivity() {
    return !!Object.keys(this.invocations).length
  }

  send(name, options) {
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
