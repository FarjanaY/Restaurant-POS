import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import Order from '../models/Order.js';
<<<<<<< HEAD
import User from '../models/User.js';
import MenuItem from '../models/MenuItem.js';
import Category from '../models/Category.js';
import TaxCategory from '../models/TaxCategory.js';
import Table from '../models/Table.js';
import DailyCost from '../models/DailyCost.js';
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

process.env.JWT_SECRET = 'test-secret';

let mongod;
let server;
let baseUrl;
let managerHeader;
let cashierHeader;

<<<<<<< HEAD
function round2(n) {
  return Math.round(n * 100) / 100;
}

=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

<<<<<<< HEAD
function lineOf(nameSnapshot, quantity, lineTotal) {
  return {
    menuItemId: new mongoose.Types.ObjectId(),
    nameSnapshot,
    quantity,
    unitPrice: lineTotal / quantity,
    lineTotal,
    vatRate: 0,
    vatAmount: 0,
  };
}

=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
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
<<<<<<< HEAD
  // 8 days ago falls inside the *previous* 7-day window (today-13..today-7),
  // one day outside the current trend window (today-6..today) — exercises
  // previousTrend without polluting the current-period assertions below.
  const eightDaysAgoNoon = new Date(todayNoon.getTime() - 8 * 24 * 60 * 60 * 1000);

  await User.create([
    { name: 'Alex Admin', role: 'admin', pinHash: 'x', active: true },
    { name: 'Cara Cashier', role: 'cashier', pinHash: 'x', active: true },
    { name: 'Retired Staff', role: 'cashier', pinHash: 'x', active: false },
  ]);

  const drinksCategory = await Category.create({ name: 'Drinks' });
  const hotFood = await TaxCategory.create({ name: 'hot_food' });
  const latteMenuItem = await MenuItem.create({
    name: 'Latte',
    categoryId: drinksCategory._id,
    basePrice: 2.5,
    taxCategoryId: hotFood._id,
    imageUrl: 'https://example.com/latte.jpg',
  });
  const table1 = await Table.create({ name: 'Table 1', capacity: 2 });
  await DailyCost.create({ date: todayNoon.toISOString().slice(0, 10), amount: 30, notes: 'Test cost' });
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

  await Order.create([
    orderAt({
      status: 'paid',
<<<<<<< HEAD
      type: 'dine_in',
      tableId: table1._id,
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
      closedAt: todayNoon,
      subtotal: 4.41,
      vatTotal: 0.59,
      total: 5.0,
<<<<<<< HEAD
      lines: [{ ...lineOf('Latte', 2, 5.0), menuItemId: latteMenuItem._id }],
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
      payments: [{ method: 'cash', amount: 5.0, tendered: 5.0, change: 0, staffId: new mongoose.Types.ObjectId() }],
    }),
    orderAt({
      status: 'completed',
      closedAt: new Date(todayNoon.getTime() + 60000),
      subtotal: 10,
      vatTotal: 1.35,
      total: 11.35,
<<<<<<< HEAD
      lines: [lineOf('Cold Sandwich', 1, 11.35)],
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
      payments: [
        { method: 'card', amount: 11.35, processorRef: 'pi_x', staffId: new mongoose.Types.ObjectId() },
      ],
    }),
<<<<<<< HEAD
    // Yesterday — must be excluded from today's summary, but included in the 7-day trend.
    orderAt({ status: 'paid', createdAt: yesterdayNoon, closedAt: yesterdayNoon, subtotal: 100, vatTotal: 20, total: 120 }),
    // 8 days ago — must land in previousTrend, not trend.
    orderAt({
      status: 'paid',
      createdAt: eightDaysAgoNoon,
      closedAt: eightDaysAgoNoon,
      subtotal: 40,
      vatTotal: 0,
      total: 40,
    }),
    // Voided, never paid — must be excluded regardless of date.
    orderAt({ status: 'voided', closedAt: todayNoon, subtotal: 5, vatTotal: 0.5, total: 5.5 }),
    // Still in progress today, no closedAt yet — only statusBreakdown should see these.
    orderAt({ status: 'open', closedAt: null }),
    orderAt({ status: 'held', closedAt: null }),
=======
    // Yesterday — must be excluded from today's summary.
    orderAt({ status: 'paid', closedAt: yesterdayNoon, subtotal: 100, vatTotal: 20, total: 120 }),
    // Voided, never paid — must be excluded regardless of date.
    orderAt({ status: 'voided', closedAt: todayNoon, subtotal: 5, vatTotal: 0.5, total: 5.5 }),
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
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
<<<<<<< HEAD

test('rejects cashier role from the dashboard summary', async () => {
  const res = await fetch(`${baseUrl}/api/reports/dashboard-summary`, { headers: cashierHeader });
  assert.equal(res.status, 403);
});

test("dashboard summary reports today's KPIs, a 7-day trend, status mix, and top items", async () => {
  const res = await fetch(`${baseUrl}/api/reports/dashboard-summary`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.today.orderCount, 2);
  assert.equal(body.today.totalSales, 16.35);
  assert.equal(body.today.avgOrderValue, 8.18); // round2(16.35 / 2)
  assert.deepEqual(body.tenderBreakdown, { cash: 5.0, card: 11.35 });

  // status mix counts every order created today regardless of closedAt.
  assert.equal(body.statusBreakdown.open, 1);
  assert.equal(body.statusBreakdown.held, 1);
  assert.equal(body.statusBreakdown.paid, 1);
  assert.equal(body.statusBreakdown.completed, 1);
  assert.equal(body.statusBreakdown.voided, 1);

  assert.equal(body.trend.length, 7);
  const todayEntry = body.trend[body.trend.length - 1];
  assert.equal(todayEntry.date, body.date);
  assert.equal(todayEntry.totalSales, 16.35);
  assert.equal(todayEntry.cost, 30); // real admin-entered DailyCost, joined by date
  const yesterdayEntry = body.trend[body.trend.length - 2];
  assert.equal(yesterdayEntry.totalSales, 120);
  assert.equal(yesterdayEntry.cost, 0); // no DailyCost entry for that day — never fabricated

  // The 8-days-ago order must land in previousTrend (the prior 7-day window),
  // not in the current trend — and previousTrend must be the same length,
  // aligned so its last entry is the day right before the current window starts.
  assert.equal(body.previousTrend.length, 7);
  assert.equal(
    body.previousTrend.reduce((sum, d) => sum + d.totalSales, 0),
    40
  );
  assert.ok(!body.trend.some((d) => d.totalSales === 40));

  assert.deepEqual(body.topItems.map((i) => i.name).sort(), ['Cold Sandwich', 'Latte']);
  const latte = body.topItems.find((i) => i.name === 'Latte');
  assert.equal(latte.quantity, 2);
  assert.equal(latte.revenue, 5.0);
  assert.equal(latte.imageUrl, 'https://example.com/latte.jpg');
  const coldSandwich = body.topItems.find((i) => i.name === 'Cold Sandwich');
  assert.equal(coldSandwich.imageUrl, null); // no matching MenuItem doc — falls back to null, not a crash

  // Active-only headcount (2 active seeded here), plus the deactivated one
  // counted separately rather than just excluded.
  assert.equal(body.totalEmployees, 2);
  assert.equal(body.inactiveEmployees, 1);

  // Recent sales resolves the dine-in order's table name as its "location",
  // plus the new imageUrl/status fields that power the Order Activity cards.
  const latteSale = body.recentSales.find((s) => s.label === 'Latte');
  assert.ok(latteSale);
  assert.equal(latteSale.location, 'Table 1');
  assert.equal(latteSale.imageUrl, 'https://example.com/latte.jpg');
  assert.equal(latteSale.status, 'paid');
  const sandwichSale = body.recentSales.find((s) => s.label === 'Cold Sandwich');
  assert.equal(sandwichSale.location, 'Takeaway');
  assert.equal(sandwichSale.status, 'completed');
  assert.equal(sandwichSale.imageUrl, null); // random menuItemId, no matching MenuItem doc

  // Top categories: only the Latte line resolves to a real MenuItem → Category
  // (Cold Sandwich's line uses a random menuItemId with no matching doc).
  assert.deepEqual(body.topCategories, [{ name: 'Drinks', imageUrl: null, revenue: 5.0 }]);

  // Both today's orders closed within the same hour (noon), so that's the peak.
  assert.equal(body.today.peakHour, '12:00 PM');

  // Today's revenue split by order type.
  assert.equal(body.typeBreakdown.dine_in, 5.0);
  assert.equal(body.typeBreakdown.takeaway, 11.35);

  assert.equal(body.weeklyPattern.length, 7);
  assert.equal(
    body.weeklyPattern.reduce((sum, d) => sum + d.orderCount, 0),
    3 // the 2 today + 1 yesterday paid/completed orders inside the 7-day trend window
  );
});

test('trendDays widens the trend window (and folds into weeklyPattern) without touching today\'s KPIs', async () => {
  const res = await fetch(`${baseUrl}/api/reports/dashboard-summary?trendDays=30`, {
    headers: managerHeader,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.trendDays, 30);
  assert.equal(body.trend.length, 30);
  assert.equal(body.today.totalSales, 16.35);
});

test('falls back to the default trend window for an unsupported trendDays value', async () => {
  const res = await fetch(`${baseUrl}/api/reports/dashboard-summary?trendDays=13`, {
    headers: managerHeader,
  });
  const body = await res.json();
  assert.equal(body.trendDays, 7);
  assert.equal(body.trend.length, 7);
});

test('rejects cashier role from all four sales reports', async () => {
  for (const path of ['sales-by-day', 'sales-by-month', 'sales-by-item', 'sales-report']) {
    const res = await fetch(`${baseUrl}/api/reports/${path}`, { headers: cashierHeader });
    assert.equal(res.status, 403, path);
  }
});

test('sales-by-day reports real per-day totals plus admin-entered cost/profit, defaulting to the last 7 days', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-by-day`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.days.length, 7);
  const todayEntry = body.days[body.days.length - 1];
  assert.equal(todayEntry.totalSales, 16.35);
  assert.equal(todayEntry.cost, 30);
  assert.equal(todayEntry.profit, -13.65); // real, computed — never a fabricated margin
  const yesterdayEntry = body.days[body.days.length - 2];
  assert.equal(yesterdayEntry.totalSales, 120);
  assert.equal(yesterdayEntry.cost, 0);

  assert.equal(body.totals.totalSales, round2(body.days.reduce((s, d) => s + d.totalSales, 0)));
});

test('sales-by-day accepts an explicit ?from=&to= range', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${baseUrl}/api/reports/sales-by-day?from=${today}&to=${today}`, {
    headers: managerHeader,
  });
  const body = await res.json();
  assert.equal(body.days.length, 1);
  assert.equal(body.days[0].totalSales, 16.35);
  assert.equal(body.totals.orderCount, 2);
});

test('sales-by-month folds orders into calendar-month buckets over the last 6 months by default', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-by-month`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.months.length, 6);
  // Today's, yesterday's, and 8-days-ago's orders are all within the last 6
  // months regardless of which calendar month they land in — sum across every
  // bucket rather than assuming a specific month, since "today" shifts.
  const totalSales = round2(body.months.reduce((s, m) => s + m.totalSales, 0));
  const orderCount = body.months.reduce((s, m) => s + m.orderCount, 0);
  assert.equal(totalSales, 176.35); // 16.35 + 120 + 40
  assert.equal(orderCount, 4);
});

test('sales-by-month accepts ?months= to widen or narrow the window', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-by-month?months=3`, { headers: managerHeader });
  const body = await res.json();
  assert.equal(body.months.length, 3);
});

