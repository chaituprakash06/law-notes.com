// components/NoteCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { CartItem, addToCart } from '@/lib/stripe';
import { getStoragePublicUrl } from '@/lib/supabase';

type Note = {
  id: string;
  title: string;
  description?: string;
  price: number;
  file_url: string;
  preview_url?: string;
};

interface NoteCardProps {
  note: Note;
  isPurchased?: boolean;
}

export default function NoteCard({ note, isPurchased = false }: NoteCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    // Try to load the preview image
    const loadPreviewImage = async () => {
      try {
        if (note.preview_url) {
          // Get the public URL from Supabase
          const url = getStoragePublicUrl(note.preview_url);
          setImageUrl(url);
        }
      } catch (error) {
        console.error('Error loading preview image:', error);
        setImageError(true);
      }
    };

    loadPreviewImage();
  }, [note.preview_url]);

  // Get file type label
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
  
  const handleAddToCart = () => {
    setIsAddingToCart(true);
    
    addToCart({
      id: note.id,
      title: note.title,
      price: note.price,
      quantity: 1
    });
    
    // Show visual feedback
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 500);
  };
  
  const handleDownload = () => {
    if (!isPurchased) return;
    
    // Get the file URL
    const fileUrl = getStoragePublicUrl(note.file_url);
    
    // Create a temporary anchor element to trigger the download
    const a = document.createElement('a');
    a.href = fileUrl || "";
    a.download = note.file_url.split('/').pop() || `${note.title.replace(/\s+/g, '_')}.docx`;
    a.target = '_blank'; // Open in new tab
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="relative h-64 bg-gray-100">
        {/* Purchased Badge */}
        {isPurchased && (
          <div className="absolute top-4 right-4 z-10 bg-green-100 text-green-800 font-semibold px-3 py-1 rounded-full text-sm">
            Purchased
          </div>
        )}
        
        {/* Display the actual preview image if available */}
        {imageUrl && !imageError ? (
          <div className="h-full w-full flex items-center justify-center overflow-hidden">
            <img 
              src={imageUrl} 
              alt={note.title}
              className="object-contain max-h-full max-w-full"
              onError={handleImageError}
            />
          </div>
        ) : (
          // Fallback to document icon if no image or error loading
          <div className="h-full w-full flex flex-col items-center justify-center p-4">
            <div className="w-24 h-24 mb-4">
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
            <h3 className="text-lg font-semibold text-center">{note.title}</h3>
            <p className="text-sm text-gray-500 text-center">{getFileTypeLabel()}</p>
          </div>
        )}
      </div>
      
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{note.title}</h3>
            <p className="text-gray-700 text-sm mt-1">{note.description}</p>
          </div>
          
          {/* Price tag */}
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
        
        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {isPurchased ? (
            <button 
              onClick={handleDownload}
              className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          ) : (
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`w-full flex items-center justify-center text-white py-2 px-4 rounded-lg transition ${
                isAddingToCart ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isAddingToCart ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Adding...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}