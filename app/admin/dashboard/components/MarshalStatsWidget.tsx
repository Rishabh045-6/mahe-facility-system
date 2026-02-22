// ✅ FIXED: MarshalStatsWidget.tsx (prevents stale/cached stats)
'use client'

import { useState, useEffect, useRef } from 'react'
import { Users, TrendingUp, Calendar, X, RefreshCw } from 'lucide-react'

interface MarshalStats {
  total: number
  activeToday: number
  activeThisWeek: number
  activeThisMonth: number
  newThisWeek: number
}

export default function MarshalStatsWidget() {
  const [stats, setStats] = useState<MarshalStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStats()
    // ✅ optional: keep it fresh so it doesn't look "stagnant"
    const id = window.setInterval(fetchStats, 60_000)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setShowPopover(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/marshal-stats?t=${Date.now()}`, {
        cache: 'no-store', // ✅ critical: bypass browser/proxy caching
        headers: { 'cache-control': 'no-cache' },
      })
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch marshal stats:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180,101,30,0.15)',
          borderRadius: '8px',
          padding: '8px 14px',
          animation: 'pulse 1.5s ease-in-out infinite',
        }}
      >
        <div style={{ width: '14px', height: '14px', backgroundColor: 'rgba(180,101,30,0.15)', borderRadius: '50%' }} />
        <div style={{ width: '48px', height: '12px', backgroundColor: 'rgba(180,101,30,0.1)', borderRadius: '4px' }} />
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.5} }`}</style>
      </div>
    )
  }

  if (!stats) return null

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>

      {/* Trigger pill */}
      <button
        onClick={() => setShowPopover(prev => !prev)}
        title="Marshal usage stats"
        style={{
          display: 'flex', alignItems: 'center', gap: '8px',
          padding: '7px 14px',
          backgroundColor: showPopover ? '#fdf6ef' : '#fffcf7',
          border: `1.5px solid ${showPopover ? '#B4651E' : 'rgba(180,101,30,0.2)'}`,
          borderRadius: '8px',
          cursor: 'pointer',
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#fdf6ef'
          e.currentTarget.style.borderColor = '#B4651E'
        }}
        onMouseLeave={(e) => {
          if (!showPopover) {
            e.currentTarget.style.backgroundColor = '#fffcf7'
            e.currentTarget.style.borderColor = 'rgba(180,101,30,0.2)'
          }
        }}
      >
        <Users size={15} color="#B4651E" />
        <span style={{
          fontSize: '0.875rem', fontWeight: '700', color: '#B4651E',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {stats.total.toLocaleString()}
        </span>
        <span style={{
          fontSize: '0.75rem', color: '#7a6a55',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          users
        </span>
        {stats.newThisWeek > 0 && (
          <span style={{
            display: 'flex', alignItems: 'center',
            backgroundColor: '#dcfce7',
            border: '1px solid rgba(22,163,74,0.2)',
            color: '#166534',
            fontSize: '0.7rem', fontWeight: '700',
            padding: '2px 6px', borderRadius: '20px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            +{stats.newThisWeek}
          </span>
        )}
      </button>

      {/* Popover */}
      {showPopover && (
        <div style={{
          position: 'absolute', right: 0, top: 'calc(100% + 8px)',
          width: '260px',
          backgroundColor: 'rgba(255,252,247,0.98)',
          border: '1px solid rgba(180,101,30,0.15)',
          borderRadius: '16px',
          boxShadow: '0 16px 48px rgba(0,0,0,0.12)',
          zIndex: 50,
          overflow: 'hidden',
        }}>
          {/* Popover header */}
          <div style={{
            backgroundColor: '#1e2d3d',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={15} color="rgba(255,255,255,0.8)" />
              <span style={{
                fontSize: '0.875rem', fontWeight: '600', color: 'white',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Marshal Stats
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={fetchStats}
                title="Refresh"
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', display: 'flex',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <RefreshCw size={13} />
              </button>
              <button
                onClick={() => setShowPopover(false)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(255,255,255,0.5)', display: 'flex',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = 'white'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Total headline */}
          <div style={{ padding: '16px 16px 0' }}>
            <div style={{
              backgroundColor: '#fdf6ef',
              border: '1px solid rgba(180,101,30,0.12)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div>
                <p style={{
                  fontSize: '0.7rem', fontWeight: '700', color: '#7a6a55',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  margin: '0 0 4px', fontFamily: "'DM Sans', sans-serif",
                }}>
                  Total Unique Marshals
                </p>
                <p style={{
                  fontSize: '2rem', fontWeight: '800', color: '#B4651E',
                  margin: '0 0 2px', lineHeight: 1, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {stats.total.toLocaleString()}
                </p>
                <p style={{
                  fontSize: '0.7rem', color: '#c4b5a0', margin: 0,
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  all time
                </p>
              </div>
              <Users size={32} color="rgba(180,101,30,0.15)" />
            </div>
          </div>

          {/* 2×2 grid */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: '8px', padding: '10px 16px 16px',
          }}>
            {[
              { icon: <Calendar size={12} />, label: 'Today', value: stats.activeToday, color: '#B4651E', bg: '#fdf6ef' },
              { icon: <TrendingUp size={12} />, label: 'This Week', value: stats.activeThisWeek, color: '#1e2d3d', bg: '#f0f4f8' },
              { icon: <Calendar size={12} />, label: 'This Month', value: stats.activeThisMonth, color: '#7a6a55', bg: '#fdf6ef' },
              { icon: <TrendingUp size={12} />, label: 'New This Week', value: stats.newThisWeek, color: '#16a34a', bg: '#f0fdf4', highlight: true },
            ].map((stat, i) => (
              <div key={i} style={{
                backgroundColor: stat.bg,
                border: `1px solid ${stat.highlight ? 'rgba(22,163,74,0.2)' : 'rgba(180,101,30,0.1)'}`,
                borderRadius: '10px',
                padding: '10px 12px',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '5px',
                  color: stat.color, marginBottom: '4px', opacity: 0.8,
                }}>
                  {stat.icon}
                  <span style={{
                    fontSize: '0.72rem', fontWeight: '500',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {stat.label}
                  </span>
                </div>
                <p style={{
                  fontSize: '1.25rem', fontWeight: '800', color: stat.color,
                  margin: 0, lineHeight: 1, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {stat.value.toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          <p style={{
            textAlign: 'center',
            fontSize: '0.7rem', color: '#c4b5a0',
            padding: '0 16px 14px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            Active = submitted at least once in period
          </p>
        </div>
      )}
    </div>
  )
}