'use client';

import { useState, useEffect } from 'react';
import { supabase, Note, getStoragePublicUrl } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import NoteCard from '@/components/NoteCard';
import Header from '@/components/Header';

// Fallback mock data in case of API failure
const mockNotes: Note[] = [
  {
    id: '1',
    title: 'Tax Law Notes',
    description: 'Tax notes as at LSE 2024 exams',
    price: 19.99,
    preview_url: '/previews/tax_image.png',
    file_url: '/previews/tax_law.pdf',
  },
  {
    id: '2',
    title: 'Company Law Notes',
    description: 'Company notes as at LSE 2024 exams',
    price: 19.99,
    preview_url: '/previews/juris_image.png',
    file_url: '/previews/juris_law.docx',
  },
  {
    id: '3',
    title: 'Jurisprudence Law Notes',
    description: 'Jurisprudence notes as at LSE 2024 exam',
    price: 19.99,
    preview_url: '/previews/company_image.png',
    file_url: '/previews/company_law.docx',
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
          setNotes(mockNotes); // Use mock data as fallback
        } else if (data && data.length > 0) {
          // Transform storage URLs to be fully qualified
          const notesWithUrls = data.map(note => {
            // Get the public URL for the preview and file
            const previewUrl = getStoragePublicUrl(note.preview_url);
            const fileUrl = getStoragePublicUrl(note.file_url);
            
            return {
              ...note,
              preview_url: previewUrl,
              file_url: fileUrl
            };
          });
          
          setNotes(notesWithUrls);
        } else {
          setNotes(mockNotes); // Use mock data if no notes found
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
        setNotes(mockNotes); // Use mock data as fallback
      }
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
        <h1 className="text-3xl font-bold mb-8 text-center">Premium Law Notes</h1>
        
        {isLoading ? (
          <div className="text-center py-12">
            <p>Loading notes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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