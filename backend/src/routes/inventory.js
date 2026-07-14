import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryItem,
  deleteInventoryItem,
} from '../controllers/inventoryController.js';

const router = Router();

// Same tier as Tables/Discount — operational back-office data, admin or manager.
router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', listInventory);
router.post('/', createInventoryItem);
router.patch('/:id', updateInventoryItem);
router.patch('/:id/adjust', adjustInventoryItem);
router.delete('/:id', deleteInventoryItem);

export default router;
