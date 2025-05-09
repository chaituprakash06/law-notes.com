// lib/stripe.ts (updated to include product price IDs)
'use client';

import { loadStripe, Stripe } from '@stripe/stripe-js';

// Cache the stripe instance
let stripePromise: Promise<Stripe | null>;

// Type for cart items
export type CartItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
};

// Add cart type to Window interface (only once in the entire app)
declare global {
  interface Window {
    cart: CartItem[];
    dispatchEvent(event: Event): boolean;
  }
}

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

// Initialize cart in window if undefined
export const initCart = () => {
  if (typeof window !== 'undefined') {
    if (!window.cart) {
      // Try to get cart from localStorage if available
      try {
        const savedCart = localStorage.getItem('cart');
        window.cart = savedCart ? JSON.parse(savedCart) : [];
      } catch (e) {
        // If there's an error, initialize with empty array
        window.cart = [];
      }
    }
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

// Map note IDs to Stripe price IDs
export const NOTE_STRIPE_PRICE_IDS: Record<string, string> = {
  'tax-law-notes': 'price_1RMwA905kmxxE8ck0nTL5h7P', // Replace with your actual price ID
  'jurisprudence-law-notes': 'price_1RMXJ205kmxxE8ckiODTh3PN', // Replace with your actual price ID
  'company-law-notes': 'price_1RMw9W05kmxxE8ckY5YDsS6y' // Replace with your actual price ID
};

// Map note IDs to actual note titles and prices (for display and local cart)
export const NOTES_CATALOG = {
  'tax-law-notes': {
    id: 'tax-law-notes',
    title: 'Tax Law Notes',
    price: 19.99,
    description: 'Tax notes as at LSE 2024 exams',
    file_url: 'notes/tax_law.pdf'
  },
  'jurisprudence-law-notes': {
    id: 'jurisprudence-law-notes',
    title: 'Jurisprudence Law Notes',
    price: 19.99,
    description: 'Jurisprudence notes as at LSE 2024 exams',
    file_url: 'notes/juris_law.docx'
  },
  'company-law-notes': {
    id: 'company-law-notes',
    title: 'Company Law Notes',
    price: 19.99,
    description: 'Company notes as at LSE 2024 exams',
    file_url: 'notes/company_law.docx'
  }
};