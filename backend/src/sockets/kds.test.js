import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { io as ioClient } from 'socket.io-client';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../app.js';
import { registerKdsNamespace } from './kds.js';
import TaxCategory from '../models/TaxCategory.js';
import VatRate from '../models/VatRate.js';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let httpServer;
let ioServer;
let clientSocket;
let baseUrl;
let cashierHeader;
let coldSandwich;

function authHeader(role) {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  cashierHeader = authHeader('cashier');

  const coldFood = await TaxCategory.create({ name: 'cold_food' });
  await VatRate.create({
    taxCategoryId: coldFood._id,
    orderType: 'takeaway',
    rate: 0,
    effectiveFrom: new Date('2020-01-01'),
  });
  const food = await Category.create({ name: 'Food' });
  coldSandwich = await MenuItem.create({
    name: 'Cold Sandwich',
    categoryId: food._id,
    basePrice: 5,
    taxCategoryId: coldFood._id,
  });

  httpServer = createServer(app);
  ioServer = new Server(httpServer);
  registerKdsNamespace(ioServer);

  await new Promise((resolve) => httpServer.listen(0, resolve));
  const { port } = httpServer.address();
  baseUrl = `http://127.0.0.1:${port}`;

  clientSocket = ioClient(`${baseUrl}/kds`, { transports: ['websocket'] });
  await new Promise((resolve) => clientSocket.on('connect', resolve));
});

after(async () => {
  clientSocket.close();
  ioServer.close();
  await new Promise((resolve) => httpServer.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});

test('a connected KDS client receives order:new only once the order is paid, not on creation', async () => {
  const createRes = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ type: 'takeaway', lines: [{ menuItemId: coldSandwich._id, quantity: 1 }] }),
  });
  const order = await createRes.json();

  let receivedBeforePayment = false;
  clientSocket.once('order:new', () => {
    receivedBeforePayment = true;
  });

  // give any (incorrect) immediate emit a moment to arrive before we pay
  await new Promise((resolve) => setTimeout(resolve, 50));
  assert.equal(receivedBeforePayment, false);
  clientSocket.off('order:new');

  const received = new Promise((resolve) => clientSocket.once('order:new', resolve));

  const payRes = await fetch(`${baseUrl}/api/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'cash', tendered: 5 }),
  });
  assert.equal(payRes.status, 201);

  const broadcastOrder = await received;
  assert.equal(broadcastOrder._id, order._id);
  assert.equal(broadcastOrder.status, 'paid');
});
