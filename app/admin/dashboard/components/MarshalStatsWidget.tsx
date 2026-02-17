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
  const [stats, setStats]           = useState<MarshalStats | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showPopover, setShowPopover] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchStats()
  }, [])

  // Close on outside click
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
      const res  = await fetch('/api/marshal-stats')
      const data = await res.json()
      if (data.success) setStats(data.data)
    } catch (err) {
      console.error('Failed to fetch marshal stats:', err)
    } finally {
      setLoading(false)
    }
  }

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center space-x-2 bg-gray-100 rounded-lg px-3 py-2 animate-pulse">
        <div className="w-4 h-4 bg-gray-300 rounded-full" />
        <div className="w-16 h-4 bg-gray-300 rounded" />
      </div>
    )
  }

  if (!stats) return null

  // ── Compact pill ─────────────────────────────────────────────────────────
  return (
    <div className="relative" ref={popoverRef}>
      <button
        onClick={() => setShowPopover(prev => !prev)}
        className="flex items-center space-x-2 bg-primary-50 hover:bg-primary-100 border border-primary-200 rounded-lg px-3 py-2 transition-colors"
        title="Marshal usage stats"
      >
        <Users className="w-4 h-4 text-primary-600" />
        <span className="text-sm font-bold text-primary-700">
          {stats.total.toLocaleString()}
        </span>
        <span className="text-xs text-primary-500">users</span>

        {/* green badge for new this week */}
        {stats.newThisWeek > 0 && (
          <span className="flex items-center text-xs bg-green-100 text-green-700 rounded-full px-1.5 py-0.5 font-semibold leading-none">
            +{stats.newThisWeek}
          </span>
        )}
      </button>

      {/* ── Popover ──────────────────────────────────────────────────────── */}
      {showPopover && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">

          {/* Header */}
          <div className="bg-primary-600 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-white" />
              <span className="text-sm font-semibold text-white">Marshal Stats</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={fetchStats}
                className="text-primary-200 hover:text-white transition-colors"
                title="Refresh"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowPopover(false)}
                className="text-primary-200 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-4 space-y-3">

            {/* Total — headline */}
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-primary-500 uppercase tracking-wide">
                  Total Unique Marshals
                </p>
                <p className="text-3xl font-extrabold text-primary-700 mt-0.5 leading-none">
                  {stats.total.toLocaleString()}
                </p>
                <p className="text-xs text-primary-400 mt-1">all time</p>
              </div>
              <Users className="w-10 h-10 text-primary-200" />
            </div>

            {/* 2×2 grid */}
            <div className="grid grid-cols-2 gap-2">
              <StatCard
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="Today"
                value={stats.activeToday}
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="This Week"
                value={stats.activeThisWeek}
                color="orange"
              />
              <StatCard
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="This Month"
                value={stats.activeThisMonth}
                color="purple"
              />
              <StatCard
                icon={<TrendingUp className="w-3.5 h-3.5" />}
                label="New This Week"
                value={stats.newThisWeek}
                color="green"
                highlight
              />
            </div>

            <p className="text-xs text-gray-400 text-center">
              Active = submitted at least once in period
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component ────────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  color,
  highlight = false,
}: {
  icon: React.ReactNode
  label: string
  value: number
  color: 'blue' | 'orange' | 'purple' | 'green'
  highlight?: boolean
}) {
  const styles = {
    blue:   'bg-blue-50   text-blue-600   border-blue-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    purple: 'bg-purple-50 text-purple-600 border-purple-100',
    green:  'bg-green-50  text-green-600  border-green-100',
  }

  return (
    <div
      className={`rounded-lg p-2.5 border ${styles[color]} ${
        highlight ? 'ring-1 ring-green-300' : ''
      }`}
    >
      <div className="flex items-center space-x-1 mb-1 opacity-70">
        {icon}
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-xl font-bold leading-none">{value.toLocaleString()}</p>
    </div>
  )
}