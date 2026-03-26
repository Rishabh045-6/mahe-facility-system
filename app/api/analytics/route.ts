import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CHECKLIST_ITEMS } from '@/lib/utils/constants'
import { getTodayDateString } from '@/lib/utils/time'

type AnalyticsRange = 'today' | 'week' | 'month'

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

const getAnalyticsRangeBounds = (range?: AnalyticsRange, days?: number) => {
  const today = getTodayDateString()

  if (range === 'today') {
    return { startDateStr: today, endDateStr: today }
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
    const weekEnd = new Date(Date.UTC(year, month - 1, day - offsetToMonday + 6, 0, 0, 0))

    return {
      startDateStr: weekStart.toISOString().slice(0, 10),
      endDateStr: weekEnd.toISOString().slice(0, 10),
    }
  }

  if (range === 'month') {
    return {
      startDateStr: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0)).toISOString().slice(0, 10),
      endDateStr: new Date(Date.UTC(year, month, 0, 0, 0, 0)).toISOString().slice(0, 10),
    }
  }

  const safeDays = Number.isFinite(days) ? Math.max(days ?? 30, 0) : 30
  const endDate = new Date(`${today}T00:00:00+05:30`)
  const startDate = new Date(endDate)
  startDate.setDate(startDate.getDate() - safeDays)

  return {
    startDateStr: startDate.toISOString().slice(0, 10),
    endDateStr: today,
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const rangeParam = searchParams.get('range')
    const range: AnalyticsRange | undefined =
      rangeParam === 'today' || rangeParam === 'week' || rangeParam === 'month' ? rangeParam : undefined
    
    const supabase = await createClient()
    const today = getTodayDateString()
    const { startDateStr, endDateStr } = getAnalyticsRangeBounds(range, days)
    
    // Get top issues
    const { data: topIssuesRaw } = await supabase
      .from('analytics')
      .select('issue_type, count')
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    const issueTypeTotals: Record<string, number> = {}
    for (const row of topIssuesRaw || []) {
      issueTypeTotals[row.issue_type] = (issueTypeTotals[row.issue_type] || 0) + row.count
    }
    const topIssues = Object.entries(issueTypeTotals)
      .map(([issue_type, total]) => ({ issue_type, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10)
    
    // Get problematic locations
    const start = new Date(`${startDateStr}T00:00:00+05:30`).toISOString()
    const endDateIssues = new Date(`${endDateStr}T00:00:00+05:30`)
    endDateIssues.setDate(endDateIssues.getDate() + 1)

    const { data: problematicRaw } = await supabase
      .from('issues')
      .select('block, floor, room_location')
      .gte('reported_at', start)
      .lt('reported_at', endDateIssues.toISOString())

    const locationMap: Record<string, { block: string; floor: string; room_location: string; count: number }> = {}
    for (const row of problematicRaw || []) {
      const key = `${row.block}-${row.floor}-${row.room_location || ''}`
      if (!locationMap[key]) {
        locationMap[key] = { block: row.block, floor: row.floor, room_location: row.room_location || '', count: 0 }
      }
      locationMap[key].count++
    }
    const problematicLocations = Object.values(locationMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
    
    // Get block comparison
    const { data: blockComparison } = await supabase
      .from('analytics')
      .select('date, block, count')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date')
    
    // Get marshal activity
    const { data: marshalActivityRaw } = await supabase
      .from('issues')
      .select('marshal_id, marshal_name')
      .gte('reported_at', start)
      .lt('reported_at', endDateIssues.toISOString())

    const marshalCounts: Record<string, { name: string; count: number }> = {}
    for (const row of marshalActivityRaw || []) {
      if (!marshalCounts[row.marshal_id]) {
        marshalCounts[row.marshal_id] = { name: row.marshal_name || row.marshal_id, count: 0 }
      }
      marshalCounts[row.marshal_id].count++
    }
    const marshalActivity = Object.entries(marshalCounts)
      .map(([marshal_id, { name, count }]) => ({ marshal_id, name, count }))
      .sort((a, b) => b.count - a.count)
    
    // Get trend over time
    const { data: trendRaw } = await supabase
      .from('analytics')
      .select('date, count')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date')

    const trendMap: Record<string, number> = {}
    for (const row of trendRaw || []) {
      trendMap[row.date] = (trendMap[row.date] || 0) + row.count
    }
    const trend = Object.entries(trendMap)
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const checklistLookup = Object.fromEntries(
      CHECKLIST_ITEMS.map(item => [
        String(item.id),
        {
          label: item.text,
          category: item.category,
        },
      ])
    )

    const { data: checklistRows } = await supabase
      .from('checklist_responses')
      .select('marshal_id, marshal_name, date, block, floor, checklist_item_id')
      .eq('response', false)
      .eq('date', today)
      .order('date', { ascending: false })

    const checklistExceptionMap: Record<string, {
      marshal_id: string
      marshal_name: string
      date: string
      block: string
      floor: string
      items: Array<{
        checklist_item_id: string
        label: string
        category: string
      }>
    }> = {}

    for (const row of checklistRows || []) {
      const itemId = String(row.checklist_item_id ?? '')
      if (!itemId) continue

      const meta = checklistLookup[itemId] || {
        label: `Checklist Item ${itemId}`,
        category: 'Unknown',
      }

      const key = `${row.marshal_id}|${row.date}|${row.block}|${row.floor}`
      if (!checklistExceptionMap[key]) {
        checklistExceptionMap[key] = {
          marshal_id: row.marshal_id,
          marshal_name: row.marshal_name || row.marshal_id,
          date: row.date,
          block: row.block,
          floor: row.floor,
          items: [],
        }
      }

      checklistExceptionMap[key].items.push({
        checklist_item_id: itemId,
        label: meta.label,
        category: meta.category,
      })
    }

    const checklist_exceptions = Object.values(checklistExceptionMap)
      .map(entry => ({
        ...entry,
        items: entry.items.sort((a, b) => a.checklist_item_id.localeCompare(b.checklist_item_id, undefined, { numeric: true })),
      }))
      .sort((a, b) => {
        if (a.marshal_name !== b.marshal_name) return a.marshal_name.localeCompare(b.marshal_name)
        if (a.date !== b.date) return b.date.localeCompare(a.date)
        if (a.block !== b.block) return a.block.localeCompare(b.block)
        return a.floor.localeCompare(b.floor, undefined, { numeric: true })
      })
    
    return NextResponse.json({
      success: true,
      data: {
        topIssues,
        problematicLocations,
        blockComparison,
        marshalActivity,
        trend,
        checklist_exceptions,
        period: { start: startDateStr, end: endDateStr },
      },
    })
    
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
