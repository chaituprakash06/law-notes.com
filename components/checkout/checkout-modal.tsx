// components/checkout/checkout-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe-client';
import { useRouter } from 'next/navigation';
import { checkAuthClientSide } from '@/lib/auth-client';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[]; // Replace with your actual cart item type
}

export default function CheckoutModal({ isOpen, onClose, cartItems }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const initializeCheckout = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check auth status client-side
        const authStatus = await checkAuthClientSide();
        
        if (!authStatus.authenticated) {
          console.error('Authentication required for checkout');
          setError('Authentication required');
          setLoading(false);
          return;
        }
        
        console.log('Authenticated user:', authStatus.userId);
        
        // Prepare return URL with origin
        const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

        // Create checkout session with direct user ID
        const response = await fetch('/api/embedded-checkout-direct', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            returnUrl,
            userId: authStatus.userId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Server configuration error');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
      } catch (err: any) {
        console.error('Error creating checkout session:', err);
        setError(err instanceof Error ? err.message : 'Failed to create checkout session');
      } finally {
        setLoading(false);
      }
    };

    initializeCheckout();
  }, [isOpen, cartItems]);

  const handleRedirectToLogin = () => {
    localStorage.setItem('redirectAfterLogin', '/cart');
    router.push('/login');
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 md:p-0" onClick={handleClose}>
      <div 
        className="relative w-full max-w-md bg-white rounded-lg shadow-xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()} // Prevent closing when clicking inside
      >
        {/* Header with fixed position */}
        <div className="p-4 border-b sticky top-0 bg-white z-10 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Secure Checkout</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content with scroll */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && (
            <div className="py-8 flex justify-center items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2">Loading checkout...</span>
            </div>
          )}

          {error && (
            <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
              <p>{error}</p>
              {error === 'Authentication required' ? (
                <button 
                  onClick={handleRedirectToLogin}
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Sign In
                </button>
              ) : (
                <button 
                  onClick={handleClose}
                  className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Return to Cart
                </button>
              )}
            </div>
          )}

          {clientSecret && !loading && !error && (
            <div className="embedded-checkout-container">
              <EmbeddedCheckoutProvider
                stripe={getStripePromise()}
                options={{ clientSecret }}
              >
                <EmbeddedCheckout className="embedded-checkout" />
              </EmbeddedCheckoutProvider>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}