import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface RoomIssuePayload {
  issue_type: string
  description: string
  is_movable?: boolean
}

interface RoomInspectionPayload {
  room: string
  features: Record<string, string>
  hasIssues: boolean | null
  issues: RoomIssuePayload[]
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      block,
      floor,
      issues,
      checklist_responses: checklistResponses,
      marshal_id: marshalId,
      marshal_name: marshalName,
      room_inspections: roomInspections,
    } = body

    if (!block || !floor || !marshalId || !marshalName) {
      return NextResponse.json(
        { error: 'Missing required fields: block, floor, marshalId, marshalName' },
        { status: 400 }
      )
    }

    const hasIssues = body.has_issues ?? body.hasIssues ?? true
    const parsedRoomInspections: RoomInspectionPayload[] = Array.isArray(roomInspections) ? roomInspections : []

    const supabase = await createClient()

    await supabase.rpc('upsert_marshal_registry', {
      p_marshal_id: marshalId,
      p_marshal_name: marshalName,
    })

    const today = new Date().toISOString().split('T')[0]

    const roomInspectionRecords = parsedRoomInspections.map((room) => ({
      date: today,
      block,
      floor,
      room_number: room.room,
      feature_data: room.features || {},
      has_issues: room.hasIssues === true,
      marshal_id: marshalId,
      marshal_name: marshalName,
    }))

    const insertedRoomInspections = roomInspectionRecords.length > 0
      ? await supabase
          .from('room_inspections')
          .upsert(roomInspectionRecords, { onConflict: 'date,block,floor,room_number,marshal_id' })
          .select('id, room_number')
      : { data: [], error: null }

    if (insertedRoomInspections.error) {
      return NextResponse.json(
        { error: 'Failed to save room inspection data', details: insertedRoomInspections.error.message },
        { status: 500 }
      )
    }

    const roomIdMap = new Map((insertedRoomInspections.data || []).map((r: { id: string, room_number: string }) => [r.room_number, r.id]))

    const issuesFromRooms = parsedRoomInspections.flatMap((room) => (
      room.hasIssues
        ? room.issues.map((issue) => ({
            issue_type: issue.issue_type,
            description: issue.description,
            is_movable: issue.is_movable || false,
            room_location: `Room ${room.room}`,
            room_number: room.room,
            room_inspection_id: roomIdMap.get(room.room) || null,
          }))
        : []
    ))

    const fallbackIssues = Array.isArray(issues) ? issues : []
    const issueSource = issuesFromRooms.length > 0 ? issuesFromRooms : fallbackIssues

    if (hasIssues && issueSource.length === 0) {
      return NextResponse.json(
        { error: 'At least one issue is required' },
        { status: 400 }
      )
    }

    const issueRecords = issueSource.map((issue: {
      room_location?: string
      issue_type: string
      description: string
      is_movable?: boolean
      images?: string[]
      room_number?: string
      room_inspection_id?: string | null
    }) => ({
      block,
      floor,
      room_location: issue.room_location || null,
      issue_type: issue.issue_type,
      description: issue.description,
      is_movable: issue.is_movable || false,
      images: issue.images || [],
      marshal_id: marshalId,
      marshal_name: marshalName,
      status: 'approved',
      room_number: issue.room_number || null,
      room_inspection_id: issue.room_inspection_id || null,
    }))

    let insertedIssues: Array<{ issue_type: string }> = []
    if (issueRecords.length > 0) {
      const { data, error } = await supabase
        .from('issues')
        .insert(issueRecords)
        .select('issue_type')

      if (error) {
        return NextResponse.json(
          { error: 'Failed to submit issues', details: error.message },
          { status: 500 }
        )
      }

      insertedIssues = data || []
    }

    await supabase
      .from('floor_coverage')
      .upsert(
        { date: today, block, floor, marshal_id: marshalId, marshal_name: marshalName },
        { onConflict: 'date,block,floor' }
      )

    if (checklistResponses && typeof checklistResponses === 'object') {
      const checklistRecords = Object.entries(checklistResponses).map(([itemId, response]) => ({
        marshal_id: marshalId,
        marshal_name: marshalName,
        block,
        floor,
        checklist_item_id: itemId,
        response: response as boolean,
        date: today,
      }))

      if (checklistRecords.length > 0) {
        await supabase
          .from('checklist_responses')
          .upsert(checklistRecords, { onConflict: 'marshal_id,block,floor,checklist_item_id,date' })
      }
    }

    for (const issue of insertedIssues) {
      await supabase.rpc('update_analytics', {
        p_date: today,
        p_block: block,
        p_issue_type: issue.issue_type,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${insertedIssues.length} issue(s) submitted successfully`,
      data: insertedIssues,
      rooms_saved: insertedRoomInspections.data?.length || 0,
    })
  } catch (error: unknown) {
    const details = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Internal server error', details },
      { status: 500 }
    )
  }
}
