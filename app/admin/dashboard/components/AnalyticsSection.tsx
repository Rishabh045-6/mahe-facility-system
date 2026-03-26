// ✅ FIXED: AnalyticsSection.tsx
'use client'

import { BarChart3, AlertTriangle, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getTodayDateString } from '@/lib/utils/time'

interface Issue {
  block: string
  floor: string
  room_location?: string
  issue_type: string
  status: string
  marshal_id: string
  reported_at: string
}

interface AnalyticsSectionProps {
  issues: Issue[]
}

const sectionTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1a1208',
  margin: '0 0 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
}

const subCard: React.CSSProperties = {
  backgroundColor: '#fdf6ef',
  border: '1px solid rgba(180,101,30,0.1)',
  borderRadius: '12px',
  padding: '16px',
}

type TimeRange = 'today' | 'week' | 'month'

const getISTDateParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'short',
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value ?? '0'),
    month: Number(parts.find((part) => part.type === 'month')?.value ?? '1'),
    day: Number(parts.find((part) => part.type === 'day')?.value ?? '1'),
    weekday: parts.find((part) => part.type === 'weekday')?.value ?? 'Mon',
  }
}

function getRangeBounds(range: 'today' | 'week' | 'month') {
  const today = getTodayDateString()
  const todayStart = new Date(`${today}T00:00:00+05:30`)
  const tomorrowStart = new Date(todayStart)
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)

  if (range === 'today') return { start: todayStart, end: tomorrowStart }

  const { year, month, day, weekday } = getISTDateParts()

  if (range === 'week') {
    const weekdayMap: Record<string, number> = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    }
    const dayIndex = weekdayMap[weekday] ?? 1
    const offsetToMonday = dayIndex === 0 ? 6 : dayIndex - 1
    const weekStart = new Date(Date.UTC(year, month - 1, day - offsetToMonday, 0, 0, 0))
    const nextWeekStart = new Date(Date.UTC(year, month - 1, day - offsetToMonday + 7, 0, 0, 0))

    return {
      start: new Date(`${weekStart.toISOString().slice(0, 10)}T00:00:00+05:30`),
      end: new Date(`${nextWeekStart.toISOString().slice(0, 10)}T00:00:00+05:30`),
    }
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0))

  return {
    start: new Date(`${monthStart.toISOString().slice(0, 10)}T00:00:00+05:30`),
    end: new Date(`${nextMonthStart.toISOString().slice(0, 10)}T00:00:00+05:30`),
  }
}

