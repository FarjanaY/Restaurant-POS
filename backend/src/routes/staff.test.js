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

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  adminHeader = authHeader('admin');
  managerHeader = authHeader('manager');

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
  const res = await fetch(`${baseUrl}/api/staff`);
  assert.equal(res.status, 401);
});

test('manager cannot manage staff — admin only', async () => {
  const res = await fetch(`${baseUrl}/api/staff`, { headers: managerHeader });
  assert.equal(res.status, 403);
});

test('creates a staff member, never returning the pinHash', async () => {
  const res = await fetch(`${baseUrl}/api/staff`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Nia Newhire', role: 'cashier', pin: '5555' }),
  });
  assert.equal(res.status, 201);
  const staff = await res.json();
  assert.equal(staff.name, 'Nia Newhire');
  assert.equal(staff.pinHash, undefined);
});

test('rejects a duplicate active PIN', async () => {
  const res = await fetch(`${baseUrl}/api/staff`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Second Person', role: 'kitchen', pin: '5555' }),
  });
  assert.equal(res.status, 409);
});

test('rejects an invalid role or malformed PIN', async () => {
  const badRole = await fetch(`${baseUrl}/api/staff`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'X', role: 'owner', pin: '1234' }),
  });
  assert.equal(badRole.status, 400);

  const badPin = await fetch(`${baseUrl}/api/staff`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'X', role: 'cashier', pin: 'abcd' }),
  });
  assert.equal(badPin.status, 400);
});

test('lists staff and updates name/role, and deactivating blocks login PIN reuse checks', async () => {
  const listRes = await fetch(`${baseUrl}/api/staff`, { headers: adminHeader });
  const staff = await listRes.json();
  const nia = staff.find((s) => s.name === 'Nia Newhire');
  assert.ok(nia);

  const updateRes = await fetch(`${baseUrl}/api/staff/${nia._id}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ role: 'manager' }),
  });
  assert.equal(updateRes.status, 200);
  assert.equal((await updateRes.json()).role, 'manager');

  const deactivateRes = await fetch(`${baseUrl}/api/staff/${nia._id}`, {
    method: 'DELETE',
    headers: adminHeader,
  });
  assert.equal(deactivateRes.status, 200);
  assert.equal((await deactivateRes.json()).active, false);

  // Once deactivated, the PIN 5555 is free again for a new active staff member.
  const reuseRes = await fetch(`${baseUrl}/api/staff`, {
    method: 'POST',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Reuses Pin', role: 'cashier', pin: '5555' }),
  });
  assert.equal(reuseRes.status, 201);
});

test('404s updating an unknown staff member', async () => {
  const fakeId = new mongoose.Types.ObjectId().toString();
  const res = await fetch(`${baseUrl}/api/staff/${fakeId}`, {
    method: 'PATCH',
    headers: adminHeader,
    body: JSON.stringify({ name: 'Ghost' }),
  });
  assert.equal(res.status, 404);
});
