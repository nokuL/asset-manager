'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import AssetTracking from '@/components/AssetTrackingModal'


export default function AssetsTab({ onUpdate }) {
  const [assets, setAssets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(5)


  useEffect(() => {
    loadAssets()
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadAssets(searchTerm)
      setCurrentPage(1) 
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  const loadAssets = async (search = '') => {
    setLoading(true)
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .order('created_at', { ascending: false })

      if (search) {
        query = query.ilike('asset_name', `%${search}%`)
      }

      const { data, error } = await query

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
      loadAssets(searchTerm)
      onUpdate()
    }
  }

  const handleRegisterWarranty = async (asset) => {
    try {
      setError('')
      
      // Get current user info
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      
      if (!currentUser) {
        throw new Error('You must be logged in to register warranties')
      }
  
      // ✅ ADD THIS: Call Next.js API route (which calls Python API)
      const response = await fetch('/api/register-warranty', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          asset_id: asset.asset_id,
          asset_name: asset.asset_name,
          serial_number: asset.id.toString()
        })
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to register warranty')
      }
      
      const { error: updateError } = await supabase
        .from('assets')
        .update({ warranty_status: 'Warranty Registered' })
        .eq('id', asset.id)
      
      if (updateError) {
        throw updateError
      }
      
      setSuccess('Warranty registered successfully!')
      loadAssets(searchTerm)
      
      const { data, error } = await supabase
        .from('assets')
        .select(`
          *,
          category:asset_categories(name),
          department:departments(name),
          creator:profiles(email, full_name)
        `)
        .eq('id', asset.id)
        .single()
      
      if (error) {
        console.error('Failed to reload asset:', error)
      } else if (data) {
        setSelectedAsset({
          ...data,
          category: data.category || { name: 'N/A' },
          department: data.department || { name: 'N/A' },
          creator: data.creator || { email: 'N/A', full_name: 'N/A' }
        })
      }
      
    } catch (err) {
      console.error('Warranty registration error:', err)
      setError(err.message || 'Failed to register warranty')
    }
  }
  const totalPages = Math.ceil(assets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentAssets = assets.slice(startIndex, endIndex)

  if (loading && assets.length === 0) {
    return <div className="text-center py-8">Loading assets...</div>
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <h2 className="text-xl font-semibold">All Assets</h2>

          {/* Search Bar */}
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search assets by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 text-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {searchTerm && (
          <p className="text-sm text-gray-600">
            Found {assets.length} asset{assets.length !== 1 ? 's' : ''}
          </p>
        )}
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
                Asset ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Asset Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Image
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
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
            {currentAssets.map((asset) => (
              <tr
                key={asset.id}
                onClick={() => {
                  setSelectedAsset(asset)
                  setShowModal(true)
                }}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-semibold text-primary-800">
                  {asset.asset_id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {asset.asset_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {asset.image_url ? (
                    <img
                      src={asset.image_url}
                      alt={asset.asset_name}
                      className="w-16 h-16 object-contain bg-gray-50 rounded-lg p-1"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${asset.status === 'Available' ? 'bg-green-100 text-green-800' :
                      asset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                        asset.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {asset.status}
                  </span>
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAsset(asset)
                        setShowModal(true)
                      }}
                      className="text-primary-600 hover:text-primary-800 transition-colors"
                      title="View details"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(asset.id)
                      }}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete asset"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {assets.length > itemsPerPage && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div className="flex-1 flex justify-between sm:hidden">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                <span className="font-medium">{Math.min(endIndex, assets.length)}</span> of{' '}
                <span className="font-medium">{assets.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {[...Array(totalPages)].map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === idx + 1
                        ? 'z-10 bg-accent-50 border-accent-500 text-accent-600'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                  >
                    {idx + 1}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}

      {assets.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          {searchTerm ? (
            <>
              No assets found matching "{searchTerm}".
              <button
                onClick={() => setSearchTerm('')}
                className="block mx-auto mt-2 text-accent-600 hover:text-accent-700 font-medium"
              >
                Clear search
              </button>
            </>
          ) : (
            'No assets found yet.'
          )}
        </div>
      )}

      {/* Asset Detail Modal */}
      {showModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-gray-900">Asset Details</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6 bg-gray-50 rounded-lg p-4">
                {selectedAsset.image_url ? (
                  <img
                    src={selectedAsset.image_url}
                    alt={selectedAsset.asset_name}
                    className="w-full h-auto max-h-96 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-full h-64 bg-gray-100 rounded-lg flex flex-col items-center justify-center">
                    <svg className="w-24 h-24 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-gray-400 text-sm">No image available</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Asset ID
                  </label>
                  <p className="text-xl font-mono font-bold text-primary-800">
                    {selectedAsset.asset_id}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Asset Name</label>
                  <p className="text-lg font-semibold text-gray-900">{selectedAsset.asset_name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedAsset.status === 'Available' ? 'bg-green-100 text-green-800' :
                      selectedAsset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                        selectedAsset.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {selectedAsset.status}
                  </span>
                </div>
                {/* NEW: Warranty Status Display */}
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Warranty Status</label>
                  {selectedAsset.warranty_status ? (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                      ✓ {selectedAsset.warranty_status}
                    </span>
                  ) : (
                    <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-gray-100 text-gray-600">
                      Not Registered
                    </span>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                  <p className="text-lg text-gray-900">{selectedAsset.category?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Department</label>
                  <p className="text-lg text-gray-900">{selectedAsset.department?.name || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Cost</label>
                  <p className="text-lg font-semibold text-accent-500">${parseFloat(selectedAsset.cost).toFixed(2)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Current Location</label>
                  <p className="text-lg text-gray-900">{selectedAsset.current_location || 'Not specified'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date Purchased</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedAsset.date_purchased).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created By</label>
                  <p className="text-lg text-gray-900">{selectedAsset.creator?.email || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created On</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedAsset.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              </div>

              {/* Asset Tracking Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <AssetTracking
                  assetId={selectedAsset.id}
                  currentStatus={selectedAsset.status}
                  currentLocation={selectedAsset.current_location}
                  onUpdate={() => {
                    loadAssets(searchTerm)
                    // Refresh selected asset
                    const refreshAsset = async () => {
                      const { data } = await supabase
                        .from('assets')
                        .select(`
                          *,
                          category:asset_categories(name),
                          department:departments(name),
                          creator:profiles(email, full_name)
                        `)
                        .eq('id', selectedAsset.id)
                        .single()
                      if (data) setSelectedAsset(data)
                    }
                    refreshAsset()
                  }}
                />
              </div>
            </div>

            {/* UPDATED: Footer with Register Warranty Button */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3 sticky bottom-0">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
              
              {!selectedAsset.warranty_status && (
                <button
                  onClick={() => handleRegisterWarranty(selectedAsset)}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Register Warranty
                </button>
              )}
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (confirm(`Are you sure you want to delete "${selectedAsset.asset_name}"?`)) {
                    handleDelete(selectedAsset.id)
                    setShowModal(false)
                  }
                }}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}