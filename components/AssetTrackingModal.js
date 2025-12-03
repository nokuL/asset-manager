'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function AssetTracking({ assetId, currentStatus, currentLocation, onUpdate }) {
  const [showUpdateForm, setShowUpdateForm] = useState(false)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    status: currentStatus,
    location: currentLocation || '',
    notes: '',
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    loadHistory()
  }, [assetId])

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from('asset_tracking_history')
      .select(`
        *,
        changer:changed_by(email, full_name)
      `)
      .eq('asset_id', assetId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (!error && data) {
      setHistory(data)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: { user } } = await supabase.auth.getUser()

      // Update asset
      const { error: updateError } = await supabase
        .from('assets')
        .update({
          status: formData.status,
          current_location: formData.location || null,
        })
        .eq('id', assetId)

      if (updateError) throw updateError

      // Add manual history entry with notes
      if (formData.notes) {
        await supabase
          .from('asset_tracking_history')
          .insert([{
            asset_id: assetId,
            changed_by: user.id,
            change_type: 'manual_update',
            old_value: null,
            new_value: formData.notes,
            notes: formData.notes,
          }])
      }

      setSuccess('Asset tracking updated successfully!')
      setShowUpdateForm(false)
      setFormData({ ...formData, notes: '' })
      loadHistory()
      if (onUpdate) onUpdate()
    } catch (err) {
      setError('Failed to update tracking: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const getChangeIcon = (changeType) => {
    switch (changeType) {
      case 'status_change':
        return (
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'location_change':
        return (
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )
      default:
        return (
          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
    }
  }

  return (
    <div className="space-y-4">
      {/* Update Button */}
      <div className="flex justify-between items-center">
        <h4 className="text-lg font-semibold text-gray-900">Asset Tracking</h4>
        <button
          onClick={() => setShowUpdateForm(!showUpdateForm)}
          className="px-4 py-2 bg-primary-800 text-white text-sm rounded-lg hover:bg-primary-900 transition-colors"
        >
          {showUpdateForm ? 'Cancel' : 'Update Tracking'}
        </button>
      </div>

      {/* Update Form */}
      {showUpdateForm && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <form onSubmit={handleUpdate} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
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
                Location
              </label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                placeholder="Building A, Floor 3, Room 301"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (Optional)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500"
                rows="2"
                placeholder="Add any notes about this update..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-4 py-2 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Updating...' : 'Update Tracking'}
            </button>
          </form>
        </div>
      )}

      {/* Tracking History */}
      <div>
        <h5 className="text-sm font-semibold text-gray-700 mb-3">Movement History</h5>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">No tracking history yet</p>
          ) : (
            history.map((entry) => (
              <div key={entry.id} className="flex gap-3 items-start">
                {getChangeIcon(entry.change_type)}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900">
                      {entry.change_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  {entry.old_value && entry.new_value && (
                    <p className="text-sm text-gray-600">
                      Changed from <span className="font-medium">{entry.old_value}</span> to{' '}
                      <span className="font-medium">{entry.new_value}</span>
                    </p>
                  )}
                  {entry.notes && (
                    <p className="text-sm text-gray-600 italic">{entry.notes}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    by {entry.changer?.email}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}