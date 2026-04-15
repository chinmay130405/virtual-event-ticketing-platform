const DEFAULT_PLATFORM_COMMISSION_RATE = 0.1;

const roundCurrency = (value) => {
  return Math.round((value + Number.EPSILON) * 100) / 100;
};

const calculateCommissionBreakdown = ({
  grossAmount,
  commissionRate = DEFAULT_PLATFORM_COMMISSION_RATE,
}) => {
  if (!Number.isFinite(grossAmount) || grossAmount < 0) {
    throw new Error('grossAmount must be >= 0');
  }

  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    throw new Error('commissionRate must be between 0 and 1');
  }

  const normalizedGrossAmount = roundCurrency(grossAmount);
  const commissionAmount = roundCurrency(normalizedGrossAmount * commissionRate);
  const netPayoutAmount = roundCurrency(normalizedGrossAmount - commissionAmount);

  return {
    grossAmount: normalizedGrossAmount,
    commissionRate,
    commissionAmount,
    netPayoutAmount,
  };
};

module.exports = {
  DEFAULT_PLATFORM_COMMISSION_RATE,
  calculateCommissionBreakdown,
};
