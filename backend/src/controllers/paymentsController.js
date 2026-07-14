import Order from '../models/Order.js';
import { emitOrderNew } from '../sockets/kds.js';
import * as stripeService from '../services/stripeService.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

function computeRemaining(order) {
  const paidSoFar = round2(order.payments.reduce((sum, p) => sum + p.amount, 0));
  return round2(order.total - paidSoFar);
}

// Factory so tests can inject fake Stripe calls instead of hitting the real API —
// the same dependency-injection pattern as computeOrderTotals's resolveRate.
export function createPaymentsController({
  createCardPaymentIntent = stripeService.createCardPaymentIntent,
  retrievePaymentIntent = stripeService.retrievePaymentIntent,
} = {}) {
  // Creates a Stripe PaymentIntent for the order's remaining balance so the
  // register's Stripe Terminal SDK can hand it to the reader.
  async function createCardIntent(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!['open', 'held'].includes(order.status)) {
        return res
          .status(409)
          .json({ message: `Cannot take payment on an order with status "${order.status}"` });
      }

      const remaining = computeRemaining(order);
      if (remaining <= 0) {
        return res.status(409).json({ message: 'Order is already fully paid' });
      }

      const intent = await createCardPaymentIntent(remaining);
      res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
    } catch (err) {
      next(err);
    }
  }

  // A payment is appended to its Order's embedded `payments` array, so this write
  // is already a single-document Mongo operation — no multi-document transaction
  // needed. optimisticConcurrency on the Order schema guards the concurrent-edit
  // race a transaction would otherwise cover.
  async function addPayment(req, res, next) {
    try {
      const order = await Order.findById(req.params.id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      if (!['open', 'held'].includes(order.status)) {
        return res
          .status(409)
          .json({ message: `Cannot take payment on an order with status "${order.status}"` });
      }

      const remaining = computeRemaining(order);
      if (remaining <= 0) {
        return res.status(409).json({ message: 'Order is already fully paid' });
      }

      const { method, tendered, paymentIntentId } = req.body;

      if (method === 'cash') {
        if (typeof tendered !== 'number' || tendered <= 0) {
          return res.status(400).json({ message: 'tendered amount is required for cash payments' });
        }

        // A tender can cover less than the remaining balance (split tender) — only
        // the portion actually owed is "amount"; the rest is change, not overpayment.
        const amount = Math.min(round2(tendered), remaining);
        const change = round2(tendered - amount);

        order.payments.push({ method: 'cash', amount, tendered, change, staffId: req.user.sub });
      } else if (method === 'card') {
        if (!paymentIntentId) {
          return res.status(400).json({ message: 'paymentIntentId is required for card payments' });
        }

        // Never trust the client's word that a card payment succeeded — verify
        // directly against Stripe before recording money as received.
        const intent = await retrievePaymentIntent(paymentIntentId);
        if (intent.status !== 'succeeded') {
          return res
            .status(402)
            .json({ message: `Card payment not completed (status: ${intent.status})` });
        }

        const amount = round2(intent.amount_received / 100);
        order.payments.push({ method: 'card', amount, processorRef: intent.id, staffId: req.user.sub });
      } else {
        return res.status(400).json({ message: 'method must be "cash" or "card"' });
      }

      const totalPaid = round2(order.payments.reduce((sum, p) => sum + p.amount, 0));
      const justPaid = totalPaid >= order.total;
      if (justPaid) {
        order.status = 'paid';
        order.closedAt = new Date();
      }

      await order.save();

      // The kitchen only sees an order once it's paid/confirmed (PRD FR3.1) — not
      // while the cashier is still building or holding it.
      if (justPaid) {
        emitOrderNew(order);
      }

      res.status(201).json(order);
    } catch (err) {
      next(err);
    }
  }

  return { createCardIntent, addPayment };
}

export const { createCardIntent, addPayment } = createPaymentsController();
