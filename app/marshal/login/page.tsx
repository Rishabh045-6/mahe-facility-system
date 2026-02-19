'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, CheckCircle2 } from 'lucide-react'
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
      localStorage.setItem('marshalId', marshalId.trim())
      localStorage.setItem('marshalName', marshalName.trim())
      toast.success(`Welcome, ${marshalName}!`)
      router.push('/marshal/report')
    }

    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F5F0EA',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(185, 100, 30, 0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 80%, rgba(185, 100, 30, 0.05) 0%, transparent 60%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <div style={{
        background: 'rgba(255, 252, 247, 0.92)',
        border: '1px solid rgba(180, 101, 30, 0.12)',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.03), 0 20px 60px rgba(0,0,0,0.08)',
      }}>
        <Link href="/" style={{
          color: '#7a6a55',
          textDecoration: 'none',
          fontSize: '0.875rem',
          display: 'inline-block',
          marginBottom: '32px',
        }}>
          ← Back to Home
        </Link>

        {step === 'id' ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#B4651E',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                boxShadow: '0 4px 16px rgba(180, 101, 30, 0.3)',
              }}>
                <User size={32} color="white" />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.75rem',
                fontWeight: '600',
                color: '#1a1208',
                marginBottom: '8px',
              }}>
                Marshal Login
              </h2>
              <p style={{ color: '#7a6a55', fontSize: '0.9rem' }}>
                Please enter your Marshal ID to continue
              </p>
            </div>

            <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1a1208',
                  marginBottom: '8px',
                }}>
                  Marshal ID
                </label>
                <input
                  type="text"
                  value={marshalId}
                  onChange={(e) => setMarshalId(e.target.value.toUpperCase())}
                  placeholder="e.g., MAR001"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid rgba(180, 101, 30, 0.25)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: '#fffcf7',
                    color: '#1a1208',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B4651E'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.25)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#B4651E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8f4e16')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B4651E')}
              >
                {loading ? 'Processing...' : 'Continue'}
              </button>
            </form>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{
                width: '72px',
                height: '72px',
                backgroundColor: '#f0fdf4',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}>
                <CheckCircle2 size={40} color="#16a34a" />
              </div>
              <h2 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.75rem',
                fontWeight: '600',
                color: '#1a1208',
                marginBottom: '8px',
              }}>
                Welcome, Marshal!
              </h2>
              <p style={{ color: '#7a6a55', fontSize: '0.9rem', marginBottom: '16px' }}>
                Please enter your name to complete login
              </p>
              <div style={{
                backgroundColor: '#fdf6ef',
                border: '1px solid rgba(180, 101, 30, 0.2)',
                borderRadius: '8px',
                padding: '10px 16px',
                fontSize: '0.875rem',
                color: '#B4651E',
                fontWeight: '500',
              }}>
                Marshal ID: {marshalId}
              </div>
            </div>

            <form onSubmit={handleContinue} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{
                  display: 'block',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1a1208',
                  marginBottom: '8px',
                }}>
                  Your Name
                </label>
                <input
                  type="text"
                  value={marshalName}
                  onChange={(e) => setMarshalName(e.target.value)}
                  placeholder="e.g., Pradeep Kumar"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '1.5px solid rgba(180, 101, 30, 0.25)',
                    borderRadius: '10px',
                    fontSize: '1rem',
                    outline: 'none',
                    backgroundColor: '#fffcf7',
                    color: '#1a1208',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#B4651E'}
                  onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.25)'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#B4651E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#8f4e16')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#B4651E')}
              >
                {loading ? 'Processing...' : 'Start Inspection'}
              </button>

              <button
                type="button"
                onClick={() => setStep('id')}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'transparent',
                  color: '#7a6a55',
                  border: '1.5px solid rgba(180, 101, 30, 0.2)',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
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