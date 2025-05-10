'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/Header';
import { initCart, clearCart } from '@/lib/stripe';

type PaymentStatus = 'loading' | 'success' | 'failed';

// Create a client component that uses useSearchParams
function CheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<PaymentStatus>('loading');
  const [email, setEmail] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initialize cart if it doesn't exist
    initCart();
    
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setStatus('failed');
      setErrorMessage('Missing session ID');
      return;
    }

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/payment-status?session_id=${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to check payment status');
        }
        
        if (data.status === 'complete') {
          // Use the clearCart utility function instead
          clearCart();
          
          setStatus('success');
          if (data.customer_email) {
            setEmail(data.customer_email);
          }
        } else {
          // Enhanced error handling based on Stripe status
          setStatus('failed');
          
          // More specific error message based on status
          if (data.status === 'expired') {
            setErrorMessage('Your payment session has expired. Please try again.');
          } else if (data.status === 'payment_intent.payment_failed') {
            setErrorMessage('Your payment was declined. Please try again with a different payment method.');
          } else {
            setErrorMessage('Payment was not completed successfully');
          }
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setStatus('failed');
        setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred');
      }
    };

    checkStatus();
  }, [searchParams]);

  if (status === 'loading') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Payment</h1>
        <p className="text-gray-600">Please wait while we confirm your payment...</p>
      </div>
    );
  }

  if (status === 'failed') {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="mb-8 flex justify-center">
          <div className="bg-red-100 rounded-full p-4">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-16 w-16 text-red-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M6 18L18 6M6 6l12 12" 
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Failed</h1>
        <p className="text-xl text-gray-600 mb-8">
          {errorMessage || 'We couldn\'t process your payment. Please try again.'}
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href="/cart"
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg"
          >
            Return to Cart
          </Link>
          <Link 
            href="/"
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg"
          >
            Browse Law Notes
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="mb-8 flex justify-center">
        <div className="bg-green-100 rounded-full p-4">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-16 w-16 text-green-600" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M5 13l4 4L19 7" 
            />
          </svg>
        </div>
      </div>
      
      <h1 className="text-4xl font-bold text-gray-900 mb-4">Thank You for Your Purchase!</h1>
      <p className="text-xl text-gray-600 mb-8">
        Your order has been successfully processed.
        {email && ` A confirmation has been sent to ${email}.`}
      </p>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-lg mx-auto mb-12">
        <h2 className="text-lg font-semibold mb-4">What's Next?</h2>
        <ul className="text-left text-gray-700 mb-6 space-y-4">
          <li className="flex">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span>You'll receive a confirmation email with your order details.</span>
          </li>
          <li className="flex">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span>Your purchased notes are now available in your dashboard.</span>
          </li>
          <li className="flex">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-blue-600 mr-2 flex-shrink-0" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            <span>You can download or view your notes at any time.</span>
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link 
          href="/"
          className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg"
        >
          Go to My Dashboard
        </Link>
        <Link 
          href="/"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-6 rounded-lg"
        >
          Browse More Law Notes
        </Link>
      </div>
    </div>
  );
}

// Loading fallback
function LoadingFallback() {
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
    </div>
  );
}

// Main page component with Suspense boundary
export default function CheckoutCompletionPage() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <CheckoutContent />
      </Suspense>
    </main>
  );
}