'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-primary-50 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-primary-800 mb-4">404</h1>
          <div className="text-6xl mb-4">📦🔍</div>
        </div>

        <h2 className="text-3xl font-bold text-gray-800 mb-4">
          Asset Not Found
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          Oops! The asset you're looking for seems to have been misplaced. 
          It might have been moved, deleted, or never existed in our inventory.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
          >
            ← Go Back
          </button>
          <Link
            href="/login"
            className="px-6 py-3 bg-primary-800 text-white rounded-lg hover:bg-primary-900 transition-colors font-medium"
          >
            Go to Login
          </Link>
        </div>

        <div className="mt-12 p-6 bg-white rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            Need Help?
          </h3>
          <p className="text-gray-600">
            If you believe this is an error, please contact your administrator 
            or check your asset inventory.
          </p>
        </div>
      </div>
    </div>
  )
}