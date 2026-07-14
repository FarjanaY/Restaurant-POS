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

test('rejects unauthenticated requests, and cashier cannot manage customers', async () => {
  const anonRes = await fetch(`${baseUrl}/api/customers`);
  assert.equal(anonRes.status, 401);

  const cashierRes = await fetch(`${baseUrl}/api/customers`, { headers: cashierHeader });
  assert.equal(cashierRes.status, 403);
});

test('creates, lists, updates, and deletes a customer', async () => {
  const createRes = await fetch(`${baseUrl}/api/customers`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Jamie Diner', phone: '555-0100', email: 'jamie@example.com' }),
  });
  assert.equal(createRes.status, 201);
  const customer = await createRes.json();
  assert.equal(customer.name, 'Jamie Diner');

  const listRes = await fetch(`${baseUrl}/api/customers`, { headers: adminHeader });
  const customers = await listRes.json();
  assert.ok(customers.some((c) => c._id === customer._id));

  const updateRes = await fetch(`${baseUrl}/api/customers/${customer._id}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ notes: 'Prefers a window table' }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).notes, 'Prefers a window table');

  const deleteRes = await fetch(`${baseUrl}/api/customers/${customer._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 204);
});

test('404s updating/deleting an unknown customer', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();

  const updateRes = await fetch(`${baseUrl}/api/customers/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Ghost' }),
  });
  assert.equal(updateRes.status, 404);

  const deleteRes = await fetch(`${baseUrl}/api/customers/${fakeId}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deleteRes.status, 404);
});
