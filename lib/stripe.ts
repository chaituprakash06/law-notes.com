'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Cache the stripe instance
let stripePromise: Promise<Stripe | null>;

// Initialize client-side Stripe (only runs in browser)
export const getStripe = () => {
  if (!stripePromise) {
    const stripePublicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    
    if (!stripePublicKey) {
      console.error('Stripe publishable key is not set in environment variables');
      return Promise.resolve(null);
    }
    
    stripePromise = loadStripe(stripePublicKey);
  }
  
  return stripePromise;
};

// Type for cart items
export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

// Initialize cart in window if undefined
export const initCart = () => {
  if (typeof window !== 'undefined' && !window.cart) {
    window.cart = [];
  }
};

// Add item to cart
export const addToCart = (item: CartItem) => {
  if (typeof window === 'undefined') return;
  
  initCart();
  
  const existingItemIndex = window.cart.findIndex(cartItem => cartItem.id === item.id);
  
  if (existingItemIndex >= 0) {
    // Item already exists, increase quantity
    window.cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    window.cart.push(item);
  }
  
  // Notify listeners of cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Remove item from cart
export const removeFromCart = (id: string) => {
  if (typeof window === 'undefined') return;
  
  initCart();
  
  window.cart = window.cart.filter(item => item.id !== id);
  
  // Notify listeners of cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Update item quantity
export const updateCartItemQuantity = (id: string, quantity: number) => {
  if (typeof window === 'undefined' || quantity < 1) return;
  
  initCart();
  
  const updatedCart = window.cart.map(item => 
    item.id === id ? { ...item, quantity } : item
  );
  
  window.cart = updatedCart;
  
  // Notify listeners of cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Get current cart
export const getCart = (): CartItem[] => {
  if (typeof window === 'undefined') return [];
  
  initCart();
  return [...window.cart];
};

// Calculate cart total
export const calculateCartTotal = (): number => {
  if (typeof window === 'undefined') return 0;
  
  initCart();
  return window.cart.reduce((total, item) => total + item.price * item.quantity, 0);
};

// Setup config for your Stripe products
export const NOTES_PRODUCTS = {
  SINGLE_NOTE: 'law_note_single',
  BUNDLE: 'law_notes_bundle',
};