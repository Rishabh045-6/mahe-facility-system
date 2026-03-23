import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  previewCopyAssignments,
  requireAdminUser,
} from '@/lib/assignments/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    const preview = await previewCopyAssignments(adminSupabase, body)
    return NextResponse.json(preview)
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Copy preview error:', error)
    return NextResponse.json(
      { error: 'Failed to preview assignment copy' },
      { status: 500 }
    )
  }
}
