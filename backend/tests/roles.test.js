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

test('normalizeRole maps legacy isAdmin boolean to role', () => {
  assert.equal(normalizeRole(undefined, true), 'admin');
  assert.equal(normalizeRole(undefined, false), 'user');
});

test('normalizeRole falls back to user for invalid role', () => {
  assert.equal(normalizeRole('super-admin'), 'user');
  assert.equal(normalizeRole(null, undefined), 'user');
});

test('isAdminUser returns true from role or legacy isAdmin', () => {
  assert.equal(isAdminUser({ role: 'admin', isAdmin: false }), true);
  assert.equal(isAdminUser({ role: 'user', isAdmin: true }), true);
  assert.equal(isAdminUser({ role: 'organizer', isAdmin: false }), false);
});

test('hasAnyRole checks role membership with legacy fallback', () => {
  assert.equal(hasAnyRole({ role: 'organizer' }, ['organizer', 'admin']), true);
  assert.equal(hasAnyRole({ isAdmin: true }, ['admin']), true);
  assert.equal(hasAnyRole({ role: 'user' }, ['admin', 'organizer']), false);
});

test('getPublicRegistrationRole blocks admin role assignment', () => {
  assert.equal(getPublicRegistrationRole('admin'), 'user');
  assert.equal(getPublicRegistrationRole('organizer'), 'user');
  assert.equal(getPublicRegistrationRole('user'), 'user');
  assert.equal(getPublicRegistrationRole('unknown'), 'user');
});
