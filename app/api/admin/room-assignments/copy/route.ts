import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  executeCopyAssignments,
  requireAdminUser,
} from '@/lib/assignments/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    const admin = await requireAdminUser(authSupabase)

    const result = await executeCopyAssignments(adminSupabase, admin.email, body)
    return NextResponse.json(result)
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Copy execute error:', error)
    return NextResponse.json(
      { error: 'Failed to copy assignments' },
      { status: 500 }
    )
  }
}
