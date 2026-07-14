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
let managerHeader;
let cashierHeader;
let kitchenHeader;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  managerHeader = authHeader('manager');
  cashierHeader = authHeader('cashier');
  kitchenHeader = authHeader('kitchen');

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
  const res = await fetch(`${baseUrl}/api/settings`);
  assert.equal(res.status, 401);
});

test('public branding endpoint needs no auth and exposes only name/logoUrl', async () => {
  await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ restaurantProfile: { name: 'French Fry Resturent', logoUrl: 'http://x/logo.png', email: 'owner@x.com' } }),
  });

  const res = await fetch(`${baseUrl}/api/settings/public`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.name, 'French Fry Resturent');
  assert.equal(body.logoUrl, 'http://x/logo.png');
  assert.equal(body.email, undefined);
  assert.equal(body.restaurantProfile, undefined);
});

test('tablesEnabled defaults to false, and any authenticated role can read it', async () => {
  const res = await fetch(`${baseUrl}/api/settings`, { headers: kitchenHeader });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).tablesEnabled, false);
});

test('listLayouts default to table per page, manager can switch one independently of the rest, and rejects an invalid value', async () => {
  const getRes = await fetch(`${baseUrl}/api/settings`, { headers: kitchenHeader });
  const initial = await getRes.json();
  assert.equal(initial.listLayouts.orders, 'table');
  assert.equal(initial.listLayouts.staff, 'table');

  const patchRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ listLayouts: { orders: 'card' } }),
  });
  assert.equal(patchRes.status, 200);
  const patched = await patchRes.json();
  assert.equal(patched.listLayouts.orders, 'card');
  assert.equal(patched.listLayouts.staff, 'table'); // untouched — per-page, not a single global switch

  const invalidRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ listLayouts: { staff: 'sideways' } }),
  });
  assert.equal(invalidRes.status, 400);
});

test('cashier cannot change settings', async () => {
  const res = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: cashierHeader,
    body: JSON.stringify({ tablesEnabled: true }),
  });
  assert.equal(res.status, 403);
});

test('manager can toggle tablesEnabled, and it persists', async () => {
  const patchRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ tablesEnabled: true }),
  });
  assert.equal(patchRes.status, 200);
  assert.equal((await patchRes.json()).tablesEnabled, true);

  const getRes = await fetch(`${baseUrl}/api/settings`, { headers: kitchenHeader });
  assert.equal((await getRes.json()).tablesEnabled, true);
});

test('manager can set the restaurant profile shown on the Dashboard, partially and repeatedly', async () => {
  const firstRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ restaurantProfile: { name: 'French Fry Resturent', city: 'Bronx' } }),
  });
  assert.equal(firstRes.status, 200);
  const first = await firstRes.json();
  assert.equal(first.restaurantProfile.name, 'French Fry Resturent');
  assert.equal(first.restaurantProfile.city, 'Bronx');

  // A second, partial PATCH must merge in rather than wipe out the first fields.
  const secondRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ restaurantProfile: { phone: '+8801302372036' } }),
  });
  const second = await secondRes.json();
  assert.equal(second.restaurantProfile.name, 'French Fry Resturent');
  assert.equal(second.restaurantProfile.phone, '+8801302372036');
});

test('manager can set general settings and social settings, partially and repeatedly', async () => {
  const firstRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({
      generalSettings: { metaTitle: 'French Fry Resturent', theme: 'Minimalist' },
      socialSettings: { facebookUrl: 'facebook.com/frenchfry' },
    }),
  });
  assert.equal(firstRes.status, 200);
  const first = await firstRes.json();
  assert.equal(first.generalSettings.metaTitle, 'French Fry Resturent');
  assert.equal(first.generalSettings.theme, 'Minimalist');
  assert.equal(first.socialSettings.facebookUrl, 'facebook.com/frenchfry');

  // A second, partial PATCH must merge in rather than wipe out the first fields.
  const secondRes = await fetch(`${baseUrl}/api/settings`, {
    method: 'PATCH',
    headers: managerHeader,
    body: JSON.stringify({ generalSettings: { metaKeyword: 'fries, fast food' } }),
  });
  const second = await secondRes.json();
  assert.equal(second.generalSettings.metaTitle, 'French Fry Resturent');
  assert.equal(second.generalSettings.metaKeyword, 'fries, fast food');
});
