'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AssetsTab({ onUpdate }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadAssets()
  }, [])
  const loadAssets = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading assets:', error)
        setError(`Failed to load assets: ${error.message}`)
        setLoading(false)
        return
      }

      const assetsWithDetails = await Promise.all(
        (data || []).map(async (asset) => {
          const [category, department, creator] = await Promise.all([
            supabase.from('asset_categories').select('name').eq('id', asset.category_id).single(),
            supabase.from('departments').select('name').eq('id', asset.department_id).single(),
            supabase.from('profiles').select('email, full_name').eq('id', asset.created_by).single(),
          ])

          return {
            ...asset,
            category: category.data,
            department: department.data,
            creator: creator.data,
          }
        })
      )

      setAssets(assetsWithDetails)
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this asset?')) {
      return
    }

    const { error } = await supabase
      .from('assets')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Asset deleted successfully!')
      loadAssets()
      onUpdate()
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading assets...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">All Assets</h2>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Assets Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cost
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date Purchased
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created By
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assets.map((asset) => (
              <tr key={asset.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {asset.asset_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.category?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.department?.name || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  ${parseFloat(asset.cost).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(asset.date_purchased).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {asset.creator?.email || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <button
                    onClick={() => handleDelete(asset.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {assets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No assets found yet.
        </div>
      )}
    </div>
  )
}