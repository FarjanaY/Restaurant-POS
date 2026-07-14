import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { computeOrderTotals } from '../services/orderTotals.js';
import { nextOrderToken } from '../services/tokenService.js';
import { resolveCouponDiscount } from '../services/couponService.js';
import { emitOrderUpdated } from '../sockets/kds.js';

function round2(n) {
  return Math.round(n * 100) / 100;
}

// A coupon and a manual discount can both be active on the same order at once
// — this is the single place their amounts get summed and clamped so neither
// handler has to know about the other's math.
function combineDiscounts(couponAmount, manualAmount, grossTotal) {
  const combined = round2((couponAmount || 0) + (manualAmount || 0));
  return Math.min(Math.max(combined, 0), grossTotal);
}

// Resolves client-sent { menuItemId, quantity, notes, modifierIds } into the
// { menuItem, quantity, notes, modifiers } shape computeOrderTotals expects,
// looking up live menu docs so price/VAT snapshots are always taken server-side.
async function resolveCartLines(rawLines) {
  const menuItemIds = rawLines.map((line) => line.menuItemId);
  const menuItems = await MenuItem.find({ _id: { $in: menuItemIds }, active: true }).populate(
    'modifierGroupIds'
  );
  const menuItemById = new Map(menuItems.map((item) => [item._id.toString(), item]));

  return rawLines.map((line) => {
    const menuItem = menuItemById.get(String(line.menuItemId));
    if (!menuItem) {
      const err = new Error(`Menu item not found or inactive: ${line.menuItemId}`);
      err.status = 422;
      throw err;
    }

    const availableModifiers = menuItem.modifierGroupIds.flatMap((group) => group.modifiers);
    const modifiers = (line.modifierIds || []).map((modifierId) => {
      const modifier = availableModifiers.find((m) => m._id.toString() === String(modifierId));
      if (!modifier) {
        const err = new Error(`Modifier not found on "${menuItem.name}": ${modifierId}`);
        err.status = 422;
        throw err;
      }
      return modifier;
    });

    return { menuItem, quantity: line.quantity, notes: line.notes, modifiers };
  });
}

// Rebuilds the { menuItemId, quantity, notes, modifierIds } shape from an
// order's own stored lines — used when a PATCH changes type/discount without
// resending the cart, so totals still recompute against current menu data.
function toRawLines(orderLines) {
  return orderLines.map((line) => ({
    menuItemId: line.menuItemId,
    quantity: line.quantity,
    notes: line.notes,
    modifierIds: line.modifiers.map((m) => m.modifierId),
  }));
}

export async function createOrder(req, res, next) {
  try {
    const { type, lines, tableId, discount, notes, clientOrderId } = req.body;

    if (clientOrderId) {
      const existing = await Order.findOne({ clientOrderId });
      if (existing) return res.status(200).json(existing);
    }

    const cartLines = await resolveCartLines(lines || []);
    const totals = await computeOrderTotals(cartLines, type, { discount: discount || 0 });
    const tokenNumber = await nextOrderToken();

    const order = await Order.create({
      tokenNumber,
      type,
      status: 'open',
      tableId: tableId || null,
      staffId: req.user.sub,
      subtotal: totals.subtotal,
      vatTotal: totals.vatTotal,
      discount: totals.discount,
      total: totals.total,
      lines: totals.lines,
      notes: notes || '',
      clientOrderId,
    });

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
}

const MAX_PAGE_SIZE = 200;

// Plain-array response (legacy, still used by KDS/held-orders which never send
// page/limit) vs. paginated { orders, total, page, limit, totalPages } — kept
// as one endpoint with an opt-in shape rather than forking routes, since every
// existing caller is unaffected by params it never sends.
export async function listOrders(req, res, next) {
  try {
    const { status, type, dateFrom, dateTo, search, page, limit } = req.query;
    const filter = {};

    if (status) filter.status = status;
    if (type) filter.type = type;

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(`${dateFrom}T00:00:00.000Z`);
      if (dateTo) filter.createdAt.$lte = new Date(`${dateTo}T23:59:59.999Z`);
    }

    if (search) {
      const asNumber = Number(search);
      if (Number.isInteger(asNumber)) {
        filter.tokenNumber = asNumber;
      } else {
        filter.$or = [
          { notes: { $regex: search, $options: 'i' } },
          { 'lines.nameSnapshot': { $regex: search, $options: 'i' } },
        ];
      }
    }

    if (!page && !limit) {
      return res.json(await Order.find(filter).sort('-createdAt'));
    }

    const pageNum = Math.max(1, Number(page) || 1);
    const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Number(limit) || 20));

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .sort('-createdAt')
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
      Order.countDocuments(filter),
    ]);

    res.json({ orders, total, page: pageNum, limit: pageSize, totalPages: Math.ceil(total / pageSize) });
  } catch (err) {
    next(err);
  }
}

