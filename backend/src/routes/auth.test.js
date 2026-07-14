import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import User from '../models/User.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  await User.create({
    name: 'Alex Admin',
    role: 'admin',
    pinHash: await bcrypt.hash('1111', 10),
  });
  await User.create({
    name: 'Inactive Manager',
    role: 'manager',
    pinHash: await bcrypt.hash('9999', 10),
    active: false,
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

test('rejects a request with no PIN', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  assert.equal(res.status, 400);
});

test('rejects an incorrect PIN', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '0000' }),
  });
  assert.equal(res.status, 401);
});

test('rejects the correct PIN for an inactive user', async () => {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '9999' }),
  });
  assert.equal(res.status, 401);
});

test('logs in with the correct PIN and the token unlocks an admin route', async () => {
  const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin: '1111' }),
  });
  assert.equal(loginRes.status, 200);

  const { token, user } = await loginRes.json();
  assert.ok(token);
  assert.equal(user.name, 'Alex Admin');
  assert.equal(user.role, 'admin');

  const adminRes = await fetch(`${baseUrl}/api/admin/categories`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(adminRes.status, 200);
});
