import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import TaxCategory from '../models/TaxCategory.js';
import VatRate from '../models/VatRate.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import Coupon from '../models/Coupon.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let cashierHeader;
let kitchenHeader;
let coldSandwich;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function createOrder() {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  return res.json(); // total = €10.00 (2x €5.00 cold sandwiches would be needed for a nicer round number)
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  cashierHeader = authHeader('cashier');
  kitchenHeader = authHeader('kitchen');

  const coldFood = await TaxCategory.create({ name: 'cold_food' });
  await VatRate.create({
    taxCategoryId: coldFood._id,
    orderType: 'takeaway',
    rate: 0,
    effectiveFrom: new Date('2020-01-01'),
  });
  const food = await Category.create({ name: 'Food' });
  coldSandwich = await MenuItem.create({
    name: 'Cold Sandwich',
    categoryId: food._id,
    basePrice: 10.0,
    taxCategoryId: coldFood._id,
  });

  await Coupon.create([
    { code: 'TENOFF', type: 'percent', value: 10, active: true },
    { code: 'FIVEOFF', type: 'fixed', value: 5, active: true },
    { code: 'HUGEOFF', type: 'fixed', value: 999, active: true }, // larger than any order — should clamp to 0
    { code: 'DISABLED', type: 'fixed', value: 2, active: false },
    { code: 'EXPIRED', type: 'fixed', value: 2, active: true, expiresAt: new Date('2020-01-01') },
  ]);

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('applies a percent coupon correctly', async () => {
  const order = await createOrder();
  assert.equal(order.total, 10);

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'tenoff' }), // lowercase — should still match (case-insensitive)
  });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.discount, 1); // 10% of €10
  assert.equal(updated.total, 9);
  assert.equal(updated.couponCode, 'TENOFF');
});

test('applies a fixed coupon correctly', async () => {
  const order = await createOrder();
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'FIVEOFF' }),
  });
  const updated = await res.json();
  assert.equal(updated.discount, 5);
  assert.equal(updated.total, 5);
});

test('clamps a fixed coupon larger than the order total to zero, never negative', async () => {
  const order = await createOrder();
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'HUGEOFF' }),
  });
  const updated = await res.json();
  assert.equal(updated.total, 0);
  assert.ok(updated.discount <= 10);
});

test('rejects an unknown coupon code', async () => {
  const order = await createOrder();
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'NOTREAL' }),
  });
  assert.equal(res.status, 404);
});

test('rejects an inactive coupon', async () => {
  const order = await createOrder();
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'DISABLED' }),
  });
  assert.equal(res.status, 404);
});

test('rejects an expired coupon', async () => {
  const order = await createOrder();
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'EXPIRED' }),
  });
  assert.equal(res.status, 410);
});

test('removing a coupon resets the discount', async () => {
  const order = await createOrder();
  await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'FIVEOFF' }),
  });

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'DELETE',
    headers: cashierHeader,
  });
  assert.equal(res.status, 200);
  const updated = await res.json();
  assert.equal(updated.discount, 0);
  assert.equal(updated.couponCode, null);
  assert.equal(updated.total, 10);
});

test('kitchen role cannot apply or remove a coupon', async () => {
  const order = await createOrder();
  const applyRes = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: kitchenHeader,
    body: JSON.stringify({ code: 'FIVEOFF' }),
  });
  assert.equal(applyRes.status, 403);

  const removeRes = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'DELETE',
    headers: kitchenHeader,
  });
  assert.equal(removeRes.status, 403);
});

test('cannot apply a coupon to a paid order', async () => {
  const order = await createOrder();
  await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 10 }),
  });

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/coupon`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ code: 'FIVEOFF' }),
  });
  assert.equal(res.status, 409);
});
