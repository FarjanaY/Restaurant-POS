import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  getDailySummary,
  getDashboardSummary,
  getSalesByDay,
  getSalesByMonth,
  getSalesByItem,
  getSalesReport,
} from '../controllers/reportsController.js';

const router = Router();

router.get('/daily-summary', requireAuth, requireRole('admin', 'manager'), getDailySummary);
router.get('/dashboard-summary', requireAuth, requireRole('admin', 'manager'), getDashboardSummary);
router.get('/sales-by-day', requireAuth, requireRole('admin', 'manager'), getSalesByDay);
router.get('/sales-by-month', requireAuth, requireRole('admin', 'manager'), getSalesByMonth);
router.get('/sales-by-item', requireAuth, requireRole('admin', 'manager'), getSalesByItem);
router.get('/sales-report', requireAuth, requireRole('admin', 'manager'), getSalesReport);

export default router;
