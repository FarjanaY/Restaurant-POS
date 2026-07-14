import InventoryItem from '../models/InventoryItem.js';

export async function listInventory(req, res, next) {
  try {
    res.json(await InventoryItem.find().sort('name'));
  } catch (err) {
    next(err);
  }
}

export async function createInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

// Relative stock change (+/-) — e.g. "-3" after using stock, "+20" after a
// delivery — rather than the caller having to read the current value first
// and race another concurrent adjustment.
export async function adjustInventoryItem(req, res, next) {
  try {
    const delta = Number(req.body.delta);
    if (!Number.isFinite(delta)) {
      return res.status(400).json({ message: 'delta must be a number' });
    }

    const item = await InventoryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });

    item.quantityOnHand = Math.max(0, item.quantityOnHand + delta);
    await item.save();
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteInventoryItem(req, res, next) {
  try {
    const item = await InventoryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
