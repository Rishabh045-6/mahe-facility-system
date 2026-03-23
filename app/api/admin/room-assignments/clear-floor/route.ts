import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  clearAssignmentsForFloor,
  requireAdminUser,
} from '@/lib/assignments/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    const result = await clearAssignmentsForFloor(adminSupabase, body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Clear floor assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to clear floor assignments' },
      { status: 500 }
    )
  }
}
