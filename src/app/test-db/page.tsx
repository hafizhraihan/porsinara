'use client'

import { useEffect, useState } from 'react'
import { testSupabaseConnection } from '@/lib/test-connection'

export default function TestDBPage() {
  const [testResults, setTestResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTest = async () => {
    setIsLoading(true)
    console.clear()
    console.log('🔍 Starting connection test...')
    
    const results = await testSupabaseConnection()
    setTestResults(results)
    setIsLoading(false)
  }

  useEffect(() => {
    // Auto-run on mount
    runTest()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">🔧 Database Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
          <div className="space-y-2 font-mono text-sm">
            <div>
              <span className="text-gray-600">Supabase URL: </span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_URL ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ NOT SET'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Anon Key: </span>
              <span className={process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'text-green-600' : 'text-red-600'}>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
                  ? `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...` 
                  : '❌ NOT SET'}
              </span>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Running tests...</span>
            </div>
          </div>
        ) : testResults ? (
          <div className="space-y-4">
            {/* Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Test Results</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${testResults.connectionOk ? 'text-green-500' : 'text-red-500'}`}>
                    {testResults.connectionOk ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Connection</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${testResults.matchesAccessible ? 'text-green-500' : 'text-red-500'}`}>
                    {testResults.matchesAccessible ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Matches Table</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${testResults.playersAccessible ? 'text-green-500' : 'text-red-500'}`}>
                    {testResults.playersAccessible ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Players Table</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl mb-2 ${testResults.basketballStatsAccessible ? 'text-green-500' : 'text-red-500'}`}>
                    {testResults.basketballStatsAccessible ? '✅' : '❌'}
                  </div>
                  <div className="text-sm text-gray-600">Basketball Stats</div>
                </div>
              </div>
            </div>

            {/* Errors */}
            {testResults.errors && testResults.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-3">❌ Errors Found</h3>
                <ul className="space-y-2">
                  {testResults.errors.map((error: string, index: number) => (
                    <li key={index} className="text-sm text-red-700 font-mono">
                      {index + 1}. {error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Success */}
            {testResults.errors && testResults.errors.length === 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-green-800 mb-2">✅ All Tests Passed!</h3>
                <p className="text-sm text-green-700">
                  Database connection is working correctly. Basketball stats table is accessible and ready to use.
                </p>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📋 Next Steps</h3>
              {testResults.basketballStatsAccessible ? (
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>✅ Basketball stats table is ready</li>
                  <li>✅ You can now add player statistics from the admin dashboard</li>
                  <li>💡 Go to <a href="/admin/dashboard" className="underline font-semibold">Admin Dashboard</a> to manage stats</li>
                </ul>
              ) : (
                <ul className="space-y-2 text-sm text-blue-700">
                  <li>⚠️ Basketball stats table has issues</li>
                  <li>🔧 Run <code className="bg-blue-100 px-2 py-1 rounded">quick-fix.sql</code> in Supabase SQL Editor</li>
                  <li>📖 See <code className="bg-blue-100 px-2 py-1 rounded">TROUBLESHOOTING.md</code> for detailed steps</li>
                  <li>🔄 After fixing, refresh this page or click "Re-run Tests" button</li>
                </ul>
              )}
            </div>
          </div>
        ) : null}

        {/* Actions */}
        <div className="flex gap-4 mt-6">
          <button
            onClick={runTest}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
          >
            {isLoading ? 'Testing...' : 'Re-run Tests'}
          </button>
          <a
            href="/admin/dashboard"
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center"
          >
            Go to Admin Dashboard
          </a>
          <a
            href="/"
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-center"
          >
            Back to Home
          </a>
        </div>

        {/* Console Instructions */}
        <div className="mt-6 bg-gray-100 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-2">💡 Pro Tip</h3>
          <p className="text-sm text-gray-700">
            Open your browser console (F12) to see detailed test output with timestamps and error messages.
          </p>
        </div>
      </div>
    </div>
  )
}


