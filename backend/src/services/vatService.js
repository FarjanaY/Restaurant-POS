import VatRate from '../models/VatRate.js';

// Resolves the VAT rate for (taxCategory, orderType) effective at `atDate`.
// Never trust a cached/hard-coded rate — rates are effective-dated and can change.
export async function resolveVatRate(taxCategoryId, orderType, atDate = new Date()) {
  const rate = await VatRate.findOne({
    taxCategoryId,
    orderType,
    effectiveFrom: { $lte: atDate },
    $or: [{ effectiveTo: null }, { effectiveTo: { $gte: atDate } }],
  }).sort({ effectiveFrom: -1 });

  if (!rate) {
    const err = new Error(
      `No VAT rate found for taxCategoryId=${taxCategoryId} orderType=${orderType} at ${atDate.toISOString()}`
    );
    err.status = 422;
    throw err;
  }

  return rate.rate;
}
