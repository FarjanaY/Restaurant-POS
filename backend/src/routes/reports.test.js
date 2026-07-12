import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Order from '../models/Order.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let managerHeader;
let cashierHeader;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

function orderAt(overrides) {
  return {
    tokenNumber: Math.floor(Math.random() * 1000000),
    type: 'takeaway',
    status: 'paid',
    staffId: new mongoose.Types.ObjectId(),
    subtotal: 0,
    vatTotal: 0,
    discount: 0,
    total: 0,
    lines: [],
    payments: [],
    ...overrides,
  };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  managerHeader = authHeader('manager');
  cashierHeader = authHeader('cashier');

  const today = new Date();
  const todayNoon = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 12));
  const yesterdayNoon = new Date(todayNoon.getTime() - 24 * 60 * 60 * 1000);

  await Order.create([
    orderAt({
      status: 'paid',
      closedAt: todayNoon,
      subtotal: 4.41,
      vatTotal: 0.59,
      total: 5.0,
      payments: [{ method: 'cash', amount: 5.0, tendered: 5.0, change: 0, staffId: new mongoose.Types.ObjectId() }],
    }),
    orderAt({
      status: 'completed',
      closedAt: new Date(todayNoon.getTime() + 60000),
      subtotal: 10,
      vatTotal: 1.35,
      total: 11.35,
      payments: [
        { method: 'card', amount: 11.35, processorRef: 'pi_x', staffId: new mongoose.Types.ObjectId() },
      ],
    }),
    // Yesterday — must be excluded from today's summary.
    orderAt({ status: 'paid', closedAt: yesterdayNoon, subtotal: 100, vatTotal: 20, total: 120 }),
    // Voided, never paid — must be excluded regardless of date.
    orderAt({ status: 'voided', closedAt: todayNoon, subtotal: 5, vatTotal: 0.5, total: 5.5 }),
  ]);

  server = app.listen(0);
  const { port } = server.address();
  baseUrl = `http://127.0.0.1:${port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('rejects cashier role from the daily summary', async () => {
  const res = await fetch(`${baseUrl}/api/reports/daily-summary`, { headers: cashierHeader });
  assert.equal(res.status, 403);
});

test("summarizes only today's paid/completed orders — excludes voided and other days", async () => {
  const res = await fetch(`${baseUrl}/api/reports/daily-summary`, { headers: managerHeader });
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.orderCount, 2);
  assert.equal(body.totalSales, 16.35); // 5.00 + 11.35
  assert.equal(body.taxCollected, 1.94); // 0.59 + 1.35
  assert.deepEqual(body.tenderBreakdown, { cash: 5.0, card: 11.35 });
});

test('accepts an explicit ?date= for a past day', async () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const res = await fetch(`${baseUrl}/api/reports/daily-summary?date=${yesterday}`, {
    headers: managerHeader,
  });
  const body = await res.json();
  assert.equal(body.orderCount, 1);
  assert.equal(body.totalSales, 120);
});
