import RTUtils from './utils'

const Events = {
  MET_REQ: 'MET_REQ',
  MET_RES: 'MET_RES',
}

const Types = {
  SET_USER_TOKEN: 'SET_USER_TOKEN',

  RSO_GET    : 'RSO_GET',
  RSO_SET    : 'RSO_SET',
  RSO_CLEAR  : 'RSO_CLEAR',
  RSO_COMMAND: 'RSO_COMMAND',
  RSO_INVOKE : 'RSO_INVOKE',

  PUB_SUB_COMMAND: 'PUB_SUB_COMMAND',
}

const method = type => function (data) {
  return this.send(type, data)
}

export default class RTMethods {

  constructor(rtProvider) {
    this.rtProvider = rtProvider

    this.invocations = {}
  }

  initialize() {
    if (!this.initialized) {
      this.rtProvider.on(Events.MET_RES, this.onResponse)

      this.initialized = true
    }
  }

  reconnect() {
    if (this.initialized) {
      this.initialized = false
      this.initialize()
    }
  }

  send(name, options) {
    this.initialize()

    const methodId = RTUtils.generateUID()
    const methodData = { id: methodId, name, options }

    this.rtProvider.emit(Events.MET_REQ, methodData)

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

  setUserToken = method(Types.SET_USER_TOKEN).bind(this)

  //----------- AUTH METHODS --------//
  //---------------------------------//

  //---------------------------------//
  //-------- PUB_SUB METHODS --------//

  sendPubSubCommand = method(Types.PUB_SUB_COMMAND).bind(this)

  //-------- PUB_SUB METHODS --------//
  //---------------------------------//

  //---------------------------------//
  //----------- RSO METHODS ---------//

  getRSO = method(Types.RSO_GET).bind(this)
  setRSO = method(Types.RSO_SET).bind(this)
  clearRSO = method(Types.RSO_CLEAR).bind(this)
  sendRSOCommand = method(Types.RSO_COMMAND).bind(this)
  invokeRSOMethod = method(Types.RSO_INVOKE).bind(this)

  //----------- RSO METHODS ---------//
  //---------------------------------//
}
