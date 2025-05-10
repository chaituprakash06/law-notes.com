'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getCart, updateCartItemQuantity, removeFromCart, calculateCartTotal, initCart } from '@/lib/stripe';
import { useAuth } from '@/lib/AuthContext';
import CheckoutModal from '@/components/checkout/checkout-modal';

export default function CartPage() {
  const [cartItems, setCartItems] = useState(getCart());
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const router = useRouter();
  // Get user from auth context
  const { user, isLoading: isAuthLoading } = useAuth();
  
  // Remove mock user
  // const mockUser = { id: 'mock-user-id' };

  useEffect(() => {
    // Initialize cart if it doesn't exist
    initCart();
    
    // Set initial cart items
    setCartItems(getCart());
    
    // Listen for cart updates
    const handleCartUpdate = () => {
      setCartItems(getCart());
    };
    
    window.addEventListener('cartUpdated', handleCartUpdate);
    
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const handleUpdateQuantity = (id: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateCartItemQuantity(id, newQuantity);
  };

  const handleRemoveItem = (id: string) => {
    removeFromCart(id);
  };

  const handleCheckout = async () => {
  setIsLoading(true);
  setErrorMessage(null);
  
  try {
    // Check authentication status first
    const authResponse = await fetch('/api/auth/status');
    
    if (!authResponse.ok) {
      // Not authenticated, redirect to login
      localStorage.setItem('redirectAfterLogin', '/cart');
      router.push('/login');
      setErrorMessage('Please log in to proceed with checkout');
      return;
    }
    
    // User is authenticated, proceed to checkout
    setIsCheckoutOpen(true);
  } catch (error) {
    console.error('Error checking auth:', error);
    setErrorMessage('Authentication check failed. Please try again.');
  } finally {
    setIsLoading(false);
  }
};

  const closeCheckoutModal = () => {
    setIsCheckoutOpen(false);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>
        
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{errorMessage}</p>
          </div>
        )}
        
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">Your cart is empty.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Browse Law Notes
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Cart items */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {cartItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{item.title}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">${item.price.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 h-8 w-8 rounded-full flex items-center justify-center"
                            aria-label="Decrease quantity"
                          >
                            -
                          </button>
                          <span className="text-sm text-gray-700">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-700 h-8 w-8 rounded-full flex items-center justify-center"
                            aria-label="Increase quantity"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">${(item.price * item.quantity).toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="text-red-600 hover:text-red-800"
                          aria-label="Remove item"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Order summary */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${calculateCartTotal().toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>${calculateCartTotal().toFixed(2)}</span>
              </div>
              
              {/* Add login notice for non-authenticated users */}
              {!user && !isAuthLoading && (
                <div className="mt-4 p-3 bg-blue-50 text-blue-800 rounded-md">
                  <p>You'll need to log in to complete your purchase.</p>
                </div>
              )}
              
              <button
                onClick={handleCheckout}
                disabled={isLoading || isAuthLoading}
                className={`w-full mt-6 py-3 px-4 rounded-lg text-white ${
                  isLoading || isAuthLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? 'Processing...' : isAuthLoading ? 'Loading...' : user ? 'Proceed to Checkout' : 'Log In to Checkout'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Embedded Checkout Modal - only show for authenticated users */}
      {isCheckoutOpen && (
        <CheckoutModal
          isOpen={isCheckoutOpen}
          onClose={closeCheckoutModal}
          cartItems={cartItems}
        />
      )}
    </main>
  );
}