'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase/client'
import IssueCard from '../dashboard/components/IssueCard'
import { getTodayDateString } from '@/lib/utils/time'

type TimeRange = 'today' | 'week' | 'month'

type Issue = {
  id: string
  block: string
  floor: string
  room_location?: string
  issue_type: string
  description: string
  is_movable: boolean
  images?: string[]
  marshal_id: string
  status: 'approved' | 'denied' | 'pending'
  reported_at: string
  marshals?: { name: string }
}

const RANGE_OPTIONS: Array<{ key: TimeRange; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

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

const getDateRange = (range: TimeRange) => {
  const today = getTodayDateString()

  if (range === 'today') {
    const todayStart = new Date(`${today}T00:00:00+05:30`)
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    return {
      start: todayStart.toISOString(),
      end: tomorrowStart.toISOString(),
      emptyLabel: 'No issues found for this type today.',
    }
  }

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
    const weekEnd = new Date(Date.UTC(year, month - 1, day - offsetToMonday + 7, 0, 0, 0))

    return {
      start: new Date(`${weekStart.toISOString().slice(0, 10)}T00:00:00+05:30`).toISOString(),
      end: new Date(`${weekEnd.toISOString().slice(0, 10)}T00:00:00+05:30`).toISOString(),
      emptyLabel: 'No issues found for this type this week.',
    }
  }

  const monthStart = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0))
  const nextMonthStart = new Date(Date.UTC(year, month, 1, 0, 0, 0))

  return {
    start: new Date(`${monthStart.toISOString().slice(0, 10)}T00:00:00+05:30`).toISOString(),
    end: new Date(`${nextMonthStart.toISOString().slice(0, 10)}T00:00:00+05:30`).toISOString(),
    emptyLabel: 'No issues found for this type this month.',
  }
}

export default function AdminIssuesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const issueType = searchParams.get('issue_type')
  const rangeParam = searchParams.get('range')
  const selectedRange: TimeRange =
    rangeParam === 'week' || rangeParam === 'month' || rangeParam === 'today' ? rangeParam : 'today'

  const [loading, setLoading] = useState(true)
  const [issues, setIssues] = useState<Issue[]>([])

  const rangeConfig = useMemo(() => getDateRange(selectedRange), [selectedRange])

  const updateRange = (nextRange: TimeRange) => {
    const nextParams = new URLSearchParams(searchParams.toString())
    nextParams.set('range', nextRange)
    router.replace(`/admin/issues?${nextParams.toString()}`)
  }

  const fetchIssues = useCallback(async () => {
    if (!issueType) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('issues')
        .select('*')
        .eq('issue_type', issueType)
        .gte('reported_at', rangeConfig.start)
        .lt('reported_at', rangeConfig.end)
        .order('reported_at', { ascending: false })

      if (error) throw error
      setIssues((data ?? []) as Issue[])
    } catch (error) {
      console.error('Error fetching issues:', error)
      toast.error('Failed to load issues')
    } finally {
      setLoading(false)
    }
  }, [issueType, rangeConfig.end, rangeConfig.start])

  const handleStatusToggle = async (issueId: string, newStatus: 'approved' | 'denied') => {
    try {
      const { error } = await supabase
        .from('issues')
        .update({ status: newStatus })
        .eq('id', issueId)

      if (error) throw error

      setIssues((prev) => prev.map((issue) => (
        issue.id === issueId ? { ...issue, status: newStatus } : issue
      )))
      toast.success(`Issue ${newStatus}`)
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  useEffect(() => {
    void fetchIssues()
  }, [fetchIssues])

  if (!issueType) {
    return (
      <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
        <p>No issue type specified.</p>
        <button
          onClick={() => router.push('/admin/dashboard')}
          style={{ marginTop: '10px', padding: '8px 16px', backgroundColor: '#B4651E', color: 'white', border: 'none', borderRadius: '8px' }}
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', fontFamily: "'DM Sans', sans-serif" }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => router.push('/admin/dashboard')}
          style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#1a1208', margin: 0 }}>
          Issues: {issueType}
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
        {RANGE_OPTIONS.map((option) => {
          const active = selectedRange === option.key
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => updateRange(option.key)}
              style={{
                padding: '8px 16px',
                borderRadius: '999px',
                border: active ? '1.5px solid #B4651E' : '1.5px solid rgba(180,101,30,0.15)',
                backgroundColor: active ? '#fdf6ef' : 'white',
                color: active ? '#B4651E' : '#7a6a55',
                fontSize: '0.9rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : issues.length === 0 ? (
        <p>{rangeConfig.emptyLabel}</p>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onStatusChange={handleStatusToggle} />
          ))}
        </div>
      )}
    </div>
  )
}
