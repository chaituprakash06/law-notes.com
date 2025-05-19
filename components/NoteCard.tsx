// /components/NoteCard.tsx
'use client';

import { useState, useEffect } from 'react';
import { CartItem, addToCart } from '@/lib/stripe';
import NoteChatbot from './NoteChatbot';

type Note = {
  id: string;
  title: string;
  description?: string;
  price: number;
  file_url: string;
  preview_url?: string;
  signed_preview_url?: string;
};

interface NoteCardProps {
  note: Note;
  isPurchased?: boolean;
}

// Define the signed URL map with an index signature
const signedUrlMap: Record<string, string> = {
  'previews/company_image.png': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/previews/company_image.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvcHJldmlld3MvY29tcGFueV9pbWFnZS5wbmciLCJpYXQiOjE3NDY4MTQ1NTEsImV4cCI6MTc0OTQwNjU1MX0.f98LRAKYgChgRMxc8y_Me7eODrISjawg9G9Ggoi5s6g',
  'previews/tax_image.png': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/previews/tax_image.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvcHJldmlld3MvdGF4X2ltYWdlLnBuZyIsImlhdCI6MTc0NjgxNDUzNCwiZXhwIjoxNzQ5NDA2NTM0fQ.HKFbRVvVpJ979W3Sr7hc0s7aYrSXPqrpM1ceDW-5No8',
  'previews/juris_law.png': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/previews/company_image.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvcHJldmlld3MvY29tcGFueV9pbWFnZS5wbmciLCJpYXQiOjE3NDY4MTQwODgsImV4cCI6MTc0OTQwNjA4OH0.Vmd0GmXI0vhPd0usTepe1Ou0ZnlzyDUiF4uafF7GWNw'
};

// Map to store signed download URLs by ID
const signedDownloadUrlMap: Record<string, string> = {
  // Tax Law Notes (ID: 4d9fc245-ed05-404c-af40-a093bdd9257)
  '4d9fc245-ed05-404c-af40-a093bdd9257': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/company_law.docx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvY29tcGFueV9sYXcuZG9jeCIsImlhdCI6MTc0NjgzODk2MiwiZXhwIjoxNzQ5NDMwOTYyfQ.TEAs6yqOnDLrUQTIzH4fd5LQ7o_6JlUKfBAtzFe0HWM',
  
  // Jurisprudence Law Notes (ID: 6f5748c7-1f83-42ba-baa3-a09e3ef8a083)
  '6f5748c7-1f83-42ba-baa3-a09e3ef8a083': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/juris_law.docx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvanVyaXNfbGF3LmRvY3giLCJpYXQiOjE3NDY4Mzg3MDgsImV4cCI6MTc0OTQzMDcwOH0.6upB-ZRlMLJVqEfqZJEwSZnXir1Q2ecMMOtQ2HdiRJw',
  
  // Company Law Notes (ID: 78a10da9-d208-4e5e-914a-09d97cb2892)
  '78a10da9-d208-4e5e-914a-09d97cb2892': 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/company_law.docx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvY29tcGFueV9sYXcuZG9jeCIsImlhdCI6MTc0NjgzODk2MiwiZXhwIjoxNzQ5NDMwOTYyfQ.TEAs6yqOnDLrUQTIzH4fd5LQ7o_6JlUKfBAtzFe0HWM'
};

