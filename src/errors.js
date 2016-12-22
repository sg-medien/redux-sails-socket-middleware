/**
 * Error class for an RSAA that does not conform to the RSAA definition
 *
 * @class InvalidRSAA
 * @access public
 * @param {array} validationErrors - an array of validation errors
 */
class InvalidRSAA extends Error {
  constructor(validationErrors) {
    super();
    this.name = 'InvalidRSAA';
    this.message = 'Invalid RSAA';
    this.validationErrors = validationErrors;
  }
}

/**
 * Error class for a custom `payload` or `meta` function throwing
 *
 * @class InternalError
 * @access public
 * @param {string} message - the error message
 */
class InternalError extends Error {
  constructor(message) {
    super();
    this.name = 'InternalError';
    this.message = message;
  }
}

/**
 * Error class for an error raised trying to make an socket call
 *
 * @class RequestError
 * @access public
 * @param {string} message - the error message
 */
class RequestError extends Error {
  constructor(message) {
    super();
    this.name = 'RequestError';
    this.message = message;
  }
}

/**
 * Error class for Socket
 *
 * @class SocketError
 * @access public
 * @param {number} status - the status code of the socket response
 * @param {string} message - the error message of the socket response
 * @param {object} response - the parsed JSON response of the socket server if the
 *  'Content-Type' header signals a JSON response
 */
class SocketError extends Error {
  constructor(status, message, response) {
    super();
    this.name = 'SocketError';
    this.status = status;
    this.message = message;
    this.response = response;
  }
}

export { InvalidRSAA, InternalError, RequestError, SocketError };
