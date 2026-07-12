import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import express from 'express';
import { MongoMemoryServer } from 'mongodb-memory-server';

import { createPaymentsController } from '../controllers/paymentsController.js';
import { requireAuth } from '../middleware/auth.js';
import { notFound, errorHandler } from '../middleware/errorHandler.js';
import Order from '../models/Order.js';

process.env.JWT_SECRET = 'test-secret';

let mongod;
let cashierHeader;
const openServers = [];

// A standalone app wired to a fake Stripe client — verifies the card-payment
// business logic (amount tracking, status verification) without ever calling
// the real Stripe API, which this environment has no credentials for anyway.
function buildTestApp({ createCardPaymentIntent, retrievePaymentIntent }) {
  const { createCardIntent, addPayment } = createPaymentsController({
    createCardPaymentIntent,
    retrievePaymentIntent,
  });
  const testApp = express();
  testApp.use(express.json());
  testApp.post('/orders/:id/card-intent', requireAuth, createCardIntent);
  testApp.post('/orders/:id/payments', requireAuth, addPayment);
  testApp.use(notFound);
  testApp.use(errorHandler);
  return testApp;
}

async function createOpenOrder(total) {
  return Order.create({
    tokenNumber: Math.floor(Math.random() * 100000),
    type: 'takeaway',
    status: 'open',
    staffId: new mongoose.Types.ObjectId(),
    subtotal: total,
    vatTotal: 0,
    discount: 0,
    total,
    lines: [],
  });
}

function authHeader() {
  const token = jwt.sign({ sub: new mongoose.Types.ObjectId().toString(), role: 'cashier' }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());
  cashierHeader = authHeader();
});

after(async () => {
  await Promise.all(openServers.map((s) => new Promise((resolve) => s.close(resolve))));
  await mongoose.disconnect();
  await mongod.stop();
});

function listen(app) {
  return new Promise((resolve) => {
    const s = app.listen(0, () => {
      openServers.push(s);
      resolve(s);
    });
  });
}

test('creates a card PaymentIntent for the order\'s remaining balance', async () => {
  const order = await createOpenOrder(7.5);
  let capturedAmount = null;

  const app = buildTestApp({
    createCardPaymentIntent: async (amount) => {
      capturedAmount = amount;
      return { client_secret: 'secret_abc', id: 'pi_abc' };
    },
    retrievePaymentIntent: async () => {
      throw new Error('should not be called');
    },
  });
  const server = await listen(app);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${baseUrl}/orders/${order._id}/card-intent`, {
    method: 'POST',
    headers: cashierHeader,
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.clientSecret, 'secret_abc');
  assert.equal(body.paymentIntentId, 'pi_abc');
  assert.equal(capturedAmount, 7.5);
});

test('records a card payment only after verifying the PaymentIntent succeeded', async () => {
  const order = await createOpenOrder(5);

  const app = buildTestApp({
    createCardPaymentIntent: async () => ({ client_secret: 'x', id: 'pi_x' }),
    retrievePaymentIntent: async (id) => ({ id, status: 'succeeded', amount_received: 500 }),
  });
  const server = await listen(app);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${baseUrl}/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'card', paymentIntentId: 'pi_x' }),
  });
  assert.equal(res.status, 201);
  const updated = await res.json();
  assert.equal(updated.status, 'paid');
  assert.equal(updated.payments[0].method, 'card');
  assert.equal(updated.payments[0].amount, 5);
  assert.equal(updated.payments[0].processorRef, 'pi_x');
});

test('rejects a card payment whose PaymentIntent has not succeeded', async () => {
  const order = await createOpenOrder(5);

  const app = buildTestApp({
    createCardPaymentIntent: async () => ({ client_secret: 'x', id: 'pi_y' }),
    retrievePaymentIntent: async (id) => ({ id, status: 'requires_payment_method', amount_received: 0 }),
  });
  const server = await listen(app);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${baseUrl}/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'card', paymentIntentId: 'pi_y' }),
  });
  assert.equal(res.status, 402);

  const fresh = await Order.findById(order._id);
  assert.equal(fresh.payments.length, 0);
  assert.equal(fresh.status, 'open');
});

test('rejects a card payment with no paymentIntentId', async () => {
  const order = await createOpenOrder(5);

  const app = buildTestApp({
    createCardPaymentIntent: async () => ({ client_secret: 'x', id: 'pi_z' }),
    retrievePaymentIntent: async () => {
      throw new Error('should not be called');
    },
  });
  const server = await listen(app);
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const res = await fetch(`${baseUrl}/orders/${order._id}/payments`, {
    method: 'POST',
    headers: cashierHeader,
    body: JSON.stringify({ method: 'card' }),
  });
  assert.equal(res.status, 400);
});
