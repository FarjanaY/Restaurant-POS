import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  listDailyCosts,
  createDailyCost,
  updateDailyCost,
  deleteDailyCost,
} from '../controllers/dailyCostController.js';

const router = Router();

// Same tier as the rest of the reporting/back-office area — admin or manager.
router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', listDailyCosts);
router.post('/', createDailyCost);
router.patch('/:id', updateDailyCost);
router.delete('/:id', deleteDailyCost);

export default router;
