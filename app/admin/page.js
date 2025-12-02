'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UsersTab from '@/components/admin/UsersTab'
import DepartmentsTab from '@/components/admin/DepartmentsTab'
import CategoriesTab from '@/components/admin/CategoriesTab'
import AssetsTab from '@/components/admin/AssetsTab'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  
  // Stats
  const [stats, setStats] = useState({
    totalAssets: 0,
    totalUsers: 0,
    totalDepartments: 0,
    totalCategories: 0,
  })

  useEffect(() => {
    checkAuth()
    loadStats()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setUser(profile)
    setLoading(false)
  }

  const loadStats = async () => {
    const [assets, users, departments, categories] = await Promise.all([
      supabase.from('assets').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('departments').select('id', { count: 'exact', head: true }),
      supabase.from('asset_categories').select('id', { count: 'exact', head: true }),
    ])

    setStats({
      totalAssets: assets.count || 0,
      totalUsers: users.count || 0,
      totalDepartments: departments.count || 0,
      totalCategories: categories.count || 0,
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-sm text-gray-600">Welcome back, {user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Assets</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalAssets}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Total Users</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Departments</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalDepartments}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm font-medium">Categories</h3>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCategories}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-accent-500text-primary-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'users'
                    ? 'border-b-2 border-accent-500text-primary-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setActiveTab('departments')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'departments'
                    ? 'border-b-2 border-accent-500text-primary-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Departments
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'categories'
                    ? 'border-b-2 border-accent-500text-primary-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Categories
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-6 py-4 text-sm font-medium ${
                  activeTab === 'assets'
                    ? 'border-b-2 border-accent-500text-primary-800'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Assets
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div>
                <h2 className="text-xl font-semibold mb-4">Dashboard Overview</h2>
                <p className="text-gray-600">
                  Welcome to the Asset Manager Admin Dashboard. Use the tabs above to manage users, 
                  departments, categories, and assets.
                </p>
              </div>
            )}

            {activeTab === 'users' && <UsersTab onUpdate={loadStats} />}
            {activeTab === 'departments' && <DepartmentsTab onUpdate={loadStats} />}
            {activeTab === 'categories' && <CategoriesTab onUpdate={loadStats} />}
            {activeTab === 'assets' && <AssetsTab onUpdate={loadStats} />}
          </div>
        </div>
      </main>
    </div>
  )
}