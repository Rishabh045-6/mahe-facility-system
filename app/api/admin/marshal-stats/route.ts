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

    const nowIST = new Date(
      new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' })
    )
    const dayOfWeek = nowIST.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const weekStart = new Date(nowIST)
    weekStart.setDate(nowIST.getDate() - daysToMonday)
    const weekStartStr = getISTDateString(weekStart)

    const monthStartStr = `${todayIST.slice(0, 7)}-01`

    const { count: totalMarshals } = await supabase
      .from('marshals')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const { data: todayData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .eq('date', todayIST)

    const activeToday = new Set((todayData ?? []).map((r: any) => r.marshal_id)).size

    const { data: weekData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .gte('date', weekStartStr)
      .lte('date', todayIST)

    const activeThisWeek = new Set((weekData ?? []).map((r: any) => r.marshal_id)).size

    const { data: monthData } = await supabase
      .from('floor_coverage')
      .select('marshal_id')
      .gte('date', monthStartStr)
      .lte('date', todayIST)

    const activeThisMonth = new Set((monthData ?? []).map((r: any) => r.marshal_id)).size

    const { count: newThisWeek } = await supabase
      .from('marshals')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStartStr)

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