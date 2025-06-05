// components/Header.tsx
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';
import { getCart } from '@/lib/stripe';
import MySubmittedNotes from './MySubmittedNotes';

export default function Header() {
  const { user, signOut } = useAuth();
  const [cartItemCount, setCartItemCount] = useState(0);
  const router = useRouter();
  
  useEffect(() => {
    // Update cart count whenever cart changes
    const updateCartCount = () => {
      const cart = getCart();
      const count = cart.reduce((total, item) => total + item.quantity, 0);
      setCartItemCount(count);
    };
    
    // Initial count
    updateCartCount();
    
    // Listen for cart updates
    const handleCartUpdate = () => updateCartCount();
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    // Clean up
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);
  
  const handleSignOut = async () => {
    try {
      await signOut();
      // Navigate to home page after sign out
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 text-2xl font-bold">
          law-notes.com
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-800 hover:text-blue-600">
            Home
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-6">
              {/* My Submitted Notes button */}
              <MySubmittedNotes />
              
              {/* Display user email */}
              <span className="text-gray-600">{user.email}</span>
              
              {/* Sign Out Button */}
              <button 
                onClick={handleSignOut}
                className="text-gray-800 hover:text-blue-600"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link 
                href="/login" 
                className="text-gray-800 hover:text-blue-600"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
          
          <Link href="/cart" className="relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-gray-800" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            {cartItemCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}