test('sales-by-item reports per-menu-item quantity/revenue with a real cost-free share of the total', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-by-item`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  const latte = body.items.find((i) => i.name === 'Latte');
  assert.equal(latte.quantity, 2);
  assert.equal(latte.revenue, 5.0);
  assert.equal(latte.imageUrl, 'https://example.com/latte.jpg');
  const sandwich = body.items.find((i) => i.name === 'Cold Sandwich');
  assert.equal(sandwich.quantity, 1);
  assert.equal(sandwich.revenue, 11.35);

  assert.equal(body.totals.revenue, 16.35);
  assert.equal(latte.share + sandwich.share <= 100, true);
});

test('sales-report defaults to daily granularity over the last 7 days, matching sales-by-day', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-report`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.granularity, 'day');
  assert.equal(body.buckets.length, 7);
  const todayBucket = body.buckets[body.buckets.length - 1];
  assert.equal(todayBucket.totalSales, 16.35);
  assert.equal(todayBucket.cost, 30);
  assert.equal(todayBucket.profit, -13.65);
});

test('sales-report groups into calendar-month buckets when granularity=month', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-report?granularity=month`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.granularity, 'month');
  assert.equal(body.buckets.length, 12); // full 12-month pool — the frontend windows/pages through it
  const totalSales = round2(body.buckets.reduce((s, b) => s + b.totalSales, 0));
  assert.equal(totalSales, 176.35); // 16.35 + 120 + 40, same fixture as sales-by-month
});

test('sales-report groups into 7-day week buckets when granularity=week', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-report?granularity=week`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.granularity, 'week');
  assert.equal(body.buckets.length, 8);
  // Sum across every bucket rather than assuming which week today/yesterday
  // land in — that depends on which weekday the test happens to run on.
  const totalSales = round2(body.buckets.reduce((s, b) => s + b.totalSales, 0));
  assert.equal(totalSales, 176.35);
});

test('sales-report groups into calendar-year buckets when granularity=year', async () => {
  const res = await fetch(`${baseUrl}/api/reports/sales-report?granularity=year`, { headers: managerHeader });
  assert.equal(res.status, 200);
  const body = await res.json();

  assert.equal(body.granularity, 'year');
  assert.equal(body.buckets.length, 5);
  const totalSales = round2(body.buckets.reduce((s, b) => s + b.totalSales, 0));
  assert.equal(totalSales, 176.35);
});

test('sales-report accepts an explicit ?from=&to= range regardless of granularity', async () => {
  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`${baseUrl}/api/reports/sales-report?granularity=day&from=${today}&to=${today}`, {
    headers: managerHeader,
  });
  const body = await res.json();
  assert.equal(body.buckets.length, 1);
  assert.equal(body.buckets[0].totalSales, 16.35);
});
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
