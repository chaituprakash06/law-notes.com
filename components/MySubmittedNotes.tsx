'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface SellerRequest {
  id: string;
  user_id: string;
  email: string;
  subject_name: string;
  exam_score: string;
  file_url: string;
  file_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export default function MySubmittedNotes() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      fetchSubmittedNotes();
    }
  }, [isOpen, user]);

  const fetchSubmittedNotes = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching submitted notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status as keyof typeof statusStyles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) return null;

  return (
    <>
      {/* Button in header */}
      <button
        onClick={() => setIsOpen(true)}
        className="text-gray-800 hover:text-blue-600 font-medium"
      >
        My Submitted Notes
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold">My Submitted Notes</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading your submissions...</p>
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-4 text-gray-600">You haven't submitted any notes yet.</p>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Submit your first notes
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {requests.map((request) => (
                    <div key={request.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{request.subject_name}</h3>
                          <p className="text-sm text-gray-600 mt-1">Score: {request.exam_score}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted on {formatDate(request.created_at)}
                          </p>
                        </div>
                        <div className="ml-4">
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                      
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        {request.file_name}
                      </div>

                      {request.status === 'pending' && (
                        <p className="mt-3 text-sm text-gray-600 italic">
                          Your submission is being reviewed. We'll notify you once it's processed.
                        </p>
                      )}
                      
                      {request.status === 'approved' && (
                        <p className="mt-3 text-sm text-green-600">
                          ✓ Your notes have been approved and will be listed for sale soon!
                        </p>
                      )}
                      
                      {request.status === 'rejected' && (
                        <p className="mt-3 text-sm text-red-600">
                          Your submission was not approved. Please ensure your notes meet our quality standards.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}