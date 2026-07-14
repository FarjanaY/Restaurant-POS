import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { getSettings, updateSettings, getPublicBranding } from '../controllers/settingsController.js';

const router = Router();

// Ahead of requireAuth — the login screen needs the store name/logo before
// any token exists.
router.get('/public', getPublicBranding);

router.use(requireAuth);

// Any authenticated role can read settings (e.g. cashier checks tablesEnabled
// before showing the table picker); only admin/manager can change them.
router.get('/', getSettings);
router.patch('/', requireRole('admin', 'manager'), updateSettings);

export default router;
