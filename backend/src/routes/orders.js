import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import {
  createOrder,
  listOrders,
  getOrder,
  updateOrder,
  voidOrder,
  markLineDone,
<<<<<<< HEAD
  updateKitchenStatus,
  completeOrder,
  applyCoupon,
  removeCoupon,
  applyManualDiscount,
  removeManualDiscount,
=======
  completeOrder,
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
} from '../controllers/ordersController.js';
import { addPayment, createCardIntent } from '../controllers/paymentsController.js';

const router = Router();

router.use(requireAuth);

// Reads are low-risk and useful to every staff-facing screen (register + KDS).
const READ_ROLES = requireRole('admin', 'manager', 'cashier', 'kitchen');
// Building/settling an order is a register (counter) action.
const REGISTER_ROLES = requireRole('admin', 'manager', 'cashier');
// Bumping tickets is a kitchen action — a cashier has no reason to mark food done.
const KITCHEN_ROLES = requireRole('admin', 'manager', 'kitchen');

router.get('/', READ_ROLES, listOrders);
router.get('/:id', READ_ROLES, getOrder);
router.post('/', REGISTER_ROLES, createOrder);
router.patch('/:id', REGISTER_ROLES, updateOrder);
router.post('/:id/void', REGISTER_ROLES, voidOrder);
<<<<<<< HEAD
router.post('/:id/coupon', REGISTER_ROLES, applyCoupon);
router.delete('/:id/coupon', REGISTER_ROLES, removeCoupon);
router.post('/:id/discount', REGISTER_ROLES, applyManualDiscount);
router.delete('/:id/discount', REGISTER_ROLES, removeManualDiscount);
router.post('/:id/card-intent', REGISTER_ROLES, createCardIntent);
router.post('/:id/payments', REGISTER_ROLES, addPayment);
router.patch('/:id/lines/:lineId', KITCHEN_ROLES, markLineDone);
router.patch('/:id/kitchen-status', KITCHEN_ROLES, updateKitchenStatus);
=======
router.post('/:id/card-intent', REGISTER_ROLES, createCardIntent);
router.post('/:id/payments', REGISTER_ROLES, addPayment);
router.patch('/:id/lines/:lineId', KITCHEN_ROLES, markLineDone);
>>>>>>> bdb08ea8c4a9d4ddf83e75a1c151f089d16cdeb3
router.post('/:id/complete', KITCHEN_ROLES, completeOrder);

export default router;
