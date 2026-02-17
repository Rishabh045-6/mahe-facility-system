import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    
    const supabase = await createClient()
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]
    
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
    const { data: problematicRaw } = await supabase
      .from('issues')
      .select('block, floor, room_location')
      .gte('reported_at', `${startDateStr}T00:00:00`)
      .lte('reported_at', `${endDateStr}T23:59:59`)

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
      .gte('reported_at', `${startDateStr}T00:00:00`)
      .lte('reported_at', `${endDateStr}T23:59:59`)

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
    
    return NextResponse.json({
      success: true,
      data: {
        topIssues,
        problematicLocations,
        blockComparison,
        marshalActivity,
        trend,
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