export default function NoteCard({ note, isPurchased = false }: NoteCardProps) {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState(false);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Get note type for chatbot
  const getNoteType = () => {
    const title = note.title.toLowerCase();
    if (title.includes('tax')) return 'tax';
    if (title.includes('jurisprudence')) return 'jurisprudence';
    if (title.includes('company')) return 'company';
    return 'tax'; // Default fallback
  };

  useEffect(() => {
    const loadPreview = () => {
      setIsPreviewLoading(true);
      setPreviewError(false);
      
      try {
        // Check if we have a manually generated signed URL
        if (note.preview_url && note.preview_url in signedUrlMap) {
          // Use the safer "in" operator instead of direct indexing
          const url = signedUrlMap[note.preview_url];
          console.log("Using manually generated signed URL:", url);
          setPreviewUrl(url);
        } 
        // Fall back to the signed_preview_url field if available
        else if (note.signed_preview_url) {
          console.log("Using signed_preview_url from database:", note.signed_preview_url);
          setPreviewUrl(note.signed_preview_url);
        }
        // No valid URL available
        else {
          console.log("No valid preview URL available for:", note.preview_url);
          setPreviewError(true);
        }
      } catch (error) {
        console.error('Error loading preview:', error);
        setPreviewError(true);
      } finally {
        setIsPreviewLoading(false);
      }
    };

    loadPreview();
  }, [note.preview_url, note.signed_preview_url]);

  // Get file type label based on file_url
  const getFileTypeLabel = () => {
    const fileUrl = note.file_url.toLowerCase();
    if (fileUrl.includes('.pdf')) {
      return 'PDF Document';
    } else if (fileUrl.includes('.docx') || fileUrl.includes('.doc')) {
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
    
    setIsDownloading(true);
    setDownloadError(false);
    
    try {
      let downloadUrl;
      let filename;
      
      // Determine which document to download based on the note title or ID
      if (note.title.toLowerCase().includes('tax')) {
        downloadUrl = 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/tax_law.pdf?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvdGF4X2xhdy5wZGYiLCJpYXQiOjE3NDY4Mzg1NTcsImV4cCI6MTc0OTQzMDU1N30.Vm2OTClwZE2NIEzR2Up40-7-CkuaNvC9___8SvmjxCM';
        filename = 'Tax Law Notes.pdf';
      } else if (note.title.toLowerCase().includes('juris')) {
        downloadUrl = 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/juris_law.docx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvanVyaXNfbGF3LmRvY3giLCJpYXQiOjE3NDY4Mzg3MDgsImV4cCI6MTc0OTQzMDcwOH0.6upB-ZRlMLJVqEfqZJEwSZnXir1Q2ecMMOtQ2HdiRJw';
        filename = 'Jurisprudence Law Notes.docx';
      } else if (note.title.toLowerCase().includes('company')) {
        downloadUrl = 'https://zqdiwegblvrgyyfjjkfz.supabase.co/storage/v1/object/sign/law-notes/notes/company_law.docx?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5X2I5YTdiYTUyLTc4MjQtNDZiOS1iZjJjLTI4MTdiMTJiZGZkNSJ9.eyJ1cmwiOiJsYXctbm90ZXMvbm90ZXMvY29tcGFueV9sYXcuZG9jeCIsImlhdCI6MTc0NjgzODk2MiwiZXhwIjoxNzQ5NDMwOTYyfQ.TEAs6yqOnDLrUQTIzH4fd5LQ7o_6JlUKfBAtzFe0HWM';
        filename = 'Company Law Notes.docx';
      } else {
        throw new Error(`Unrecognized note type: ${note.title}`);
      }
      
      // Add cache-busting parameter
      downloadUrl += (downloadUrl.includes('?') ? '&' : '?') + '_t=' + Date.now();
      
      // Create download link
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
    } catch (error) {
      console.error('Error downloading file:', error);
      setDownloadError(true);
      
      // Type check the error properly
      if (error instanceof Error) {
        alert(`Failed to download file: ${error.message}`);
      } else {
        alert("Failed to download file. Please try again later.");
      }
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
      }, 800);
    }
  };

  const handlePreviewError = () => {
    setPreviewError(true);
  };

  const handleOpenPreview = () => {
    if (previewUrl && !previewError) {
      setIsPreviewModalOpen(true);
    }
  };

  // Toggle chat visibility
  const toggleChat = () => {
    setShowChat(!showChat);
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
        
        {/* Loading state */}
        {isPreviewLoading && (
          <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
          </div>
        )}
        
        {/* Preview image - shown when available and loaded */}
        {!isPreviewLoading && previewUrl && !previewError && (
          <div 
            className="h-full w-full flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={handleOpenPreview}
          >
            <div className="relative w-full h-full">
              <img 
                src={previewUrl} 
                alt={`Preview of ${note.title}`}
                className="object-contain w-full h-full p-2"
                onError={handlePreviewError}
              />
              
              {/* Hover overlay with magnify icon */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 flex items-center justify-center transition-all duration-300">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Fallback document icon - shown when no preview or error */}
        {(!previewUrl || previewError) && !isPreviewLoading && (
          <div className="h-full w-full flex flex-col items-center justify-center p-4">
            <div className="w-24 h-24 mb-4">
              {note.file_url.toLowerCase().includes('.pdf') ? (
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
          {note.file_url.toLowerCase().includes('.pdf') ? (
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
          {/* Preview button - only show when there is a valid preview */}
          {previewUrl && !previewError && !isPurchased && (
            <button 
              onClick={handleOpenPreview}
              className="flex-1 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 py-2 px-4 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Preview
            </button>
          )}
          
          {/* Download button - for purchased notes */}
          {isPurchased && (
            <button 
              onClick={handleDownload}
              disabled={isDownloading}
              className={`flex-1 flex items-center justify-center ${
                isDownloading ? 'bg-green-500' : 'bg-green-600 hover:bg-green-700'
              } text-white py-2 px-4 rounded-lg transition`}
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
                  Download
                </>
              )}
            </button>
          )}
          
          {/* Add to Cart button - for non-purchased notes */}
          {!isPurchased && (
            <button 
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className={`flex-1 flex items-center justify-center text-white py-2 px-4 rounded-lg transition ${
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
          
          {/* Chat Assistant button - only for purchased notes */}
          {isPurchased && (
            <button 
              onClick={toggleChat}
              className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg transition ${
                showChat 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-5 w-5 mr-2" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
                />
              </svg>
              {showChat ? 'Hide Assistant' : 'Ask Assistant'}
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && previewUrl && (
        <PreviewModal 
          imageUrl={previewUrl}
          title={note.title}
          onClose={() => setIsPreviewModalOpen(false)}
        />
      )}
      
      {/* Chat Assistant - only shown when purchased and toggled on */}
      {isPurchased && showChat && (
        <NoteChatbot 
          noteId={note.id} 
          noteType={getNoteType()}
          noteTitle={note.title}
        />
      )}
    </div>
  );
}

// Preview Modal Component
function PreviewModal({ imageUrl, title, onClose }: { imageUrl: string, title: string, onClose: () => void }) {
  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    // Prevent body scrolling when modal is open
    document.body.style.overflow = 'hidden';
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75" onClick={onClose}>
      <div className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] w-[90vw] overflow-hidden" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button 
            className="text-gray-500 hover:text-gray-700"
            onClick={onClose}
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 flex items-center justify-center overflow-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
          <img 
            src={imageUrl} 
            alt={title}
            className="max-w-full max-h-full object-contain"
          />
        </div>
        
        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex justify-end">
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}