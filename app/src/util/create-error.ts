'use strict';

const types = {
  'notFound': 404,
  'badRequest': 400,
  'serverError': 500,
  'unauthorized': 401,
  'forbidden': 403
};
export const errorType = types;

/**
 * Simple wrapper of the native Node Error object to create custom errors
 *
 * @param {string}  message The message to be displayed with the error
 * @param {object}  data    Any data to be returned with the error
 * @return {Error}
 */
export default function (message: string, data?: any) {
  const error: Error = new Error(message);

  error['data'] = data ? data : {};

  if (!data || !data.statusCode) {
    error['data'].statusCode = types['serverError'];
  }

  return error;
}
