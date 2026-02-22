// app/api/admin/marshal-stats/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function getISTDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(date)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const todayIST = getISTDateString()

    // Week start (Monday) in IST
    const nowIST = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    )
    const dayOfWeek = nowIST.getDay() // 0=Sun, 1=Mon, ...
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(nowIST)
    weekStart.setDate(nowIST.getDate() - daysToMonday)
    const weekStartStr = getISTDateString(weekStart)

    // Month start in IST
    const monthStartStr = `${todayIST.slice(0, 7)}-01`

    // ----------------------------
    // Total registered marshals
    // ----------------------------
    const { count: totalMarshals } = await supabase
      .from('marshals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // ----------------------------
    // Active today — unique marshals who submitted floor coverage today
    // ----------------------------
    const { data: todayData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .eq('date', todayIST)

    const activeToday = new Set((todayData ?? []).map((r: any) => r.marshal_id)).size

    // ----------------------------
    // Active this week
    // ----------------------------
    const { data: weekData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .gte('date', weekStartStr)
      .lte('date', todayIST)

    const activeThisWeek = new Set((weekData ?? []).map((r: any) => r.marshal_id)).size

    // ----------------------------
    // Active this month
    // ----------------------------
    const { data: monthData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .gte('date', monthStartStr)
      .lte('date', todayIST)

    const activeThisMonth = new Set((monthData ?? []).map((r: any) => r.marshal_id)).size

    // ----------------------------
    // New marshals registered this week (in marshals table)
    // ----------------------------
    const { count: newThisWeek } = await supabase
      .from('marshals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)

    // ----------------------------
    // Total submissions today (floor coverage rows today)
    // ----------------------------
    const { count: submissionsToday } = await supabase
      .from('floor_coverage')
      .select('*', { count: 'exact', head: true })
      .eq('date', todayIST)

    const stats = {
      totalMarshals: totalMarshals ?? 0,
      activeToday,
      activeThisWeek,
      activeThisMonth,
      newThisWeek: newThisWeek ?? 0,
      submissionsToday: submissionsToday ?? 0,
      generatedAt: new Date().toISOString(),
    }

    return NextResponse.json(stats, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })

  } catch (err) {
    console.error('Marshal stats error:', err)
    return NextResponse.json(
      { error: 'Failed to fetch marshal stats' },
      { status: 500 }
    )
  }
}