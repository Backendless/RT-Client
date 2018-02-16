import RTListeners from './listeners'

const ListenerTypes = {
  CONNECT    : 'CONNECT',
  ERROR      : 'ERROR',
  COMMAND    : 'COMMAND',
  USER_STATUS: 'USER_STATUS',
}

export default class RTScopeConnector extends RTListeners {

  /**
   * @static
   * @function
   * @decorator
   * @param {Boolean} [returnPromise] - if passed to TRUE the method returns a Promise
   *                                    and will be resolved when the instance is connected to scope
   *                                    and method return any result
   *
   * decorate instance's methods of the Class
   * puts the method's execution to pool and run it immediately after connected to Connection Scope.
   * if the instance is already connected to the scope the method will be executed immediately
   **/
  static delayedOperation = delayedOperation

  /**
   * @abstract getter, must be overridden in an inherited class
   * must returns a function for adding subscriptions to CONNECT to connection scope
   * For ex.: RTProvider.subscriptions.connectToRSO
   **/
  get connectSubscriber() {
    return null
  }

  /**
   * @abstract getter, must be overridden in an inherited class
   *
   * must returns a function for adding subscriptions to listening COMMANDS in connection scope
   * For ex.: RTProvider.subscriptions.onRSOCommand
   **/
  get commandSubscriber() {
    return null
  }

  /**
   * @abstract getter, must be overridden in an inherited class
   *
   * must returns a function for adding subscriptions to listening changes of USER_STATUS in connection scope
   * For ex.: RTProvider.subscriptions.onRSOUserStatus
   **/
  get usersSubscriber() {
    return null
  }

  /**
   * @abstract getter, must be overridden in an inherited class
   *
   * must returns a function for sending COMMAND into connection scope
   * For ex.: RTProvider.methods.sendRSOCommand
   **/
  get commandSender() {
    return null
  }

  constructor(options) {
    super()

    this.options = options

    this.delayedOperations = []

    this.connect()
  }

  /**
   * @public method
   *
   * connect to connection scope, if you already connected the method do nothing
   **/
  connect() {
    if (!this.isConnected()) {
      this.connection = this.connectSubscriber(this.getScopeOptions(), {
        onError: error => this.onError(error),
        onReady: () => this.onConnect(),
        onStop : () => this.onDisconnect()
      })
    }
  }

  /**
   * @public method
   *
   * disconnect from connection scope, if you already disconnect the method do nothing
   **/
  disconnect() {
    if (this.isConnected()) {
      this.removeAllListeners()

      this.connection.stop()
    }
  }

  /**
   * @public method
   *
   * returns TRUE if you connected to connection scope otherwise returns FALSE
   **/
  isConnected() {
    return !!this.connection && this.connection.isReady()
  }

  /**
   * @private method
   **/
  getSubscriptionOptions() {
    return this.getScopeOptions()
  }

  /**
   * @private method
   **/
  getScopeOptions() {
    return this.options
  }

  /**
   * @private method
   **/
  onConnect() {
    this.delayedOperations.forEach(operation => operation())
    this.delayedOperations = []

    this.runSimpleListeners(ListenerTypes.CONNECT)
  }

  /**
   * @private method
   **/
  onError(error) {
    this.runSimpleListeners(ListenerTypes.ERROR, error)
  }

  /**
   * @private method
   **/
  onDisconnect() {
    this.connection = null
  }

  /**
   * @public method
   **/
  removeAllListeners() {
    this.delayedOperations = []

    super.removeAllListeners()
  }

  /**
   * @public method
   **/
  addConnectListener(callback, onError) {
    this.addSimpleListener(ListenerTypes.CONNECT, callback)

    if (onError) {
      this.addSimpleListener(ListenerTypes.ERROR, onError)
    }
  }

  /**
   * @public method
   **/
  removeConnectListeners(callback, onError) {
    this.removeSimpleListener(ListenerTypes.CONNECT, callback)

    if (onError) {
      this.removeSimpleListener(ListenerTypes.ERROR, onError)
    }
  }

  /**
   * @public method
   **/
  @delayedOperation()
  addCommandListener(callback, onError) {
    this.addSubscription(ListenerTypes.COMMAND, this.commandSubscriber, { callback, onError })
  }

  /**
   * @public method
   **/
  @delayedOperation()
  removeCommandListeners(callback) {
    this.stopSubscription(ListenerTypes.COMMAND, { callback })
  }

  /**
   * @public method
   **/
  @delayedOperation()
  addUserStatusListener(callback, onError) {
    this.addSubscription(ListenerTypes.USER_STATUS, this.usersSubscriber, { callback, onError })
  }

  /**
   * @public method
   **/
  @delayedOperation()
  removeUserStatusListeners(callback) {
    this.stopSubscription(ListenerTypes.USER_STATUS, { callback })
  }

  /**
   * @public method
   **/
  @delayedOperation(true)
  send(type, data) {
    return this.commandSender({ ...this.getScopeOptions(), type, data })
  }

}

function delayedOperation(returnPromise) {
  return function (target, key, descriptor) {
    const decorated = descriptor.value

    descriptor.value = function () {
      const run = () => decorated.apply(this, arguments)

      if (this.isConnected()) {
        return run()
      }

      if (returnPromise) {
        return new Promise((resolve, reject) => this.delayedOperations.push(() => run().then(resolve, reject)))
      }

      this.delayedOperations.push(run)
    }

    return descriptor
  }
}
