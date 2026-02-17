import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()

    const today      = new Date().toISOString().split('T')[0]
    const weekAgo    = new Date(Date.now() - 7  * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const monthAgo   = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const [
      { count: total },
      { count: activeToday },
      { count: activeThisWeek },
      { count: activeThisMonth },
      { count: newThisWeek },
    ] = await Promise.all([
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }),
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).eq('last_seen', today),
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('last_seen', weekAgo),
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('last_seen', monthAgo),
      supabase.from('marshal_registry').select('*', { count: 'exact', head: true }).gte('first_seen', weekAgo),
    ])

    return NextResponse.json({
      success: true,
      data: {
        total:           total          ?? 0,
        activeToday:     activeToday    ?? 0,
        activeThisWeek:  activeThisWeek ?? 0,
        activeThisMonth: activeThisMonth?? 0,
        newThisWeek:     newThisWeek    ?? 0,
      },
    })
  } catch (error: any) {
    console.error('Error fetching marshal stats:', error)
    return NextResponse.json({ error: 'Failed to fetch marshal stats' }, { status: 500 })
  }
}