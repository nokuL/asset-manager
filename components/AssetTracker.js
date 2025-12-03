'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AssetTracker() {
    const [assetId, setAssetId] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [showModal, setShowModal] = useState(false)
    const [assetData, setAssetData] = useState(null)
    const [history, setHistory] = useState([])

    const handleSearch = async (e) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            // Search for asset by asset_id
            const { data: asset, error: assetError } = await supabase
                .from('assets')
                .select(`
          *,
          category:asset_categories(name),
          department:departments(name),
          creator:profiles(email, full_name)
        `)
                .eq('asset_id', assetId.trim().toUpperCase())
                .single()

            if (assetError || !asset) {
                setError(`Asset ID "${assetId}" not found`)
                setLoading(false)
                return
            }

            // Load tracking history
            const { data: historyData, error: historyError } = await supabase
                .from('asset_tracking_history')
                .select('*')
                .eq('asset_id', asset.id)
                .order('created_at', { ascending: false })



            // Fetch user details for each history entry
            const historyWithUsers = await Promise.all(
                (historyData || []).map(async (entry) => {
                    const { data: userData } = await supabase
                        .from('profiles')
                        .select('email, full_name')
                        .eq('id', entry.changed_by)
                        .single()

                    return {
                        ...entry,
                        changer: userData || { email: 'Unknown user', full_name: null }
                    }
                })
            )

            setAssetData(asset)
            setHistory(historyWithUsers || [])
            setShowModal(true)
        } catch (err) {
            setError('An error occurred while searching')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const getChangeIcon = (changeType) => {
        switch (changeType) {
            case 'status_change':
                return (
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
            case 'location_change':
                return (
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                )
            default:
                return (
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                )
        }
    }

    return (
        <div>
            {/* Search Form */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-primary-800 to-primary-900 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Track Asset</h3>
                        <p className="text-sm text-gray-600">Enter Asset ID to view tracking history</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Asset ID
                        </label>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                required
                                value={assetId}
                                onChange={(e) => setAssetId(e.target.value.toUpperCase())}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 font-mono text-lg"
                                placeholder="AST-2025-001"
                            />
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-3 bg-accent-500 text-white rounded-lg hover:bg-accent-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                            >
                                {loading ? (
                                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                ) : (
                                    'Track'
                                )}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Example: AST-2025-001, AST-2025-002
                        </p>
                    </div>
                </form>
            </div>

            {/* Tracking Modal */}
            {showModal && assetData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-gradient-to-r from-primary-800 to-primary-900 text-white px-6 py-4 flex justify-between items-center z-10 rounded-t-xl">
                            <div>
                                <h3 className="text-2xl font-bold">Asset Tracking Report</h3>
                                <p className="text-primary-100 text-sm mt-1">ID: {assetData.asset_id}</p>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-white hover:text-gray-200 text-3xl leading-none"
                            >
                                ×
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6">
                            {/* Asset Summary Card */}
                            <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl border border-gray-200">
                                <div className="flex items-start gap-4">
                                    {assetData.image_url ? (
                                        <img
                                            src={assetData.image_url}
                                            alt={assetData.asset_name}
                                            className="w-24 h-24 object-contain bg-white rounded-lg p-2 border border-gray-200"
                                        />
                                    ) : (
                                        <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center border border-gray-200">
                                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                            </svg>
                                        </div>
                                    )}
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-bold text-gray-900 mb-2">{assetData.asset_name}</h4>
                                        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                                            <div>
                                                <span className="text-gray-500">Status:</span>
                                                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${assetData.status === 'Available' ? 'bg-green-100 text-green-800' :
                                                        assetData.status === 'In Use' ? 'bg-blue-100 text-blue-800' :
                                                            assetData.status === 'Under Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {assetData.status}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Category:</span>
                                                <span className="ml-2 font-medium text-gray-900">{assetData.category?.name || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Department:</span>
                                                <span className="ml-2 font-medium text-gray-900">{assetData.department?.name || '-'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Location:</span>
                                                <span className="ml-2 font-medium text-gray-900">{assetData.current_location || 'Not specified'}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Cost:</span>
                                                <span className="ml-2 font-semibold text-accent-600">${parseFloat(assetData.cost).toFixed(2)}</span>
                                            </div>
                                            <div>
                                                <span className="text-gray-500">Purchased:</span>
                                                <span className="ml-2 font-medium text-gray-900">
                                                    {new Date(assetData.date_purchased).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            {/* Movement History */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <h4 className="text-xl font-bold text-gray-900">Movement History</h4>
                                    <span className="text-sm text-gray-500">({history.length} events)</span>
                                </div>

                                {history.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                        </svg>
                                        <p className="text-gray-500 font-medium">No tracking history yet</p>
                                        <p className="text-sm text-gray-400 mt-1">Asset movements will appear here</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {history.map((entry, index) => (
                                            <div
                                                key={entry.id}
                                                className="flex gap-4 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                                            >
                                                {getChangeIcon(entry.change_type)}
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <p className="text-base font-semibold text-gray-900">
                                                            {entry.change_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                        </p>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {new Date(entry.created_at).toLocaleString()}
                                                        </span>
                                                    </div>
                                                    {entry.old_value && entry.new_value && (
                                                        <div className="flex items-center gap-2 text-sm mb-2">
                                                            <span className="px-2 py-1 bg-red-100 text-red-800 rounded font-medium">
                                                                {entry.old_value}
                                                            </span>
                                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                            </svg>
                                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                                                                {entry.new_value}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {entry.notes && (
                                                        <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200 italic">
                                                            "{entry.notes}"
                                                        </p>
                                                    )}
                                                    <p className="text-xs text-gray-500 mt-2">
                                                        Updated by <span className="font-medium text-gray-700">{entry.changer?.email}</span>
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-xl">
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full px-4 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-colors font-medium"
                            >
                                Close Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}