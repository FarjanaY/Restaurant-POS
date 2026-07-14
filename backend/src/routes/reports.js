import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
<<<<<<< HEAD
import {
  getDailySummary,
  getDashboardSummary,
  getSalesByDay,
  getSalesByMonth,
  getSalesByItem,
  getSalesReport,
} from '../controllers/reportsController.js';
=======
import { getDailySummary } from '../controllers/reportsController.js';
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

const router = Router();

router.get('/daily-summary', requireAuth, requireRole('admin', 'manager'), getDailySummary);
<<<<<<< HEAD
router.get('/dashboard-summary', requireAuth, requireRole('admin', 'manager'), getDashboardSummary);
router.get('/sales-by-day', requireAuth, requireRole('admin', 'manager'), getSalesByDay);
router.get('/sales-by-month', requireAuth, requireRole('admin', 'manager'), getSalesByMonth);
router.get('/sales-by-item', requireAuth, requireRole('admin', 'manager'), getSalesByItem);
router.get('/sales-report', requireAuth, requireRole('admin', 'manager'), getSalesReport);
=======
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3

export default router;
