'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

export default function OverviewTab() {
  const [analytics, setAnalytics] = useState({
    assetsByCategory: [],
    assetsByDepartment: [],
    assetValueByDepartment: [],
    recentAssets: [],
    totalValue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      // Fetch all assets with related data
      const { data: assets, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(name),
          department:departments(name)
        `)

      if (error) throw error

      // Calculate analytics
      const categoryCount = {}
      const departmentCount = {}
      const departmentValue = {}
      let totalValue = 0

      assets.forEach((asset) => {
        const categoryName = asset.category?.name || 'Uncategorized'
        const departmentName = asset.department?.name || 'Unassigned'
        const cost = parseFloat(asset.cost) || 0

        // Count by category
        categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1

        // Count by department
        departmentCount[departmentName] = (departmentCount[departmentName] || 0) + 1

        // Sum value by department
        departmentValue[departmentName] = (departmentValue[departmentName] || 0) + cost

        totalValue += cost
      })

      // Convert to chart data format
      const assetsByCategory = Object.entries(categoryCount).map(([name, count]) => ({
        name,
        count,
      }))

      const assetsByDepartment = Object.entries(departmentCount).map(([name, count]) => ({
        name,
        count,
      }))

      const assetValueByDepartment = Object.entries(departmentValue).map(([name, value]) => ({
        name,
        value: parseFloat(value.toFixed(2)),
      }))

      // Get recent 6 months asset creation trend
      const sixMonthsAgo = new Date()
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

      const recentAssets = Array.from({ length: 6 }, (_, i) => {
        const date = new Date()
        date.setMonth(date.getMonth() - (5 - i))
        const monthName = date.toLocaleDateString('en-US', { month: 'short' })
        const count = assets.filter((asset) => {
          const assetDate = new Date(asset.created_at)
          return (
            assetDate.getMonth() === date.getMonth() &&
            assetDate.getFullYear() === date.getFullYear()
          )
        }).length
        return { month: monthName, count }
      })

      setAnalytics({
        assetsByCategory,
        assetsByDepartment,
        assetValueByDepartment,
        recentAssets,
        totalValue,
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const COLORS = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#dbeafe', '#f97316', '#fb923c']

  if (loading) {
    return <div className="text-center py-8">Loading analytics...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analytics Overview</h2>
        <p className="text-gray-600">
          Comprehensive insights into your asset management system
        </p>
      </div>

      {/* Total Value Card */}
      <div className="bg-gradient-to-br from-primary-800 to-primary-900 p-6 rounded-xl text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm font-medium mb-1">Total Asset Value</p>
            <p className="text-4xl font-bold">${analytics.totalValue.toLocaleString()}</p>
            <p className="text-primary-200 text-sm mt-2">Across all departments</p>
          </div>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assets by Category - Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.assetsByCategory}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.assetsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Assets by Department - Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Assets by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.assetsByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1e3a8a" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Value by Department - Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Asset Value by Department
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.assetValueByDepartment}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `$${value.toLocaleString()}`} />
              <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Asset Creation Trend - Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Asset Creation Trend (Last 6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.recentAssets}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#1e3a8a"
                strokeWidth={3}
                dot={{ fill: '#f97316', r: 6 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <p className="text-blue-600 text-xs font-medium uppercase mb-1">Categories</p>
          <p className="text-2xl font-bold text-blue-900">
            {analytics.assetsByCategory.length}
          </p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-100">
          <p className="text-green-600 text-xs font-medium uppercase mb-1">Departments</p>
          <p className="text-2xl font-bold text-green-900">
            {analytics.assetsByDepartment.length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <p className="text-purple-600 text-xs font-medium uppercase mb-1">Avg. Value</p>
          <p className="text-2xl font-bold text-purple-900">
            ${analytics.assetsByDepartment.reduce((sum, d) => sum + d.count, 0) > 0
              ? (analytics.totalValue / analytics.assetsByDepartment.reduce((sum, d) => sum + d.count, 0)).toFixed(0)
              : 0}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
          <p className="text-orange-600 text-xs font-medium uppercase mb-1">This Month</p>
          <p className="text-2xl font-bold text-orange-900">
            {analytics.recentAssets[analytics.recentAssets.length - 1]?.count || 0}
          </p>
        </div>
      </div>
    </div>
  )
}