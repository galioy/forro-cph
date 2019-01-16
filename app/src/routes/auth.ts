'use strict';

import * as express from 'express';
import createError from '../util/create-error';
import UserInput = Inputs.UserInput;

const validator = require('koogn').createValidator();
const router = express.Router();

const authInputExample: UserInput = {
  email: 'test1@test.com',
  password: '@asd1234t'
};

/**
 * Verifies login credentials and returns a JWT
 */
router.post('/login', async (req, res, next) => {
  req.app.log.info({
    params: req.body
  }, `Incoming request: ${req.baseUrl}`);

  if (!validator.isValid(authInputExample, req.body)) {
    return next(createError('Input validation error', { status: 400 }));
  }

  const email: string = req.body.email;
  const password: string = req.body.password;

  let token: string;
  try {
    token = await req.app.service.AuthService.login(email, password);

    res.set('Authorization', `Bearer ${token}`);
    res.status(200);
    res.json({ token });

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
