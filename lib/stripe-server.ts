import Stripe from 'stripe';

// Initialize server-side Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest Stripe API version
});

export { stripe };