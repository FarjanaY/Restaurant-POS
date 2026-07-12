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
let kitchenHeader;
let coldSandwich;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function createPaidOrder() {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();

  const payRes = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 5 }),
  });
  return payRes.json();
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
    basePrice: 5,
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

test('cashier cannot bump a line or complete an order', async () => {
  const order = await createPaidOrder();

  const lineRes = await fetch(`${baseUrl}/api/orders/${order._id}/lines/${order.lines[0]._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ done: true }),
  });
  assert.equal(lineRes.status, 403);

  const completeRes = await fetch(`${baseUrl}/api/orders/${order._id}/complete`, {
    method: 'POST',
    headers: cashierHeader,
  });
  assert.equal(completeRes.status, 403);
});

test('kitchen can mark a line done, then complete (bump) the whole order', async () => {
  const order = await createPaidOrder();

  const lineRes = await fetch(`${baseUrl}/api/orders/${order._id}/lines/${order.lines[0]._id}`, {
    method: 'PATCH',
    headers: kitchenHeader,
    body: JSON.stringify({ done: true }),
  });
  assert.equal(lineRes.status, 200);
  assert.equal((await lineRes.json()).lines[0].done, true);

  const completeRes = await fetch(`${baseUrl}/api/orders/${order._id}/complete`, {
    method: 'POST',
    headers: kitchenHeader,
  });
  assert.equal(completeRes.status, 200);
  const completed = await completeRes.json();
  assert.equal(completed.status, 'completed');
  assert.ok(completed.lines.every((line) => line.done));
});

test('rejects completing an order twice', async () => {
  const order = await createPaidOrder();
  await fetch(`${baseUrl}/api/orders/${order._id}/complete`, { method: 'POST', headers: kitchenHeader });

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/complete`, {
    method: 'POST',
    headers: kitchenHeader,
  });
  assert.equal(res.status, 409);
});

test('rejects bumping a line on an order that has not reached the kitchen yet', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();

  const res = await fetch(`${baseUrl}/api/orders/${order._id}/lines/${order.lines[0]._id}`, {
    method: 'PATCH',
    headers: kitchenHeader,
    body: JSON.stringify({ done: true }),
  });
  assert.equal(res.status, 409);
});
