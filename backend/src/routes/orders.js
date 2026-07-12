import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  voidOrder,
} from '../controllers/ordersController.js';
import { addPayment } from '../controllers/paymentsController.js';

const router = Router();

router.use(requireAuth, requireRole('admin', 'manager', 'cashier'));

router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id', updateOrder);
router.post('/:id/void', voidOrder);
router.post('/:id/payments', addPayment);

export default router;
