import Request from 'backendless-request'

const isUndefined = value => typeof value === 'undefined'
const isString = value => typeof value === 'string'
const isFunction = value => typeof value === 'function'
const isObject = value => typeof value === 'object' && value !== null

export default class RTConfig {

  constructor(config) {
    this.appId = null
    this.lookupPath = null
    this.lookupHeaders = {}
    this.debugMode = false
    this.connectQuery = {}
    this.socketConfigTransform = null

    this.socketConfig = null

    this.set(config)
  }

  set(config) {
    if (!config) {
      return
    }

    if (!isUndefined(config.appId)) {
      if (!isString(config.appId)) {
        throw new Error('"appId" must be String.')
      }

      this.appId = config.appId
    }

    if (!isUndefined(config.lookupPath)) {
      if (!isString(config.lookupPath)) {
        throw new Error('"lookupPath" must be String.')
      }

      this.lookupPath = config.lookupPath
    }

    if (!isUndefined(config.lookupHeaders)) {
      if (!isObject(config.lookupHeaders)) {
        throw new Error('"lookupHeaders" must be Object.')
      }

      this.lookupHeaders = config.lookupHeaders
    }

    if (!isUndefined(config.debugMode)) {
      this.debugMode = !!config.debugMode
    }

    if (!isUndefined(config.connectQuery)) {
      if (isFunction(config.connectQuery)) {
        this.getConnectQuery = config.connectQuery

      } else if (isObject(config.connectQuery)) {
        this.connectQuery = config.connectQuery

      } else {
        throw new Error('"connectQuery" must be Function or Object.')
      }
    }

    if (!isUndefined(config.socketConfigTransform)) {
      if (isFunction(config.socketConfigTransform)) {
        this.socketConfigTransform = config.socketConfigTransform

      } else {
        throw new Error('"socketConfigTransform" must be Function.')
      }
    }
  }

  getConnectQuery() {
    return this.connectQuery
  }

  async prepare() {
    if (!isString(this.lookupPath)) {
      throw new Error('lookupPath must be String')
    }

    const host = await Request.get(this.lookupPath).set(this.lookupHeaders)

    const url = this.appId ? `${ host }/${ this.appId }` : host
    const path = this.appId ? `/${ this.appId }` : undefined

    const query = this.getConnectQuery()

    this.socketConfig = {
      host,
      url,
      options: {
        path,
        query,
        forceNew    : true,
        autoConnect : false,
        reconnection: false,
      }
    }

    if (this.socketConfigTransform) {
      const socketConfig = await this.socketConfigTransform(this.socketConfig)

      if (socketConfig) {
        this.socketConfig = socketConfig
      }
    }
  }

  getSocketConfig() {
    return this.socketConfig
  }
}

