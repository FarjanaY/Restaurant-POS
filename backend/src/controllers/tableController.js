import Table from '../models/Table.js';
import Order from '../models/Order.js';

// A table counts as occupied while its order is still in play — once an order
// is completed or voided, the table is free again even if nobody explicitly
// "closed" it (this app has no separate seat-clearing step).
const OCCUPYING_STATUSES = ['open', 'held', 'paid'];

export async function listTables(req, res, next) {
  try {
    const tables = await Table.find().sort('name');
    const occupyingOrders = await Order.find(
      { tableId: { $in: tables.map((t) => t._id) }, status: { $in: OCCUPYING_STATUSES } },
      { tableId: 1, tokenNumber: 1, status: 1, total: 1 }
    );
    const orderByTable = new Map(occupyingOrders.map((o) => [o.tableId.toString(), o]));

    res.json(
      tables.map((table) => {
        const order = orderByTable.get(table._id.toString());
        return {
          ...table.toObject(),
          status: order ? 'occupied' : 'available',
          currentOrder: order
            ? { _id: order._id, tokenNumber: order.tokenNumber, status: order.status, total: order.total }
            : null,
        };
      })
    );
  } catch (err) {
    next(err);
  }
}

export async function createTable(req, res, next) {
  try {
    const table = await Table.create(req.body);
    res.status(201).json(table);
  } catch (err) {
    next(err);
  }
}

export async function updateTable(req, res, next) {
  try {
    const table = await Table.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.json(table);
  } catch (err) {
    next(err);
  }
}

export async function deleteTable(req, res, next) {
  try {
    // Refuse to delete a table currently in use — losing the tableId reference
    // on a live order would silently un-assign it mid-service.
    const activeOrder = await Order.findOne({
      tableId: req.params.id,
      status: { $in: OCCUPYING_STATUSES },
    });
    if (activeOrder) {
      return res.status(409).json({ message: 'Cannot delete a table with an active order' });
    }

    const table = await Table.findByIdAndDelete(req.params.id);
    if (!table) return res.status(404).json({ message: 'Table not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
