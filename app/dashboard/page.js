'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Navbar from '@/components/Navbar'
import AssetTracker from '@/components/AssetTracker'

export default function UserDashboard() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [assets, setAssets] = useState([])
  const [departments, setDepartments] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    asset_name: '',
    category_id: '',
    department_id: '',
    date_purchased: '',
    cost: '',
    image: null,
    status: 'Available',
    current_location: '',
    assigned_to: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAuth()
    loadDepartments()
    loadCategories()
  }, [])

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (user) {
        loadAssets(user.id, searchTerm)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm, user])

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

    setUser(profile)
    setLoading(false)
    loadAssets(user.id)
  }

  const loadAssets = async (userId, search = '') => {
    try {
      let query = supabase
        .from('assets')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })

      // Add search filter if search term exists
      if (search) {
        query = query.ilike('asset_name', `%${search}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error loading assets:', error)
        return
      }

      const assetsWithDetails = await Promise.all(
        (data || []).map(async (asset) => {
          const [category, department] = await Promise.all([
            supabase.from('asset_categories').select('name').eq('id', asset.category_id).single(),
            supabase.from('departments').select('name').eq('id', asset.department_id).single(),
          ])

          return {
            ...asset,
            category: category.data,
            department: department.data,
          }
        })
      )

      setAssets(assetsWithDetails)
    } catch (err) {
      console.error('Error loading assets:', err)
    }
  }

  const loadDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading departments:', error)
    } else {
      setDepartments(data || [])
    }
  }

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .order('name')

    if (error) {
      console.error('Error loading categories:', error)
    } else {
      setCategories(data || [])
    }
  }
  const handleRegisterWarranty = async (asset) => {
    try {
      setError('')
      
      // Call our Next.js API route (server-side)
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
      
      // Update Supabase
      const { error: updateError } = await supabase
        .from('assets')
        .update({ warranty_status: 'Warranty Registered' })
        .eq('id', asset.id)
      
      if (updateError) {
        throw updateError
      }
      
      setSuccess('Warranty registered successfully!')
      loadAssets(user.id, searchTerm)
      
      // Refresh selected asset
      const { data } = await supabase
        .from('assets')
        .select('*')
        .eq('id', asset.id)
        .single()
      
      if (data) {
        const [category, department] = await Promise.all([
          supabase.from('asset_categories').select('name').eq('id', data.category_id).single(),
          supabase.from('departments').select('name').eq('id', data.department_id).single(),
        ])
        
        setSelectedAsset({
          ...data,
          category: category.data,
          department: department.data,
        })
      }
      
    } catch (err) {
      console.error('Warranty registration error:', err)
      setError(err.message || 'Failed to register warranty')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      let imageUrl = null

      // Upload image if one was selected
      if (formData.image) {
        const fileExt = formData.image.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const filePath = `${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('asset-images')
          .upload(filePath, formData.image)

        if (uploadError) {
          setError('Failed to upload image: ' + uploadError.message)
          return
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('asset-images')
          .getPublicUrl(filePath)

        imageUrl = urlData.publicUrl
      }

      const { error: insertError } = await supabase
        .from('assets')
        .insert([
          {
            asset_name: formData.asset_name,
            category_id: formData.category_id,
            department_id: formData.department_id,
            date_purchased: formData.date_purchased,
            cost: parseFloat(formData.cost),
            image_url: imageUrl,
            status: formData.status,
            current_location: formData.current_location || null,
            assigned_to: formData.assigned_to || null,
            created_by: user.id,
          },
        ])

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess('Asset created successfully!')
      setFormData({
        asset_name: '',
        category_id: '',
        department_id: '',
        date_purchased: '',
        cost: '',
        image: null,
        status: 'Available',
        current_location: '',
        assigned_to: '',
      })
      setShowForm(false)
      loadAssets(user.id, searchTerm)
    } catch (err) {
      setError('Failed to create asset')
    }
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
      <Navbar user={user} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
    <AssetTracker />
  </div>
        {/* Stats Card */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <h3 className="text-gray-500 text-sm font-medium">My Total Assets</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{assets.length}</p>
        </div>

        {/* Search and Create Button */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <h2 className="text-xl font-semibold">My Assets</h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Search my assets by name..."
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

              {/* Create Asset Button */}
              <button
                onClick={() => setShowForm(!showForm)}
                className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900 whitespace-nowrap"
              >
                {showForm ? 'Cancel' : 'Create New Asset'}
              </button>
            </div>
          </div>

          {/* Search results count */}
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

        {/* Create Asset Form */}
        {showForm && (
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg font-medium mb-4">Create New Asset</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.asset_name}
                  onChange={(e) => setFormData({ ...formData, asset_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., Dell Laptop XPS 15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  required
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Select a category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Department *
                </label>
                <select
                  required
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="">Select a department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Purchased *
                </label>
                <input
                  type="date"
                  required
                  value={formData.date_purchased}
                  onChange={(e) => setFormData({ ...formData, date_purchased: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cost (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asset Image (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, image: e.target.files[0] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                />
                {formData.image && (
                  <p className="text-sm text-gray-600 mt-1">
                    Selected: {formData.image.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                >
                  <option value="Available">Available</option>
                  <option value="In Use">In Use</option>
                  <option value="Under Maintenance">Under Maintenance</option>
                  <option value="Retired">Retired</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Location (Optional)
                </label>
                <input
                  type="text"
                  value={formData.current_location}
                  onChange={(e) => setFormData({ ...formData, current_location: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                  placeholder="e.g., Building A, Floor 3, Room 301"
                />
              </div>

              <button
                type="submit"
                className="w-full px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900"
              >
                Create Asset
              </button>
            </form>
          </div>
        )}

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
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
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Purchased
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assets.map((asset) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.category?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {asset.department?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${parseFloat(asset.cost).toFixed(2)}
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
                      {new Date(asset.date_purchased).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

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
                'No assets found. Create your first asset!'
              )}
            </div>
          )}
        </div>
      </main>

      {/* Asset Detail Modal */}
      {showModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
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
                  <label className="block text-sm font-medium text-gray-500 mb-1">Created On</label>
                  <p className="text-lg text-gray-900">
                    {new Date(selectedAsset.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Status
                  </label>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${selectedAsset.status === 'Available' ? 'bg-green-100 text-green-800' :
                      selectedAsset.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                        selectedAsset.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                    }`}>
                    {selectedAsset.status}
                  </span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Current Location
                  </label>
                  <p className="text-lg text-gray-900">
                    {selectedAsset.current_location || 'Not specified'}
                  </p>
                </div>
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


              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 flex gap-3">
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}