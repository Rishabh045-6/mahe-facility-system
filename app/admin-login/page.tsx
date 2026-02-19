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
        setError(result.details || result.error || 'Invalid credentials')
        toast.error(result.error || 'Login failed')
        setLoading(false)
        return
      }

      toast.success('Login successful!')
      router.push('/admin/dashboard')

    } catch (err) {
      setError('Network error. Please check your connection.')
      toast.error('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    border: '1.5px solid rgba(180, 101, 30, 0.25)',
    borderRadius: '10px',
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: '#fffcf7',
    color: '#1a1208',
    boxSizing: 'border-box' as const,
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

        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '72px',
            height: '72px',
            backgroundColor: '#1e2d3d',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 4px 16px rgba(30, 45, 61, 0.3)',
          }}>
            <span style={{ color: 'white', fontSize: '1.75rem', fontWeight: '700' }}>A</span>
          </div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.75rem',
            fontWeight: '600',
            color: '#1a1208',
            marginBottom: '8px',
          }}>
            Admin Dashboard
          </h2>
          <p style={{ color: '#7a6a55', fontSize: '0.9rem' }}>
            MAHE Facility Management System
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && (
            <div style={{
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <AlertCircle size={16} color="#ef4444" />
              <p style={{ color: '#dc2626', fontSize: '0.875rem', margin: 0 }}>{error}</p>
            </div>
          )}

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#1a1208',
              marginBottom: '8px',
            }}>
              <Mail size={14} color="#B4651E" />
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@mahe.edu"
              required
              autoFocus
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = '#B4651E'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.25)'}
            />
          </div>

          <div>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.875rem',
              fontWeight: '500',
              color: '#1a1208',
              marginBottom: '8px',
            }}>
              <Lock size={14} color="#B4651E" />
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={inputStyle}
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
              backgroundColor: '#1e2d3d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2a3f57')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1e2d3d')}
          >
            {loading ? (
              <span>Logging in...</span>
            ) : (
              <>
                <LogIn size={18} />
                <span>Login</span>
              </>
            )}
          </button>
        </form>

        <p style={{
          textAlign: 'center',
          fontSize: '0.8rem',
          color: '#b0a090',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid rgba(180, 101, 30, 0.1)',
        }}>
          Contact system administrator for access
        </p>
      </div>
    </div>
  )
}