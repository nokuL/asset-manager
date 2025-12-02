'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function CategoriesTab({ onUpdate }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('asset_categories')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading categories:', error)
    } else {
      setCategories(data || [])
    }
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { error: insertError } = await supabase
        .from('asset_categories')
        .insert([
          {
            name: formData.name,
            description: formData.description,
            created_by: user.id,
          },
        ])

      if (insertError) {
        setError(insertError.message)
        return
      }

      setSuccess('Category created successfully!')
      setFormData({ name: '', description: '' })
      setShowForm(false)
      loadCategories()
      onUpdate()
    } catch (err) {
      setError('Failed to create category')
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return
    }

    const { error } = await supabase
      .from('asset_categories')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
    } else {
      setSuccess('Category deleted successfully!')
      loadCategories()
      onUpdate()
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading categories...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Manage Asset Categories</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900"
        >
          {showForm ? 'Cancel' : 'Create New Category'}
        </button>
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

      {showForm && (
        <div className="bg-gray-50 p-6 rounded-lg mb-6">
          <h3 className="text-lg font-medium mb-4">Create New Category</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                placeholder="e.g., Electronics, Furniture, Vehicles"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                rows="3"
                placeholder="Optional description"
              />
            </div>

            <button
              type="submit"
              className="w-full px-4 py-2 bg-primary-800 text-white rounded-lg hover:bg-primary-900"
            >
              Create Category
            </button>
          </form>
        </div>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <div key={category.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <button
                onClick={() => handleDelete(category.id)}
                className="text-red-600 hover:text-red-800 text-sm"
              >
                Delete
              </button>
            </div>
            {category.description && (
              <p className="text-sm text-gray-600 mb-2">{category.description}</p>
            )}
            <p className="text-xs text-gray-400">
              Created: {new Date(category.created_at).toLocaleDateString()}
            </p>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No categories found. Create your first category!
        </div>
      )}
    </div>
  )
}