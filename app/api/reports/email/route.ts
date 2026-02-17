import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'
import { emailSender } from '@/lib/email/sender'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const to = body.email || process.env.DIRECTOR_EMAIL || 'director@mahe.edu'

    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]

    // Fetch today's issues
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
        { error: 'No issues', message: 'No issues reported today. Cannot send report.' },
        { status: 400 }
      )
    }

    const reportData = { issues, date: today }

    // Generate both files
    const [pdfBuffer, excelBuffer] = await Promise.all([
      generatePDF(reportData, today),
      generateExcel(reportData, today),
    ])

    const stats = {
      total:      issues.length,
      approved:   issues.filter(i => i.status === 'approved').length,
      denied:     issues.filter(i => i.status === 'denied').length,
      withImages: issues.filter(i => i.images && i.images.length > 0).length,
    }

    const success = await emailSender.sendDailyReport(to, pdfBuffer, excelBuffer, stats)

    if (!success) {
      return NextResponse.json(
        { error: 'Email failed', message: 'Report generated but email delivery failed. Check SMTP settings.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `Report emailed to ${to}`,
      stats,
    })

  } catch (error: any) {
    console.error('Error in /api/reports/email:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error.message ?? 'Unknown error' },
      { status: 500 }
    )
  }
}