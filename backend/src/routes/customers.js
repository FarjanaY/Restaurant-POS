import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { listCustomers, createCustomer, updateCustomer, deleteCustomer } from '../controllers/customerController.js';

const router = Router();

// This directory isn't wired into orders yet (no customerId on Order) — it's
// a standalone contact list for now, admin/manager only like the rest of the
// back office.
router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', listCustomers);
router.post('/', createCustomer);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

export default router;
