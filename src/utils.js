const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

const Utils = {

  generateUID() {
    //TODO: find a better solution for generate UID
    let hash = ''

    for (let i = 0; i < 8; i++) {
      hash += CHARS.charAt(Math.floor(Math.random() * CHARS.length))
    }

    return hash + Date.now()
  },

  deferred: timeout => (target, key, descriptor) => {
    let lastInvocation = null

    const decorated = descriptor.value

    descriptor.value = function () {
      if (lastInvocation) {
        clearTimeout(lastInvocation)
      }

      lastInvocation = setTimeout(() => {
        decorated.apply(this, arguments)
      }, timeout || 500)
    }

    return descriptor
  }

}

export default Utils