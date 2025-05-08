import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

// Replace these with your Supabase project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for user profiles in Supabase
export type UserProfile = {
  id: string;
  email: string;
  created_at: string;
  purchases: string[]; // Array of purchased note IDs
};

// Type for notes
export type Note = {
  id: string;
  title: string;
  description: string;
  price: number;
  preview_url: string;
  file_url: string;
};

// Authentication helper functions
/**
 * Sign up a new user
 */
export const signUp = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  
  return { data, error };
};

/**
 * Sign in a user with email and password
 */
export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  return { data, error };
};

/**
 * Sign out the current user
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Get the current user session
 */
export const getCurrentSession = async () => {
  const { data, error } = await supabase.auth.getSession();
  return { 
    session: data.session,
    user: data.session?.user || null,
    error 
  };
};

/**
 * Get user profile data
 */
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  
  return { data, error };
};

/**
 * Check if a user has purchased a specific note
 */
export const hasUserPurchasedNote = async (userId: string, noteId: string) => {
  if (!userId) return false;
  
  const { data, error } = await supabase
    .from('purchases')
    .select('id')
    .eq('user_id', userId)
    .eq('note_id', noteId)
    .single();
  
  return !!data && !error;
};

/**
 * Get user's purchased notes
 */
export const getUserPurchasedNotes = async (userId: string) => {
  if (!userId) return { data: [], error: null };
  
  const { data: purchasesData, error: purchasesError } = await supabase
    .from('purchases')
    .select('note_id')
    .eq('user_id', userId);
    
  if (purchasesError || !purchasesData.length) {
    return { data: [], error: purchasesError };
  }
  
  const noteIds = purchasesData.map(purchase => purchase.note_id);
  
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .in('id', noteIds);
    
  return { data, error };
};

 /**
 * Helper function to get a public URL for Supabase Storage items
 */
export const getStoragePublicUrl = (path: string, bucket: string = 'law-notes') => {
  // If path is already a full URL, return it as is
  if (path?.startsWith('http')) {
    return path;
  }
  
  try {
    // Handle empty or undefined path
    if (!path) {
      return null;
    }
    
    // Remove leading slash if present for Supabase Storage
    const storagePath = path.startsWith('/') ? path.substring(1) : path;
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(storagePath);
      
    return data?.publicUrl || null;
  } catch (error) {
    console.error('Error getting public URL:', error);
    // If there was an error, return null
    return null;
  }
};
