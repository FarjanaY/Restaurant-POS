import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { listTables, createTable, updateTable, deleteTable } from '../controllers/tableController.js';

const router = Router();

router.use(requireAuth);

// Cashier needs to read the floor for the Register table picker; only
// admin/manager set up the floor plan itself.
const READ_ROLES = requireRole('admin', 'manager', 'cashier');
const MANAGE_ROLES = requireRole('admin', 'manager');

router.get('/', READ_ROLES, listTables);
router.post('/', MANAGE_ROLES, createTable);
router.patch('/:id', MANAGE_ROLES, updateTable);
router.delete('/:id', MANAGE_ROLES, deleteTable);

export default router;
