import Coupon from '../models/Coupon.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

// Resolves a coupon code against the order's current gross total (before any
// discount), returning the discount amount to apply. Never trusts a
// client-supplied discount — the code is looked up and validated server-side.
export async function resolveCouponDiscount(code, grossTotal) {
  if (!code || !code.trim()) {
    const err = new Error('Coupon code is required');
    err.status = 400;
    throw err;
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (!coupon || !coupon.active) {
    const err = new Error('Invalid or inactive coupon code');
    err.status = 404;
    throw err;
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    const err = new Error('This coupon has expired');
    err.status = 410;
    throw err;
  }

  const rawDiscount = coupon.type === 'percent' ? grossTotal * (coupon.value / 100) : coupon.value;
  // Never discount past zero — a fixed coupon larger than the order just zeroes it out.
  const discount = round2(Math.min(Math.max(rawDiscount, 0), grossTotal));

  return { discount, coupon };
}
