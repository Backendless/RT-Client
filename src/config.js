const isUndefined = value => typeof value === 'undefined'
const isString = value => typeof value === 'string'
const isFunction = value => typeof value === 'function'
const isObject = value => typeof value === 'object' && value !== null

export default class RTConfig {

  constructor(config) {
    this.appId = null
    this.debugMode = false
    this.connectQuery = {}
    this.socketConfigTransform = null
    this.hostResolver = null

    this.socketConfig = null

    this.set(config)
  }

  set(config) {
    if (!config) {
      return
    }

    if (!isUndefined(config.hostResolver)) {
      if (isFunction(config.hostResolver)) {
        this.hostResolver = config.hostResolver
      }
    }

    if (!isUndefined(config.appId)) {
      if (!isString(config.appId)) {
        throw new Error('"appId" must be String.')
      }

      this.appId = config.appId
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

  getSocketConfig() {
    return this.socketConfig
  }

  async getHost() {
    if (isUndefined(this.hostResolver) || !isFunction(this.hostResolver)) {
      throw new Error('"hostResolver" must be a function');
    }

    const host = await this.hostResolver()

    if (!host || typeof host !== 'string') {
      throw new Error('"hostResolver" must return a valid string');
    }

    return host
  }

  async prepare() {
    const query = this.getConnectQuery()
    const host = await this.getHost()

    const url = this.appId ? `${ host }/${ this.appId }` : host
    const path = this.appId ? `/${ this.appId }` : undefined

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
      this.socketConfig = await this.socketConfigTransform(this.socketConfig) || this.socketConfig
    }
  }
}

