import Stripe from 'stripe';

let cachedClient = null;

// Lazy singleton — avoids constructing a Stripe client (and validating the key)
// at module-import time, which would break any test that imports this module
// without STRIPE_SECRET_KEY set.
export function getStripeClient() {
  if (!cachedClient) {
    cachedClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return cachedClient;
}

// Boots the Stripe Terminal SDK on the register (frontend calls this once per session).
export async function createConnectionToken(stripe = getStripeClient()) {
  const token = await stripe.terminal.connectionTokens.create();
  return token.secret;
}

// card_present + automatic capture is the Stripe Terminal in-person flow —
// the reader collects and confirms the payment method, Stripe auto-captures.
export async function createCardPaymentIntent(amountEur, stripe = getStripeClient()) {
  return stripe.paymentIntents.create({
    amount: Math.round(amountEur * 100),
    currency: 'eur',
    payment_method_types: ['card_present'],
    capture_method: 'automatic',
  });
}

export async function retrievePaymentIntent(paymentIntentId, stripe = getStripeClient()) {
  return stripe.paymentIntents.retrieve(paymentIntentId);
}
