import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let adminHeader;
let cashierHeader;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  adminHeader = authHeader('admin');
  cashierHeader = authHeader('cashier');

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('rejects unauthenticated requests, and cashier cannot manage inventory', async () => {
  const anonRes = await fetch(`${baseUrl}/api/inventory`);
  assert.equal(anonRes.status, 401);

  const cashierRes = await fetch(`${baseUrl}/api/inventory`, { headers: cashierHeader });
  assert.equal(cashierRes.status, 403);
});

test('creates, lists, and updates an inventory item', async () => {
  const createRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Flour', unit: 'kg', quantityOnHand: 50, lowStockThreshold: 10 }),
  });
  assert.equal(createRes.status, 201);
  const item = await createRes.json();
  assert.equal(item.name, 'Flour');

  const listRes = await fetch(`${baseUrl}/api/inventory`, { headers: adminHeader });
  const items = await listRes.json();
  assert.ok(items.some((i) => i._id === item._id));

  const updateRes = await fetch(`${baseUrl}/api/inventory/${item._id}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ lowStockThreshold: 15 }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).lowStockThreshold, 15);
});

test('adjusts stock by a relative delta in either direction, clamped at zero', async () => {
  const createRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Tomatoes', unit: 'kg', quantityOnHand: 5 }),
  });
  const item = await createRes.json();

  const restockRes = await fetch(`${baseUrl}/api/inventory/${item._id}/adjust`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ delta: 20 }),
  });
  assert.equal(restockRes.status, 200);
  assert.equal((await restockRes.json()).quantityOnHand, 25);

  const useRes = await fetch(`${baseUrl}/api/inventory/${item._id}/adjust`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ delta: -100 }),
  });
  assert.equal(useRes.status, 200);
  assert.equal((await useRes.json()).quantityOnHand, 0); // clamped, never negative
});

test('rejects a non-numeric adjustment delta', async () => {
  const createRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Rice' }),
  });
  const item = await createRes.json();

  const res = await fetch(`${baseUrl}/api/inventory/${item._id}/adjust`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ delta: 'a lot' }),
  });
  assert.equal(res.status, 400);
});

test('deletes an inventory item', async () => {
  const createRes = await fetch(`${baseUrl}/api/inventory`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Sugar' }),
  });
  const item = await createRes.json();

  const deleteRes = await fetch(`${baseUrl}/api/inventory/${item._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 204);
});

test('404s updating/deleting/adjusting an unknown inventory item', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();

  const updateRes = await fetch(`${baseUrl}/api/inventory/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Ghost' }),
  });
  assert.equal(updateRes.status, 404);

  const adjustRes = await fetch(`${baseUrl}/api/inventory/${fakeId}/adjust`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ delta: 1 }),
  });
  assert.equal(adjustRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/inventory/${fakeId}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 404);
});
