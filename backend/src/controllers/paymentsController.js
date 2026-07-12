import Order from '../models/Order.js';
import { emitOrderNew } from '../sockets/kds.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

// A payment is appended to its Order's embedded `payments` array, so this write
// is already a single-document Mongo operation — no multi-document transaction
// needed. optimisticConcurrency on the Order schema (see models/Order.js) covers
// the concurrent-edit race a transaction would otherwise guard against.
export async function addPayment(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!['open', 'held'].includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot take payment on an order with status "${order.status}"` });
    }

    const paidSoFar = round2(order.payments.reduce((sum, p) => sum + p.amount, 0));
    const remaining = round2(order.total - paidSoFar);
    if (remaining <= 0) {
      return res.status(409).json({ message: 'Order is already fully paid' });
    }

    const { method, tendered } = req.body;

    if (method === 'cash') {
      if (typeof tendered !== 'number' || tendered <= 0) {
        return res.status(400).json({ message: 'tendered amount is required for cash payments' });
      }

      // A tender can cover less than the remaining balance (split tender) — only the
      // portion actually owed is "amount"; anything beyond that is change, not overpayment.
      const amount = Math.min(round2(tendered), remaining);
      const change = round2(tendered - amount);

      order.payments.push({ method: 'cash', amount, tendered, change, staffId: req.user.sub });
    } else if (method === 'card') {
      return res.status(501).json({ message: 'Card payments arrive in Step 14 (Stripe Terminal)' });
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
