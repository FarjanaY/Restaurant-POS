import { Router } from 'express';

const router = Router();

// Scaffold only — PIN/credential login wired to JWT issuance tracked in DEVELOPMENT_CHECKLIST.md Phase 1/2.
router.post('/login', (req, res) => {
  res.status(501).json({ message: 'Not implemented yet' });
});

export default router;
