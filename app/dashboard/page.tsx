'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, Note, getUserPurchasedNotes, getStoragePublicUrl } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import Header from '@/components/Header';
import NoteCard from '@/components/NoteCard';

export default function DashboardPage() {
  const [purchasedNotes, setPurchasedNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuth();

  useEffect(() => {
    const fetchPurchasedNotes = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await getUserPurchasedNotes(user.id);
        
        if (error) {
          throw error;
        }
        
        if (data && data.length > 0) {
          // Transform storage URLs to be fully qualified
          const notesWithUrls = data.map(note => {
            const previewUrl = getStoragePublicUrl(note.preview_url);
            const fileUrl = getStoragePublicUrl(note.file_url);
            
            return {
              ...note,
              preview_url: previewUrl,
              file_url: fileUrl
            };
          });
          
          setPurchasedNotes(notesWithUrls);
        } else {
          setPurchasedNotes([]);
        }
      } catch (error) {
        console.error('Error fetching purchased notes:', error);
        setPurchasedNotes([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Check if authentication is complete before trying to fetch notes
    if (!isAuthLoading) {
      fetchPurchasedNotes();
    }
  }, [user, isAuthLoading, router]);

  // Show loading state while auth is loading
  if (isAuthLoading || isLoading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <p>Loading your notes...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">My Notes</h1>
        
        {purchasedNotes.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">You haven't purchased any notes yet.</p>
            <button
              onClick={() => router.push('/')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
            >
              Browse Law Notes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {purchasedNotes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                isPurchased={true} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}