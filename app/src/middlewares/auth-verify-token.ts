'use strict';

import { default as createError, errorType } from '../util/create-error';

const jwt = require('jsonwebtoken');

const endpointsToAuth: string[] = [
  '/users/contacts'
];

/**
 * Verifies whether the passed JWT as an Authorization header is valid.
 *
 * @param req
 * @param res
 * @param next
 */
export default async function (req, res, next) {
  if (!endpointsToAuth.includes(req.url)) {
    return next();
  }

  if (!req.headers) {
    req.app.log.error('Headers not provided');
    return next(createError('No access token was provided', { statusCode: errorType.unauthorized }));
  }

  const auth: string = req.headers.authorization;
  if (!auth) {
    req.app.log.error('Authorization header not provided');
    return next(createError('No access token was provided', { statusCode: errorType.unauthorized }));
  }

  const jwtRegex = new RegExp('^Bearer\\s[a-zA-Z0-9\\-_]+?\\.[a-zA-Z0-9\\-_]+?\\.([a-zA-Z0-9\\-_]+)?$');
  if (!jwtRegex.test(auth)) {
    req.app.log.error('Authorization header value is not of a valid format');
    return next(createError('Could not authenticate user', { statusCode: errorType.unauthorized }));
  }

  const token: string = auth.replace('Bearer ', '');

  try {
    const payload = jwt.verify(token, req.app.config.auth.secret);
    req.userId = payload.userId;
    return next();

  } catch (err) {
    if (err.expiredAt && (+new Date(err.expiredAt) < +new Date())) {
      req.app.log.debug('Access token has expired. Checking refresh token...');

      try {
        const refreshAuthData: any = await req.app.service.AuthService.refreshAuth(token);
        req.userId = refreshAuthData.userId;
        res.set('Authorization', `Bearer ${refreshAuthData.newToken}`);

        return next();

      } catch (err) {
        return next(err);
      }
    }
    req.app.log.error({ err }, 'Invalid access token');
    return next(createError('Invalid access token', { statusCode: errorType.unauthorized }));
  }
}
