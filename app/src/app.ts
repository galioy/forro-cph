#!/usr/bin/env node
/* istanbul ignore file */

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as cors from 'cors';

import UserService from './services/UserService';
import AuthService from './services/AuthService';
import errorHandler from './middlewares/catch-and-log-errors';
import authVerifyToken from './middlewares/auth-verify-token';

/*
 * If production env, then load the config file with the values from the environment variables provided to the container.
 * Otherwise just load the local config file for the current environment.
 */
let config = require(`../config/${process.env.NODE_ENV.toLowerCase()}.json`);

if (process.env.NODE_ENV === 'production') {
  let configStringified: string = JSON.stringify(config);

  Object.keys(process.env).forEach(key => {
    configStringified = configStringified.replace(key, process.env[key]);
  });

  config = JSON.parse(configStringified);
  console.log(config);
}

const connections = require('./util/connections');
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');

const app = express();
const port = process.env.PORT || '3000';

app
  .use(bodyParser.json())
  .options('*', cors())
  .use(cors())
  .use(bodyParser.urlencoded({ extended: true }))
  /*
   * Verify the JWT
   */
  .use(authVerifyToken)
  /*
   * Routes
   */
  .use('/', indexRouter)
  .use('/auth', authRouter)
  .use('/users', usersRouter)
  /*
   * Error handler
   */
  .use(errorHandler);

/*
 * Init the DB connections
 */
app['config'] = config;
connections.initRedis(app);
connections.initSequelize(app);
connections.initLogger(app, process.env.LOGDNA_KEY);
connections.initFirebase(app);

/*
 * Set some of the initialized config and connection objects as properties of the app object, so that they are
 * accessible anywhere across the app
 */
app['service'] = {};
app.service['UserService'] = new UserService(app);
app.service['AuthService'] = new AuthService(app);

/*
 * Start the service
 */
app.listen(port, () => {
  app.log.info(`Server started on port ${port} (container exposed: ${process.env.EXPOSED_PORT})`);
});

export default app;
