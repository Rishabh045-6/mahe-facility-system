import { NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  buildDashboardState,
  ensureValidDateString,
  requireAdminUser,
} from '@/lib/assignments/service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = ensureValidDateString(searchParams.get('date'))

    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    const state = await buildDashboardState(adminSupabase, date)
    return NextResponse.json(state)
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Assignment dashboard error:', error)
    return NextResponse.json(
      { error: 'Failed to load assignment dashboard state' },
      { status: 500 }
    )
  }
}
