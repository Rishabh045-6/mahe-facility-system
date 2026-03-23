import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import {
  AssignmentApiError,
  ensureMarshalExists,
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
    const admin = await requireAdminUser(authSupabase)
    const marshal = await ensureMarshalExists(adminSupabase, body.marshal_id)

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

    const now = new Date().toISOString()
    const { data, error } = await adminSupabase
      .from('room_assignments')
      .update({
        marshal_id: marshal.marshal_id,
        marshal_name: marshal.marshal_name,
        assigned_at: now,
        assigned_by: admin.email,
        updated_at: now,
      })
      .eq('id', existingRow.id)
      .select()
      .single()

    if (error) {
      throw new AssignmentApiError(500, `Failed to reassign room: ${error.message}`)
    }

    return NextResponse.json({
      success: true,
      assignment: data,
    })
  } catch (error) {
    if (error instanceof AssignmentApiError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }

    console.error('Reassign room error:', error)
    return NextResponse.json(
      { error: 'Failed to reassign room' },
      { status: 500 }
    )
  }
}
