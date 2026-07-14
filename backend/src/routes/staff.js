import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { listStaff, createStaff, updateStaff, deactivateStaff } from '../controllers/staffController.js';

const router = Router();

// Staff records (names, roles, PINs) are sensitive — admin only, no manager
// tier here (unlike Tables/Dashboard/Orders), since this also controls who
// can log in as what role at all.
router.use(requireAuth, requireRole('admin'));

router.get('/', listStaff);
router.post('/', createStaff);
router.patch('/:id', updateStaff);
router.delete('/:id', deactivateStaff);

export default router;
