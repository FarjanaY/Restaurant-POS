import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import { listCoupons, createCoupon, updateCoupon, deleteCoupon } from '../controllers/couponController.js';

const router = Router();

// Managing the coupon catalog (the Discount admin page) is distinct from
// applying/removing one on a specific order (see routes/orders.js) — same
// admin/manager tier as the rest of the back-office area.
router.use(requireAuth, requireRole('admin', 'manager'));

router.get('/', listCoupons);
router.post('/', createCoupon);
router.patch('/:id', updateCoupon);
router.delete('/:id', deleteCoupon);

export default router;
