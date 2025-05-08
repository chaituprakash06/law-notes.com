import { loadStripe } from '@stripe/stripe-js';
import Stripe from 'stripe';

// Initialize client-side Stripe
export const getStripe = async () => {
  const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string;
  return await loadStripe(stripePublicKey);
};

// Initialize server-side Stripe
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16', // Use the latest Stripe API version
});

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