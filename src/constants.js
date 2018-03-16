export const NativeSocketEvents = {
  CONNECTING       : 'connecting',
  CONNECT          : 'connect',
  CONNECT_ERROR    : 'connect_error',
  CONNECT_TIMEOUT  : 'connect_timeout',
  DISCONNECT       : 'disconnect',
  RECONNECT        : 'reconnect',
  RECONNECT_ATTEMPT: 'reconnect_attempt',
  RECONNECTING     : 'reconnecting',
  RECONNECT_ERROR  : 'reconnect_error',
  RECONNECT_FAILED : 'reconnect_failed',
  ERROR            : 'error',
  PING             : 'ping',
  PONG             : 'pong',
}

export const RTSocketEvents = {
  SUB_ON : 'SUB_ON',
  SUB_OFF: 'SUB_OFF',
  SUB_RES: 'SUB_RES',

  MET_REQ: 'MET_REQ',
  MET_RES: 'MET_RES',
}

export const RTSubscriptionTypes = {
  OBJECTS_CHANGES: 'OBJECTS_CHANGES',

  PUB_SUB_CONNECT : 'PUB_SUB_CONNECT',
  PUB_SUB_MESSAGES: 'PUB_SUB_MESSAGES',
  PUB_SUB_COMMANDS: 'PUB_SUB_COMMANDS',
  PUB_SUB_USERS   : 'PUB_SUB_USERS',

  RSO_CONNECT : 'RSO_CONNECT',
  RSO_CHANGES : 'RSO_CHANGES',
  RSO_CLEARED : 'RSO_CLEARED',
  RSO_COMMANDS: 'RSO_COMMANDS',
  RSO_INVOKE  : 'RSO_INVOKE',
  RSO_USERS   : 'RSO_USERS',

  //-----------------------------------------//
  //----------- FOR CONSOLE ONLY ------------//

  LOGGING_MESSAGES: 'LOGGING_MESSAGES',

  //----------- FOR CONSOLE ONLY ------------//
  //-----------------------------------------//
}

export const RTMethodTypes = {
  SET_USER_TOKEN: 'SET_USER_TOKEN',

  RSO_GET    : 'RSO_GET',
  RSO_SET    : 'RSO_SET',
  RSO_CLEAR  : 'RSO_CLEAR',
  RSO_COMMAND: 'RSO_COMMAND',
  RSO_INVOKE : 'RSO_INVOKE',

  PUB_SUB_COMMAND: 'PUB_SUB_COMMAND',
}
