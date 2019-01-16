'use strict';

import { UserModel } from '../models/User';
import { default as createError, errorType } from '../util/create-error';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

export default class AuthService {
  app: any;
  private readonly sequelize: any;
  private readonly redis: any;

  constructor(app: any) {
    this.app = app;
    this.sequelize = this.app.sequelize;
    this.redis = this.app.redis;
  }

  /**
   * Verifies the credentials of a user account and returns a JWT
   *
   * @param {string} email    The email of the existing user account
   * @param {string} password The plain text password of the user account
   * @return {Promise<string>}  A JWT
   */
  async login(email: string, password: string): Promise<string> {
    let user: UserModel;
    try {
      user = await this.sequelize.models.users.findOne({
        where: {
          email: email
        },
        raw: true
      });
    } catch (err) {
      this.app.log.error({ email }, 'Could not get user record');
      throw createError('Could not get user record', { email });
    }

    if (!user) {
      this.app.log.error({ email }, 'User does not exist');
      throw createError('Wrong username', { email, statusCode: errorType.badRequest });
    }

    let loginSuccessful: boolean;
    try {
      loginSuccessful = await bcrypt.compare(password, user.password);
    } catch (err) {
      this.app.log.error('Could not verify the password');
      throw createError('Server Error');
    }

    if (!loginSuccessful) {
      this.app.log.error('Wrong password');
      throw createError('Wrong password', { statusCode: errorType.badRequest });
    }

    this.app.log.info({ userId: user.id, email: user.email }, 'User signed in');

    return await this.signToken({ userId: user.id });
  }

  /**
   * Creates a JWT with a given payload.
   * Store a hash of the generated JWT as a refresh token in Redis.
   *
   * @param {object}  data  The user data to be passed as payload in the token
   * @return {Promise<string>}  The JWT
   */
  async signToken(data): Promise<string> {
    const now: number = Math.floor(Date.now() / 1000);

    /*
     * Prepare the basic params of the JWT payload
     */
    const payload: any = {
      iat: now,
      exp: now + this.app.config.auth.accessTokenExpiryTime
    };

    /*
     * Add the actual payload data
     */
    Object.assign(payload, data);

    let token: string;
    try {
      token = await jwt.sign(payload, this.app.config.auth.secret);
    } catch (err) {
      this.app.log.error({ payload }, 'Could not generate an access token');
      throw createError('Server error');
    }

    /*
     * Set a hash of the token as a refresh token in Redis with expiry time.
     * If unsuccessful - do not break the request by returning an error. We still want the user to this.app.log in. Instead,
     * only log the error, so we can investigate.
     */
    try {
      const hash: string = crypto.createHash('sha256')
        .update(token, 'utf8')
        .digest('hex');

      await this.redis.set(hash, true, 'EX', this.app.config.auth.refreshTokenExpiryTime, 'NX');

    } catch (err) {
      this.app.log.error({ err }, 'Could not set refresh token in Redis');
    }

    return token;
  }

  /**
   * Check if there is a valid refresh token for the provided JWT and if so - generate a new access token.
   *
   * @param {string}  token The original access JWT
   * @return {Promise<>}
   */
  async refreshAuth(token: string): Promise<any> {
    try {
      const hash: string = crypto.createHash('sha256')
        .update(token, 'utf8')
        .digest('hex');

      const refreshTokenIsValid: string = await this.redis.get(hash);

      if (!refreshTokenIsValid) {
        this.app.log.error('Refresh token does not exist');
        throw createError('Invalid token');
      }

      const jwtPayload = jwt.decode(token);

      const newToken: string = await this.signToken({ userId: jwtPayload.userId });
      return { newToken, userId: jwtPayload.userId };

    } catch (err) {
      this.app.log.error('Could not get refresh token');
      throw createError('Invalid access token');
    }
  }

}
