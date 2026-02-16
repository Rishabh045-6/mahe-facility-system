'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, CheckCircleIcon } from 'lucide-react'
import Link from 'next/link'

export default function MarshalLoginPage() {
  const [marshalId, setMarshalId] = useState('')
  const [marshalName, setMarshalName] = useState('')
  const [step, setStep] = useState<'id' | 'name'>('id')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (step === 'id') {
      if (!marshalId.trim()) {
        toast.error('Please enter your Marshal ID')
        setLoading(false)
        return
      }
      setStep('name')
    } else {
      if (!marshalName.trim()) {
        toast.error('Please enter your name')
        setLoading(false)
        return
      }
      
      // Store marshal data in localStorage (NO VALIDATION)
      localStorage.setItem('marshalId', marshalId.trim())
      localStorage.setItem('marshalName', marshalName.trim())
      
      toast.success(`Welcome, ${marshalName}!`)
      router.push('/marshal/report')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen .bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
        <Link href="/" className="text-black hover:text-gray-700 mb-4 inline-block font-medium">
          ← Back to Home
        </Link>

        {step === 'id' ? (
          <>
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Marshal Login
              </h2>
              <p className="text-gray-700">
                Please enter your Marshal ID to continue
              </p>
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label
                  htmlFor="marshalId"
                  className="block text-sm font-medium text-black mb-2"
                >
                  Marshal ID
                </label>
                <input
                  id="marshalId"
                  type="text"
                  value={marshalId}
                  onChange={(e) => setMarshalId(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  placeholder="e.g., MAR001"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircleIcon className="w-16 h-16 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-black mb-2">
                Welcome, Marshal!
              </h2>
              <p className="text-gray-700 mb-6">
                Please enter your name to complete login
              </p>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-black font-medium">Marshal ID: {marshalId}</p>
              </div>
            </div>

            <form onSubmit={handleContinue} className="space-y-4">
              <div>
                <label
                  htmlFor="marshalName"
                  className="block text-sm font-medium text-black mb-2"
                >
                  Your Name
                </label>
                <input
                  id="marshalName"
                  type="text"
                  value={marshalName}
                  onChange={(e) => setMarshalName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
                  placeholder="e.g., Pradeep Kumar"
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
              >
                {loading ? 'Processing...' : 'Start Inspection'}
              </button>

              <button
                type="button"
                onClick={() => setStep('id')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-black font-semibold py-3 px-6 rounded-lg transition-colors text-lg"
              >
                ← Back
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}