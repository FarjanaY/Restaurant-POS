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

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let cashierHeader;
let coldSandwich;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function createOrder(basePrice) {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await res.json();
  assert.equal(order.total, basePrice);
  return order;
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  cashierHeader = authHeader('cashier');

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
    basePrice: 7.3,
    taxCategoryId: coldFood._id,
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

test('cash payment of €10 on a €7.30 order gives €2.70 change and marks the order paid', async () => {
  const order = await createOrder(7.3);

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 10 }),
  });
  assert.equal(res.status, 201);

  const paid = await res.json();
  assert.equal(paid.status, 'paid');
  assert.equal(paid.payments[0].amount, 7.3);
  assert.equal(paid.payments[0].change, 2.7);
  assert.ok(paid.closedAt);
});

test('split tender across two cash payments only completes the order on the second', async () => {
  const order = await createOrder(7.3);

  const first = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 3 }),
  });
  const firstBody = await first.json();
  assert.equal(firstBody.status, 'open');
  assert.equal(firstBody.payments[0].amount, 3);
  assert.equal(firstBody.payments[0].change, 0);

  const second = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 4.3 }),
  });
  const secondBody = await second.json();
  assert.equal(secondBody.status, 'paid');
  assert.equal(secondBody.payments.length, 2);
});

test('rejects a second payment once the order is fully paid', async () => {
  const order = await createOrder(7.3);
  await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 10 }),
  });

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 5 }),
  });
  assert.equal(res.status, 409);
});

test('rejects payment on a voided order', async () => {
  const order = await createOrder(7.3);
  await fetch(`${baseUrl}/api/orders/${order._id}/void`, { method: 'POST', headers: cashierHeader });

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 10 }),
  });
  assert.equal(res.status, 409);
});

test('rejects a cash payment with no tendered amount', async () => {
  const order = await createOrder(7.3);
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash' }),
  });
  assert.equal(res.status, 400);
});

test('rejects a card payment with no paymentIntentId', async () => {
  // Full card-payment business logic (success/failure verification against
  // Stripe) is covered in cardPayments.test.js via dependency injection —
  // this only checks the input validation reachable through the real route.
  const order = await createOrder(7.3);
  const res = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'card' }),
  });
  assert.equal(res.status, 400);
});
