'use strict';

import * as express from 'express';
import createError from '../util/create-error';
import UserInput = Inputs.UserInput;
import ContactInput = Inputs.ContactInput;
import ContactData = Inputs.ContactInput;

const router = express.Router();
const validator = require('koogn').createValidator();

const userInputExample: UserInput = {
  email: 'test1@test.com',
  password: '@asd1234t'
};

const contactInputExample: ContactInput = {
  name: 'Borat',
  email: 'borat@yo.com',
  phone: 12345678
};

/**
 * Creates a new user account
 */
router.post('/', async (req, res, next) => {
  req.app.log.info(`Incoming request: ${req.baseUrl}`);

  if (!validator.isValid(userInputExample, req.body)) {
    return next(createError('Input validation error', { status: 400 }));
  }

  const email: string = req.body.email;
  const password: string = req.body.password;

  let token: string;
  try {
    token = await req.app.service.UserService.signup(email, password);

    res.set('Authorization', `Bearer ${token}`);
    res.status(201);
    res.json({ token });

  } catch (err) {
    return next(err);
  }

});

/**
 * Creates a new contact record for a user account
 */
router.post('/contacts', async (req, res, next) => {
  req.app.log.info({ params: req.body }, `Incoming request: ${req.baseUrl}`);

  if (!validator.isValid(contactInputExample, req.body)) {
    return next(createError('Input validation error', { input: req.body, status: 400 }));
  }

  const contact: ContactData = req.body;

  let contacts: ContactData[];
  try {
    contacts = await req.app.service.UserService.createContact(req.userId, contact);

    res.status(201);
    res.json(contacts);

  } catch (err) {
    return next(err);
  }
});

module.exports = router;
