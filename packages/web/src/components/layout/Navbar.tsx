'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-b from-[#1a052a] via-[#2a093c] to-[#1a052a] shadow-lg border-b border-purple-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center group">
              <span className="text-2xl font-extrabold tracking-tight text-purple-400 group-hover:text-purple-300 transition">Mana</span>
            </Link>
            <div className="hidden sm:flex sm:space-x-6">
              <Link href="/movies" className="text-gray-200 hover:text-purple-300 transition px-2 py-1 rounded-lg hover:bg-purple-900/50 font-medium">
                Movies
              </Link>
              <Link href="/movies/search" className="text-gray-200 hover:text-purple-300 transition px-2 py-1 rounded-lg hover:bg-purple-900/50 font-medium">
                Search
              </Link>
              {user?.role === 'admin' && (
                <Link href="/admin" className="text-gray-200 hover:text-purple-300 transition px-2 py-1 rounded-lg hover:bg-purple-900/50 font-medium">
                  Admin
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:flex sm:items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link href="/profile" className="flex items-center space-x-2 text-gray-300 hover:text-purple-300 transition">
                  <span className="font-semibold">Level {user?.level}</span>
                  <div className="w-16 bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-purple-500 h-2 rounded-full"
                      style={{
                        width: `${((user?.experience ?? 0) / ((user?.level ?? 1) * 100)) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="font-semibold">{user?.name}</span>
                  {user?.role === 'admin' && (
                    <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-900 text-purple-200 ml-2">
                      {user.isSuperAdmin ? 'Super Admin' : 'Admin'}
                    </span>
                  )}
                </Link>
                <button
                  onClick={logout}
                  className="ml-2 px-4 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-white font-semibold transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              pathname !== '/auth/login' && (
                <Link href="/auth/login" className="ml-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition">
                  Sign In
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 