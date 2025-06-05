'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import SellerRequestModal from './SellerRequestModal';
import { track } from '@vercel/analytics';

export default function SellerRequestBox() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (!user) {
      // Redirect to login with return URL
      const returnUrl = encodeURIComponent(window.location.pathname);
      router.push(`/login?redirect=${returnUrl}`);
    } else {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 text-center shadow-sm hover:shadow-md transition-shadow">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Have first class notes to sell?
        </h3>
        <p className="text-gray-600 mb-4">
          Share your knowledge and earn money from your high-quality notes
        </p>
        <button
          onClick={() => {
            handleClick;
            track('SubmitNotes');
        }}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          Submit a request here
        </button>
      </div>

      <SellerRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </>
  );
}