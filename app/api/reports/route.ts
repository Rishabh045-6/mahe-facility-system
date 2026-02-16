import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generatePDF } from '@/lib/reports/pdf'
import { generateExcel } from '@/lib/reports/excel'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's issues
    const { data: issues } = await supabase
      .from('issues')
      .select('*')
      .gte('reported_at', `${today}T00:00:00`)
      .lte('reported_at', `${today}T23:59:59`)
      .order('reported_at', { ascending: true })
    
    if (!issues || issues.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No issues reported today. Cannot generate report.',
        Data: { issues_count: 0 }
      }, { status: 400 })
    }
    
    // Calculate statistics
    const stats = {
      total: issues.length,
      approved: issues.filter((i: any) => i.status === 'approved').length,
      denied: issues.filter((i: any) => i.status === 'denied').length,
      pending: issues.filter((i: any) => !i.status || i.status === 'pending').length,
      withImages: issues.filter((i: any) => i.images && i.images.length > 0).length,
    }
    
    // Generate PDF
    const pdfBuffer = await generatePDF({ issues, date: today }, today)
    
    // Generate Excel
    const excelBuffer = await generateExcel({ issues, date: today }, today)
    
    // Convert to base64 for response
    const pdfBase64 = pdfBuffer.toString('base64')
    const excelBase64 = excelBuffer.toString('base64')
    
    return NextResponse.json({
      success: true,
      message: 'Reports generated successfully',
      data: {
        issues_count: issues.length,
        stats,
        pdf: pdfBase64,
        excel: excelBase64,
        filename: `MAHE_Daily_Report_${today}`,
      },
    })
    
  } catch (error) {
    console.error('Error generating reports:', error)
    return NextResponse.json(
      { 
        error: 'Report generation failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}