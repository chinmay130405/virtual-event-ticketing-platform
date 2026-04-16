const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

const { generateToken } = require('../utils/jwt');
const { admin } = require('../middleware/auth');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

test('generateToken includes role claim for admin users', () => {
  const token = generateToken('user-1', 'admin');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(decoded.id, 'user-1');
  assert.equal(decoded.role, 'admin');
  assert.equal('isAdmin' in decoded, false);
});

test('generateToken defaults to user role for regular users', () => {
  const token = generateToken('user-2');
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  assert.equal(decoded.id, 'user-2');
  assert.equal(decoded.role, 'user');
  assert.equal('isAdmin' in decoded, false);
});

test('admin middleware allows admin role', () => {
  const req = { user: { role: 'admin' } };
  const res = {
    status() {
      throw new Error('status should not be called for admin role');
    },
  };

  let nextCalled = false;
  admin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('admin middleware rejects non-admin role value', () => {
  const req = { user: { role: 'organizer' } };
  const response = {};
  const res = {
    status(code) {
      response.code = code;
      return {
        json(payload) {
          response.payload = payload;
        },
      };
    },
  };

  let nextCalled = false;
  admin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(response.code, 403);
  assert.equal(response.payload.success, false);
});

test('admin middleware rejects non-admin users', () => {
  const req = { user: { role: 'user' } };
  const response = {};
  const res = {
    status(code) {
      response.code = code;
      return {
        json(payload) {
          response.payload = payload;
        },
      };
    },
  };

  let nextCalled = false;
  admin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, false);
  assert.equal(response.code, 403);
  assert.equal(response.payload.success, false);
});
