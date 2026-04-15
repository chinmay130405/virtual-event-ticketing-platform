const test = require('node:test');
const assert = require('node:assert/strict');

const { verifyOrganizerAuthenticity } = require('../utils/organizerAuthenticity');

test('verifyOrganizerAuthenticity approves trusted signals', async () => {
  const result = await verifyOrganizerAuthenticity({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: '22AAAAA0000A1Z5',
    businessAddress: 'Mumbai, India',
    venueRegistration: 'VENUE-001',
  });

  assert.equal(result.autoApproved, true);
  assert.equal(result.recommendedStatus, 'approved');
  assert.ok(result.score >= 80);
});

test('verifyOrganizerAuthenticity falls back to manual for missing venue registration', async () => {
  const result = await verifyOrganizerAuthenticity({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: '22AAAAA0000A1Z5',
    businessAddress: 'Mumbai, India',
  });

  assert.equal(result.autoApproved, false);
  assert.equal(result.recommendedStatus, 'pending_manual_review');
  assert.ok(result.score >= 60);
});

test('verifyOrganizerAuthenticity rejects invalid GST', async () => {
  const result = await verifyOrganizerAuthenticity({
    companyName: 'Acme Events Pvt Ltd',
    gstNumber: 'INVALID',
    businessAddress: 'Mumbai, India',
    venueRegistration: 'VENUE-001',
  });

  assert.equal(result.autoApproved, false);
  assert.equal(result.recommendedStatus, 'rejected');
  assert.ok(result.score < 50);
});

test('verifyOrganizerAuthenticity returns deterministic reasons list', async () => {
  const result = await verifyOrganizerAuthenticity({
    companyName: '',
    gstNumber: '',
    businessAddress: '',
    venueRegistration: '',
  });

  assert.equal(Array.isArray(result.reasons), true);
  assert.equal(result.reasons.length > 0, true);
  assert.equal(result.recommendedStatus, 'rejected');
});
