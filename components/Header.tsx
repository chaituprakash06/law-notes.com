// components/Header.tsx
import { useAuth } from '@/lib/AuthContext';
import Link from 'next/link';

export default function Header() {
  const { user } = useAuth();
  
  return (
    <header className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-600 text-2xl font-bold">
          law-notes.com
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link href="/" className="text-gray-800 hover:text-blue-600">
            Home
          </Link>
          
          {user ? (
            <div className="flex items-center space-x-6">
              {/* Display user email instead of "My Notes" */}
              <span className="text-gray-600">{user.email}</span>
              <Link 
                href="/dashboard" 
                className="text-gray-800 hover:text-blue-600"
              >
                Dashboard
              </Link>
              <Link 
                href="/api/auth/signout" 
                className="text-gray-800 hover:text-blue-600"
              >
                Sign Out
              </Link>
            </div>
          ) : (
            <div className="flex items-center space-x-6">
              <Link 
                href="/login" 
                className="text-gray-800 hover:text-blue-600"
              >
                Login
              </Link>
              <Link 
                href="/register" 
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg"
              >
                Register
              </Link>
            </div>
          )}
          
          <Link href="/cart" className="relative">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-6 w-6 text-gray-800" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
              />
            </svg>
            {/* Add cart item count badge if needed */}
          </Link>
        </div>
      </div>
    </header>
  );
}