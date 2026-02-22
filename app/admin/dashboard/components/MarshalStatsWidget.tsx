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
          timeZone: 'Asia/Kolkata',
        })
      )
    } catch (err) {
      console.error('Failed to fetch marshal stats:', err)
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 60_000)
    return () => clearInterval(interval)
  }, [fetchStats])

  const statItems = stats ? [
    { label: 'Total',        value: stats.totalMarshals,  sublabel: 'registered', color: '#B4651E', icon: <Users size={12} color="#B4651E" /> },
    { label: 'Today',        value: stats.activeToday,    sublabel: 'active',     color: '#2563eb', icon: <Activity size={12} color="#2563eb" /> },
    { label: 'This Week',    value: stats.activeThisWeek, sublabel: 'active',     color: '#16a34a', icon: <UserCheck size={12} color="#16a34a" /> },
    { label: 'This Month',   value: stats.activeThisMonth,sublabel: 'active',     color: '#7c3aed', icon: <Calendar size={12} color="#7c3aed" /> },
    { label: 'New',          value: stats.newThisWeek,    sublabel: 'this week',  color: '#d97706', icon: <TrendingUp size={12} color="#d97706" /> },
    { label: 'Submissions',  value: stats.submissionsToday,sublabel: 'today',     color: '#0891b2', icon: <Activity size={12} color="#0891b2" /> },
  ] : []

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '14px 16px',
      border: '1px solid rgba(180, 101, 30, 0.12)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
          <Users size={15} color="#B4651E" />
          <span style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: '0.85rem',
            fontWeight: '600',
            color: '#1a1208',
          }}>
            Marshal Activity
          </span>
          {lastUpdated && (
            <span style={{
              fontSize: '0.72rem',
              color: '#a89a8a',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              · updated {lastUpdated}
            </span>
          )}
        </div>

        <button
          onClick={fetchStats}
          disabled={loading}
          style={{
            background: 'none',
            border: '1px solid rgba(180,101,30,0.18)',
            borderRadius: '6px',
            padding: '3px 8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            color: '#B4651E',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.72rem',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '500',
            opacity: loading ? 0.5 : 1,
          }}
        >
          <RefreshCw size={11} style={loading ? { animation: 'spin 0.8s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          fontSize: '0.78rem',
          color: '#dc2626',
          marginBottom: '10px',
          fontFamily: "'DM Sans', sans-serif",
          display: 'flex',
          gap: '6px',
          alignItems: 'center',
        }}>
          {error}
          <button onClick={fetchStats} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', textDecoration: 'underline', fontSize: 'inherit', padding: 0 }}>
            retry
          </button>
        </div>
      )}

      {/* Stats grid — 6 columns on wide, wraps on narrow */}
      {loading && !stats ? (
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} style={{
              flex: 1,
              height: '52px',
              backgroundColor: '#f5f0ea',
              borderRadius: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      ) : stats ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: '8px',
        }}>
          {statItems.map((item) => (
            <div key={item.label} style={{
              backgroundColor: '#faf8f5',
              borderRadius: '8px',
              padding: '8px 10px',
              borderLeft: `3px solid ${item.color}`,
              display: 'flex',
              flexDirection: 'column',
              gap: '3px',
              minWidth: 0,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {item.icon}
                <span style={{
                  fontSize: '0.68rem',
                  color: '#7a6a55',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  fontFamily: "'DM Sans', sans-serif",
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {item.label}
                </span>
              </div>
              <span style={{
                fontSize: '1.35rem',
                fontWeight: '700',
                color: item.color,
                fontFamily: "'DM Sans', sans-serif",
                lineHeight: 1,
              }}>
                {item.value}
              </span>
              <span style={{
                fontSize: '0.68rem',
                color: '#a89a8a',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {item.sublabel}
              </span>
            </div>
          ))}
        </div>
      ) : null}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}