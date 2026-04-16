const test = require('node:test');
const assert = require('node:assert/strict');

const { transitionPayoutStatus } = require('../utils/payoutTransition');

test('allows admin to mark processing payout as paid', () => {
  const result = transitionPayoutStatus({
    currentStatus: 'processing',
    action: 'mark_paid',
    actorRole: 'admin',
  });

  assert.equal(result.nextStatus, 'paid');
  assert.equal(result.allowed, true);
});

test('allows admin to mark processing payout as failed', () => {
  const result = transitionPayoutStatus({
    currentStatus: 'processing',
    action: 'mark_failed',
    actorRole: 'admin',
  });

  assert.equal(result.nextStatus, 'failed');
  assert.equal(result.allowed, true);
});

test('prevents organizer from finalizing payout status', () => {
  const result = transitionPayoutStatus({
    currentStatus: 'processing',
    action: 'mark_paid',
    actorRole: 'organizer',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'Only admin can finalize payout status');
  assert.equal(result.nextStatus, 'processing');
});

test('prevents invalid action from changing status', () => {
  const result = transitionPayoutStatus({
    currentStatus: 'processing',
    action: 'whatever',
    actorRole: 'admin',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'Invalid payout transition action');
});

test('prevents transition when status is not processing', () => {
  const result = transitionPayoutStatus({
    currentStatus: 'pending',
    action: 'mark_paid',
    actorRole: 'admin',
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, 'Payout must be in processing state for this action');
});
