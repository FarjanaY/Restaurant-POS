import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import { connectDB } from './config/db.js';
import TaxCategory from './models/TaxCategory.js';
import VatRate from './models/VatRate.js';
import Category from './models/Category.js';
import ModifierGroup from './models/ModifierGroup.js';
import MenuItem from './models/MenuItem.js';
import User from './models/User.js';
import Coupon from './models/Coupon.js';
import Table from './models/Table.js';

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
  const pizza = await Category.findOneAndUpdate(
    { name: 'Pizza' },
    { name: 'Pizza', sortOrder: 1 },
    { upsert: true, new: true }
  );
  const burgers = await Category.findOneAndUpdate(
    { name: 'Burgers' },
    { name: 'Burgers', sortOrder: 2 },
    { upsert: true, new: true }
  );
  const pasta = await Category.findOneAndUpdate(
    { name: 'Pasta' },
    { name: 'Pasta', sortOrder: 3 },
    { upsert: true, new: true }
  );
  const food = await Category.findOneAndUpdate(
    { name: 'Food' },
    { name: 'Food', sortOrder: 4 },
    { upsert: true, new: true }
  );
  const desserts = await Category.findOneAndUpdate(
    { name: 'Desserts' },
    { name: 'Desserts', sortOrder: 5 },
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
      description: 'Espresso with steamed milk',
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
      description: 'Fresh-cut sandwich, served chilled',
      categoryId: food._id,
      basePrice: 5.0,
      taxCategoryId: coldFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );

  // Real photos via the Foodish API (https://foodish-api.com) — a free, open
  // API built specifically for placeholder food images in projects like this,
  // not scraped from an arbitrary source. Static image URLs, verified reachable.
  await MenuItem.findOneAndUpdate(
    { name: 'Margherita Pizza' },
    {
      name: 'Margherita Pizza',
      description: 'Classic delight with 100% real mozzarella cheese',
      imageUrl: 'https://foodish-api.com/images/pizza/pizza7.jpg',
      categoryId: pizza._id,
      basePrice: 8.5,
      taxCategoryId: hotFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );
  await MenuItem.findOneAndUpdate(
    { name: 'Classic Beef Burger' },
    {
      name: 'Classic Beef Burger',
      description: 'Juicy beef patty with cheddar cheese',
      imageUrl: 'https://foodish-api.com/images/burger/burger72.jpg',
      categoryId: burgers._id,
      basePrice: 9.99,
      taxCategoryId: hotFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );
  await MenuItem.findOneAndUpdate(
    { name: 'Creamy Alfredo Pasta' },
    {
      name: 'Creamy Alfredo Pasta',
      description: 'Fettuccine pasta with creamy alfredo sauce',
      imageUrl: 'https://foodish-api.com/images/pasta/pasta22.jpg',
      categoryId: pasta._id,
      basePrice: 11.99,
      taxCategoryId: hotFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );
  await MenuItem.findOneAndUpdate(
    { name: 'Chocolate Lava Cake' },
    {
      name: 'Chocolate Lava Cake',
      description: 'Warm chocolate cake with a molten center',
      imageUrl: 'https://foodish-api.com/images/dessert/dessert15.jpg',
      categoryId: desserts._id,
      basePrice: 6.99,
      taxCategoryId: coldFood._id,
      modifierGroupIds: [],
      sortOrder: 0,
    },
    { upsert: true, new: true }
  );

  console.log('Seeded sample menu (categories, modifier groups, menu items).');
}

// Dev-only default PINs — never reuse these in a real deployment.
const DEV_STAFF = [
  { name: 'Alex Admin', role: 'admin', pin: '1111' },
  { name: 'Cara Cashier', role: 'cashier', pin: '2222' },
  { name: 'Kyle Kitchen', role: 'kitchen', pin: '3333' },
  { name: 'Sam Manager', role: 'manager', pin: '4444' },
];

async function seedDevStaff() {
  for (const { name, role, pin } of DEV_STAFF) {
    const exists = await User.findOne({ name });
    if (exists) continue;

    const pinHash = await bcrypt.hash(pin, 10);
    await User.create({ name, role, pinHash, active: true });
  }

  console.log(
    `Seeded dev staff logins (PIN): ${DEV_STAFF.map((u) => `${u.name}=${u.pin}`).join(', ')} — dev only, do not use in production.`
  );
}

// Dev/demo coupons — not a full promo-code admin UI (that's Phase 2 FR10.2),
// just enough real, working codes to exercise the discount-coupon flow end to end.
const DEV_COUPONS = [
  { code: 'WELCOME10', type: 'percent', value: 10 },
  { code: 'SAVE5', type: 'fixed', value: 5 },
];

async function seedCoupons() {
  for (const coupon of DEV_COUPONS) {
    await Coupon.findOneAndUpdate({ code: coupon.code }, coupon, { upsert: true, new: true });
  }
  console.log(`Seeded coupons: ${DEV_COUPONS.map((c) => c.code).join(', ')}`);
}

// Sample floor plan for the optional Tables feature (off by default via
// Settings.tablesEnabled) — harmless to have sitting here unused until an
// admin turns the feature on for a dine-in-style venue.
const DEV_TABLES = [
  { name: 'Table 1', capacity: 2, section: 'Main' },
  { name: 'Table 2', capacity: 2, section: 'Main' },
  { name: 'Table 3', capacity: 4, section: 'Main' },
  { name: 'Table 4', capacity: 4, section: 'Main' },
  { name: 'Table 5', capacity: 6, section: 'Patio' },
  { name: 'Table 6', capacity: 2, section: 'Patio' },
];

async function seedTables() {
  for (const table of DEV_TABLES) {
    await Table.findOneAndUpdate({ name: table.name }, table, { upsert: true, new: true });
  }
  console.log(`Seeded tables: ${DEV_TABLES.map((t) => t.name).join(', ')}`);
}

async function run() {
  await connectDB(MONGO_URI);
  await seedTaxCategoriesAndRates();
  await seedSampleMenu();
  await seedDevStaff();
  await seedCoupons();
  await seedTables();
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
