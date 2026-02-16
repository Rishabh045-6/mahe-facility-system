import { NextRequest, NextResponse } from 'next/server'
import { emailSender } from '@/lib/email/sender'
import { createClient } from '@/lib/supabase/server'

// This endpoint is called by Vercel Cron at 6 PM IST daily
export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request (add authentication if needed)
    const authHeader = request.headers.get('authorization')
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    console.log('🔄 Running daily report cron job...')
    
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    // Get today's issues
    const { data: issues } = await supabase
      .from('issues')
      .select(`
        *,
        marshals (name)
      `)
      .gte('reported_at', `${today}T00:00:00`)
      .lte('reported_at', `${today}T23:59:59`)
    
    if (!issues || issues.length === 0) {
      console.log('ℹ️ No issues to report today')
      return NextResponse.json({
        success: true,
        message: 'No issues to report',
      })
    }
    
    // Calculate statistics
    const stats = {
      total: issues.length,
      approved: issues.filter((i: any) => i.status === 'approved').length,
      denied: issues.filter((i: any) => i.status === 'denied').length,
      pending: issues.filter((i: any) => !i.status || i.status === 'pending').length,
      withImages: issues.filter((i: any) => i.images && i.images.length > 0).length,
    }
    
    // Generate reports
    const { generatePDF } = await import('@/lib/reports/pdf')
    const { generateExcel } = await import('@/lib/reports/excel')
    
    const pdfBuffer = await generatePDF({ issues, date: today }, today)
    const excelBuffer = await generateExcel({ issues, date: today }, today)
    
    // Send to director
    const directorEmail = process.env.DIRECTOR_EMAIL || 'director@mahe.edu'
    const success = await emailSender.sendDailyReport(
      directorEmail,
      pdfBuffer,
      excelBuffer,
      stats
    )
    
    if (success) {
      console.log('✅ Daily report sent successfully')
      
      // Notify admin
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@mahe.edu'
      await emailSender.sendNotification(
        adminEmail,
        `Daily facility report has been sent to the director. Total issues: ${stats.total} (Approved: ${stats.approved}, Denied: ${stats.denied})`
      )
      
      return NextResponse.json({
        success: true,
        message: 'Daily report sent successfully',
        stats,
      })
    } else {
      console.error('❌ Failed to send daily report')
      return NextResponse.json(
        { error: 'Failed to send email' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('❌ Error in cron job:', error)
    return NextResponse.json(
      { error: 'Cron job failed', details: error },
      { status: 500 }
    )
  }
}