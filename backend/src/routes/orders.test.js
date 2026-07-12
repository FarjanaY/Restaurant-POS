import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import TaxCategory from '../models/TaxCategory.js';
import VatRate from '../models/VatRate.js';
import Category from '../models/Category.js';
import ModifierGroup from '../models/ModifierGroup.js';
import MenuItem from '../models/MenuItem.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let cashierHeader;
let kitchenHeader;
let coldSandwich;
let latte;
let oatMilkId;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  cashierHeader = authHeader('cashier');
  kitchenHeader = authHeader('kitchen');

  const [hotFood, coldFood] = await Promise.all([
    TaxCategory.create({ name: 'hot_food' }),
    TaxCategory.create({ name: 'cold_food' }),
  ]);
  await VatRate.create([
    { taxCategoryId: hotFood._id, orderType: 'dine_in', rate: 0.135, effectiveFrom: new Date('2020-01-01') },
    { taxCategoryId: hotFood._id, orderType: 'takeaway', rate: 0.135, effectiveFrom: new Date('2020-01-01') },
    { taxCategoryId: coldFood._id, orderType: 'dine_in', rate: 0.135, effectiveFrom: new Date('2020-01-01') },
    { taxCategoryId: coldFood._id, orderType: 'takeaway', rate: 0, effectiveFrom: new Date('2020-01-01') },
  ]);

  const drinks = await Category.create({ name: 'Drinks' });
  const milk = await ModifierGroup.create({
    name: 'Milk',
    minSelect: 1,
    maxSelect: 1,
    required: true,
    modifiers: [
      { name: 'Whole', priceDelta: 0 },
      { name: 'Oat', priceDelta: 0.5 },
    ],
  });
  oatMilkId = milk.modifiers[1]._id.toString();

  latte = await MenuItem.create({
    name: 'Latte',
    categoryId: drinks._id,
    basePrice: 3.5,
    taxCategoryId: hotFood._id,
    modifierGroupIds: [milk._id],
  });
  coldSandwich = await MenuItem.create({
    name: 'Cold Sandwich',
    categoryId: drinks._id,
    basePrice: 5.0,
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

test('rejects unauthenticated and kitchen-role requests', async () => {
  const noAuth = await fetch(`${baseUrl}/api/orders`);
  assert.equal(noAuth.status, 401);

  const kitchenReq = await fetch(`${baseUrl}/api/orders`, { headers: kitchenHeader });
  assert.equal(kitchenReq.status, 403);
});

test('creates a dine-in order with a modifier and computes VAT correctly', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({
      type: 'dine_in',
      lines: [{ menuItemId: latte._id, quantity: 1, modifierIds: [oatMilkId] }],
    }),
  });
  assert.equal(res.status, 201);

  const order = await res.json();
  assert.equal(order.tokenNumber, 1);
  assert.equal(order.status, 'open');
  assert.equal(order.lines[0].unitPrice, 4.0); // 3.50 + 0.50 oat milk
  assert.equal(order.lines[0].nameSnapshot, 'Latte');
  assert.equal(order.lines[0].modifiers[0].nameSnapshot, 'Oat');
  assert.equal(order.total, 4.0);
});

test('a second order gets the next sequential token', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await res.json();
  assert.equal(order.tokenNumber, 2);
  assert.equal(order.vatTotal, 0); // zero-rated cold takeaway
});

test('rejects an order line for an unknown menu item', async () => {
  const res = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({
      type: 'takeaway',
      lines: [{ menuItemId: new mongoose.Types.ObjectId().toString(), quantity: 1 }],
    }),
  });
  assert.equal(res.status, 422);
});

test('create is idempotent by clientOrderId', async () => {
  const body = JSON.stringify({
    type: 'takeaway',
    clientOrderId: 'client-abc-123',
    lines: [{ menuItemId: coldSandwich._id, quantity: 1 }],
  });

  const first = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: cashierHeader, body });
  assert.equal(first.status, 201);
  const firstOrder = await first.json();

  const second = await fetch(`${baseUrl}/api/orders`, { method: 'POST', headers: cashierHeader, body });
  assert.equal(second.status, 200);
  const secondOrder = await second.json();
  assert.equal(secondOrder._id, firstOrder._id);
});

test('hold, recall, and edit an open order', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();

  const holdRes = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ status: 'held' }),
  });
  assert.equal((await holdRes.json()).status, 'held');

  const recallRes = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ status: 'open' }),
  });
  assert.equal((await recallRes.json()).status, 'open');

  const editRes = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ lines: [{ menuItemId: coldSandwich._id, quantity: 2 }] }),
  });
  const edited = await editRes.json();
  assert.equal(edited.lines[0].quantity, 2);
  assert.equal(edited.total, 10.0);
});

test('changing order type alone recomputes VAT without resending lines', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();
  assert.equal(order.vatTotal, 0);

  const res = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'dine_in' }),
  });
  const updated = await res.json();
  assert.equal(updated.vatTotal, 0.59);
  assert.equal(updated.total, 5.0); // same displayed price, only the VAT split changes
});

test('voids an unpaid order but rejects voiding it twice', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();

  const voidRes = await fetch(`${baseUrl}/api/orders/${order._id}/void`, {
    method: 'POST',
    headers: cashierHeader,
  });
  assert.equal(voidRes.status, 200);
  assert.equal((await voidRes.json()).status, 'voided');

  const secondVoid = await fetch(`${baseUrl}/api/orders/${order._id}/void`, {
    method: 'POST',
    headers: cashierHeader,
  });
  assert.equal(secondVoid.status, 409);
});

test('rejects editing a voided order', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();
  await fetch(`${baseUrl}/api/orders/${order._id}/void`, { method: 'POST', headers: cashierHeader });

  const editRes = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ status: 'held' }),
  });
  assert.equal(editRes.status, 409);
});

test('order-level notes can be set on creation and changed via PATCH', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({
      type: 'takeaway',
      notes: 'No napkins',
      lines: [{ menuItemId: coldSandwich._id, quantity: 1 }],
    }),
  });
  const order = await createRes.json();
  assert.equal(order.notes, 'No napkins');

  const res = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ notes: 'Extra napkins' }),
  });
  assert.equal((await res.json()).notes, 'Extra napkins');
});
