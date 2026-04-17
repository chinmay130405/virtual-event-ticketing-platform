const USER_PLATFORM_FEE_RATE = 0.02;

const COUPON_CONFIG = {
  NEON20: { discountPercent: 20, owner: 'Neon Growth Squad' },
  KING20: { discountPercent: 20, owner: 'King Performance Media' },
  APDH20: { discountPercent: 20, owner: 'APDH Learning Labs' },
  THUG10: { discountPercent: 10, owner: 'Thug Conversion Studio' },
  DARE10: { discountPercent: 10, owner: 'Dare Digital House' },
  LEEP20: { discountPercent: 20, owner: 'LEEP Community Partners' },
};

const normalizeCouponCode = (code) => String(code || '').trim().toUpperCase();

const getCouponByCode = (code) => {
  const normalizedCode = normalizeCouponCode(code);
  if (!normalizedCode || !COUPON_CONFIG[normalizedCode]) {
    return null;
  }

  return {
    code: normalizedCode,
    ...COUPON_CONFIG[normalizedCode],
  };
};

const calculateCheckoutPricing = ({ subtotal, couponCode }) => {
  const safeSubtotal = Math.max(0, Number(subtotal || 0));
  const coupon = getCouponByCode(couponCode);
  const discountPercent = coupon?.discountPercent || 0;
  const couponDiscountAmount = Number(((safeSubtotal * discountPercent) / 100).toFixed(2));
  const discountedSubtotal = Number((safeSubtotal - couponDiscountAmount).toFixed(2));
  const userPlatformFeeAmount = Number((discountedSubtotal * USER_PLATFORM_FEE_RATE).toFixed(2));
  const payableAmount = Number((discountedSubtotal + userPlatformFeeAmount).toFixed(2));

  return {
    subtotal: Number(safeSubtotal.toFixed(2)),
    couponCode: coupon?.code || '',
    couponOwner: coupon?.owner || '',
    couponDiscountPercent: discountPercent,
    couponDiscountAmount,
    discountedSubtotal,
    userPlatformFeeRate: USER_PLATFORM_FEE_RATE,
    userPlatformFeeAmount,
    payableAmount,
  };
};

module.exports = {
  USER_PLATFORM_FEE_RATE,
  COUPON_CONFIG,
  getCouponByCode,
  calculateCheckoutPricing,
};
