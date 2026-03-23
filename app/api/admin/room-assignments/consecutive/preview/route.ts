import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  previewConsecutiveAssignments,
  requireAdminUser,
} from '@/lib/assignments/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    const preview = await previewConsecutiveAssignments(adminSupabase, body)
    return NextResponse.json(preview)
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Consecutive preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview consecutive room assignment' },
      { status: 500 }
    )
  }
}
