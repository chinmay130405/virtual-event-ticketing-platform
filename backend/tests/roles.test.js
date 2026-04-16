const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeRole,
  isAdminUser,
  hasAnyRole,
  getPublicRegistrationRole,
} = require('../utils/roles');

test('normalizeRole returns role when valid', () => {
  assert.equal(normalizeRole('admin'), 'admin');
  assert.equal(normalizeRole('organizer'), 'organizer');
  assert.equal(normalizeRole('user'), 'user');
});

test('normalizeRole falls back to user for invalid role', () => {
  assert.equal(normalizeRole('super-admin'), 'user');
  assert.equal(normalizeRole(null), 'user');
});

test('isAdminUser returns true only for admin role', () => {
  assert.equal(isAdminUser({ role: 'admin' }), true);
  assert.equal(isAdminUser({ role: 'user' }), false);
  assert.equal(isAdminUser({ role: 'organizer' }), false);
});

test('hasAnyRole checks role membership', () => {
  assert.equal(hasAnyRole({ role: 'organizer' }, ['organizer', 'admin']), true);
  assert.equal(hasAnyRole({ role: undefined }, ['admin']), false);
  assert.equal(hasAnyRole({ role: 'user' }, ['admin', 'organizer']), false);
});

test('getPublicRegistrationRole blocks admin role assignment', () => {
  assert.equal(getPublicRegistrationRole('admin'), 'user');
  assert.equal(getPublicRegistrationRole('organizer'), 'user');
  assert.equal(getPublicRegistrationRole('user'), 'user');
  assert.equal(getPublicRegistrationRole('unknown'), 'user');
});
