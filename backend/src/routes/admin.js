import { Router } from 'express';

import { requireAuth, requireRole } from '../middleware/auth.js';
import * as categoryController from '../controllers/categoryController.js';
import * as menuItemController from '../controllers/menuItemController.js';
import * as modifierGroupController from '../controllers/modifierGroupController.js';
import { listTaxCategories } from '../controllers/taxCategoryController.js';

const router = Router();

router.use(requireAuth, requireRole('admin'));

router.get('/tax-categories', listTaxCategories);

router.get('/categories', categoryController.listCategories);
router.post('/categories', categoryController.createCategory);
router.patch('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);

router.get('/menu-items', menuItemController.listMenuItems);
router.post('/menu-items', menuItemController.createMenuItem);
router.patch('/menu-items/:id', menuItemController.updateMenuItem);
router.delete('/menu-items/:id', menuItemController.deleteMenuItem);

router.get('/modifier-groups', modifierGroupController.listModifierGroups);
router.post('/modifier-groups', modifierGroupController.createModifierGroup);
router.patch('/modifier-groups/:id', modifierGroupController.updateModifierGroup);
router.delete('/modifier-groups/:id', modifierGroupController.deleteModifierGroup);

export default router;
