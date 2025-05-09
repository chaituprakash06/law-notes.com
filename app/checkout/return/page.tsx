// app/checkout/return/page.tsx
'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function CheckoutReturn() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    // Get the session ID from the URL
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      // If no session ID, redirect to cart with error
      router.push('/cart?error=missing_session_id');
      return;
    }

    // Check redirect status if provided by Stripe
    const redirectStatus = searchParams.get('redirect_status');
    
    // Simply forward to the completion page with the session ID
    // The completion page will handle checking the payment status
    router.push(`/checkout/completion?session_id=${sessionId}`);
    
  }, [searchParams, router]);

  // Show loading while redirecting
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="flex justify-center mb-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Payment</h1>
        <p className="text-gray-600">Please wait while we redirect you...</p>
      </div>
    </main>
  );
}