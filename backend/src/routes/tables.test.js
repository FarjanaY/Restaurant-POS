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
let adminHeader;
let managerHeader;
let cashierHeader;
let kitchenHeader;
let coldSandwich;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  adminHeader = authHeader('admin');
  managerHeader = authHeader('manager');
  cashierHeader = authHeader('cashier');
  kitchenHeader = authHeader('kitchen');

  const coldFood = await TaxCategory.create({ name: 'cold_food' });
  await VatRate.create({
    taxCategoryId: coldFood._id,
    orderType: 'dine_in',
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

test('rejects unauthenticated requests', async () => {
  const res = await fetch(`${baseUrl}/api/tables`);
  assert.equal(res.status, 401);
});

test('kitchen cannot list tables (no register/floor reason to)', async () => {
  const res = await fetch(`${baseUrl}/api/tables`, { headers: kitchenHeader });
  assert.equal(res.status, 403);
});

test('cashier can list tables but cannot create one', async () => {
  const listRes = await fetch(`${baseUrl}/api/tables`, { headers: cashierHeader });
  assert.equal(listRes.status, 200);

  const createRes = await fetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ name: 'Patio 1', capacity: 4 }),
  });
  assert.equal(createRes.status, 403);
});

test('admin/manager can create, update, and list tables with an available status', async () => {
  const createRes = await fetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'T1', capacity: 2, section: 'Main' }),
  });
  assert.equal(createRes.status, 201);
  const table = await createRes.json();
  assert.equal(table.name, 'T1');

  const updateRes = await fetch(`${baseUrl}/api/tables/${table._id}`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ capacity: 6 }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).capacity, 6);

  const listRes = await fetch(`${baseUrl}/api/tables`, { headers: managerHeader });
  const tables = await listRes.json();
  const seen = tables.find((t) => t._id === table._id);
  assert.equal(seen.status, 'available');
  assert.equal(seen.currentOrder, null);
});

test('a table with an active order shows as occupied, and cannot be deleted', async () => {
  const tableRes = await fetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'T2', capacity: 2 }),
  });
  const table = await tableRes.json();

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({
      type: 'dine_in',
      tableId: table._id,
      lines: [{ menuItemId: coldSandwich._id, quantity: 1 }],
    }),
  });
  assert.equal(orderRes.status, 201);

  const listRes = await fetch(`${baseUrl}/api/tables`, { headers: managerHeader });
  const tables = await listRes.json();
  const occupied = tables.find((t) => t._id === table._id);
  assert.equal(occupied.status, 'occupied');
  assert.equal(occupied.currentOrder.tokenNumber, (await orderRes.json()).tokenNumber);

  const deleteRes = await fetch(`${baseUrl}/api/tables/${table._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 409);
});

test('a table can be assigned to an order after creation via PATCH /orders/:id, and freed once voided', async () => {
  const tableRes = await fetch(`${baseUrl}/api/tables`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'T3', capacity: 2 }),
  });
  const table = await tableRes.json();

  const orderRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'dine_in', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await orderRes.json();
  assert.equal(order.tableId, null);

  const patchRes = await fetch(`${baseUrl}/api/orders/${order._id}`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ tableId: table._id }),
  });
  assert.equal(patchRes.status, 200);
  assert.equal((await patchRes.json()).tableId, table._id);

  const voidRes = await fetch(`${baseUrl}/api/orders/${order._id}/void`, {
    method: 'POST',
    headers: cashierHeader,
  });
  assert.equal(voidRes.status, 200);

  const listRes = await fetch(`${baseUrl}/api/tables`, { headers: managerHeader });
  const tables = await listRes.json();
  const freed = tables.find((t) => t._id === table._id);
  assert.equal(freed.status, 'available');

  // Now deletable since nothing active references it.
  const deleteRes = await fetch(`${baseUrl}/api/tables/${table._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 204);
});

test('404s on updating/deleting an unknown table', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const updateRes = await fetch(`${baseUrl}/api/tables/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ capacity: 4 }),
  });
  assert.equal(updateRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/tables/${fakeId}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 404);
});
