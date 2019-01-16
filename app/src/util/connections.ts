/* istanbul ignore file */
'use strict';

import User from '../models/User';
import * as Sequelize from 'sequelize';
import * as firebase from 'firebase';

const redis = require('async-redis');
const LogDNA = require('logdna-bunyan').BunyanStream;
const bunyan = require('bunyan');
const bunyanPretty = require('bunyan-pretty');

export interface BunyanLogger {
  debug: any;
  info: any;
  error: any;
  warn: any;
  addStream: any;
}

/**
 * Initialize the Redis connection
 *
 * @param {object}  app     The express app object
 */
export function initRedis(app) {
  const redisClient = redis.createClient(app.config.redis, {
    retry_strategy: (options) => {
      if (options.error) {
        console.error(options.err);
        return new Error('Redis connection error');
      }

      /* Try to reconnect after 3 sec */
      return 3000;
    }
  });

  redisClient.on('error', (err) => {
    console.error(err);
    return err;
  });

  app.redis = redisClient;
}

/**
 * Initialize the Sequelize connection with Postgres
 *
 * @param {object}  app     The express app object
 */
export function initSequelize(app) {
  const Op = Sequelize.Op;
  const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
  };

  const sequelize = new Sequelize(app.config.postgres, {
    dialect: 'postgres',
    logging: (message) => console.log(message),
    operatorsAliases
  });

  sequelize.models['user'] = User.init(sequelize, Sequelize);

  app.sequelize = sequelize;
  app.Sequelize = Sequelize;
}

/**
 * Initializes the logger object, used to send logs (console for local dev and LogDNA for production)
 *
 * @param {object}  app The express app object
 * @param {string}  key The LogDNA ingestion key
 */
export function initLogger(app, key) {
  /* We only declare DEBUG and INFO because they are the lowest levels that we need. Any other levels are higher:
   *  fatal  (60)
   *  error  (50)
   *  warn   (40)
   *  info   (30)
   *  debug  (20)
   *
   * By declaring DEBUG stream to be the console and INFO stream to be our logging server we say that anything from
   * DEBUG and above will be logged in console and anything from INFO and above will be logged in the server.
   * This way we get INFO and above to be in both console and server.
   */
  const logger: BunyanLogger = bunyan.createLogger({
    name: process.env.HOSTNAME || 'forro-service',
    streams: []
  });

  let stream: any = {
    formatter: 'pretty',
    stream: bunyanPretty()
  };

  let logDestination: string = 'console';
  let logLevel: string = 'debug';

  /*
   * Cases:
   * (1) If local dev env (NODE_ENV == 'default' or 'development') -> log only to console, from level 'debug'
   *
   * (2) If deployment env (NODE_ENV != 'default' or != 'development' or != 'test') -> log to Log Server (LogDNA)
   ** if logging of debug is enabled (DEBUG_ENABLE == 'true') -> log from 'debug' level, otherwise from 'info'
   */
  if (!['development', 'test'].includes(process.env.NODE_ENV)) {
    // it's not local dev env -> case 2
    if (!key) {
      console.log('*** FATAL ERROR: Logging service ingestion key is not provided. Exiting now...');
      process.exit(1);
    }

    const logServerStream: any = {
      stream: new LogDNA({
        key,
        hostname: process.env.NODE_ENV || `temp-wrong-env_${process.env.NODE_ENV}`,
        index_meta: true
      }),
      type: 'raw' // has to be used for LogDNA LaaS
    };

    Object.assign(stream, logServerStream);
    logDestination = 'the Log Server';

    // default is to log from 'debug' onward. But if it's not enabled, switch to log from 'info' onward
    if (process.env.DEBUG_ENABLE !== 'true') {
      logLevel = 'info';
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    logger.addStream(Object.assign(stream, { level: logLevel }));
    console.log(`*** LOGGING TO ${logDestination} FROM LEVEL ${logLevel}`);
  } else {
    console.log(`*** TEST env... do not log`);
  }

  app.log = logger;
}

/**
 * Initialize the Firebase service connection
 *
 * @param app
 */
export function initFirebase(app) {
  const firebaseConfig = process.env.NODE_ENV === 'production' ?
    app.config.firebaseConfig :
    require('../../config/local.env.json').firebaseConfig;

  firebase.initializeApp(firebaseConfig);

  /*
   * Get a reference to the Firebase DB service and set it as property of the app object
   */
  app.firebaseDb = firebase.database();
}
