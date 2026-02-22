// app/marshal/login/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { User, Loader2, ShieldX } from 'lucide-react'
import Link from 'next/link'

export default function MarshalLoginPage() {
  const [marshalId, setMarshalId] = useState('')
  const [marshalName, setMarshalName] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!marshalId.trim()) {
      toast.error('Please enter your Marshal ID')
      return
    }
    if (!marshalName.trim()) {
      toast.error('Please enter your name')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/marshal-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marshal_id: marshalId.trim(),
          name: marshalName.trim(),
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        toast.error(result.error || 'Invalid credentials')
        setLoading(false)
        return
      }

      // Store the name as it exists in the database, not whatever the user typed
      localStorage.setItem('marshalId', result.marshal_id)
      localStorage.setItem('marshalName', result.name)

      toast.success(`Welcome, ${result.name}!`)
      router.push('/marshal/report')

    } catch (err) {
      console.error('Login error:', err)
      toast.error('Something went wrong. Please try again.')
      setLoading(false)
    }
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
          <p style={{ color: '#7a6a55', fontSize: '0.9rem', margin: 0 }}>
            Enter your Marshal ID and name to access the portal
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              onChange={(e) => setMarshalId(e.target.value)}
              placeholder="e.g., MAR001"
              autoFocus
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(180, 101, 30, 0.25)',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: loading ? '#f5f0ea' : '#fffcf7',
                color: '#1a1208',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
                letterSpacing: '0.05em',
                fontWeight: '600',
              }}
              onFocus={(e) => { if (!loading) e.target.style.borderColor = '#B4651E' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(180, 101, 30, 0.25)' }}
            />
          </div>

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
              placeholder="Enter your full name"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(180, 101, 30, 0.25)',
                borderRadius: '10px',
                fontSize: '1rem',
                outline: 'none',
                backgroundColor: loading ? '#f5f0ea' : '#fffcf7',
                color: '#1a1208',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => { if (!loading) e.target.style.borderColor = '#B4651E' }}
              onBlur={(e) => { e.target.style.borderColor = 'rgba(180, 101, 30, 0.25)' }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: loading ? '#c4a882' : '#B4651E',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              marginTop: '4px',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#8f4e16' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#B4651E' }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                Verifying...
              </>
            ) : (
              'Continue'
            )}
          </button>
        </form>

        <div style={{
          marginTop: '28px',
          padding: '14px 16px',
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180, 101, 30, 0.15)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
        }}>
          <ShieldX size={16} color="#B4651E" style={{ flexShrink: 0, marginTop: '2px' }} />
          <p style={{
            fontSize: '0.8rem',
            color: '#7a6a55',
            margin: 0,
            lineHeight: 1.5,
          }}>
            Access is restricted to registered marshals only. Both your ID and name must match our records. Contact your administrator if you have trouble logging in.
          </p>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}