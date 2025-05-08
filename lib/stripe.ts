'use client';

import { loadStripe } from '@stripe/stripe-js';

// Initialize client-side Stripe (only runs in browser)
export const getStripe = async () => {
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
  return await loadStripe(stripePublicKey);
};

// Type for cart items
export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

// Setup config for your Stripe products
export const NOTES_PRODUCTS = {
  SINGLE_NOTE: 'law_note_single',
  BUNDLE: 'law_notes_bundle',
};