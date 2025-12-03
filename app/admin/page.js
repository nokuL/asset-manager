'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import UsersTab from '@/components/admin/UsersTab'
import DepartmentsTab from '@/components/admin/DepartmentsTab'
import CategoriesTab from '@/components/admin/CategoriesTab'
import AssetsTab from '@/components/admin/AssetsTab'
import Navbar from '@/components/Navbar'
import OverviewTab from '@/components/admin/OverviewTab'
import AssetTracker from '@/components/AssetTracker'

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
     {/* Navbar */}
<Navbar user={user} />

{/* Page Header */}
<div className="bg-white border-b border-gray-200">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
    <p className="text-sm text-gray-600 mt-1">Welcome back, {user?.email}</p>
  </div>
</div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Cards */}
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
  {/* Total Assets Card */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">Total Assets</h3>
    <p className="text-3xl font-bold text-gray-900">{stats.totalAssets}</p>
    <p className="text-xs text-gray-500 mt-2">All registered assets</p>
  </div>

  {/* Total Users Card */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-green-50 to-green-100 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">Total Users</h3>
    <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
    <p className="text-xs text-gray-500 mt-2">Active system users</p>
  </div>

  {/* Departments Card */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">Departments</h3>
    <p className="text-3xl font-bold text-gray-900">{stats.totalDepartments}</p>
    <p className="text-xs text-gray-500 mt-2">Organization units</p>
  </div>

  {/* Categories Card */}
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 bg-gradient-to-br from-accent-50 to-accent-100 rounded-lg flex items-center justify-center">
        <svg className="w-6 h-6 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      </div>
    </div>
    <h3 className="text-gray-500 text-sm font-medium mb-1">Categories</h3>
    <p className="text-3xl font-bold text-gray-900">{stats.totalCategories}</p>
    <p className="text-xs text-gray-500 mt-2">Asset categories</p>
  </div>
</div>

      {/* Tabs */}
<div className="bg-white rounded-xl shadow-sm border border-gray-100">
  <div className="border-b border-gray-200">
    <nav className="flex -mb-px overflow-x-auto">
      <button
        onClick={() => setActiveTab('overview')}
        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === 'overview'
            ? 'border-b-2 border-accent-500 text-accent-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
        }`}
      >
        Overview
      </button>
      <button
        onClick={() => setActiveTab('users')}
        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === 'users'
            ? 'border-b-2 border-accent-500 text-accent-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
        }`}
      >
        Users
      </button>
      <button
        onClick={() => setActiveTab('departments')}
        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === 'departments'
            ? 'border-b-2 border-accent-500 text-accent-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
        }`}
      >
        Departments
      </button>
      <button
        onClick={() => setActiveTab('categories')}
        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === 'categories'
            ? 'border-b-2 border-accent-500 text-accent-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
        }`}
      >
        Categories
      </button>
      <button
        onClick={() => setActiveTab('assets')}
        className={`px-6 py-4 text-sm font-medium whitespace-nowrap transition-colors ${
          activeTab === 'assets'
            ? 'border-b-2 border-accent-500 text-accent-600'
            : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
        }`}
      >
        Assets
      </button>
    </nav>
  </div>
  <div className="p-6">
  {activeTab === 'overview' && (
  <div className="space-y-6">
    <AssetTracker />
    <OverviewTab />
  </div>
)}
  {activeTab === 'users' && <UsersTab onUpdate={loadStats} />}
  {activeTab === 'departments' && <DepartmentsTab onUpdate={loadStats} />}
  {activeTab === 'categories' && <CategoriesTab onUpdate={loadStats} />}
  {activeTab === 'assets' && <AssetsTab onUpdate={loadStats} />}
</div></div>
      </main>
    </div>
  )
}