import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import ModifierGroup from '../models/ModifierGroup.js';
import TaxCategory from '../models/TaxCategory.js';

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const hotFood = await TaxCategory.create({ name: 'hot_food' });
  const drinks = await Category.create({ name: 'Drinks', sortOrder: 0 });
  const inactiveCategory = await Category.create({ name: 'Discontinued', active: false });
  const milk = await ModifierGroup.create({
    name: 'Milk',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [{ name: 'Oat', priceDelta: 0.5 }],
  });

  await MenuItem.create({
    name: 'Latte',
    categoryId: drinks._id,
    basePrice: 3.5,
    taxCategoryId: hotFood._id,
    modifierGroupIds: [milk._id],
  });
  await MenuItem.create({
    name: 'Discontinued Item',
    categoryId: inactiveCategory._id,
    basePrice: 1,
    taxCategoryId: hotFood._id,
    active: false,
  });

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('GET /api/menu returns active categories and items with modifier groups populated', async () => {
  const res = await fetch(`${baseUrl}/api/menu`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.categories.length, 1);
  assert.equal(body.categories[0].name, 'Drinks');

  assert.equal(body.items.length, 1);
  assert.equal(body.items[0].name, 'Latte');
  assert.equal(body.items[0].modifierGroupIds[0].name, 'Milk');
});

test('GET /api/menu/modifier-groups lists modifier groups', async () => {
  const res = await fetch(`${baseUrl}/api/menu/modifier-groups`);
  assert.equal(res.status, 200);

  const groups = await res.json();
  assert.equal(groups.length, 1);
  assert.equal(groups[0].name, 'Milk');
});
