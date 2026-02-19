'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import MarshalActivityChart from './components/MarshalActivityChart'
import {
  RefreshCw, Download, AlertTriangle, CheckCircle2,
  XCircle, Mail, FileText, Users, Search
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { getTodayDateString } from '@/lib/utils/time'
import IssueCard from './components/IssueCard'
import FloorCoverageAlert from './components/FloorCoverageAlert'
import AnalyticsSection from './components/AnalyticsSection'

// ─── Shared style constants ───────────────────────────────────────────────────
const card: React.CSSProperties = {
  backgroundColor: 'rgba(255, 252, 247, 0.95)',
  border: '1px solid rgba(180, 101, 30, 0.12)',
  borderRadius: '16px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
}

const inputStyle: React.CSSProperties = {
  padding: '9px 14px',
  border: '1.5px solid rgba(180, 101, 30, 0.2)',
  borderRadius: '10px',
  fontSize: '0.875rem',
  outline: 'none',
  backgroundColor: '#fffcf7',
  color: '#1a1208',
  fontFamily: "'DM Sans', sans-serif",
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<any[]>([])
  const [filteredIssues, setFilteredIssues] = useState<any[]>([])
  const [floorCoverage, setFloorCoverage] = useState<any[]>([])
  const [marshalActivity, setMarshalActivity] = useState<any[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'denied'>('all')
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [stats, setStats] = useState({
    total: 0, approved: 0, denied: 0, pending: 0, withImages: 0,
  })

  const uniqueMarshalsCount = React.useMemo(() => {
    if (!floorCoverage.length) return 0
    return new Set(floorCoverage.map(fc => fc.marshal_id)).size
  }, [floorCoverage])

  useEffect(() => {
    fetchDashboardData(true)
    const interval = setInterval(() => fetchDashboardData(false), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    applyFilters()
  }, [issues, filterStatus, filterBlock, searchQuery])

  const fetchDashboardData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true)
      const today = getTodayDateString()

      const { data: activityData } = await supabase
        .from('daily_marshal_counts')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: true })
      setMarshalActivity(activityData || [])

      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .gte('reported_at', `${today}T00:00:00`)
        .lte('reported_at', `${today}T23:59:59`)
        .order('reported_at', { ascending: false })
      if (issuesError) throw issuesError
      setIssues(issuesData || [])

      const { data: coverageData } = await supabase
        .from('floor_coverage')
        .select('*')
        .eq('date', today)
        .order('block')
        .order('floor')
      setFloorCoverage(coverageData || [])

      calculateStats(issuesData || [])
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (issuesData: any[]) => {
    setStats({
      total: issuesData.length,
      approved: issuesData.filter(i => i.status === 'approved').length,
      denied: issuesData.filter(i => i.status === 'denied').length,
      pending: issuesData.filter(i => !i.status || i.status === 'pending').length,
      withImages: issuesData.filter(i => i.images && i.images.length > 0).length,
    })
  }

  const applyFilters = () => {
    let filtered = [...issues]
    if (filterStatus !== 'all') filtered = filtered.filter(i => i.status === filterStatus)
    if (filterBlock !== 'all') filtered = filtered.filter(i => i.block === filterBlock)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(i =>
        i.description?.toLowerCase().includes(q) ||
        i.issue_type?.toLowerCase().includes(q) ||
        i.marshal_id?.toLowerCase().includes(q) ||
        i.marshal_name?.toLowerCase().includes(q) ||
        i.room_location?.toLowerCase().includes(q)
      )
    }
    setFilteredIssues(filtered)
  }

  const handleStatusToggle = async (issueId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId)
      if (error) throw error
      setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i))
      toast.success(`Issue ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  const handleGenerateReport = async () => {
    try {
      setEmailLoading(true)
      const response = await fetch('/api/reports/download', { method: 'POST' })
      const contentType = response.headers.get('content-type')
      if (!contentType?.includes('application/json')) {
        toast.error(`Server error: ${response.status}`)
        return
      }
      const result = await response.json()
      if (!response.ok) { toast.error(result.message || result.error || 'Failed to generate report'); return }

      // Download PDF
      const pdfBinary = atob(result.pdf)
      const pdfBytes = new Uint8Array(pdfBinary.length)
      for (let i = 0; i < pdfBinary.length; i++) pdfBytes[i] = pdfBinary.charCodeAt(i)
      const pdfUrl = URL.createObjectURL(new Blob([pdfBytes], { type: 'application/pdf' }))
      const pdfLink = document.createElement('a')
      pdfLink.href = pdfUrl
      pdfLink.download = `${result.filename}.pdf`
      pdfLink.click()
      URL.revokeObjectURL(pdfUrl)

      // Download Excel
      const excelBinary = atob(result.excel)
      const excelBytes = new Uint8Array(excelBinary.length)
      for (let i = 0; i < excelBinary.length; i++) excelBytes[i] = excelBinary.charCodeAt(i)
      const excelUrl = URL.createObjectURL(new Blob([excelBytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
      const excelLink = document.createElement('a')
      excelLink.href = excelUrl
      excelLink.download = `${result.filename}.xlsx`
      excelLink.click()
      URL.revokeObjectURL(excelUrl)

      toast.success('Reports downloaded successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Report generation failed.')
    } finally {
      setEmailLoading(false)
      setShowEmailModal(false)
    }
  }

  const handleSendEmail = async () => {
    try {
      setEmailLoading(true)
      const response = await fetch('/api/reports/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'director@mahe.edu' }),
      })
      const result = await response.json()
      if (!response.ok) {
        toast.error(result.message?.includes('No issues')
          ? 'No issues reported today. Cannot send report.'
          : result.message || result.error || 'Failed to send email')
        return
      }
      toast.success('Email sent to director successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email')
    } finally {
      setEmailLoading(false)
      setShowEmailModal(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid #B4651E', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
            Loading dashboard...
          </p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Stat Cards ─────────────────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
      }}>
        {[
          {
            label: 'Total Issues',
            value: stats.total,
            valueColor: '#1a1208',
            icon: <FileText size={28} color="rgba(180,101,30,0.25)" />,
          },
          {
            label: 'Approved',
            value: stats.approved,
            valueColor: '#16a34a',
            icon: <CheckCircle2 size={28} color="rgba(22,163,74,0.25)" />,
          },
          {
            label: 'Denied',
            value: stats.denied,
            valueColor: '#dc2626',
            icon: <XCircle size={28} color="rgba(220,38,38,0.25)" />,
          },
          {
            label: 'Active Marshals Today',
            value: uniqueMarshalsCount,
            valueColor: '#B4651E',
            icon: <Users size={28} color="rgba(180,101,30,0.25)" />,
            sub: `${floorCoverage.length} floors covered`,
            subColor: '#B4651E',
          },
          {
            label: 'With Images',
            value: stats.withImages,
            valueColor: '#1e2d3d',
            icon: <FileText size={28} color="rgba(30,45,61,0.2)" />,
          },
        ].map((stat, i) => (
          <div key={i} style={{ ...card, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div>
                <p style={{ fontSize: '0.8rem', color: '#7a6a55', margin: '0 0 8px', fontWeight: '500' }}>
                  {stat.label}
                </p>
                <p style={{
                  fontSize: '2rem', fontWeight: '700',
                  color: stat.valueColor, margin: 0, lineHeight: 1,
                }}>
                  {stat.value}
                </p>
                {stat.sub && (
                  <p style={{ fontSize: '0.75rem', color: stat.subColor, margin: '6px 0 0' }}>
                    {stat.sub}
                  </p>
                )}
              </div>
              <div style={{ marginTop: '4px' }}>{stat.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Floor Coverage Alert ────────────────────────────────────────────── */}
      <FloorCoverageAlert floorCoverage={floorCoverage} />

      {/* ── Action Bar ─────────────────────────────────────────────────────── */}
      <div style={{
        ...card,
        padding: '16px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        {/* Left: action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => fetchDashboardData(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px',
              backgroundColor: '#B4651E',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(180,101,30,0.3)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#8f4e16'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#B4651E'}
          >
            <RefreshCw size={15} />
            Refresh
          </button>

          <button
            onClick={() => setShowEmailModal(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '9px 18px',
              backgroundColor: '#1e2d3d',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(30,45,61,0.3)',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#2a3f57'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1e2d3d'}
          >
            <Download size={15} />
            Generate Report
          </button>
        </div>

        {/* Right: filters */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#7a6a55', fontWeight: '500' }}>Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              style={inputStyle}
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="denied">Denied</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.8rem', color: '#7a6a55', fontWeight: '500' }}>Block:</span>
            <select
              value={filterBlock}
              onChange={(e) => setFilterBlock(e.target.value)}
              style={inputStyle}
            >
              <option value="all">All Blocks</option>
              <option value="AB1">AB1</option>
              <option value="AB2">AB2</option>
              <option value="AB3">AB3</option>
              <option value="AB4">AB4</option>
              <option value="AB5">AB5</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              color="#7a6a55"
              style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="Search issues..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ ...inputStyle, paddingLeft: '32px', width: '200px' }}
            />
          </div>
        </div>
      </div>

      {/* ── Issues List ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.2rem',
            fontWeight: '600',
            color: '#1a1208',
            margin: 0,
          }}>
            Today's Issues
          </h2>
          <span style={{
            backgroundColor: '#fdf6ef',
            border: '1px solid rgba(180, 101, 30, 0.2)',
            borderRadius: '20px',
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#B4651E',
          }}>
            {filteredIssues.length}
          </span>
        </div>

        {filteredIssues.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            backgroundColor: '#fdf6ef',
            borderRadius: '0 0 16px 16px',
          }}>
            <AlertTriangle size={48} color="rgba(180,101,30,0.2)" style={{ margin: '0 auto 16px' }} />
            <p style={{ color: '#7a6a55', fontSize: '1rem', margin: 0 }}>No issues found</p>
          </div>
        ) : (
          <div style={{ borderRadius: '0 0 16px 16px', overflow: 'hidden' }}>
            {filteredIssues.map((issue, index) => (
              <div
                key={issue.id}
                style={{
                  borderTop: index === 0 ? 'none' : '1px solid rgba(180, 101, 30, 0.08)',
                }}
              >
                <IssueCard issue={issue} onStatusChange={handleStatusToggle} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Marshal Activity Chart ──────────────────────────────────────────── */}
      {marshalActivity.length > 0 && (
        <div style={card}>
          <MarshalActivityChart data={marshalActivity} />
        </div>
      )}

      {/* ── Analytics Section ───────────────────────────────────────────────── */}
      <div style={card}>
        <AnalyticsSection issues={issues} />
      </div>

      {/* ── Email / Report Modal ────────────────────────────────────────────── */}
      {showEmailModal && (
        <div style={{
          position: 'fixed', inset: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 50, padding: '24px',
          backdropFilter: 'blur(4px)',
        }}>
          <div style={{
            ...card,
            width: '100%',
            maxWidth: '440px',
            padding: 0,
            overflow: 'hidden',
          }}>
            {/* Modal header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
            }}>
              <h3 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: '0 0 6px',
              }}>
                Generate & Send Report
              </h3>
              <p style={{ color: '#7a6a55', fontSize: '0.875rem', margin: 0 }}>
                Choose how you'd like to handle today's facility report
              </p>
            </div>

            {/* Modal actions */}
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                onClick={handleGenerateReport}
                disabled={emailLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '14px',
                  backgroundColor: '#1e2d3d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  opacity: emailLoading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { if (!emailLoading) e.currentTarget.style.backgroundColor = '#2a3f57' }}
                onMouseLeave={(e) => { if (!emailLoading) e.currentTarget.style.backgroundColor = '#1e2d3d' }}
              >
                <Download size={18} />
                {emailLoading ? 'Generating...' : 'Download Report (PDF + Excel)'}
              </button>

              <button
                onClick={handleSendEmail}
                disabled={emailLoading}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                  padding: '14px',
                  backgroundColor: '#B4651E',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  cursor: emailLoading ? 'not-allowed' : 'pointer',
                  opacity: emailLoading ? 0.7 : 1,
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => { if (!emailLoading) e.currentTarget.style.backgroundColor = '#8f4e16' }}
                onMouseLeave={(e) => { if (!emailLoading) e.currentTarget.style.backgroundColor = '#B4651E' }}
              >
                <Mail size={18} />
                {emailLoading ? 'Sending...' : 'Send to Director via Email'}
              </button>
            </div>

            {/* Modal footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid rgba(180, 101, 30, 0.1)',
            }}>
              <button
                onClick={() => setShowEmailModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#7a6a55',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}