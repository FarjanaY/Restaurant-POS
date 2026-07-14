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

test('rejects unauthenticated requests, and cashier cannot manage the coupon catalog', async () => {
  const anonRes = await fetch(`${baseUrl}/api/coupons`);
  assert.equal(anonRes.status, 401);

  const cashierRes = await fetch(`${baseUrl}/api/coupons`, { headers: cashierHeader });
  assert.equal(cashierRes.status, 403);
});

test('creates, lists, updates, and deletes a coupon', async () => {
  const createRes = await fetch(`${baseUrl}/api/coupons`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ code: 'summer20', type: 'percent', value: 20 }),
  });
  assert.equal(createRes.status, 201);
  const coupon = await createRes.json();
  assert.equal(coupon.code, 'SUMMER20'); // schema uppercases

  const listRes = await fetch(`${baseUrl}/api/coupons`, { headers: adminHeader });
  const coupons = await listRes.json();
  assert.ok(coupons.some((c) => c._id === coupon._id));

  const updateRes = await fetch(`${baseUrl}/api/coupons/${coupon._id}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ active: false }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).active, false);

  const deleteRes = await fetch(`${baseUrl}/api/coupons/${coupon._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 204);
});

test('rejects a duplicate coupon code', async () => {
  await fetch(`${baseUrl}/api/coupons`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ code: 'DUPE1', type: 'fixed', value: 5 }),
  });
  const res = await fetch(`${baseUrl}/api/coupons`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ code: 'DUPE1', type: 'fixed', value: 5 }),
  });
  assert.equal(res.status, 409);
});

test('404s updating/deleting an unknown coupon', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const updateRes = await fetch(`${baseUrl}/api/coupons/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ active: false }),
  });
  assert.equal(updateRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/coupons/${fakeId}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 404);
});
