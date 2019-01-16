'use strict';

import { UserModel } from '../models/User';
import { default as createError, errorType } from '../util/create-error';
import ContactData = Inputs.ContactInput;

const bcrypt = require('bcryptjs');

export default class UserService {
  app: any;
  private readonly sequelize: any;
  private readonly firebaseDb: any;

  constructor(app: any) {
    this.app = app;
    this.sequelize = this.app.sequelize;
    this.firebaseDb = this.app.firebaseDb;
  }

  /**
   * Create a new user account record and returns a JWT
   *
   * @param {string} email      The email of the user account to be created
   * @param {string} password   The password of the account to be created
   * @return {Promise<string>}  A JWT
   */
  async signup(email: string, password: string): Promise<string> {
    const saltRounds: number = 10;
    let passwordHash: string;

    let existingUser: UserModel;
    try {
      existingUser = await this.sequelize.models.users.findOne({
        where: { email },
        raw: true
      });
    } catch (err) {
      this.app.log.error({ email }, 'Could not query DB to check for existing user');
      throw createError('Server Error');
    }

    if (existingUser) {
      this.app.log.error({ email }, 'User with this email already exists');
      throw createError('User with this email already exists', { email, statusCode: errorType.badRequest });
    }

    try {
      passwordHash = await bcrypt.hash(password, saltRounds);
    } catch (err) {
      this.app.log.error('Could not hash password');
      throw createError('Server Error');
    }


    let newUser: UserModel;
    try {
      newUser = await this.sequelize.models.users.create({
        email, password: passwordHash
      });

      if (!newUser) {
        this.app.log.error({ email }, 'Could not create user');
        throw createError('Could not create a new user', { email });
      }

      this.app.log.info({ userId: newUser.id, email: newUser.email }, 'New user created');

      return this.app.service.AuthService.signToken({ userId: newUser.id });

    } catch (err) {
      this.app.log.error({ email }, 'Could not create new user record in DB');
      throw createError('Whoops... something went wrong. Could not create a new user', { email });
    }
  }

  /**
   * Creates a new contact record for a user account.
   * If the user has no contacts list already, create one with its first contact.
   *
   * @param {string}      userId   The ID of the user in the current system
   * @param {ContactData} newContact  The contact object to be created
   */
  async createContact(userId: string, newContact: ContactData): Promise<ContactData[]> {
    let userContacts: ContactData[] | null;
    try {
      const userData: any = await this.firebaseDb.ref(`users/${userId}`).once('value');
      userContacts = userData.val();
    } catch (err) {
      this.app.log.error(err, 'Could not retrieve user data from Firebase');
      throw createError('Server Error');
    }

    if (userContacts) {
      this.app.log.debug({ userId, newContact }, 'Adding new contact to user contacts list');

      try {
        userContacts.push(newContact);
        await this.firebaseDb.ref(`users/${userId}`).set(userContacts);

        this.app.log.info({ userId, newContact }, 'New contact added');

        return userContacts;
      } catch (err) {
        this.app.log.error(err, 'Could not update/add contacts to user record in Firebase');
        throw createError('Server Error');
      }
    } else {
      this.app.log.debug({ userId, newContact }, 'User has no contacts list. Creating one now...');

      try {
        await this.firebaseDb.ref(`users/${userId}`).set([newContact]);

        this.app.log.info({ userId, newContact }, 'User contacts list created with its first contact');

        return [newContact];
      } catch (err) {
        this.app.log.error(err, 'Could not create new user record in Firebase');
        throw createError('Server Error');
      }
    }
  }
}
