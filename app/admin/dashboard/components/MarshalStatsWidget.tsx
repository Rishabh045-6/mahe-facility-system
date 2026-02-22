// app/admin/components/MarshalStatsWidget.tsx
'use client'

import { useEffect, useState, useCallback } from 'react'
import { Users, UserCheck, Calendar, TrendingUp, RefreshCw, Activity } from 'lucide-react'

type MarshalStats = {
  totalMarshals: number
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  newThisWeek: number
  submissionsToday: number
  generatedAt: string
}

export default function MarshalStatsWidget() {
  const [stats, setStats] = useState<MarshalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string>('')

  const fetchStats = useCallback(async () => {
    try {
      setError(null)
      // Timestamp cache-buster forces a fresh network request every time
      const res = await fetch(`/api/admin/marshal-stats?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data: MarshalStats = await res.json()
      setStats(data)
      setLastUpdated(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        })
      )
    } catch (err) {
      console.error('Failed to fetch marshal stats:', err)
      setError('Failed to load stats')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    // Refresh every 60 seconds automatically
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const cardStyle = (accentColor: string): React.CSSProperties => ({
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '18px 20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
    borderLeft: `4px solid ${accentColor}`,
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  })

  const labelStyle: React.CSSProperties = {
    fontSize: '0.78rem',
    color: '#7a6a55',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontFamily: "'DM Sans', sans-serif",
  }

  const valueStyle = (color: string): React.CSSProperties => ({
    fontSize: '2rem',
    fontWeight: '700',
    color,
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1,
  })

  return (
    <div style={{
      backgroundColor: '#fffcf7',
      borderRadius: '16px',
      padding: '20px',
      border: '1px solid rgba(180, 101, 30, 0.12)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '18px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            backgroundColor: '#fdf6ef',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Users size={18} color="#B4651E" />
          </div>
          <div>
            <h3 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.05rem',
              fontWeight: '600',
              color: '#1a1208',
              margin: 0,
            }}>
              Marshal Activity
            </h3>
            {lastUpdated && (
              <p style={{
                fontSize: '0.75rem',
                color: '#7a6a55',
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Updated {lastUpdated}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          title="Refresh stats"
          style={{
            background: 'none',
            border: '1px solid rgba(180,101,30,0.2)',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: '#B4651E',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.78rem',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '500',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw
            size={13}
            style={loading ? { animation: 'spin 0.8s linear infinite' } : {}}
          />
          Refresh
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid rgba(220,38,38,0.2)',
          borderRadius: '8px',
          padding: '10px 14px',
          fontSize: '0.85rem',
          color: '#dc2626',
          marginBottom: '14px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {error} — <button
            onClick={fetchStats}
            style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}
          >
            retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      {loading && !stats ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} style={{
              backgroundColor: '#f5f0ea',
              borderRadius: '12px',
              height: '80px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : stats ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '12px',
        }}>
          <div style={cardStyle('#B4651E')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={14} color="#B4651E" />
              <span style={labelStyle}>Total</span>
            </div>
            <span style={valueStyle('#1a1208')}>{stats.totalMarshals}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              registered
            </span>
          </div>

          <div style={cardStyle('#2563eb')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#2563eb" />
              <span style={labelStyle}>Today</span>
            </div>
            <span style={valueStyle('#2563eb')}>{stats.activeToday}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              active
            </span>
          </div>

          <div style={cardStyle('#16a34a')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <UserCheck size={14} color="#16a34a" />
              <span style={labelStyle}>This Week</span>
            </div>
            <span style={valueStyle('#16a34a')}>{stats.activeThisWeek}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              active
            </span>
          </div>

          <div style={cardStyle('#7c3aed')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={14} color="#7c3aed" />
              <span style={labelStyle}>This Month</span>
            </div>
            <span style={valueStyle('#7c3aed')}>{stats.activeThisMonth}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              active
            </span>
          </div>

          <div style={cardStyle('#d97706')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <TrendingUp size={14} color="#d97706" />
              <span style={labelStyle}>New</span>
            </div>
            <span style={valueStyle('#d97706')}>{stats.newThisWeek}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              this week
            </span>
          </div>

          <div style={cardStyle('#0891b2')}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} color="#0891b2" />
              <span style={labelStyle}>Submissions</span>
            </div>
            <span style={valueStyle('#0891b2')}>{stats.submissionsToday}</span>
            <span style={{ fontSize: '0.72rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
              today
            </span>
          </div>
        </div>
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}