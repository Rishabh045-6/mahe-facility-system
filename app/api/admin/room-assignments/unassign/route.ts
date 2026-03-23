import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  ensureRoomNotCovered,
  ensureValidDateString,
  normalizeLocationInput,
  requireAdminUser,
} from '@/lib/assignments/service'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const date = ensureValidDateString(body.date)
    const { block, floor, room_number } = normalizeLocationInput(body)

    const authSupabase = await createClient()
    const adminSupabase = createAdminClient()
    await requireAdminUser(authSupabase)

    await ensureRoomNotCovered(adminSupabase, date, block, floor, room_number)

    const { data: existingRow, error: fetchError } = await adminSupabase
      .from('room_assignments')
      .select('*')
      .eq('date', date)
      .eq('block', block)
      .eq('floor', floor)
      .eq('room_number', room_number)
      .single()

    if (fetchError || !existingRow) {
      throw new AssignmentApiError(404, 'No assignment found for the selected room')
    }

    const { error } = await adminSupabase
      .from('room_assignments')
      .delete()
      .eq('id', existingRow.id)

    if (error) {
      throw new AssignmentApiError(500, `Failed to unassign room: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      removed_assignment: existingRow,
    })
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Unassign room error:', error)
    return NextResponse.json(
      { error: 'Failed to unassign room' },
      { status: 500 }
    )
  }
}
