import RTClient from './client'
import Listeners from './listeners'
import ScopeConnector from './scope-connector'

const root = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global)

RTClient.Listeners = Listeners
RTClient.ScopeConnector = ScopeConnector

if (root) {
  root.BackendlessRTClient = RTClient
}

module.exports = RTClient

export default RTClient
export const RTListeners = Listeners
export const RTScopeConnector = ScopeConnector

