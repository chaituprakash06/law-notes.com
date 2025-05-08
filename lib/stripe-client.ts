'use client';

import { loadStripe, Stripe as StripeType } from '@stripe/stripe-js';

// Cache the stripe instance
let stripePromise: Promise<StripeType | null>;

// Initialize client-side Stripe (only runs in browser)
export const getStripePromise = () => {
  if (!stripePromise) {
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!stripePublicKey) {
      console.error('Stripe publishable key is not set in environment variables');
      return null;
    }
    
    stripePromise = loadStripe(stripePublicKey);
  }
  
  return stripePromise;
};