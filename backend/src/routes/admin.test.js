import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import TaxCategory from '../models/TaxCategory.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let adminAuthHeader;
let cashierAuthHeader;

function authHeader(role) {
  const token = jwt.sign({ sub: 'test-user', role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  adminAuthHeader = authHeader('admin');
  cashierAuthHeader = authHeader('cashier');

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('rejects requests with no auth token', async () => {
  const res = await fetch(`${baseUrl}/api/admin/categories`);
  assert.equal(res.status, 401);
});

test('rejects non-admin roles', async () => {
  const res = await fetch(`${baseUrl}/api/admin/categories`, { headers: cashierAuthHeader });
  assert.equal(res.status, 403);
});

test('admin can create, update, and delete a category', async () => {
  const createRes = await fetch(`${baseUrl}/api/admin/categories`, {
    method: 'POST',
    headers: { ...adminAuthHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Drinks', sortOrder: 0 }),
  });
  assert.equal(createRes.status, 201);
  const category = await createRes.json();
  assert.equal(category.name, 'Drinks');
  assert.equal(category.active, true);

  const updateRes = await fetch(`${baseUrl}/api/admin/categories/${category._id}`, {
    method: 'PATCH',
    headers: { ...adminAuthHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: false }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).active, false);

  const deleteRes = await fetch(`${baseUrl}/api/admin/categories/${category._id}`, {
    method: 'DELETE',
    headers: adminAuthHeader,
  });
  assert.equal(deleteRes.status, 204);

  const missingRes = await fetch(`${baseUrl}/api/admin/categories/${category._id}`, {
    method: 'PATCH',
    headers: { ...adminAuthHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({ active: true }),
  });
  assert.equal(missingRes.status, 404);
});

test('admin can create a menu item referencing a category and tax category', async () => {
  const [category, taxCategory] = await Promise.all([
    mongoose.model('Category').create({ name: 'Food' }),
    TaxCategory.create({ name: 'cold_food' }),
  ]);

  const res = await fetch(`${baseUrl}/api/admin/menu-items`, {
    method: 'POST',
    headers: { ...adminAuthHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Cold Sandwich',
      categoryId: category._id,
      basePrice: 5.0,
      taxCategoryId: taxCategory._id,
    }),
  });
  assert.equal(res.status, 201);
  const item = await res.json();
  assert.equal(item.name, 'Cold Sandwich');
  assert.equal(item.basePrice, 5);
});

test('admin can create a modifier group with embedded modifiers', async () => {
  const res = await fetch(`${baseUrl}/api/admin/modifier-groups`, {
    method: 'POST',
    headers: { ...adminAuthHeader, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Milk',
      minSelect: 1,
      maxSelect: 1,
      required: true,
      modifiers: [
        { name: 'Whole', priceDelta: 0 },
        { name: 'Oat', priceDelta: 0.5 },
      ],
    }),
  });
  assert.equal(res.status, 201);
  const group = await res.json();
  assert.equal(group.modifiers.length, 2);
  assert.equal(group.modifiers[1].name, 'Oat');
});
