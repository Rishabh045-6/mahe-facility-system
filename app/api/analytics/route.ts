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
    const { data: topIssues } = await supabase
      .from('analytics')
      .select('issue_type, sum(count) as total')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('total', { ascending: false })
      .limit(10)
    
    // Get problematic locations
    const { data: problematicLocations } = await supabase
      .from('issues')
      .select('block, floor, room_location, count(*)')
      .gte('reported_at', `${startDateStr}T00:00:00`)
      .lte('reported_at', `${endDateStr}T23:59:59`)
      .order('count', { ascending: false })
      .limit(10)
    
    // Get block comparison
    const { data: blockComparison } = await supabase
      .from('analytics')
      .select('date, block, sum(count) as total')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date')
    
    // Get marshal activity
    const { data: marshalActivity } = await supabase
      .from('issues')
      .select('marshal_id, marshals(name), count(*)')
      .gte('reported_at', `${startDateStr}T00:00:00`)
      .lte('reported_at', `${endDateStr}T23:59:59`)
      .order('count', { ascending: false })
    
    // Get trend over time
    const { data: trend } = await supabase
      .from('analytics')
      .select('date, sum(count) as total')
      .gte('date', startDateStr)
      .lte('date', endDateStr)
      .order('date')
    
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