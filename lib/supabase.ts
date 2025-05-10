// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Configure the Supabase client with cookie-based auth
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'sb-auth-token',
    storage: {
      getItem: (key) => {
        if (typeof window === 'undefined') {
          return null;
        }
        
        // Try to get from localStorage first
        const value = localStorage.getItem(key);
        if (value) return value;
        
        // If not in localStorage, check cookies
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [cookieName, cookieValue] = cookie.trim().split('=');
          if (cookieName === key) {
            return cookieValue;
          }
        }
        
        return null;
      },
      setItem: (key, value) => {
        if (typeof window === 'undefined') {
          return;
        }
        
        localStorage.setItem(key, value);
        // Also set as cookie for API routes
        document.cookie = `${key}=${value}; path=/; max-age=604800; SameSite=Lax`;
      },
      removeItem: (key) => {
        if (typeof window === 'undefined') {
          return;
        }
        
        localStorage.removeItem(key);
        // Also remove from cookies
        document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
      },
    },
  },
});


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

/**
 * Generate a signed URL for Supabase Storage items with a 1-month expiry
 * @param path The file path within the bucket
 * @param bucket The storage bucket name, defaults to 'law-notes'
 * @returns A signed URL with a 1-month expiration time, or null if there was an error
 */
export const getSignedStorageUrl = async (path: string, bucket: string = 'law-notes') => {
  // Set expiry to 1 month (in seconds)
  // 60 seconds * 60 minutes * 24 hours * 30 days = 2,592,000 seconds
  const expiresIn = 60 * 60 * 24 * 30;
  
  // If path is already a full URL with a token, return it as is
  if (path?.includes('token=')) {
    return path;
  }
  
  try {
    // Handle empty or undefined path
    if (!path) {
      return null;
    }
    
    // Remove leading slash if present for Supabase Storage
    const storagePath = path.startsWith('/') ? path.substring(1) : path;
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(storagePath, expiresIn);
      
    if (error) {
      throw error;
    }
      
    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting signed URL:', error);
    // If there was an error, return null
    return null;
  }
};
