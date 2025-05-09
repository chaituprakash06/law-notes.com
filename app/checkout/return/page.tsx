// app/checkout/return/page.tsx
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';

function ReturnContent() {
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

    // Simply forward to the completion page with the session ID
    router.push(`/checkout/completion?session_id=${sessionId}`);
    
  }, [searchParams, router]);

  // Return UI for this component
  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <div className="flex justify-center mb-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Processing Your Payment</h1>
      <p className="text-gray-600">Please wait while we redirect you...</p>
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

// Main component with Suspense boundary
export default function CheckoutReturn() {
  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Suspense fallback={<LoadingFallback />}>
        <ReturnContent />
      </Suspense>
    </main>
  );
}