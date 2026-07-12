import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import { computeOrderTotals } from '../services/orderTotals.js';
import { nextOrderToken } from '../services/tokenService.js';

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

export async function listOrders(req, res, next) {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    res.json(await Order.find(filter).sort('-createdAt'));
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

    const { status, lines, type, discount, notes } = req.body;

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
