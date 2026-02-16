'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogIn, Lock, Mail, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // ✅ CALL OUR API ROUTE INSTEAD OF DIRECT SUPABASE AUTH
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: email.trim(), 
          password: password.trim() 
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        // ✅ SHOW DETAILED ERROR FROM API
        setError(result.details || result.error || 'Invalid credentials')
        toast.error(result.error || 'Login failed')
        setLoading(false)
        return
      }

      toast.success('Login successful!')
      router.push('/admin/dashboard')

    } catch (err) {
      console.error('Login error:', err)
      setError('Network error. Please check your connection.')
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen .bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <Link href="/" className="text-black hover:text-gray-700 mb-4 inline-block font-medium">
          ← Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-4xl font-bold">A</span>
          </div>
          <h1 className="text-3xl font-bold text-black mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-700">
            MAHE Facility Management System
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
              <div className="flex items-center">
                <AlertCircle className="w-5 h-5 text-red-400 mr-3" />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-black mb-2">
              <div className="flex items-center">
                <Mail className="w-4 h-4 mr-2 text-gray-400" />
                Email Address
              </div>
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="admin@mahe.edu"
              required
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-black mb-2">
              <div className="flex items-center">
                <Lock className="w-4 h-4 mr-2 text-gray-400" />
                Password
              </div>
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-700">
            Contact system administrator for access
          </p>
        </div>
      </div>
    </div>
  )
}