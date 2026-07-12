import Order from '../models/Order.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

// UTC day boundaries — a placeholder until real timezone handling (Europe/Dublin)
// is confirmed before go-live, same caveat as the VAT rates in PRD.md §11.
function dayRangeUTC(dateStr) {
  const date = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end };
}

// End-of-day summary (FR5.1) — total sales, order count, tax collected, tender
// breakdown. Scoped to orders closed (paid) within the given day; voided orders
// never reach 'paid' so they're excluded automatically.
export async function getDailySummary(req, res, next) {
  try {
    const { start, end } = dayRangeUTC(req.query.date);

    const orders = await Order.find({
      status: { $in: ['paid', 'completed'] },
      closedAt: { $gte: start, $lt: end },
    });

    const orderCount = orders.length;
    const totalSales = round2(orders.reduce((sum, o) => sum + o.total, 0));
    const taxCollected = round2(orders.reduce((sum, o) => sum + o.vatTotal, 0));

    const tenderBreakdown = {};
    for (const order of orders) {
      for (const payment of order.payments) {
        tenderBreakdown[payment.method] = round2(
          (tenderBreakdown[payment.method] || 0) + payment.amount
        );
      }
    }

    res.json({ date: start.toISOString().slice(0, 10), orderCount, totalSales, taxCollected, tenderBreakdown });
  } catch (err) {
    next(err);
  }
}
