'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Navbar({ user }) {
  const router = useRouter()
  const pathname = usePathname()
  const [showProfileMenu, setShowProfileMenu] = useState(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const isActive = (path) => pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <Link href={user?.role === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-800 to-primary-900 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-xl font-bold">A</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Asset Manager
              </span>
            </Link>

            {/* Navigation Links */}
            {user && (
              <div className="hidden md:flex items-center gap-1">
                {user.role === 'admin' ? (
                  <>
                    <Link
                      href="/admin"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/admin')
                          ? 'bg-primary-50 text-primary-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        isActive('/dashboard')
                          ? 'bg-primary-50 text-primary-800'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      My Assets
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Right Side - User Menu */}
          {user ? (
            <div className="flex items-center gap-4">
              {/* Role Badge */}
              <div className="hidden sm:block">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  user.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-accent-400 to-accent-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <svg
                    className={`w-4 h-4 text-gray-600 transition-transform ${
                      showProfileMenu ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {user.full_name || 'User'}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    
                    <div className="py-2">
                      <Link
                        href={user.role === 'admin' ? '/admin' : '/dashboard'}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowProfileMenu(false)}
                      >
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          Dashboard
                        </div>
                      </Link>
                    </div>

                    <div className="border-t border-gray-200 pt-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Login
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-800 hover:bg-primary-900 rounded-lg transition-colors"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}