import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import CALL_SOCKET from './CALL_SOCKET';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError } from './errors' ;
import { normalizeTypeDescriptors, actionWith } from './util';

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function sailsSocketMiddleware({ getState }) {
  const baseSocketUrl = 'http://localhost:9000';
  const socket = sailsIOClient(socketIOClient);
  socket.sails.url = baseSocketUrl;

  return (next) => async (action) => {
    // Do not process actions without a [CALL_SOCKET] property
    if (!isRSAA(action)) {
      return next(action);
    }

    // Try to dispatch an error request FSA for invalid RSAAs
    const validationErrors = validateRSAA(action);
    if (validationErrors.length) {
      const callSocket = action[CALL_SOCKET];
      if (callSocket.types && Array.isArray(callSocket.types)) {
        let requestType = callSocket.types[0];
        if (requestType && requestType.type) {
          requestType = requestType.type;
        }
        next({
          type: requestType,
          payload: new InvalidRSAA(validationErrors),
          error: true
        });
      }
      return;
    }

    // Parse the validated RSAA action
    const callSocket = action[CALL_SOCKET];
    let { endpoint, headers } = callSocket;
    const { method, body, types } = callSocket;
    const [requestType, successType, failureType] = normalizeTypeDescriptors(types);

    // Process [CALL_SOCKET].endpoint function
    if (typeof endpoint === 'function') {
      try {
        endpoint = endpoint(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[CALL_SOCKET].endpoint function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // Process [CALL_SOCKET].headers function
    if (typeof headers === 'function') {
      try {
        headers = headers(getState());
      } catch (e) {
        return next(await actionWith(
          {
            ...requestType,
            payload: new RequestError('[CALL_SOCKET].headers function failed'),
            error: true
          },
          [action, getState()]
        ));
      }
    }

    // We can now dispatch the request FSA
    next(await actionWith(
      requestType,
      [action, getState()]
    ));

    try {
      let res;
      const url = baseSocketUrl + endpoint;
      const params = body;

      // Make the Socket call
      await socket.request({ url, params: body, method, headers }, (responseBody, JWR) => {
        res = JWR;
      });
    } catch(e) {
      // The request was malformed, or there was a network error
      return next(await actionWith(
        {
          ...requestType,
          payload: new RequestError(e.message),
          error: true
        },
        [action, getState()]
      ));
    }

    // Process the server response
    if (!res.error) {
      return next(await actionWith(
        successType,
        [action, getState(), res]
      ));
    } else {
      return next(await actionWith(
        {
          ...failureType,
          error: true
        },
        [action, getState(), res]
      ));
    }
  }
}

export { sailsSocketMiddleware };
