const test = require('node:test');
const assert = require('node:assert/strict');

const { calculateCommissionBreakdown } = require('../utils/commission');

test('calculateCommissionBreakdown applies default 10% commission', () => {
  const result = calculateCommissionBreakdown({ grossAmount: 1000 });

  assert.equal(result.grossAmount, 1000);
  assert.equal(result.commissionRate, 0.1);
  assert.equal(result.commissionAmount, 100);
  assert.equal(result.netPayoutAmount, 900);
});

test('calculateCommissionBreakdown handles decimal rounding to two places', () => {
  const result = calculateCommissionBreakdown({ grossAmount: 999.99, commissionRate: 0.1234 });

  assert.equal(result.grossAmount, 999.99);
  assert.equal(result.commissionRate, 0.1234);
  assert.equal(result.commissionAmount, 123.4);
  assert.equal(result.netPayoutAmount, 876.59);
});

test('calculateCommissionBreakdown rejects invalid gross amount', () => {
  assert.throws(() => calculateCommissionBreakdown({ grossAmount: -1 }), /grossAmount must be >= 0/);
  assert.throws(() => calculateCommissionBreakdown({ grossAmount: NaN }), /grossAmount must be >= 0/);
});

test('calculateCommissionBreakdown rejects invalid commission rate', () => {
  assert.throws(
    () => calculateCommissionBreakdown({ grossAmount: 100, commissionRate: -0.1 }),
    /commissionRate must be between 0 and 1/
  );
  assert.throws(
    () => calculateCommissionBreakdown({ grossAmount: 100, commissionRate: 2 }),
    /commissionRate must be between 0 and 1/
  );
});
