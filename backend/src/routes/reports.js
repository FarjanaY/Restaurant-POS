import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { getDailySummary } from '../controllers/reportsController.js';

const router = Router();

router.get('/daily-summary', requireAuth, requireRole('admin', 'manager'), getDailySummary);

export default router;
