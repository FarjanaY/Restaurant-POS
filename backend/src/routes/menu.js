import { Router } from 'express';
import { getMenu, getModifierGroups } from '../controllers/menuController.js';

const router = Router();

// GET /api/menu — categories + active items + their modifier groups
router.get('/', getMenu);
router.get('/modifier-groups', getModifierGroups);

export default router;
