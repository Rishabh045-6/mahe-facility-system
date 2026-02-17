import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    const { data: issues, error: dbError } = await supabase
      .from('issues')
      .select('*')
      .gte('reported_at', `${today}T00:00:00`)
      .lte('reported_at', `${today}T23:59:59`)
      .order('reported_at', { ascending: false })

    if (dbError) {
      return NextResponse.json(
        { error: 'Database error', message: dbError.message },
        { status: 500 }
      )
    }

    if (!issues || issues.length === 0) {
      return NextResponse.json(
        { error: 'No issues', message: 'No issues reported today.' },
        { status: 400 }
      )
    }

    const reportData = { issues, date: today }

    const [pdfBuffer, excelBuffer] = await Promise.all([
      generatePDF(reportData, today),
      generateExcel(reportData, today),
    ])

    return NextResponse.json({
      success: true,
      filename: `MAHE_Daily_Report_${today}`,
      pdf: pdfBuffer.toString('base64'),
      excel: excelBuffer.toString('base64'),
    })

  } catch (error: any) {
    console.error('Error in /api/reports/download:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message ?? 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}