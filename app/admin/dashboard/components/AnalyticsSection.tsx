'use client'

import { BarChart3, TrendingUp, AlertTriangle, MapPin, CheckCircle2, XCircle } from 'lucide-react'
import { useState } from 'react'

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

export default function AnalyticsSection({ issues }: AnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')

  const filteredIssues = issues.filter(issue => {
    const issueDate = new Date(issue.reported_at)
    const now = new Date()
    if (timeRange === 'today') return issueDate.toDateString() === now.toDateString()
    if (timeRange === 'week') {
      const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7)
      return issueDate >= weekAgo
    }
    const monthAgo = new Date(); monthAgo.setMonth(monthAgo.getMonth() - 1)
    return issueDate >= monthAgo
  })

  const totalIssues = filteredIssues.length
  const approvedIssues = filteredIssues.filter(i => i.status === 'approved').length
  const deniedIssues = filteredIssues.filter(i => i.status === 'denied').length

  const issueTypeCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1
    return acc
  }, {})
  const topIssueTypes = Object.entries(issueTypeCounts).sort(([, a], [, b]) => b - a).slice(0, 5)
  const maxIssueCount = topIssueTypes.length ? Math.max(...topIssueTypes.map(([, c]) => c)) : 1

  const blockCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.block] = (acc[issue.block] || 0) + 1
    return acc
  }, {})

  const locationCounts = filteredIssues.reduce((acc: Record<string, { count: number; location: string }>, issue) => {
    const key = `${issue.block}-F${issue.floor}${issue.room_location ? '-' + issue.room_location : ''}`
    if (!acc[key]) acc[key] = {
      count: 0,
      location: `${issue.block}, Floor ${issue.floor}${issue.room_location ? ', ' + issue.room_location : ''}`,
    }
    acc[key].count++
    return acc
  }, {})
  const problematicLocations = Object.values(locationCounts).sort((a, b) => b.count - a.count).slice(0, 5)

  return (
    <div>
      {/* Header with time range toggle */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 28px',
        borderBottom: '1px solid rgba(180,101,30,0.1)',
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.2rem', fontWeight: '600',
          color: '#1a1208', margin: 0,
        }}>
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
              label: 'Total Issues', value: totalIssues,
              icon: <BarChart3 size={22} color="rgba(180,101,30,0.3)" />,
              color: '#B4651E',
            },
            {
              label: 'Approved', value: approvedIssues,
              sub: totalIssues > 0 ? `${Math.round((approvedIssues / totalIssues) * 100)}% approval rate` : '',
              icon: <CheckCircle2 size={22} color="rgba(22,163,74,0.3)" />,
              color: '#16a34a',
            },
            {
              label: 'Denied', value: deniedIssues,
              sub: totalIssues > 0 ? `${Math.round((deniedIssues / totalIssues) * 100)}% denial rate` : '',
              icon: <XCircle size={22} color="rgba(220,38,38,0.3)" />,
              color: '#dc2626',
            },
            {
              label: 'Blocks', value: Object.keys(blockCounts).length,
              sub: `${totalIssues} issues reported`,
              icon: <MapPin size={22} color="rgba(30,45,61,0.25)" />,
              color: '#1e2d3d',
            },
          ].map((stat, i) => (
            <div key={i} style={{ ...subCard, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{
                  fontSize: '0.75rem', color: '#7a6a55', fontWeight: '500',
                  margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {stat.label}
                </p>
                <p style={{
                  fontSize: '2rem', fontWeight: '800', color: stat.color,
                  margin: 0, lineHeight: 1, fontFamily: "'DM Sans', sans-serif",
                }}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p style={{
                    fontSize: '0.72rem', color: '#7a6a55', margin: '5px 0 0',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
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
                <p style={{ color: '#c4b5a0', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
                  No issues in this period
                </p>
              ) : topIssueTypes.map(([type, count], index) => (
                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '20px', fontSize: '0.75rem', fontWeight: '700',
                    color: '#c4b5a0', flexShrink: 0, fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {index + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}>
                      <span style={{
                        fontSize: '0.82rem', fontWeight: '600', color: '#1a1208',
                        fontFamily: "'DM Sans', sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {type}
                      </span>
                      <span style={{
                        fontSize: '0.75rem', color: '#7a6a55', flexShrink: 0, marginLeft: '8px',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {count}
                      </span>
                    </div>
                    <div style={{
                      height: '5px', backgroundColor: 'rgba(180,101,30,0.1)',
                      borderRadius: '4px', overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${(count / maxIssueCount) * 100}%`,
                        backgroundColor: '#B4651E',
                        borderRadius: '4px',
                      }} />
                    </div>
                  </div>
                </div>
              ))}
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
                <p style={{ color: '#c4b5a0', fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif" }}>
                  No issues in this period
                </p>
              ) : problematicLocations.map((loc, index) => (
                <div key={index} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px',
                  backgroundColor: '#fffcf7',
                  border: '1px solid rgba(180,101,30,0.1)',
                  borderRadius: '10px',
                  gap: '10px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <span style={{
                      fontSize: '0.72rem', fontWeight: '700', color: '#c4b5a0', flexShrink: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {index + 1}
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{
                        fontSize: '0.82rem', fontWeight: '600', color: '#1a1208',
                        margin: '0 0 2px', fontFamily: "'DM Sans', sans-serif",
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {loc.location}
                      </p>
                      <p style={{
                        fontSize: '0.72rem', color: '#7a6a55', margin: 0,
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {loc.count} issue{loc.count !== 1 ? 's' : ''} reported
                      </p>
                    </div>
                  </div>
                  <span style={{
                    flexShrink: 0,
                    padding: '3px 10px', borderRadius: '20px',
                    fontSize: '0.75rem', fontWeight: '700',
                    backgroundColor: loc.count >= 3 ? '#fee2e2' : loc.count >= 2 ? '#fef3c7' : '#dcfce7',
                    color: loc.count >= 3 ? '#991b1b' : loc.count >= 2 ? '#92400e' : '#166534',
                    fontFamily: "'DM Sans', sans-serif",
                  }}>
                    {loc.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Issues by Block */}
        {Object.keys(blockCounts).length > 0 && (
          <div style={subCard}>
            <h3 style={sectionTitle}>
              <BarChart3 size={16} color="#B4651E" />
              Issues by Block
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
              gap: '12px',
            }}>
              {Object.entries(blockCounts).map(([block, count]) => {
                const pct = totalIssues > 0 ? ((count as number) / totalIssues) * 100 : 0
                return (
                  <div key={block} style={{ textAlign: 'center' }}>
                    <p style={{
                      fontWeight: '700', color: '#1a1208', margin: '0 0 8px',
                      fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {block}
                    </p>
                    <div style={{
                      width: '100%', height: '100px',
                      backgroundColor: 'rgba(180,101,30,0.08)',
                      borderRadius: '10px',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute', bottom: 0, left: 0, right: 0,
                        height: `${Math.min(pct, 100)}%`,
                        background: 'linear-gradient(to top, #B4651E, #e3903f)',
                        transition: 'height 0.4s ease',
                      }} />
                      <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <span style={{
                          fontSize: '1.5rem', fontWeight: '800',
                          color: pct > 40 ? 'white' : '#1a1208',
                          fontFamily: "'DM Sans', sans-serif",
                          textShadow: pct > 40 ? '0 1px 3px rgba(0,0,0,0.3)' : 'none',
                        }}>
                          {count}
                        </span>
                      </div>
                    </div>
                    <p style={{
                      fontSize: '0.72rem', color: '#7a6a55', margin: '6px 0 0',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
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