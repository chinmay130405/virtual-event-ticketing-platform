const test = require('node:test');
const assert = require('node:assert/strict');

const { validateOrganizerRegistration } = require('../utils/organizerVerification');

test('validateOrganizerRegistration accepts valid organizer payload', () => {
  const result = validateOrganizerRegistration({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: '22AAAAA0000A1Z5',
    businessAddress: 'Mumbai, India',
  });

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test('validateOrganizerRegistration rejects missing companyName', () => {
  const result = validateOrganizerRegistration({
    gstNumber: '22AAAAA0000A1Z5',
    businessAddress: 'Mumbai, India',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.includes('companyName is required'), true);
});

test('validateOrganizerRegistration rejects invalid GST format', () => {
  const result = validateOrganizerRegistration({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: 'INVALID-GST',
    businessAddress: 'Mumbai, India',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.includes('gstNumber format is invalid'), true);
});

test('validateOrganizerRegistration rejects missing businessAddress', () => {
  const result = validateOrganizerRegistration({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: '22AAAAA0000A1Z5',
  });

  assert.equal(result.valid, false);
  assert.equal(result.errors.includes('businessAddress is required'), true);
});
