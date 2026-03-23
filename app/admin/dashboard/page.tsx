'use client'

import { useState, useEffect } from 'react'
import React from 'react'
import {
  RefreshCw, Download, AlertTriangle, CheckCircle2,
  XCircle, Mail, FileText, Users, Search, ChevronRight, ChevronDown
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import { getTodayDateString } from '@/lib/utils/time'
import IssueCard from './components/IssueCard'
import FloorCoverageAlert from './components/FloorCoverageAlert'
import AnalyticsSection from './components/AnalyticsSection'
import RoomAssignmentModal from './components/RoomAssignmentModal'
import CopyAssignmentsModal from './components/CopyAssignmentsModal'
import ConsecutiveAssignmentModal from './components/ConsecutiveAssignmentModal'

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

type AssignmentRoomState = {
  block: string
  floor: string
  room_number: string
  room_order: number
  floor_order: number
  category: 'not_assigned_not_covered' | 'assigned_not_covered' | 'assigned_covered' | 'unassigned_but_covered'
  assignment: {
    marshal_id: string
    marshal_name?: string | null
  } | null
  inspection: {
    marshal_id?: string | null
    marshal_name?: string | null
    has_issues?: boolean | null
    created_at?: string | null
  } | null
}

type AssignmentFloor = {
  block: string
  floor: string
  counts: {
    total_rooms: number
    not_assigned_not_covered: number
    assigned_not_covered: number
    assigned_covered: number
    unassigned_but_covered: number
  }
  rooms: AssignmentRoomState[]
}

type AssignmentDashboardData = {
  date: string
  summary: {
    total_rooms: number
    not_assigned_not_covered: number
    assigned_not_covered: number
    assigned_covered: number
    anomalies: number
  }
  categories: {
    not_assigned_not_covered: AssignmentRoomState[]
    assigned_not_covered: AssignmentRoomState[]
    assigned_covered: AssignmentRoomState[]
  }
  anomalies: {
    unassigned_but_covered: AssignmentRoomState[]
  }
  floors: AssignmentFloor[]
}

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<any[]>([])
  const [filteredIssues, setFilteredIssues] = useState<any[]>([])
  const [floorCoverage, setFloorCoverage] = useState<any[]>([])
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)
  const [filterStatus, setFilterStatus] = useState<'all' | 'approved' | 'denied'>('all')
  const [filterBlock, setFilterBlock] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [assignmentDate, setAssignmentDate] = useState(getTodayDateString())
  const [assignmentLoading, setAssignmentLoading] = useState(false)
  const [assignmentError, setAssignmentError] = useState<string | null>(null)
  const [assignmentData, setAssignmentData] = useState<AssignmentDashboardData | null>(null)
  const [expandedFloors, setExpandedFloors] = useState<Record<string, boolean>>({})
  const [selectedAssignmentRoom, setSelectedAssignmentRoom] = useState<AssignmentRoomState | null>(null)
  const [showCopyAssignmentsModal, setShowCopyAssignmentsModal] = useState(false)
  const [showConsecutiveAssignmentsModal, setShowConsecutiveAssignmentsModal] = useState(false)
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

  useEffect(() => {
    fetchAssignmentDashboard(assignmentDate)
  }, [assignmentDate])

  useEffect(() => {
    console.debug('[AdminDashboardPage] consecutive modal open state', showConsecutiveAssignmentsModal)
  }, [showConsecutiveAssignmentsModal])

  const fetchDashboardData = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true)
      const today = getTodayDateString()

      const start = new Date(`${today}T00:00:00+05:30`).toISOString()
      const endDate = new Date(`${today}T00:00:00+05:30`)
      endDate.setDate(endDate.getDate() + 1)

      const { data: issuesData, error: issuesError } = await supabase
        .from('issues')
        .select('*')
        .gte('reported_at', start)
        .lt('reported_at', endDate.toISOString())
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

  const fetchAssignmentDashboard = async (date: string) => {
    try {
      setAssignmentLoading(true)
      setAssignmentError(null)

      const response = await fetch(`/api/admin/room-assignments/dashboard?date=${encodeURIComponent(date)}`, {
        cache: 'no-store',
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load room assignments')
      }

      setAssignmentData(result)
      setExpandedFloors(prev => {
        if (Object.keys(prev).length > 0) return prev

        const next: Record<string, boolean> = {}
        for (const floor of result.floors || []) {
          next[`${floor.block}|${floor.floor}`] = false
        }
        return next
      })
    } catch (error: any) {
      console.error('Error loading room assignment dashboard:', error)
      setAssignmentData(null)
      setAssignmentError(error.message || 'Failed to load room assignments')
    } finally {
      setAssignmentLoading(false)
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

  const toggleFloor = (block: string, floor: string) => {
    const key = `${block}|${floor}`
    setExpandedFloors(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleAssignmentRoomSuccess = async () => {
    await fetchAssignmentDashboard(assignmentDate)
    toast.success('Room assignment updated')
  }

  const handleCopyAssignmentsSuccess = async (nextDate: string) => {
    if (nextDate !== assignmentDate) {
      setAssignmentDate(nextDate)
    } else {
      await fetchAssignmentDashboard(nextDate)
    }
    toast.success('Assignments copied successfully')
  }

  const handleConsecutiveAssignmentsSuccess = async (nextDate: string) => {
    if (nextDate !== assignmentDate) {
      setAssignmentDate(nextDate)
    } else {
      await fetchAssignmentDashboard(nextDate)
    }
    toast.success('Consecutive room assignment completed')
  }

  const handleClearAllAssignments = async () => {
    const confirmed = window.confirm('This will remove ALL assignments for this date. This cannot be undone.')
    if (!confirmed) return

    try {
      setAssignmentLoading(true)
      const response = await fetch('/api/admin/room-assignments/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: assignmentDate }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear assignments')
      }

      await fetchAssignmentDashboard(assignmentDate)
      toast.success('All assignments cleared for selected date')
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear assignments')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleClearFloorAssignments = async (block: string, floor: string) => {
    const confirmed = window.confirm('This will remove all assignments for this floor. This cannot be undone.')
    if (!confirmed) return

    try {
      setAssignmentLoading(true)
      const response = await fetch('/api/admin/room-assignments/clear-floor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: assignmentDate, block, floor }),
      })

      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Failed to clear floor assignments')
      }

      await fetchAssignmentDashboard(assignmentDate)
      toast.success(`Assignments cleared for ${block} Floor ${floor}`)
    } catch (error: any) {
      toast.error(error.message || 'Failed to clear floor assignments')
    } finally {
      setAssignmentLoading(false)
    }
  }

  const handleOpenConsecutiveAssignmentsModal = () => {
    console.debug('[AdminDashboardPage] opening consecutive modal')
    setShowConsecutiveAssignmentsModal(true)
  }

  const handleCloseConsecutiveAssignmentsModal = () => {
    console.debug('[AdminDashboardPage] closing consecutive modal')
    setShowConsecutiveAssignmentsModal(false)
  }

  const getRoomStatusMeta = (room: AssignmentRoomState) => {
    switch (room.category) {
      case 'assigned_covered':
        return {
          label: 'Assigned & Covered',
          background: 'rgba(22,163,74,0.08)',
          border: '1px solid rgba(22,163,74,0.18)',
          color: '#166534',
        }
      case 'assigned_not_covered':
        return {
          label: 'Assigned & Not Covered',
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.2)',
          color: '#92400e',
        }
      case 'unassigned_but_covered':
        return {
          label: 'Unassigned but Covered',
          background: 'rgba(220,38,38,0.08)',
          border: '1px solid rgba(220,38,38,0.18)',
          color: '#991b1b',
        }
      default:
        return {
          label: 'Not Assigned & Not Covered',
          background: '#fdf6ef',
          border: '1px solid rgba(180,101,30,0.14)',
          color: '#7a6a55',
        }
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

      <div style={card}>
        <div style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#1a1208',
              margin: '0 0 4px',
            }}>
              Room Assignment
            </h2>
            <p style={{ color: '#7a6a55', fontSize: '0.82rem', margin: 0 }}>
              Assignment coverage for the selected date.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <input
              type="date"
              value={assignmentDate}
              onChange={(e) => setAssignmentDate(e.target.value)}
              style={inputStyle}
            />
            <button
              onClick={() => setShowCopyAssignmentsModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#1e2d3d',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Copy Previous Day
            </button>
            <button
              onClick={handleOpenConsecutiveAssignmentsModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#8f4e16',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Assign Consecutive Rooms
            </button>
            <button
              onClick={handleClearAllAssignments}
              disabled={assignmentLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '9px 16px',
                backgroundColor: '#991b1b',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: assignmentLoading ? 'not-allowed' : 'pointer',
                opacity: assignmentLoading ? 0.7 : 1,
              }}
            >
              Clear All Assignments
            </button>
          </div>
        </div>

        <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {assignmentError ? (
            <div style={{
              padding: '16px 18px',
              borderRadius: '12px',
              backgroundColor: 'rgba(220,38,38,0.06)',
              border: '1px solid rgba(220,38,38,0.15)',
              color: '#991b1b',
              fontSize: '0.9rem',
            }}>
              {assignmentError}
            </div>
          ) : assignmentLoading && !assignmentData ? (
            <div style={{
              textAlign: 'center',
              padding: '32px 20px',
              color: '#7a6a55',
              fontSize: '0.95rem',
            }}>
              Loading room assignments...
            </div>
          ) : assignmentData ? (
            <>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}>
                {[
                  {
                    label: 'Not Assigned & Not Covered',
                    value: assignmentData.summary.not_assigned_not_covered,
                    color: '#7a6a55',
                    bg: '#fdf6ef',
                  },
                  {
                    label: 'Assigned & Not Covered',
                    value: assignmentData.summary.assigned_not_covered,
                    color: '#92400e',
                    bg: 'rgba(245,158,11,0.08)',
                  },
                  {
                    label: 'Assigned & Covered',
                    value: assignmentData.summary.assigned_covered,
                    color: '#166534',
                    bg: 'rgba(22,163,74,0.08)',
                  },
                  {
                    label: 'Anomalies',
                    value: assignmentData.summary.anomalies,
                    color: '#991b1b',
                    bg: 'rgba(220,38,38,0.08)',
                  },
                ].map((item) => (
                  <div key={item.label} style={{
                    padding: '18px 20px',
                    borderRadius: '12px',
                    backgroundColor: item.bg,
                    border: '1px solid rgba(180,101,30,0.1)',
                  }}>
                    <p style={{ fontSize: '0.76rem', color: '#7a6a55', fontWeight: '600', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: '2rem', fontWeight: '700', color: item.color, margin: 0, lineHeight: 1 }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignmentData.floors.map((floorItem) => {
                  const key = `${floorItem.block}|${floorItem.floor}`
                  const isExpanded = !!expandedFloors[key]

                  return (
                    <div key={key} style={{
                      border: '1px solid rgba(180,101,30,0.12)',
                      borderRadius: '14px',
                      overflow: 'hidden',
                      backgroundColor: '#fffcf7',
                    }}>
                      <div
                        style={{
                          width: '100%',
                          padding: '16px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleFloor(floorItem.block, floorItem.floor)}
                          style={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textAlign: 'left',
                            padding: 0,
                            flex: '1 1 220px',
                          }}
                        >
                          {isExpanded ? <ChevronDown size={18} color="#B4651E" /> : <ChevronRight size={18} color="#B4651E" />}
                          <div>
                            <p style={{ fontWeight: '700', color: '#1a1208', margin: '0 0 4px', fontSize: '0.95rem' }}>
                              {floorItem.block} Floor {floorItem.floor}
                            </p>
                            <p style={{ color: '#7a6a55', margin: 0, fontSize: '0.8rem' }}>
                              {floorItem.counts.total_rooms} rooms
                            </p>
                          </div>
                        </button>

                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            type="button"
                            onClick={() => handleClearFloorAssignments(floorItem.block, floorItem.floor)}
                            disabled={assignmentLoading}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '999px',
                              backgroundColor: '#fff',
                              border: '1px solid rgba(220,38,38,0.18)',
                              color: '#991b1b',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              cursor: assignmentLoading ? 'not-allowed' : 'pointer',
                              opacity: assignmentLoading ? 0.7 : 1,
                            }}
                          >
                            Clear Floor
                          </button>
                          {[
                            { label: 'Open', value: floorItem.counts.not_assigned_not_covered, color: '#7a6a55' },
                            { label: 'Assigned', value: floorItem.counts.assigned_not_covered, color: '#92400e' },
                            { label: 'Covered', value: floorItem.counts.assigned_covered, color: '#166534' },
                            { label: 'Anomaly', value: floorItem.counts.unassigned_but_covered, color: '#991b1b' },
                          ].map((pill) => (
                            <span key={pill.label} style={{
                              padding: '4px 10px',
                              borderRadius: '999px',
                              backgroundColor: '#fff',
                              border: '1px solid rgba(180,101,30,0.12)',
                              color: pill.color,
                              fontSize: '0.75rem',
                              fontWeight: '600',
                            }}>
                              {pill.label}: {pill.value}
                            </span>
                          ))}
                        </div>
                      </div>

                      {isExpanded && (
                        <div style={{
                          borderTop: '1px solid rgba(180,101,30,0.1)',
                          display: 'flex',
                          flexDirection: 'column',
                        }}>
                          {floorItem.rooms.map((room) => {
                            const meta = getRoomStatusMeta(room)

                            return (
                              <button
                                type="button"
                                key={`${room.block}|${room.floor}|${room.room_number}`}
                                onClick={() => setSelectedAssignmentRoom(room)}
                                style={{
                                  padding: '14px 18px',
                                  borderTop: '1px solid rgba(180,101,30,0.06)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '12px',
                                  flexWrap: 'wrap',
                                  width: '100%',
                                  backgroundColor: 'transparent',
                                  borderLeft: 'none',
                                  borderRight: 'none',
                                  borderBottom: 'none',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                }}
                              >
                                <div>
                                  <p style={{ fontWeight: '700', color: '#1a1208', margin: '0 0 4px', fontSize: '0.92rem' }}>
                                    {room.room_number}
                                  </p>
                                  <p style={{ color: '#7a6a55', margin: 0, fontSize: '0.8rem' }}>
                                    {room.assignment
                                      ? `Marshal: ${room.assignment.marshal_name || room.assignment.marshal_id}`
                                      : 'Unassigned'}
                                    {room.inspection?.marshal_name || room.inspection?.marshal_id
                                      ? ` • Covered by ${room.inspection.marshal_name || room.inspection.marshal_id}`
                                      : ''}
                                  </p>
                                </div>

                                <span style={{
                                  padding: '6px 10px',
                                  borderRadius: '999px',
                                  backgroundColor: meta.background,
                                  border: meta.border,
                                  color: meta.color,
                                  fontSize: '0.76rem',
                                  fontWeight: '700',
                                }}>
                                  {meta.label}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              <div style={{
                border: '1px solid rgba(220,38,38,0.14)',
                borderRadius: '14px',
                backgroundColor: 'rgba(220,38,38,0.04)',
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid rgba(220,38,38,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}>
                  <div>
                    <p style={{ fontWeight: '700', color: '#991b1b', margin: '0 0 4px', fontSize: '0.95rem' }}>
                      Unassigned but Covered
                    </p>
                    <p style={{ color: '#7a6a55', margin: 0, fontSize: '0.8rem' }}>
                      Rooms covered without an explicit assignment row.
                    </p>
                  </div>
                  <span style={{
                    padding: '4px 10px',
                    borderRadius: '999px',
                    backgroundColor: '#fff',
                    border: '1px solid rgba(220,38,38,0.14)',
                    color: '#991b1b',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                  }}>
                    {assignmentData.anomalies.unassigned_but_covered.length}
                  </span>
                </div>

                {assignmentData.anomalies.unassigned_but_covered.length === 0 ? (
                  <div style={{ padding: '18px', color: '#7a6a55', fontSize: '0.85rem' }}>
                    No anomalies for this date.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {assignmentData.anomalies.unassigned_but_covered.map((room) => (
                      <div
                        key={`anomaly-${room.block}|${room.floor}|${room.room_number}`}
                        style={{
                          padding: '14px 18px',
                          borderTop: '1px solid rgba(220,38,38,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <p style={{ fontWeight: '700', color: '#1a1208', margin: '0 0 4px', fontSize: '0.92rem' }}>
                            {room.block} Floor {room.floor} • {room.room_number}
                          </p>
                          <p style={{ color: '#7a6a55', margin: 0, fontSize: '0.8rem' }}>
                            Covered by {room.inspection?.marshal_name || room.inspection?.marshal_id || 'Unknown'}
                          </p>
                        </div>
                        <span style={{
                          padding: '6px 10px',
                          borderRadius: '999px',
                          backgroundColor: 'rgba(220,38,38,0.08)',
                          border: '1px solid rgba(220,38,38,0.18)',
                          color: '#991b1b',
                          fontSize: '0.76rem',
                          fontWeight: '700',
                        }}>
                          Review Needed
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '32px 20px',
              color: '#7a6a55',
              fontSize: '0.95rem',
            }}>
              No room assignment data available.
            </div>
          )}
        </div>
      </div>

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

      <RoomAssignmentModal
        open={!!selectedAssignmentRoom}
        date={assignmentDate}
        room={selectedAssignmentRoom}
        onClose={() => setSelectedAssignmentRoom(null)}
        onSuccess={handleAssignmentRoomSuccess}
      />

      <CopyAssignmentsModal
        open={showCopyAssignmentsModal}
        targetDate={assignmentDate}
        onClose={() => setShowCopyAssignmentsModal(false)}
        onSuccess={handleCopyAssignmentsSuccess}
      />

      <ConsecutiveAssignmentModal
        open={showConsecutiveAssignmentsModal}
        targetDate={assignmentDate}
        onClose={handleCloseConsecutiveAssignmentsModal}
        onSuccess={handleConsecutiveAssignmentsSuccess}
      />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
