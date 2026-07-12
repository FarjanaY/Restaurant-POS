import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { getConnectionToken } from '../controllers/terminalController.js';

const router = Router();

router.post('/connection-token', requireAuth, requireRole('admin', 'manager', 'cashier'), getConnectionToken);

export default router;
