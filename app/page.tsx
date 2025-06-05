'use client';

import { useState, useEffect } from 'react';
import { supabase, Note, getStoragePublicUrl } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import NoteCard from '@/components/NoteCard';
import Header from '@/components/Header';
import SellerRequestBox from '@/components/SellerRequestBox';

// Fallback mock data in case of API failure
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Tax Law Notes',
    description: 'Tax notes as at LSE 2024 exams',
    price: 19.99,
    preview_url: 'previews/tax_image.png',
    file_url: 'previews/tax_law.pdf',
  },
  {
    id: '2',
    title: 'Jurisprudence Law Notes',
    description: 'Jurisprudence notes as at LSE 2024 exams',
    price: 19.99,
    preview_url: 'previews/juris_image.png',
    file_url: 'previews/juris_law.docx',
  },
  {
    id: '3',
    title: 'Company Law Notes',
    description: 'Company notes as at LSE 2024 exams',
    price: 19.99,
    preview_url: 'previews/company_image.png',
    file_url: 'previews/company_law.docx',
  },
];

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [purchasedNoteIds, setPurchasedNoteIds] = useState<string[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    // Fetch notes from Supabase
    const fetchNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('created_at', { ascending: false });
          
        if (error) {
          console.error('Error fetching notes:', error);
          loadMockNotes();
        } else if (data && data.length > 0) {
          setNotes(data);
        } else {
          loadMockNotes();
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        loadMockNotes();
      }
    };

    // Function to load mock notes with public URLs
    const loadMockNotes = () => {
      Promise.all(
        mockNotes.map(async note => {
          try {
            const previewUrl = await getStoragePublicUrl(note.preview_url);
            return {
              ...note,
              preview_url: previewUrl || note.preview_url,
            };
          } catch (e) {
            console.error(`Error processing note ${note.id}:`, e);
            return note;
          }
        })
      ).then(processedNotes => {
        setNotes(processedNotes);
      });
    };

    // If user is logged in, fetch their purchased notes
    const fetchPurchasedNotes = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('purchases')
            .select('note_id')
            .eq('user_id', user.id);
            
          if (error) {
            console.error('Error fetching purchases:', error);
          } else if (data) {
            const noteIds = data.map(purchase => purchase.note_id);
            setPurchasedNoteIds(noteIds);
          }
        } catch (error) {
          console.error('Error fetching purchases:', error);
        }
      }
    };

    const loadData = async () => {
      setIsLoading(true);
      await fetchNotes();
      if (user) {
        await fetchPurchasedNotes();
      }
      setIsLoading(false);
    };

    loadData();
  }, [user]);

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">LSE Law Notes</h1>
        
        {/* Add Seller Request Box */}
        <div className="mb-8 max-w-2xl mx-auto">
          <SellerRequestBox />
        </div>
        
        {isLoading ? (
          <div className="text-center py-12">
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            <p className="mt-4 text-gray-600">Loading notes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {notes.map((note) => (
              <NoteCard 
                key={note.id} 
                note={note} 
                isPurchased={purchasedNoteIds.includes(note.id)} 
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}