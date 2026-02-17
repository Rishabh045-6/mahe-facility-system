// NEW FILE: app/api/cron/archive-marshal-counts/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { updateDailyMarshalCount } from '@/lib/analytics/marshal-counter'

// Archives yesterday's marshal count at 12:30 AM IST
export async function GET(request: NextRequest) {
  try {
    // Calculate yesterday in UTC (matches your schema)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0]
    
    await updateDailyMarshalCount(yesterday)
    
    return NextResponse.json({
      success: true,
      message: `Marshal count archived for ${yesterday}`,
      date: yesterday
    })
  } catch (error) {
    console.error('Marshal count archiving failed:', error)
    return NextResponse.json(
      { error: 'Archiving failed', details: error },
      { status: 500 }
    )
  }
}