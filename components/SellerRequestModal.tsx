'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';

interface SellerRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SellerRequestModal({ isOpen, onClose }: SellerRequestModalProps) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    subjectName: '',
    examScore: '',
    file: null as File | null,
  });

  // Check if bucket exists on component mount
  useEffect(() => {
    const checkBucket = async () => {
      try {
        const { data, error } = await supabase.storage.listBuckets();
        console.log('Available buckets:', data);
        if (error) {
          console.error('Error listing buckets:', error);
        }
      } catch (err) {
        console.error('Error checking buckets:', err);
      }
    };
    
    if (isOpen) {
      checkBucket();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      setError('You must be logged in to submit a request');
      return;
    }
    
    if (!user.email) {
      setError('User email not found');
      return;
    }

    if (!formData.file) {
      setError('Please upload your notes document');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Upload file to Supabase storage
      const fileExt = formData.file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `seller-uploads/${fileName}`;

      console.log('Uploading to bucket: law-notes');
      console.log('File path:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('law-notes')
        .upload(filePath, formData.file);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', uploadData);

      if (uploadError) throw uploadError;

      // Create seller request record
      const { error: dbError } = await supabase
        .from('seller_requests')
        .insert({
          user_id: user.id,
          email: user.email,
          subject_name: formData.subjectName,
          exam_score: formData.examScore,
          file_url: filePath,
          file_name: formData.file.name,
        });

      if (dbError) throw dbError;

      // Reset form and close modal
      setFormData({ subjectName: '', examScore: '', file: null });
      onClose();
      
      // Show success message (you can replace this with a toast notification)
      alert('Your request has been submitted successfully!');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (e.g., max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'application/msword', 
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        setError('Please upload a PDF or Word document');
        return;
      }
      
      setFormData({ ...formData, file });
      setError(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <h2 className="text-2xl font-bold mb-6">Submit Your Notes</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject Name
            </label>
            <input
              type="text"
              required
              value={formData.subjectName}
              onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Contract Law, Criminal Law"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exam Score
            </label>
            <input
              type="text"
              required
              value={formData.examScore}
              onChange={(e) => setFormData({ ...formData, examScore: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., First Class (75%), 2:1 (65%)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Upload Notes Document
            </label>
            <input
              type="file"
              required
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Accepted formats: PDF, DOC, DOCX (Max 10MB)
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div className="flex space-x-4 pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Submitting...' : 'Submit Request'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}