export default function AnalyticsSection({ issues }: AnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('today')

  const filteredIssues = useMemo(() => {
    const { start, end } = getRangeBounds(timeRange)

    return issues.filter(issue => {
      if (!issue.reported_at) return false
      const d = new Date(issue.reported_at)
      if (Number.isNaN(d.getTime())) return false
      return d >= start && d < end
    })
  }, [issues, timeRange])

  const totalIssues = filteredIssues.length
  const approvedIssues = filteredIssues.filter(i => (i.status ?? '').toLowerCase() === 'approved').length
  const deniedIssues = filteredIssues.filter(i => (i.status ?? '').toLowerCase() === 'denied').length

  const issueTypeCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    const key = issue.issue_type?.trim() || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const topIssueTypes = Object.entries(issueTypeCounts).sort(([, a], [, b]) => b - a).slice(0, 5)
  const maxIssueCount = topIssueTypes.length ? Math.max(...topIssueTypes.map(([, c]) => c)) : 1

  const blockCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    const key = issue.block?.trim() || 'Unknown'
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const locationCounts = filteredIssues.reduce(
    (acc: Record<string, { count: number; location: string }>, issue) => {
      const key = `${issue.block}-F${issue.floor}${issue.room_location ? '-' + issue.room_location : ''}`
      if (!acc[key]) {
        acc[key] = {
          count: 0,
          location: `${issue.block}, Floor ${issue.floor}${issue.room_location ? ', ' + issue.room_location : ''}`,
        }
      }
      acc[key].count++
      return acc
    },
    {}
  )

  const problematicLocations = Object.values(locationCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  const issueTypeDistribution = useMemo(() => {
    const counts = new Map<string, number>()
    filteredIssues.forEach(issue => {
      counts.set(issue.issue_type, (counts.get(issue.issue_type) || 0) + 1)
    })
    const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
    const top5 = sorted.slice(0, 5)
    const othersCount = sorted.slice(5).reduce((sum, [, count]) => sum + count, 0)
    if (othersCount > 0) {
      top5.push(['Others', othersCount])
    }
    const total = filteredIssues.length
    return top5.map(([type, count]) => ({
      type,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0,
      displayPercentage: total > 0 ? Math.round((count / total) * 100) : 0
    }))
  }, [filteredIssues])

  return (
    <div>
      {/* Header with time range toggle */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 28px',
          borderBottom: '1px solid rgba(180,101,30,0.1)',
        }}
      >
        <h2
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#1a1208',
            margin: 0,
          }}
        >
          Analytics
        </h2>
        <div style={{ display: 'flex', gap: '6px' }}>
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                border: timeRange === range ? 'none' : '1.5px solid rgba(180,101,30,0.15)',
                backgroundColor: timeRange === range ? '#B4651E' : 'transparent',
                color: timeRange === range ? 'white' : '#7a6a55',
                fontSize: '0.8rem',
                fontWeight: '600',
                textTransform: 'capitalize',
                cursor: 'pointer',
                transition: 'all 0.15s',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Stat mini-cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
          {[
            {
              label: 'Total Issues',
              value: totalIssues,
              icon: <BarChart3 size={22} color="rgba(180,101,30,0.3)" />,
              color: '#B4651E',
            },
            {
              label: 'Approved',
              value: approvedIssues,
              sub: totalIssues > 0 ? `${Math.round((approvedIssues / totalIssues) * 100)}% approval rate` : '',
              icon: <CheckCircle2 size={22} color="rgba(22,163,74,0.3)" />,
              color: '#16a34a',
            },
            {
              label: 'Denied',
              value: deniedIssues,
              sub: totalIssues > 0 ? `${Math.round((deniedIssues / totalIssues) * 100)}% denial rate` : '',
              icon: <XCircle size={22} color="rgba(220,38,38,0.3)" />,
              color: '#dc2626',
            },
            {
              label: 'Blocks',
              value: Object.keys(blockCounts).length,
              sub: `${totalIssues} issues reported`,
              icon: <MapPin size={22} color="rgba(30,45,61,0.25)" />,
              color: '#1e2d3d',
            },
          ].map((stat, i) => (
            <div key={i} style={{ ...subCard, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#7a6a55',
                    fontWeight: '500',
                    margin: '0 0 6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {stat.label}
                </p>
                <p
                  style={{
                    fontSize: '2rem',
                    fontWeight: '800',
                    color: stat.color,
                    margin: 0,
                    lineHeight: 1,
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {stat.value}
                </p>
                {stat.sub && (
                  <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: '5px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                    {stat.sub}
                  </p>
                )}
              </div>
              <div style={{ marginTop: '2px' }}>{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* Top issue types + Problematic locations */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Top Issue Types */}
          <div style={subCard}>
            <h3 style={sectionTitle}>
              <AlertTriangle size={16} color="#f59e0b" />
              Top Issue Types
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {topIssueTypes.length === 0 ? (
                <p style={{ color: '#c4b5a0', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>No issues in this period</p>
              ) : (
                topIssueTypes.map(([type, count], index) => (
                  <Link
                    key={type}
                    href={`/admin/issues?issue_type=${encodeURIComponent(type)}&range=${timeRange}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 12px',
                        borderRadius: '10px',
                        backgroundColor: '#fffcf7',
                        border: '1px solid rgba(180,101,30,0.1)',
                        transition: 'border-color 0.15s, background-color 0.15s',
                      }}
                    >
                      <span
                        style={{
                          width: '20px',
                          fontSize: '0.75rem',
                          fontWeight: '700',
                          color: '#c4b5a0',
                          flexShrink: 0,
                          fontFamily: "'DM Sans', sans-serif",
                        }}
                      >
                        {index + 1}
                      </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                        <span
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: '#8f4e16',
                            fontFamily: "'DM Sans', sans-serif",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {type}
                        </span>
                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: '#7a6a55',
                            flexShrink: 0,
                            marginLeft: '8px',
                            fontFamily: "'DM Sans', sans-serif",
                            backgroundColor: '#fdf6ef',
                            border: '1px solid rgba(180,101,30,0.14)',
                            borderRadius: '999px',
                            padding: '2px 8px',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                      <div style={{ height: '5px', backgroundColor: 'rgba(180,101,30,0.1)', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(count / maxIssueCount) * 100}%`, backgroundColor: '#B4651E', borderRadius: '4px' }} />
                      </div>
                    </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Problematic Locations */}
          <div style={subCard}>
            <h3 style={sectionTitle}>
              <MapPin size={16} color="#dc2626" />
              Problematic Locations
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {problematicLocations.length === 0 ? (
                <p style={{ color: '#c4b5a0', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>No issues in this period</p>
              ) : (
                problematicLocations.map((loc, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      backgroundColor: '#fffcf7',
                      border: '1px solid rgba(180,101,30,0.1)',
                      borderRadius: '10px',
                      gap: '10px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#c4b5a0', flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>
                        {index + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: '700',
                            color: '#1a1208',
                            margin: '0 0 2px',
                            fontFamily: "'DM Sans', sans-serif",
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {loc.location}
                        </p>
                        <p style={{ fontSize: '0.78rem', color: '#7a6a55', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                          {loc.count} issue{loc.count !== 1 ? 's' : ''} reported
                        </p>
                      </div>
                    </div>
                    <span
                      style={{
                        flexShrink: 0,
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '0.75rem',
                        fontWeight: '700',
                        backgroundColor: loc.count >= 3 ? '#fee2e2' : loc.count >= 2 ? '#fef3c7' : '#dcfce7',
                        color: loc.count >= 3 ? '#991b1b' : loc.count >= 2 ? '#92400e' : '#166534',
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      {loc.count}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Issue Type Distribution */}
        <div style={subCard}>
          <h3 style={sectionTitle}>
            Issue Type Distribution
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {issueTypeDistribution.length === 0 ? (
              <p style={{ color: '#c4b5a0', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>No issues in this period</p>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      background: `conic-gradient(${issueTypeDistribution.map((item, index) => {
                        const colors = ['#B4651E', '#10b981', '#ef4444', '#f59e0b', '#6b7280', '#8b5cf6']
                        const start = issueTypeDistribution.slice(0, index).reduce((sum, i) => sum + i.percentage, 0)
                        const end = start + item.percentage
                        return `${colors[index % colors.length]} ${start}% ${end}%`
                      }).join(', ')})`,
                    }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {issueTypeDistribution.map((item, index) => {
                      const colors = ['#B4651E', '#10b981', '#ef4444', '#f59e0b', '#6b7280', '#8b5cf6']
                      return (
                        <div key={item.type} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '12px',
                              height: '12px',
                              borderRadius: '50%',
                              backgroundColor: colors[index % colors.length],
                              flexShrink: 0,
                            }}
                          />
                          <span style={{ fontSize: '0.8rem', color: '#1a1208', fontFamily: "'DM Sans', sans-serif", flex: 1 }}>
                            {item.type}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
                            {item.count} ({item.displayPercentage}%)
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Issues by Block */}
        {Object.keys(blockCounts).length > 0 && (
          <div style={subCard}>
            <h3 style={sectionTitle}>
              <BarChart3 size={16} color="#B4651E" />
              Issues by Block
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
              {Object.entries(blockCounts).map(([block, count]) => {
                const pct = totalIssues > 0 ? (count / totalIssues) * 100 : 0
                return (
                  <div key={block} style={{ textAlign: 'center' }}>
                    <p style={{ fontWeight: '700', color: '#1a1208', margin: '0 0 8px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" }}>
                      {block}
                    </p>
                    <div
                      style={{
                        width: '100%',
                        height: '100px',
                        backgroundColor: 'rgba(180,101,30,0.08)',
                        borderRadius: '10px',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          bottom: 0,
                          left: 0,
                          right: 0,
                          height: `${Math.min(pct, 100)}%`,
                          background: 'linear-gradient(to top, #B4651E, #e3903f)',
                          transition: 'height 0.4s ease',
                        }}
                      />
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span
                          style={{
                            fontSize: '1.5rem',
                            fontWeight: '800',
                            color: pct > 40 ? 'white' : '#1a1208',
                            fontFamily: "'DM Sans', sans-serif",
                            textShadow: pct > 40 ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                          }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: '6px 0 0', fontFamily: "'DM Sans', sans-serif" }}>
                      {pct.toFixed(1)}% of total
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
