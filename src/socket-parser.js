/* eslint-disable */

/**
 * Since JS Clients don't use binary data through sockets
 * we do not need to use socket.io-parser module inside the socket.io-client
 *
 * The custom SocketIO Parser is based on both modules:
 *  - socket.io-json-parser
 *  - socket.io-parser
 */

const Emitter = require('component-emitter')

exports.protocol = 4

exports.types = [
  'CONNECT',
  'DISCONNECT',
  'EVENT',
  'ACK',
  'ERROR',
  'BINARY_EVENT',
  'BINARY_ACK'
]

exports.CONNECT = 0
exports.DISCONNECT = 1
exports.EVENT = 2
exports.ACK = 3
exports.ERROR = 4
exports.BINARY_EVENT = 5
exports.BINARY_ACK = 6

exports.Encoder = Encoder
exports.Decoder = Decoder

function Encoder() {
}

/**
 * Encode a packet as a single string if non-binary, or as a
 * buffer sequence, depending on packet type.
 *
 * @param {Object} obj - packet object
 * @param {Function} callback - function to handle encodings (likely engine.write)
 * @return Calls callback with Array of encodings
 * @api public
 */

Encoder.prototype.encode = function (obj, callback) {
  callback([encodeAsString(obj)])
}

/**
 * Encode packet as string.
 *
 * @param {Object} packet
 * @return {String} encoded
 * @api private
 */

function encodeAsString(obj) {

  // first is type
  let str = '' + obj.type

  // attachments if we have them
  if (exports.BINARY_EVENT === obj.type || exports.BINARY_ACK === obj.type) {
    str += obj.attachments + '-'
  }

  // if we have a namespace other than `/`
  // we append it followed by a comma `,`
  if (obj.nsp && '/' !== obj.nsp) {
    str += obj.nsp + ','
  }

  // immediately followed by the id
  if (null != obj.id) {
    str += obj.id
  }

  // json data
  if (null != obj.data) {
    str += JSON.stringify(obj.data)
  }

  return str
}

function Decoder() {
}

Emitter(Decoder.prototype)

/**
 * Decodes an ecoded packet string into packet JSON.
 *
 * @param {String} obj - encoded packet
 * @return {Object} packet
 * @api public
 */

Decoder.prototype.add = function (obj) {
  if (typeof obj === 'string') {
    this.emit('decoded', decodeString(obj))
  } else {
    throw new Error('Unknown type: ' + obj)
  }
}

/**
 * Decode a packet String (JSON data)
 *
 * @param {String} str
 * @return {Object} packet
 * @api private
 */

function decodeString(str) {
  let i = 0
  // look up type
  let p = {
    type: Number(str.charAt(0))
  }

  if (null == exports.types[p.type]) return error()

  // look up attachments if type binary
  if (exports.BINARY_EVENT === p.type || exports.BINARY_ACK === p.type) {
    let buf = ''
    while (str.charAt(++i) !== '-') {
      buf += str.charAt(i)
      if (i == str.length) break
    }
    if (buf != Number(buf) || str.charAt(i) !== '-') {
      throw new Error('Illegal attachments')
    }
    p.attachments = Number(buf)
  }

  // look up namespace (if any)
  if ('/' === str.charAt(i + 1)) {
    p.nsp = ''
    while (++i) {
      var c = str.charAt(i)
      if (',' === c) break
      p.nsp += c
      if (i === str.length) break
    }
  } else {
    p.nsp = '/'
  }

  // look up id
  const next = str.charAt(i + 1)
  if ('' !== next && Number(next) == next) {
    p.id = ''
    while (++i) {
      var c = str.charAt(i)
      if (null == c || Number(c) != c) {
        --i
        break
      }
      p.id += str.charAt(i)
      if (i === str.length) break
    }
    p.id = Number(p.id)
  }

  // look up json data
  if (str.charAt(++i)) {
    p = tryParse(p, str.substr(i))
  }

  return p
}

function tryParse(p, str) {
  try {
    p.data = JSON.parse(str)
  } catch (e) {
    return error()
  }
  return p
}

/**
 * Deallocates a parser's resources
 *
 * @api public
 */

Decoder.prototype.destroy = function () {
}

function error() {
  return {
    type: exports.ERROR,
    data: 'parser error'
  }
}
