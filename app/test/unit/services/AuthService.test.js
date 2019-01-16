'use strict';

const expect = require('chai').expect;
const sinon = require('sinon');
const AuthService = require('../../../src/services/AuthService').default;
const config = require('../../../config/test.json');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

describe('AuthService', () => {
  const sandbox = sinon.sandbox.create();
  const service = new AuthService({
    config: {
      auth: config.auth
    },
    log: {
      error: () => {
      },
      info: () => {
      },
      debug: () => {
      }
    },
    sequelize: {
      models: {
        users: {
          findOne: () => {
          }
        }
      }
    },
    redis: {
      set: () => {
      },
      get: () => {
      }
    }
  });
  const testPasswordHash = '$2b$10$dazbRfGOpKX0iP448APYiuW0vHrdDW0ezwwGK5Um3jJuoEVvgmUWm';

  afterEach(() => {
    sandbox.restore();
  });

  describe('login', () => {
    it('should return a JWT when signing in a user', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve({
        id: '1',
        email: 'example@test.com',
        password: testPasswordHash
      }));
      sandbox.stub(service, 'signToken').returns(Promise.resolve('asdfExampleToken'));

      const token = await service.login('example@test.com', 'asdf');
      expect(token).to.equal('asdfExampleToken');
    });

    it('should return an error when getting the user returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.reject({ some: 'error' }));
      const bcryptStub = sandbox.stub(bcrypt, 'compare');
      const signTokenStub = sandbox.stub(service, 'signToken');

      try {
        await service.login('example@test.com', 'asdf');
      } catch (err) {
        expect(bcryptStub.notCalled).to.equal(true);
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Could not get user record');
        expect(err.data).to.deep.equal({ email: 'example@test.com', statusCode: 500 });
      }
    });

    it('should return an error when the user does not exist', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve(null));
      const bcryptStub = sandbox.stub(bcrypt, 'compare');
      const signTokenStub = sandbox.stub(service, 'signToken');

      try {
        await service.login('example@test.com', 'asdf');
      } catch (err) {
        expect(bcryptStub.notCalled).to.equal(true);
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Wrong username');
        expect(err.data).to.deep.equal({ email: 'example@test.com', statusCode: 400 });
      }
    });

    it('should return an error when bcrypt password comparison returns "false" (password is wrong)', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve({
        id: '1',
        email: 'example@test.com',
        password: testPasswordHash
      }));
      const signTokenStub = sandbox.stub(service, 'signToken');

      try {
        await service.login('example@test.com', 'asdfWrongPassword');
      } catch (err) {
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Wrong password');
        expect(err.data).to.deep.equal({ statusCode: 400 });
      }
    });

    it('should return an error when bcrypt password comparison returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve({
        id: '1',
        email: 'example@test.com',
        password: testPasswordHash
      }));
      sandbox.stub(bcrypt, 'compare').returns(Promise.reject({ some: 'error' }));
      const signTokenStub = sandbox.stub(service, 'signToken');

      try {
        await service.login('example@test.com', 'asdf');
      } catch (err) {
        expect(signTokenStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Server Error');
      }
    });

    it('should return an error when signing the token returns an error', async () => {
      sandbox.stub(service.sequelize.models.users, 'findOne').returns(Promise.resolve({
        id: '1',
        email: 'example@test.com',
        password: testPasswordHash
      }));
      sandbox.stub(service, 'signToken').returns(Promise.reject({ some: 'error' }));

      try {
        await service.login('example@test.com', 'asdf');
      } catch (err) {
        expect(err).to.deep.equal({ some: 'error' });
      }
    });

  });

  describe('signToken', () => {
    it('should return a JWT', async () => {
      sandbox.stub(service.redis, 'set').returns(Promise.resolve('OK'));

      const token = await service.signToken({ userId: '123' });

      expect(typeof token).to.equal('string');
      const payload = jwt.decode(token);
      expect(payload.userId).to.equal('123');
    });

    it('should return an error when signing the payload returns an error', async () => {
      const redisStub = sandbox.stub(service.redis, 'set');

      try {
        await service.signToken({ userId: '123' });
      } catch (err) {
        expect(redisStub.notCalled).to.equal(true);
        expect(err.message).to.equal('Server Error');
      }
    });

    it('should NOT return an error and only log it when setting the refreshToken in Redis returns an error', async () => {
      const redisStub = sandbox.stub(service.redis, 'set').returns(Promise.reject({ some: 'error' }));
      const logErrorStub = sandbox.stub(service.app.log, 'error');

      const token = await service.signToken({ userId: '123' });

      const payload = jwt.decode(token);
      expect(payload.userId).to.equal('123');

      expect(redisStub.calledOnce).to.equal(true);
      expect(logErrorStub.calledOnce).to.equal(true);
    });

  });

  describe('refreshAuth', () => {
    it('should return a new JWT and the userId', async () => {
      sandbox.stub(service.redis, 'get').returns(Promise.resolve(true));
      sandbox.stub(service, 'signToken').returns(Promise.resolve('anotherIrrelevantTokenValue'));
      sandbox.stub(jwt, 'decode').returns({ userId: '123' });

      const { newToken, userId } = await service.refreshAuth('someIrrelevantJwtValue');

      expect(newToken).to.equal('anotherIrrelevantTokenValue');
      expect(userId).to.equal('123');
    });

    it('should return an error when the refresh token does not exist', async () => {
      sandbox.stub(service.redis, 'get').returns(Promise.resolve(null));
      const signTokenStub = sandbox.stub(service, 'signToken');
      const decodeStub = sandbox.stub(jwt, 'decode');
      const logErrorStub = sandbox.stub(service.app.log, 'error');

      try {
        await service.refreshAuth('someIrrelevantJwtValue');
      } catch (err) {
        expect(err.message).to.equal('Invalid access token');
        expect(signTokenStub.notCalled).to.equal(true);
        expect(decodeStub.notCalled).to.equal(true);
        expect(logErrorStub.calledTwice).to.equal(true);
      }
    });

    it('should return an error when signing the new token returns an error', async () => {
      sandbox.stub(service.redis, 'get').returns(Promise.resolve(true));
      sandbox.stub(service, 'signToken').returns(Promise.reject({ some: 'error' }));
      const logErrorStub = sandbox.stub(service.app.log, 'error');

      try {
        await service.refreshAuth('someIrrelevantJwtValue');
      } catch (err) {
        expect(err.message).to.equal('Invalid access token');
        expect(logErrorStub.calledOnce).to.equal(true);
      }
    });

  });


});
