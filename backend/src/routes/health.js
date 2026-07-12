import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-pos-backend' });
});

export default router;
