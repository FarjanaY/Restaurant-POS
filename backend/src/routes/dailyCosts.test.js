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
let managerHeader;
let cashierHeader;

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

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('rejects unauthenticated requests, and cashier cannot manage daily costs', async () => {
  const anonRes = await fetch(`${baseUrl}/api/daily-costs`);
  assert.equal(anonRes.status, 401);

  const cashierRes = await fetch(`${baseUrl}/api/daily-costs`, { headers: cashierHeader });
  assert.equal(cashierRes.status, 403);
});

test('admin creates, lists, updates, and deletes a daily cost entry', async () => {
  const createRes = await fetch(`${baseUrl}/api/daily-costs`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-07-01', amount: 120.5, notes: 'Food cost + labor' }),
  });
  assert.equal(createRes.status, 201);
  const cost = await createRes.json();
  assert.equal(cost.date, '2026-07-01');
  assert.equal(cost.amount, 120.5);

  const listRes = await fetch(`${baseUrl}/api/daily-costs`, { headers: managerHeader });
  const costs = await listRes.json();
  assert.ok(costs.some((c) => c._id === cost._id));

  const updateRes = await fetch(`${baseUrl}/api/daily-costs/${cost._id}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-07-01', amount: 150, notes: 'Revised' }),
  });
  assert.equal(updateRes.status, 200);
  const updated = await updateRes.json();
  assert.equal(updated.amount, 150);
  assert.equal(updated.notes, 'Revised');

  const deleteRes = await fetch(`${baseUrl}/api/daily-costs/${cost._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 204);
});

test('rejects a duplicate date', async () => {
  await fetch(`${baseUrl}/api/daily-costs`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-07-02', amount: 50 }),
  });
  const res = await fetch(`${baseUrl}/api/daily-costs`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-07-02', amount: 75 }),
  });
  assert.equal(res.status, 409);
});

test('filters by dateFrom/dateTo', async () => {
  await fetch(`${baseUrl}/api/daily-costs`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-06-01', amount: 10 }),
  });
  const res = await fetch(`${baseUrl}/api/daily-costs?dateFrom=2026-07-01&dateTo=2026-07-01`, {
    headers: adminHeader,
  });
  const costs = await res.json();
  assert.ok(costs.every((c) => c.date === '2026-07-01'));
});

test('404s updating/deleting an unknown cost entry', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const updateRes = await fetch(`${baseUrl}/api/daily-costs/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ date: '2026-07-03', amount: 1 }),
  });
  assert.equal(updateRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/daily-costs/${fakeId}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 404);
});