export async function getOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    next(err);
  }
}

const EDITABLE_STATUSES = ['open', 'held'];
const HOLD_RECALL_STATUSES = ['open', 'held'];

export async function updateOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot edit an order with status "${order.status}"` });
    }

    const { status, lines, type, discount, notes, tableId } = req.body;

    if (lines || type || discount !== undefined) {
      const rawLines = lines || toRawLines(order.lines);
      const cartLines = await resolveCartLines(rawLines);
      const totals = await computeOrderTotals(cartLines, type || order.type, {
        discount: discount ?? order.discount,
      });

      order.type = type || order.type;
      order.lines = totals.lines;
      order.subtotal = totals.subtotal;
      order.vatTotal = totals.vatTotal;
      order.discount = totals.discount;
      order.total = totals.total;
    }

    if (notes !== undefined) {
      order.notes = notes;
    }

    if (tableId !== undefined) {
      order.tableId = tableId || null;
    }

    if (status) {
      if (!HOLD_RECALL_STATUSES.includes(status)) {
        return res
          .status(400)
          .json({ message: 'status must be "held" (hold) or "open" (recall)' });
      }
      order.status = status;
    }

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// Applying a coupon always re-resolves against the order's current gross total
// (before discount) rather than trusting a client-supplied amount, so it's safe
// to call repeatedly (e.g. after the cart changes) or to swap one coupon for another.
export async function applyCoupon(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot apply a coupon to an order with status "${order.status}"` });
    }

    const rawLines = toRawLines(order.lines);
    const cartLines = await resolveCartLines(rawLines);
    const totalsBeforeDiscount = await computeOrderTotals(cartLines, order.type, { discount: 0 });
    const { discount: couponDiscount, coupon } = await resolveCouponDiscount(
      req.body.code,
      totalsBeforeDiscount.total
    );

    const combined = combineDiscounts(couponDiscount, order.manualDiscount, totalsBeforeDiscount.total);
    const totals = await computeOrderTotals(cartLines, order.type, { discount: combined });
    order.subtotal = totals.subtotal;
    order.vatTotal = totals.vatTotal;
    order.discount = totals.discount;
    order.total = totals.total;
    order.couponCode = coupon.code;

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function removeCoupon(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot change an order with status "${order.status}"` });
    }

    const rawLines = toRawLines(order.lines);
    const cartLines = await resolveCartLines(rawLines);
    const totalsBeforeDiscount = await computeOrderTotals(cartLines, order.type, { discount: 0 });
    const combined = combineDiscounts(0, order.manualDiscount, totalsBeforeDiscount.total);
    const totals = await computeOrderTotals(cartLines, order.type, { discount: combined });

    order.subtotal = totals.subtotal;
    order.vatTotal = totals.vatTotal;
    order.discount = totals.discount;
    order.total = totals.total;
    order.couponCode = null;

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// A flat, staff-entered discount — independent of (and stacks with) a coupon.
// Always re-resolves any existing coupon fresh against the current gross total,
// same reasoning as applyCoupon: never trust a stale client-supplied combined amount.
export async function applyManualDiscount(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot apply a discount to an order with status "${order.status}"` });
    }

    const amount = Number(req.body.amount);
    if (!Number.isFinite(amount) || amount < 0) {
      return res.status(400).json({ message: 'amount must be a non-negative number' });
    }

    const rawLines = toRawLines(order.lines);
    const cartLines = await resolveCartLines(rawLines);
    const totalsBeforeDiscount = await computeOrderTotals(cartLines, order.type, { discount: 0 });

    let couponPortion = 0;
    if (order.couponCode) {
      const resolved = await resolveCouponDiscount(order.couponCode, totalsBeforeDiscount.total);
      couponPortion = resolved.discount;
    }

    const manualPortion = round2(Math.min(Math.max(amount, 0), totalsBeforeDiscount.total));
    const combined = combineDiscounts(couponPortion, manualPortion, totalsBeforeDiscount.total);
    const totals = await computeOrderTotals(cartLines, order.type, { discount: combined });

    order.subtotal = totals.subtotal;
    order.vatTotal = totals.vatTotal;
    order.discount = totals.discount;
    order.total = totals.total;
    order.manualDiscount = manualPortion;

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function removeManualDiscount(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!EDITABLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot change an order with status "${order.status}"` });
    }

    const rawLines = toRawLines(order.lines);
    const cartLines = await resolveCartLines(rawLines);
    const totalsBeforeDiscount = await computeOrderTotals(cartLines, order.type, { discount: 0 });

    let couponPortion = 0;
    if (order.couponCode) {
      const resolved = await resolveCouponDiscount(order.couponCode, totalsBeforeDiscount.total);
      couponPortion = resolved.discount;
    }

    const combined = combineDiscounts(couponPortion, 0, totalsBeforeDiscount.total);
    const totals = await computeOrderTotals(cartLines, order.type, { discount: combined });

    order.subtotal = totals.subtotal;
    order.vatTotal = totals.vatTotal;
    order.discount = totals.discount;
    order.total = totals.total;
    order.manualDiscount = 0;

    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

export async function voidOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status === 'voided') {
      return res.status(409).json({ message: 'Order is already voided' });
    }
    if (order.payments.length > 0) {
      return res.status(409).json({ message: 'Cannot void a paid order — use a refund instead' });
    }

    order.status = 'voided';
    order.closedAt = new Date();
    await order.save();
    res.json(order);
  } catch (err) {
    next(err);
  }
}

const KDS_VISIBLE_STATUSES = ['paid'];

// Marks a single kitchen ticket line done/undone (FR3.4). Only meaningful on an
// order the kitchen can actually see (paid) — bumping a line on an order that
// hasn't reached the kitchen yet, or one already fully completed, is a no-op bug.
export async function markLineDone(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!KDS_VISIBLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot bump a line on an order with status "${order.status}"` });
    }

    const line = order.lines.id(req.params.lineId);
    if (!line) return res.status(404).json({ message: 'Order line not found' });

    line.done = req.body.done !== false;
    await order.save();
    emitOrderUpdated(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

const KITCHEN_STATUSES = ['new', 'cooking', 'ready'];

// Manual kitchen-stage control — lets kitchen staff move a ticket between
// New/Cooking/Ready explicitly, independent of the per-line checklist above
// (which only tracks which individual items are prepped, not the ticket's stage).
export async function updateKitchenStatus(req, res, next) {
  try {
    const { status } = req.body;
    if (!KITCHEN_STATUSES.includes(status)) {
      return res.status(400).json({ message: `Invalid kitchen status "${status}"` });
    }

    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (!KDS_VISIBLE_STATUSES.includes(order.status)) {
      return res
        .status(409)
        .json({ message: `Cannot update kitchen status on an order with status "${order.status}"` });
    }

    order.kitchenStatus = status;
    // The two directions mirror each other: checking off every line auto-bumps
    // the ticket to ready (see markLineDone's caller on the frontend); manually
    // bumping the ticket to ready should equally mark every line prepped —
    // "ready to serve" already implies nothing's left on the checklist.
    if (status === 'ready') {
      order.lines.forEach((line) => {
        line.done = true;
      });
    }
    await order.save();
    emitOrderUpdated(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
}

// Whole-order bump — moves a paid order out of the active KDS queue.
export async function completeOrder(req, res, next) {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.status !== 'paid') {
      return res
        .status(409)
        .json({ message: `Cannot complete an order with status "${order.status}"` });
    }

    order.status = 'completed';
    order.lines.forEach((line) => {
      line.done = true;
    });
    await order.save();
    emitOrderUpdated(order);
    res.json(order);
  } catch (err) {
    next(err);
  }
}
