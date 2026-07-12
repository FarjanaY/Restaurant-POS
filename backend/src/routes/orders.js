import { Router } from 'express';

const router = Router();

// Scaffold only — full implementation (VAT calc, payments, void) tracked in DEVELOPMENT_CHECKLIST.md Phase 1.
router.post('/', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.patch('/:id', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/:id/payments', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

router.post('/:id/void', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
