'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const UserService = require('../../../src/services/UserService').default;
const bcrypt = require('bcryptjs');
// const firebaseTest = require('firebase-functions-test')();

describe('UserService', () => {
  const sandbox = sinon.sandbox.create();
  const service = new UserService({
    log: {
      error: () => {
      },
      info: () => {
      },
      debug: () => {
      }
    },
    service: {
      AuthService: {
        signToken: () => {
        }
      }
    },
    sequelize: {
      models: {
        users: {
          findOne: () => {
          },
          create: () => {
          }
        }
      }
    },
    firebaseDb: {
      ref: () => {
        return {
          once: () => {
          },
          set: () => {
          }
        }
      }
    }
  });
  const contactData = { name: 'asd', email: 'example@test.com', phone: 12345678 };

  afterEach(() => {
    sandbox.restore();
  });

  describe('signup', () => {
    it('should return a JWT when creating a new user', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve(null));
      sandbox.stub(service.sequelize.models.users, 'create').returns(Promise.resolve({
        id: 1,
        email: 'example@test.com'
      }));
      sandbox.stub(service.app.service.AuthService, 'signToken').returns(Promise.resolve('asdfExampleToken'));

      const token = await service.signup('example@test.com', 'asdfPassword');
      expect(token).to.equal('asdfExampleToken');
    });

    it('should return an error when creating a new user returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve(null));
      sandbox.stub(service.sequelize.models.users, 'create').returns(Promise.reject({ some: 'error' }));
      // sandbox.stub(userService.app.service.AuthService, 'signToken').returns(Promise.resolve('asdfExampleToken'));

      try {
        await service.signup('example@test.com', 'asdfPassword');
      } catch (err) {
        expect(err.message).to.equal('Whoops... something went wrong. Could not create a new user');
        expect(err.data).to.deep.equal({ email: 'example@test.com', statusCode: 500 });
      }
    });

    it('should return an error when signing a token for the new user returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve(null));
      sandbox.stub(service.sequelize.models.users, 'create').returns(Promise.resolve({
        id: 1,
        email: 'example@test.com'
      }));
      sandbox.stub(service.app.service.AuthService, 'signToken').returns(Promise.reject({ some: 'error' }));

      try {
        await service.signup('example@test.com', 'asdfPassword');
      } catch (err) {
        expect(err).to.deep.equal({ some: 'error' });
      }
    });


    it('should return an error when hashing the password returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve(null));
      sandbox.stub(bcrypt, 'hash').throws({ some: 'error' });
      const createUserStub = sandbox.stub(service.sequelize.models.users, 'create');
      const signTokenStub = sandbox.stub(service.app.service.AuthService, 'signToken');

      try {
        await service.signup('example@test.com', 'asdfPassword');
      } catch (err) {
        expect(createUserStub.notCalled).to.equal(true);
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Server Error')
      }
    });

    it('should return an error when a user already exists', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve({ some: 'user' }));
      const createUserStub = sandbox.stub(service.sequelize.models.users, 'create');
      const signTokenStub = sandbox.stub(service.app.service.AuthService, 'signToken');

      try {
        await service.signup('example@test.com', 'asdfPassword');
      } catch (err) {
        expect(createUserStub.notCalled).to.equal(true);
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('User with this email already exists');
        expect(err.data).to.deep.equal({ email: 'example@test.com', statusCode: 400 });
      }
    });

    it('should return an error when checking for an existing user returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.reject({ some: 'error' }));
      const createUserStub = sandbox.stub(service.sequelize.models.users, 'create');
      const signTokenStub = sandbox.stub(service.app.service.AuthService, 'signToken');

      try {
        await service.signup('example@test.com', 'asdfPassword');
      } catch (err) {
        expect(createUserStub.notCalled).to.equal(true);
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Server Error');
      }
    });
  });

  describe.skip('createContact', () => {
    it('should return a new list of contacts for the user', async () => {
      sandbox.stub(service.firebaseDb.ref, 'once').returns(Promise.resolve({
        val: () => {
          return null;
        }
      }));
      sandbox.stub(service.firebaseDb.ref, 'set').returns(Promise.resolve(null));

      const newContact = await service.createContact('1', contactData);
      expect(newContact).to.deep.equal([contactData]); // notice that it equals an array of the provided contactData
    });
  });

});
