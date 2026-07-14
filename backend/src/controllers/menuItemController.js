import MenuItem from '../models/MenuItem.js';

export async function listMenuItems(req, res, next) {
  try {
    res.json(await MenuItem.find().sort('sortOrder').populate('modifierGroupIds'));
  } catch (err) {
    next(err);
  }
}

export async function createMenuItem(req, res, next) {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
}

export async function updateMenuItem(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch (err) {
    next(err);
  }
}

export async function deleteMenuItem(req, res, next) {
  try {
    const item = await MenuItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
