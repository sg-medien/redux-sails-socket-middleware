import socketIOClient from 'socket.io-client';
import sailsIOClient from 'sails.io.js';
import CALL_SOCKET from './CALL_SOCKET';
import LISTEN_SOCKET from './LISTEN_SOCKET';
import { isRSAA, validateRSAA } from './validation';
import { InvalidRSAA, RequestError } from './errors' ;
import { normalizeCallTypeDescriptors, normalizeListenTypeDescriptor, actionWith } from './util';

/**
 * A Redux middleware that processes RSAA actions.
 *
 * @type {ReduxMiddleware}
 * @access public
 */
function sailsSocketMiddleware(options = {}) {
  const { socketBaseUrl, ...otherOptions } = options;

  if (!socketBaseUrl) throw new Error('Please provide the base socket url of your sails.js server (socketBaseUrl).');

  const socket = sailsIOClient(socketIOClient);
  socket.sails.url = socketBaseUrl;

  if (otherOptions) {
    Object.keys(otherOptions).forEach((key) => {
      if (typeof socket.sails[key] !== 'undefined') {
        socket.sails[key] = otherOptions[key];
      }
    });
  }

  const listen = {};

  return ({ getState, dispatch }) => {
    return (next) => async(action) => {
      // Do not process actions without a [CALL_SOCKET] or a [LISTEN_SOCKET] property
      if (!isRSAA(action)) {
        return next(action);
      }

      // Try to dispatch an error request FSA for invalid RSAAs
      const validationErrors = validateRSAA(action);
      if (validationErrors.length) {
        if (action.hasOwnProperty(LISTEN_SOCKET)) {
          const listenSocket = action[LISTEN_SOCKET];
          if (listenSocket.type) {
            next({
              type: listenSocket.type,
              payload: new InvalidRSAA(validationErrors),
              error: true
            });
          }
        } else {
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
        }
        return;
      }

      if (action.hasOwnProperty(LISTEN_SOCKET)) {
        // Parse the validated RSAA action
        const listenSocket = action[LISTEN_SOCKET];
        const { on, type } = listenSocket;
        const listenType = normalizeListenTypeDescriptor(type);

        if (typeof listen[listenType.type] === 'undefined') {
          listen[listenType.type] = {};
        }

        if (typeof listen[listenType.type][on] === 'undefined') {
          listen[type][on] = true;

          // Setup socket listener
          socket.socket.on(on, (message) => {
            actionWith(
              listenType,
              [action, getState(), message]
            ).then((listenAction) => dispatch(listenAction));
          });
        }

        // Process further actions
        return;
      } else {
        // Parse the validated RSAA action
        const callSocket = action[CALL_SOCKET];
        let { endpoint, headers } = callSocket;
        const { method, body, types } = callSocket;
        const [requestType, successType, failureType] = normalizeCallTypeDescriptors(types);

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
          const url = socketBaseUrl + endpoint;

          // Make the Socket call
          var res = await new Promise((next) => {
            socket.socket.request({ url, params: body, method, headers }, (responseBody, JWR) => next(JWR));
          });
        } catch (e) {
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
  }
}

export { sailsSocketMiddleware };
