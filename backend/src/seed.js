import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import TaxCategory from './models/TaxCategory.js';
import VatRate from './models/VatRate.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/restaurant_pos';

// Placeholder Irish rates — confirm with Revenue Commissioners / an accountant before go-live (PRD.md §6.5.2).
const TAX_CATEGORY_RATES = [
  { name: 'hot_food', dine_in: 0.135, takeaway: 0.135 },
  { name: 'cold_food', dine_in: 0.135, takeaway: 0 },
  { name: 'soft_drink', dine_in: 0.23, takeaway: 0.23 },
  { name: 'alcohol', dine_in: 0.23, takeaway: 0.23 },
];

async function seedTaxCategoriesAndRates() {
  const effectiveFrom = new Date();

  for (const { name, dine_in, takeaway } of TAX_CATEGORY_RATES) {
    const taxCategory = await TaxCategory.findOneAndUpdate(
      { name },
      { name },
      { upsert: true, new: true }
    );

    for (const [orderType, rate] of [
      ['dine_in', dine_in],
      ['takeaway', takeaway],
    ]) {
      const existing = await VatRate.findOne({
        taxCategoryId: taxCategory._id,
        orderType,
        effectiveTo: null,
      });
      if (existing) continue;

      await VatRate.create({
        taxCategoryId: taxCategory._id,
        orderType,
        rate,
        effectiveFrom,
        effectiveTo: null,
      });
    }
  }

  console.log('Seeded tax categories and VAT rates.');
}

async function run() {
  await connectDB(MONGO_URI);
  await seedTaxCategoriesAndRates();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
