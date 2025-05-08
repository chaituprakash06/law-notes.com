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

// Add cart type to Window interface
declare global {
  interface Window {
    cart: CartItem[];
    dispatchEvent(event: Event): boolean;
  }
}

// Initialize cart in window if undefined
export const initCart = () => {
  if (typeof window !== 'undefined') {
    // Try to get cart from localStorage if available
    try {
      const savedCart = localStorage.getItem('cart');
      window.cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      // If there's an error, initialize with empty array
      window.cart = [];
    }
  }
};

// Add item to cart
export const addToCart = (item: CartItem) => {
  if (typeof window === 'undefined') return;
  
  initCart();
  
  // Now TypeScript knows window.cart is defined after initCart()
  const existingItemIndex = window.cart?.findIndex(cartItem => cartItem.id === item.id) ?? -1;
  
  if (existingItemIndex >= 0) {
    // Item already exists, increase quantity
    window.cart[existingItemIndex].quantity += item.quantity;
  } else {
    // Add new item
    window.cart.push(item);
  }
  
  // Save to localStorage
  try {
    localStorage.setItem('cart', JSON.stringify(window.cart));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
  
  // Notify listeners of cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Remove item from cart
export const removeFromCart = (id: string) => {
  if (typeof window === 'undefined') return;
  
  initCart();
  
  window.cart = window.cart.filter(item => item.id !== id);
  
  // Save to localStorage
  try {
    localStorage.setItem('cart', JSON.stringify(window.cart));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
  
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
  
  // Save to localStorage
  try {
    localStorage.setItem('cart', JSON.stringify(window.cart));
  } catch (e) {
    console.error('Error saving cart to localStorage:', e);
  }
  
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

// Clear cart
export const clearCart = (): void => {
  if (typeof window === 'undefined') return;
  
  window.cart = [];
  
  // Remove from localStorage
  try {
    localStorage.removeItem('cart');
  } catch (e) {
    console.error('Error clearing cart from localStorage:', e);
  }
  
  // Notify listeners of cart update
  window.dispatchEvent(new CustomEvent('cartUpdated'));
};

// Setup config for your Stripe products
export const NOTES_PRODUCTS = {
  SINGLE_NOTE: 'law_note_single',
  BUNDLE: 'law_notes_bundle',
};