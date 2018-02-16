import Config from './config'
import Provider from './provider'
import Listeners from './listeners'
import ScopeConnector from './scope-connector'

const root = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global)

const BackendlessRTClient = {
  Config,
  Provider,
  Listeners,
  ScopeConnector,
}

if (root) {
  root.BackendlessRTClient = BackendlessRTClient
}

module.exports = BackendlessRTClient

export default BackendlessRTClient
