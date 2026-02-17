import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { block, floor, issues, checklist_responses: checklistResponses, marshal_id: marshalId, marshal_name: marshalName } = body

    // Basic validation
    if (!block || !floor || !marshalId || !marshalName) {
      return NextResponse.json(
        { error: 'Missing required fields: block, floor, marshalId, marshalName' },
        { status: 400 }
      )
    }

    const hasIssues = body.has_issues ?? body.hasIssues ?? true
    if (hasIssues && (!issues || !Array.isArray(issues) || issues.length === 0)) {
      return NextResponse.json(
        { error: 'At least one issue is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // ─── 1. Register marshal in persistent registry ─────────────────────────
    // This upserts their record (increments submission count, updates last_seen)
    await supabase.rpc('upsert_marshal_registry', {
      p_marshal_id:   marshalId,
      p_marshal_name: marshalName,
    })

    // ─── 2. Insert issues ────────────────────────────────────────────────────
    const issueRecords = (hasIssues && issues) ? issues.map((issue: any) => ({
      block,
      floor,
      room_location: issue.room_location || null,
      issue_type:    issue.issue_type,
      description:   issue.description,
      is_movable:    issue.is_movable || false,
      images:        issue.images || [],
      marshal_id:    marshalId,
      marshal_name:  marshalName,
      status:        'approved',
    })) : []

    let insertedIssues: any[] = []
    let issuesError: any = null

    if (issueRecords.length > 0) {
      const { data, error } = await supabase
        .from('issues')
        .insert(issueRecords)
        .select()
      insertedIssues = data || []
      issuesError = error
    }

    if (issuesError) {
      console.error('Issues insert error:', issuesError)
      return NextResponse.json(
        { error: 'Failed to submit issues', details: issuesError.message },
        { status: 500 }
      )
    }

    // ─── 3. Record floor coverage ────────────────────────────────────────────
    const today = new Date().toISOString().split('T')[0]

    await supabase
      .from('floor_coverage')
      .upsert(
        { date: today, block, floor, marshal_id: marshalId, marshal_name: marshalName },
        { onConflict: 'date,block,floor' }
      )

    // ─── 4. Save checklist responses ─────────────────────────────────────────
    if (checklistResponses && typeof checklistResponses === 'object') {
      const checklistRecords = Object.entries(checklistResponses).map(([itemId, response]) => ({
        marshal_id:        marshalId,
        marshal_name:      marshalName,
        block,
        floor,
        checklist_item_id: itemId,
        response:          response as boolean,
        date:              today,
      }))

      if (checklistRecords.length > 0) {
        await supabase
          .from('checklist_responses')
          .upsert(checklistRecords, { onConflict: 'marshal_id,block,floor,checklist_item_id,date' })
      }
    }

    // ─── 5. Update analytics ─────────────────────────────────────────────────
    for (const issue of insertedIssues || []) {
      await supabase.rpc('update_analytics', {
        p_date:       today,
        p_block:      block,
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