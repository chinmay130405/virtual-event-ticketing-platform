const test = require('node:test');
const assert = require('node:assert/strict');

const { buildAuthUserPayload } = require('../utils/authUserPayload');

test('buildAuthUserPayload returns base auth fields without legacy isAdmin', () => {
  const payload = buildAuthUserPayload({
    _id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
  });

  assert.deepEqual(payload, {
    id: 'u1',
    name: 'Alice',
    email: 'alice@example.com',
    role: 'admin',
  });
  assert.equal('isAdmin' in payload, false);
});

test('buildAuthUserPayload includes verification fields when requested', () => {
  const payload = buildAuthUserPayload(
    {
      _id: 'u2',
      name: 'Org User',
      email: 'org@example.com',
      role: 'organizer',
      verificationStatus: 'pending',
      verificationReason: 'Documents under review',
    },
    { includeVerification: true }
  );

  assert.deepEqual(payload, {
    id: 'u2',
    name: 'Org User',
    email: 'org@example.com',
    role: 'organizer',
    verificationStatus: 'pending',
    verificationReason: 'Documents under review',
  });
});

test('buildAuthUserPayload throws on invalid user input', () => {
  assert.throws(
    () => buildAuthUserPayload(null),
    /user is required/
  );
});
