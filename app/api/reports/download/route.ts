import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ReportData, Issue, RoomInspection, FloorCoverage } from '@/lib/reports/types'

interface IssueRow {
  id: string
  block: string
  floor: string
  room_number?: string | null
  room_location?: string | null
  issue_type: string
  description: string
  is_movable: boolean
  images: string[]
  marshal_id: string
  marshal_name: string
  status: 'approved' | 'denied' | 'pending'
  reported_at: string
}

interface RoomInspectionRow {
  id: string
  date: string
  block: string
  floor: string
  room_number: string
  feature_data: Record<string, any>
  has_issues: boolean
  marshal_id: string
  marshal_name: string
  created_at: string
  updated_at: string
}

interface FloorCoverageRow {
  id: string
  date: string
  block: string
  floor: string
  marshal_id?: string
  marshal_name?: string
  submitted_at?: string
  has_issues?: boolean
}

export const runtime = 'nodejs'
export const maxDuration = 60

// FIX: Always use IST date for all queries — room_inspections.date is
// stored as IST date by the marshal portal. Using UTC date causes mismatches
// particularly in the early morning hours (12:00 AM–5:30 AM IST).
function getISTDateString(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
}

export async function POST(request: NextRequest) {
  try {
    console.log('[REPORT] Starting report generation...')

    const supabase = await createClient()
    const today = getISTDateString()

    console.log(`[REPORT] Generating report for IST date: ${today}`)

    // ── Issues ────────────────────────────────────────────────────────────
    // Issues use a timestamp column so we query with IST-aware bounds
    const start = new Date(`${today}T00:00:00+05:30`).toISOString()
    const endDate = new Date(`${today}T00:00:00+05:30`)
    endDate.setDate(endDate.getDate() + 1)

    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .gte('reported_at', start)
      .lt('reported_at', endDate.toISOString())
      .order('reported_at', { ascending: false })

    if (issuesError) {
      console.error('[REPORT] Issues fetch error:', issuesError)
      throw new Error(`Failed to fetch issues: ${issuesError.message}`)
    }

    const issuesList: IssueRow[] = (issues as unknown as IssueRow[]) || []
    console.log(`[REPORT] Issues fetched: ${issuesList.length}`)

    // ── Room Inspections ──────────────────────────────────────────────────
    // room_inspections.date is a DATE column stored as IST date string
    const { data: roomInspections, error: roomError } = await supabase
      .from('room_inspections')
      .select('*')
      .eq('date', today)
      .order('block', { ascending: true })

    if (roomError) {
      console.warn('[REPORT] Room inspections fetch warning:', roomError.message)
    }

    const roomInspectionsList: RoomInspectionRow[] =
      (roomInspections as unknown as RoomInspectionRow[]) || []
    console.log(`[REPORT] Room inspections fetched: ${roomInspectionsList.length}`)

    if (roomInspectionsList.length === 0) {
      console.warn(`[REPORT] ⚠ No room inspections found for date ${today}. Check that room_inspections.date is being set as IST date during marshal submission.`)
    } else {
      console.log('[REPORT] Sample room inspection:', JSON.stringify(roomInspectionsList[0], null, 2))
    }

    // ── Floor Coverage ────────────────────────────────────────────────────
    const { data: floorCoverage, error: coverageError } = await supabase
      .from('floor_coverage')
      .select('*')
      .eq('date', today)

    if (coverageError) {
      console.warn('[REPORT] Floor coverage fetch warning:', coverageError.message)
    }

    const floorCoverageList: FloorCoverageRow[] =
      (floorCoverage as unknown as FloorCoverageRow[]) || []
    console.log(`[REPORT] Floor coverage fetched: ${floorCoverageList.length}`)

    // ── Summary ───────────────────────────────────────────────────────────
    // FIX: blocks_covered includes blocks from BOTH issues AND room_inspections
    // Previously only pulled from issues, so it showed "None" when only rooms
    // were inspected but no issues were raised.
    const blocksFromIssues       = issuesList.map((i) => i.block)
    const blocksFromInspections  = roomInspectionsList.map((r) => r.block)
    const blocksCovered = [
      ...new Set([...blocksFromIssues, ...blocksFromInspections].filter(Boolean)),
    ] as string[]

    const summary = {
      total_issues:          issuesList.length,
      approved_issues:       issuesList.filter((i) => i.status === 'approved').length,
      denied_issues:         issuesList.filter((i) => i.status === 'denied').length,
      total_rooms_inspected: roomInspectionsList.length,
      rooms_with_issues:     roomInspectionsList.filter((r) => r.has_issues === true).length,
      blocks_covered:        blocksCovered,
    }

    console.log('[REPORT] Summary:', summary)

    // ── Build ReportData ──────────────────────────────────────────────────
    const reportData: ReportData = {
      date: today,
      summary,
      issues: issuesList.map((i): Issue => ({
        id:           i.id,
        block:        i.block,
        floor:        i.floor,
        room_number:  i.room_number,
        room_location:i.room_location,
        issue_type:   i.issue_type,
        description:  i.description,
        is_movable:   i.is_movable,
        images:       i.images || [],
        marshal_id:   i.marshal_id,
        marshal_name: i.marshal_name,
        status:       i.status,
        reported_at:  i.reported_at,
      })),
      room_inspections: roomInspectionsList.map((r): RoomInspection => ({
        id:           r.id,
        date:         r.date,
        block:        r.block,
        floor:        r.floor,
        room_number:  r.room_number,
        feature_data: r.feature_data || {},
        has_issues:   r.has_issues,
        marshal_id:   r.marshal_id,
        marshal_name: r.marshal_name,
        created_at:   r.created_at,
      })),
      floor_coverage: floorCoverageList.map((fc): FloorCoverage => ({
        id:           fc.id,
        date:         fc.date,
        block:        fc.block,
        floor:        fc.floor,
        marshal_id:   fc.marshal_id,
        marshal_name: fc.marshal_name,
        submitted_at: fc.submitted_at,
      })),
    }

    // ── Generate ──────────────────────────────────────────────────────────
    const { generatePDF }   = await import('@/lib/reports/pdf')
    const { generateExcel } = await import('@/lib/reports/excel')

    console.log('[REPORT] Generating PDF...')
    const pdfBuffer = await generatePDF(reportData, today)

    console.log('[REPORT] Generating Excel...')
    const excelBuffer = await generateExcel(reportData, today)

    console.log('[REPORT] ✅ Reports generated successfully')
    console.log(`[REPORT] PDF size: ${pdfBuffer.length} bytes, Excel size: ${excelBuffer.length} bytes`)

    return NextResponse.json({
      success:  true,
      filename: `MAHE_Daily_Report_${today}`,
      pdf:      pdfBuffer.toString('base64'),
      excel:    excelBuffer.toString('base64'),
    })

  } catch (error: any) {
    console.error('=== REPORT GENERATION ERROR ===')
    console.error('Message:', error?.message)
    console.error('Stack:',   error?.stack)
    console.error('Name:',    error?.name)
    console.error('================================')

    return NextResponse.json(
      {
        error:   'Report generation failed',
        message: error?.message ?? 'Unknown error',
        name:    error?.name,
      },
      { status: 500 }
    )
  }
}