'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Note } from '@/lib/supabase';
import { CartItem } from '@/lib/stripe';
import { useAuth } from '@/lib/AuthContext';

// Add this to your global state management later
// For simplicity, we'll use a simple global variable for now
declare global {
  interface Window {
    cart?: CartItem[];
    addToCart?: (item: CartItem) => void;
  }
}

// Initialize global cart if it doesn't exist
if (typeof window !== 'undefined') {
  window.cart = window.cart || [];
  window.addToCart = (item: CartItem) => {
    const existingItem = window.cart?.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      existingItem.quantity += 1;
    } else {
      window.cart?.push(item);
    }
    
    // Dispatch an event to notify components that the cart has changed
    window.dispatchEvent(new CustomEvent('cartUpdated'));
  };
}

interface NoteCardProps {
  note: Note;
  isPurchased: boolean;
}

export default function NoteCard({ note, isPurchased }: NoteCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { user } = useAuth();
  const router = useRouter();
  
  const handleAddToCart = () => {
    if (typeof window !== 'undefined' && window.addToCart) {
      window.addToCart({
        id: note.id,
        title: note.title,
        price: note.price,
        quantity: 1
      });
    }
  };
  
  const handleDownload = async () => {
    // Redirect to login if not authenticated
    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent('/dashboard')}`);
      return;
    }
    
    // Don't allow download if not purchased
    if (!isPurchased) {
      return;
    }
    
    try {
      setIsDownloading(true);
      
      // The note.file_url should already be a public URL from Supabase Storage
      const fileUrl = note.file_url;
      
      // Get the filename from the URL or use the note title
      const fileName = note.file_url.split('/').pop() || `${note.title.replace(/\s+/g, '_')}.docx`;
      
      // Create a temporary anchor element to trigger the download
      const a = document.createElement('a');
      a.href = fileUrl;
      a.download = fileName;
      a.target = '_blank'; // Open in new tab to ensure download starts
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download the file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const handlePreview = () => {
    setShowPreview(true);
  };
  
  const closePreview = () => {
    setShowPreview(false);
  };

  // Function to get file type label
  const getFileTypeLabel = () => {
    const fileUrl = note.file_url.toLowerCase();
    if (fileUrl.endsWith('.pdf')) {
      return 'PDF Document';
    } else if (fileUrl.endsWith('.docx') || fileUrl.endsWith('.doc')) {
      return 'Word Document';
    } else {
      return 'Document';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-80 bg-gray-100">
        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-4 right-4 z-10 bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full text-sm">
            Purchased
          </div>
        )}
        
        {/* Document Type Preview */}
        <div className="h-full w-full flex flex-col items-center justify-center p-4">
          {/* Document Icon */}
          <div className="w-32 h-32 mb-4 flex items-center justify-center">
            {note.file_url.toLowerCase().endsWith('.pdf') ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          
          {/* Document Title */}
          <h3 className="text-lg font-semibold text-center">{note.title}</h3>
          <p className="text-sm text-gray-500 text-center">{getFileTypeLabel()}</p>
        </div>
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">{note.title}</h3>
            <p className="text-gray-600 text-sm mt-1">{note.description}</p>
          </div>
          
          {/* Price tag for non-purchased notes */}
          {!isPurchased && (
            <div className="bg-blue-100 text-blue-800 font-semibold px-3 py-1 rounded-full text-sm">
              ${note.price.toFixed(2)}
            </div>
          )}
        </div>
        
        {/* File type indicator */}
        <div className="mt-2 flex items-center text-sm text-gray-500">
          {note.file_url.toLowerCase().endsWith('.pdf') ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          )}
          <span>{getFileTypeLabel()}</span>
        </div>
        
        {/* Download or Add to Cart buttons */}
        <div className="mt-4 flex gap-2">
          {isPurchased ? (
            /* Download button for purchased notes */
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition ${
                isDownloading ? 'opacity-75' : ''
              }`}
            >
              {isDownloading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Downloading...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Note
                </>
              )}
            </button>
          ) : (
            <>
              {/* Preview button */}
              <button 
                onClick={handlePreview}
                className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Preview
              </button>
            
              {/* Add to Cart button */}
              <button 
                onClick={handleAddToCart}
                className="flex-1 flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Add to Cart
              </button>
            </>
          )}
        </div>
        
        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-semibold">{note.title} - Preview</h3>
                <button 
                  onClick={closePreview}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-6 overflow-auto flex-1">
                <div className="mb-4 flex items-center">
                  {note.file_url.toLowerCase().endsWith('.pdf') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-3 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  )}
                  <div>
                    <h4 className="font-medium">{note.title}</h4>
                    <p className="text-sm text-gray-500">{getFileTypeLabel()}</p>
                  </div>
                </div>
                
                <div className="prose max-w-none">
                  <h3>Description</h3>
                  <p>{note.description}</p>
                  
                  <h3 className="mt-6">Preview Content</h3>
                  <p>This note contains comprehensive study materials for {note.title}.</p>
                  <p>Key topics covered:</p>
                  <ul>
                    <li>Core concepts and principles</li>
                    <li>Important cases and precedents</li>
                    <li>Exam preparation guidance</li>
                    <li>Sample questions and model answers</li>
                  </ul>
                  
                  <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                    <p className="font-medium">Note: This is a preview.</p>
                    <p>Purchase this note to access the full content and download the file.</p>
                  </div>
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="border-t p-4 flex justify-end gap-3">
                <button 
                  onClick={closePreview}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button 
                  onClick={handleAddToCart}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart - ${note.price.toFixed(2)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}