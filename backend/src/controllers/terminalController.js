import { createConnectionToken } from '../services/stripeService.js';

// The register's Stripe Terminal SDK calls this once per session to boot its
// connection to a reader (physical or Stripe's test-mode simulated reader).
export async function getConnectionToken(req, res, next) {
  try {
    const secret = await createConnectionToken();
    res.json({ secret });
  } catch (err) {
    next(err);
  }
}
