'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function CartButton() {
  const [cartCount, setCartCount] = useState(0);
  
  useEffect(() => {
    // Set initial cart count
    if (typeof window !== 'undefined') {
      setCartCount(window.cart?.length || 0);
      
      // Listen for cart updates
      const handleCartUpdate = () => {
        setCartCount(window.cart?.length || 0);
      };
      
      window.addEventListener('cartUpdated', handleCartUpdate);
      
      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate);
      };
    }
  }, []);
  
  return (
    <Link href="/cart" className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      
      {cartCount > 0 && (
        <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
          {cartCount}
        </span>
      )}
    </Link>
  );
}