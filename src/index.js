/**
 * Redux middleware for calling an sails socket.
 * @module redux-sails-socket-middleware
 * @requires babel-runtime
 * @requires lodash.isplainobject
 * @requires sails.io.js
 * @requires socket.io-client
 * @exports {symbol} CALL_SOCKET
 * @exports {symbol} LISTEN_SOCKET
 * @exports {function} isRSAA
 * @exports {function} validateRSAA
 * @exports {function} isValidRSAA
 * @exports {error} InvalidRSAA
 * @exports {error} InternalError
 * @exports {error} RequestError
 * @exports {error} SocketError
 * @exports {function} getJSON
 * @exports {ReduxMiddleWare} sailsSocketMiddleware
 */

/**
 * @typedef {function} ReduxMiddleware
 * @param {object} store
 * @returns {ReduxNextHandler}
 *
 * @typedef {function} ReduxNextHandler
 * @param {function} next
 * @returns {ReduxActionHandler}
 *
 * @typedef {function} ReduxActionHandler
 * @param {object} action
 * @returns undefined
 */

import CALL_SOCKET from './CALL_SOCKET';
import LISTEN_SOCKET from './LISTEN_SOCKET';
import { isRSAA, validateRSAA, isValidRSAA } from './validation';
import { InvalidRSAA, InternalError, RequestError, SocketError } from './errors';
import { getJSON } from './util';
import { sailsSocketMiddleware } from './middleware';

export {
  CALL_SOCKET,
  LISTEN_SOCKET,
  isRSAA,
  validateRSAA,
  isValidRSAA,
  InvalidRSAA,
  InternalError,
  RequestError,
  SocketError,
  getJSON,
  sailsSocketMiddleware
};
