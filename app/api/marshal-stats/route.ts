import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const startOfTodayIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
    startOfTodayIST.setHours(0, 0, 0, 0)

    const weekAgoIST = new Date(startOfTodayIST)
    weekAgoIST.setDate(weekAgoIST.getDate() - 7)

    const monthAgoIST = new Date(startOfTodayIST)
    monthAgoIST.setDate(monthAgoIST.getDate() - 30)
    const [
      { count: total },
      { count: activeToday },
      { count: activeThisWeek },
      { count: activeThisMonth },
      { count: newThisWeek },
    ] = await Promise.all([
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }),

      // activeToday: last_active >= start of today (IST)
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('last_active', startOfTodayIST.toISOString()),

      // activeThisWeek
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('last_active', weekAgoIST.toISOString()),

      supabase.from('marshal_registry')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgoIST.toISOString()),

      // activeThisMonth
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('last_active', monthAgoIST.toISOString()),
    ])



    return NextResponse.json({
      success: true,
      data: {
        total: total ?? 0,
        activeToday: activeToday ?? 0,
        activeThisWeek: activeThisWeek ?? 0,
        activeThisMonth: activeThisMonth ?? 0,
        newThisWeek: newThisWeek ?? 0,
      },
      headers: { 'Cache-Control': 'no-store' }
    })
  }
  catch (error: any) {
    console.error('Error fetching marshal stats:', error)
    return NextResponse.json({ error: 'Failed to fetch marshal stats' }, { status: 500 })
  }
}