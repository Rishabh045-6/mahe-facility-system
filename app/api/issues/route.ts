import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { X } from 'lucide-react'

interface RoomInspectionPayload {
  room: string
  features: Record<string, string>
  hasIssues: boolean | null
  issues: RoomIssuePayload[]
}

interface RoomIssuePayload {
  issue_type: string
  description: string
  is_movable?: boolean
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const checklistResponses = body.checklist_responses ?? body.checklistResponses ?? {}
    const { block, floor, issues, marshal_id: marshalId, marshal_name: marshalName } = body

    // Basic validation
    if (!block || !floor || !marshalId || !marshalName) {
      return NextResponse.json(
        { error: 'Missing required fields: block, floor, marshalId, marshalName' },
        { status: 400 }
      )
    }

    const hasIssues = body.has_issues ?? body.hasIssues ?? true
    const parsedRoomInspections: RoomInspectionPayload[] = Array.isArray(body.room_inspections)
      ? body.room_inspections
      : []

    const supabase = await createClient()

    // ─── 0. Register marshal ────────────────────────────────────────────────
    await supabase.rpc('upsert_marshal_registry', {
      p_marshal_id: marshalId,
      p_marshal_name: marshalName,
    })

    // ─── 1. Validate issues ─────────────────────────────────────────────────
    const hasRoomIssues = parsedRoomInspections.some(room => room.hasIssues === true && room.issues.length > 0)
    const hasGlobalIssues = Array.isArray(issues) && issues.length > 0
    const anyIssues = (hasRoomIssues || hasGlobalIssues) && hasIssues

    if (hasIssues && !hasRoomIssues && !hasGlobalIssues) {
      return NextResponse.json(
        { error: 'Please add at least one issue or mark "No issues found" for all rooms' },
        { status: 400 }
      )
    }

    // ─── 2. Insert global issues ────────────────────────────────────────────
    const issueRecords = (hasIssues && issues) ? issues.map((issue: any) => ({
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
    })) : []

    let insertedIssues: any[] = []
    if (issueRecords.length > 0) {
      const { data: inserted, error: issuesError } = await supabase
        .from('issues')
        .insert(issueRecords)
        .select()
      if (issuesError) throw issuesError
      insertedIssues = inserted || []
    }

    // ─── 3. ✅ INSERT ROOM INSPECTIONS (THIS WAS MISSING!) ──────────────────
    const toISTDate = (d: Date) =>
      new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(d) // YYYY-MM-DD

    const today = toISTDate(new Date())

    if (parsedRoomInspections.length > 0) {
      const roomInspectionRecords = parsedRoomInspections.map((room: RoomInspectionPayload) => ({
        date: today,
        block,
        floor,
        room_number: room.room,
        feature_data: room.features,  // ✅ Store features as JSONB
        has_issues: room.hasIssues === true,
        marshal_id: marshalId,
        marshal_name: marshalName,
        created_at: new Date().toISOString(),
      }))

      const { error: roomError } = await supabase
        .from('room_inspections')
        .upsert(roomInspectionRecords, {
          onConflict: 'date,block,floor,room_number'
        })

      if (roomError) {
        console.warn('[SUBMISSION] Room inspections upsert warning:', roomError.message)
        // Don't fail submission for this - non-critical
      }

      console.log('[SUBMISSION] Saved room inspections:', roomInspectionRecords.length)
    }

    // ─── 4. Record floor coverage ───────────────────────────────────────────
    // ✅ FIXED typo: submtted_at → submitted_at
    const { error: coverageError } = await supabase
      .from('floor_coverage')
      .upsert(
        {
          date: today,
          block,
          floor,
          marshal_id: marshalId,
          marshal_name: marshalName,
          submitted_at: new Date().toISOString(),  // ✅ Fixed typo
          has_issues: anyIssues,
        },
        { onConflict: 'date,block,floor' }
      )

    if (coverageError) {
      console.warn('[SUBMISSION] Floor coverage upsert warning:', coverageError.message)
    }

    // ─── 5. Save checklist responses ────────────────────────────────────────

    if (checklistResponses && typeof checklistResponses === 'object') {
      const checklistRecords = Object.entries(checklistResponses).map(([itemId, response]) => ({
        marshal_id: marshalId,
        marshal_name: marshalName,
        block,
        floor,
        checklist_item_id: String(itemId),
        response: Boolean(response),
        date: today,
      }))

      console.log('[SUBMISSION] checklistRecords:', checklistRecords.length)

      if (checklistRecords.length > 0) {
        const { error: checklistErr } = await supabase
          .from('checklist_responses')
          .upsert(checklistRecords, {
            onConflict: 'marshal_id,block,floor,checklist_item_id,date',
          })

        if (checklistErr) {
          console.error('[SUBMISSION] checklist upsert failed:', checklistErr)
          // This should be treated as important (not silent),
          // because your history depends on it.
          return NextResponse.json(
            { error: 'Failed to save checklist responses', details: checklistErr.message },
            { status: 500 }
          )
        }
      }
    }

    // ─── 6. Update analytics ────────────────────────────────────────────────
    for (const issue of insertedIssues || []) {
      await supabase.rpc('update_analytics', {
        p_date: today,
        p_block: block,
        p_issue_type: issue.issue_type,
      })
    }

    return NextResponse.json({
      success: true,
      message: `${insertedIssues?.length || 0} issue(s) submitted successfully`,
      data: insertedIssues,
    })

  } catch (error: any) {
    console.error('Error in issues POST:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}