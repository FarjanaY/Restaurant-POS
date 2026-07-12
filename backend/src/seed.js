import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import TaxCategory from './models/TaxCategory.js';
import VatRate from './models/VatRate.js';
import Category from './models/Category.js';
import ModifierGroup from './models/ModifierGroup.js';
import MenuItem from './models/MenuItem.js';

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

// Small sample menu (matches the PRD's "Large Latte, oat milk, extra shot" example) so the menu
// API and order flow have real data to hit during manual testing — not production catalog data.
async function seedSampleMenu() {
  const [hotFood, coldFood] = await Promise.all([
    TaxCategory.findOne({ name: 'hot_food' }),
    TaxCategory.findOne({ name: 'cold_food' }),
  ]);

  const drinks = await Category.findOneAndUpdate(
    { name: 'Drinks' },
    { name: 'Drinks', sortOrder: 0 },
    { upsert: true, new: true }
  );
  const food = await Category.findOneAndUpdate(
    { name: 'Food' },
    { name: 'Food', sortOrder: 1 },
    { upsert: true, new: true }
  );

  const size = await ModifierGroup.findOneAndUpdate(
    { name: 'Size' },
    {
      name: 'Size',
      minSelect: 1,
      maxSelect: 1,
      required: true,
      modifiers: [
        { name: 'Regular', priceDelta: 0 },
        { name: 'Large', priceDelta: 0.5 },
      ],
    },
    { upsert: true, new: true }
  );
  const milk = await ModifierGroup.findOneAndUpdate(
    { name: 'Milk' },
    {
      name: 'Milk',
      minSelect: 1,
      maxSelect: 1,
      required: true,
      modifiers: [
        { name: 'Whole', priceDelta: 0 },
        { name: 'Oat', priceDelta: 0.5 },
        { name: 'Skim', priceDelta: 0 },
      ],
    },
    { upsert: true, new: true }
  );
  const extras = await ModifierGroup.findOneAndUpdate(
    { name: 'Extras' },
    {
      name: 'Extras',
      minSelect: 0,
      maxSelect: 3,
      required: false,
      modifiers: [
        { name: 'Extra Shot', priceDelta: 0.5 },
        { name: 'Whipped Cream', priceDelta: 0.3 },
      ],
    },
    { upsert: true, new: true }
  );

  await MenuItem.findOneAndUpdate(
    { name: 'Latte' },
    {
      name: 'Latte',
      categoryId: drinks._id,
      basePrice: 3.5,
      taxCategoryId: hotFood._id,
      modifierGroupIds: [size._id, milk._id, extras._id],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );
  await MenuItem.findOneAndUpdate(
    { name: 'Cold Sandwich' },
    {
      name: 'Cold Sandwich',
      categoryId: food._id,
      basePrice: 5.0,
      taxCategoryId: coldFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );

  console.log('Seeded sample menu (categories, modifier groups, menu items).');
}

async function run() {
  await connectDB(MONGO_URI);
  await seedTaxCategoriesAndRates();
  await seedSampleMenu();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
