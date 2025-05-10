// components/checkout/checkout-modal.tsx
'use client';

import { useState, useEffect } from 'react';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { getStripePromise } from '@/lib/stripe-client';
import { useRouter } from 'next/navigation';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: any[]; // Replace with your actual cart item type
}

export default function CheckoutModal({ isOpen, onClose, cartItems }: CheckoutModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  // Check auth status first
  useEffect(() => {
    const checkAuthStatus = async () => {
      if (!isOpen) return;
      
      try {
        setLoading(true);
        const response = await fetch('/api/auth/status');
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Authentication required');
        }
        
        const data = await response.json();
        setUserId(data.user.id);
      } catch (err: any) {
        console.error('Auth check error:', err);
        setError('Authentication required');
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, [isOpen]);

  // Only fetch checkout session when we have a userId
  useEffect(() => {
    if (!isOpen || !userId) return;

    const fetchCheckoutSession = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('Creating checkout with verified userId:', userId);

        // Prepare return URL with origin
        const returnUrl = `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`;

        const response = await fetch('/api/embedded-checkout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            items: cartItems,
            returnUrl,
            userId: userId
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Server configuration error');
        }

        const { clientSecret } = await response.json();
        setClientSecret(clientSecret);
        setLoading(false);
      } catch (err: any) {
        console.error('Error creating checkout session:', err);
        setError(err.message || 'Failed to create checkout session');
        setLoading(false);
      }
    };

    fetchCheckoutSession();
  }, [isOpen, cartItems, userId]);

  const handleRedirectToLogin = () => {
    localStorage.setItem('redirectAfterLogin', '/cart');
    router.push('/login');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="relative w-full max-w-md p-6 bg-white rounded-lg shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <span className="sr-only">Close</span>
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-xl font-semibold mb-4">Secure Checkout</h2>

        {loading && <div className="py-4 text-center">Loading checkout...</div>}

        {error && (
          <div className="p-4 mb-4 bg-red-100 text-red-700 rounded-md">
            <p>{error}</p>
            {error === 'Authentication required' ? (
              <button 
                onClick={handleRedirectToLogin}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Sign In
              </button>
            ) : (
              <button 
                onClick={onClose}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Return to Cart
              </button>
            )}
          </div>
        )}

        {clientSecret && !loading && !error && (
          <div className="min-h-[400px]">
            <EmbeddedCheckoutProvider
              stripe={getStripePromise()}
              options={{ clientSecret }}
            >
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
          </div>
        )}
      </div>
    </div>
  );
}