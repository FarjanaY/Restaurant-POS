import { Router } from 'express';
import Category from '../models/Category.js';
import MenuItem from '../models/MenuItem.js';
import ModifierGroup from '../models/ModifierGroup.js';

const router = Router();

// GET /api/menu — categories + active items + their modifier groups
router.get('/', async (req, res, next) => {
  try {
    const [categories, items] = await Promise.all([
      Category.find({ active: true }).sort('sortOrder'),
      MenuItem.find({ active: true }).sort('sortOrder').populate('modifierGroupIds'),
    ]);
    res.json({ categories, items });
  } catch (err) {
    next(err);
  }
});

router.get('/modifier-groups', async (req, res, next) => {
  try {
    const groups = await ModifierGroup.find();
    res.json(groups);
  } catch (err) {
    next(err);
  }
});

export default router;
