'use strict';

const expect = require('chai').expect;
const createError = require('../../../src/util/create-error');

describe('create-error', () => {

  it('should return an Error object only with a message when no data is provided', () => {
    const err = createError.default('Some error');

    expect(err).to.be.a('error');
    expect(err.message).to.equal('Some error');
    expect(err.data).to.deep.equal({ statusCode: 500 });
  });

  it('should return an Error object with message and data when both are provided, but no statusCode provided', () => {
    const err = createError.default('Some error', { sample: 'data' });

    expect(err).to.be.a('error');
    expect(err.message).to.equal('Some error');
    expect(err.data).to.deep.equal({ sample: 'data', statusCode: 500 });
  });

  it('should return an Error object with everything provided', () => {
    const err = createError.default('Some error', { sample: 'data', statusCode: createError.errorType.badRequest });

    expect(err).to.be.a('error');
    expect(err.message).to.equal('Some error');
    expect(err.data).to.deep.equal({ sample: 'data', statusCode: 400 });
  });

});
