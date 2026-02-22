import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ✅ Import types from report generators
import type { ReportData, Issue, RoomInspection, FloorCoverage } from '@/lib/reports/types'

// ✅ Local interfaces for Supabase rows (match your DB schema)
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
  block: string
  floor: string
  room_number: string
  feature_data: Record<string, any>
  has_issues: boolean
  marshal_id: string
  marshal_name: string
  created_at: string
}

interface FloorCoverageRow {
  id: string
  date: string
  block: string
  floor: string
  marshal_id?: string
  marshal_name?: string
  submitted_at?: string
}

export const runtime = 'nodejs'
export const maxDuration = 60


export async function POST(request: NextRequest) {
  try {
    console.log('[REPORT] Starting report generation...')

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // ✅ FIX: Correct destructure (data + error)
    const { data: issues, error: issuesError } = await supabase
      .from('issues')
      .select('*')
      .gte('reported_at', `${today}T00:00:00`)
      .lte('reported_at', `${today}T23:59:59`)
      .order('reported_at', { ascending: false })

    // ✅ Safe cast
    const issuesList: IssueRow[] = (issues as unknown as IssueRow[]) || []

    if (issuesError) {
      console.error('[REPORT] Issues fetch error:', issuesError)
      throw new Error(`Failed to fetch issues: ${issuesError.message}`)
    }

    // Fetch room inspections for today
    const { data: roomInspections, error: roomError } = await supabase
      .from('room_inspections')
      .select('*')
      .eq('date', today)

    console.log('=== ROOM INSPECTIONS DEBUG ===')
    console.log('Fetched count:', roomInspections?.length || 0)
    console.log('First record:', roomInspections?.[0])
    console.log('Error:', roomError)
    console.log('============================')

    const roomInspectionsList: RoomInspectionRow[] = (roomInspections as RoomInspectionRow[]) || []

    if (roomError) {
      console.warn('[REPORT] Room inspections fetch warning:', roomError.message)
    }

    // Fetch floor coverage for today
    const { data: floorCoverage, error: coverageError } = await supabase
      .from('floor_coverage')
      .select('*')
      .eq('date', today)

    const floorCoverageList: FloorCoverageRow[] =
      (floorCoverage as unknown as FloorCoverageRow[]) || []

    if (coverageError) {
      console.warn('[REPORT] Floor coverage fetch warning:', coverageError.message)
    }

    console.log('[REPORT] Floor coverage data:', floorCoverageList)

    console.log('[REPORT] Fetched data:', {
      issuesCount: issuesList.length,
      roomInspectionsCount: roomInspectionsList.length,
      floorCoverageCount: floorCoverageList.length,
    })

    // Build summary with explicit null-safe access
    const summary = {
      total_issues: issuesList.length,
      approved_issues: issuesList.filter((i) => i.status === 'approved').length,
      denied_issues: issuesList.filter((i) => i.status === 'denied').length,
      total_rooms_inspected: roomInspectionsList.length,
      rooms_with_issues: roomInspectionsList.filter((r) => r.has_issues === true).length,
      blocks_covered: [...new Set(
        issuesList
          .map((i) => i.block)
          .filter((b) => b && typeof b === 'string')
      )] as string[],
    }

    console.log('[REPORT] Summary:', summary)

    // ✅ Transform DB rows to ReportData format (match pdf.ts/excel.ts interfaces)
    const reportData: ReportData = {
      issues: issuesList.map((i) => ({
        id: i.id,
        block: i.block,
        floor: i.floor,
        room_number: i.room_number,
        room_location: i.room_location,
        issue_type: i.issue_type,
        description: i.description,
        is_movable: i.is_movable,
        images: i.images,
        marshal_id: i.marshal_id,
        marshal_name: i.marshal_name,
        status: i.status,
        reported_at: i.reported_at,
      })),
      room_inspections: roomInspectionsList.map((r) => ({
        id: r.id,
        block: r.block,
        floor: r.floor,
        room_number: r.room_number,
        // ✅ FIX: correct property name + syntax
        feature_data: r.feature_data,
        has_issues: r.has_issues,
        marshal_id: r.marshal_id,
        marshal_name: r.marshal_name,
        created_at: r.created_at,
      })),
      floor_coverage: floorCoverageList.map((fc) => ({
        id: fc.id,
        date: fc.date,
        block: fc.block,
        floor: fc.floor,
        marshal_id: fc.marshal_id,
        marshal_name: fc.marshal_name,
        submitted_at: fc.submitted_at,
      })),
      date: today,
      summary: summary,
    }

    // Import report generators
    const { generatePDF } = await import('@/lib/reports/pdf')
    const { generateExcel } = await import('@/lib/reports/excel')

    // Generate reports
    console.log('[REPORT] Generating PDF...')
    const pdfBuffer = await generatePDF(reportData, today)

    console.log('[REPORT] Generating Excel...')
    const excelBuffer = await generateExcel(reportData, today)

    console.log('[REPORT] Reports generated successfully')

    return NextResponse.json({
      success: true,
      filename: `MAHE_Daily_Report_${today}`,
      pdf: pdfBuffer.toString('base64'),
      excel: excelBuffer.toString('base64'),
    })
  } catch (error: any) {
    console.error('=== REPORT GENERATION ERROR ===')
    console.error('Message:', error?.message)
    console.error('Stack:', error?.stack)
    console.error('Name:', error?.name)
    console.error('================================')

    return NextResponse.json(
      {
        error: 'Report generation failed',
        message: error?.message ?? 'Unknown error',
        name: error?.name,
      },
      { status: 500 }
    )
  }
}