const isUndefined = value => typeof value === 'undefined'
const isString = value => typeof value === 'string'
const isFunction = value => typeof value === 'function'
const isObject = value => typeof value === 'object' && value !== null

const RTConfig = {
  appId       : null,
  lookupPath  : null,
  debugMode   : false,
  connectQuery: {},

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
  },

  /**
   * @abstract
   **/
  getConnectQuery() {
    return this.connectQuery
  },

}

export default RTConfig