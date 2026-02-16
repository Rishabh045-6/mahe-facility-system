import { NextRequest, NextResponse } from 'next/server'
import { emailSender } from '@/lib/email/sender'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const { type, to, data } = await request.json()
    
    if (!type || !to) {
      return NextResponse.json(
        { error: 'Type and recipient are required' },
        { status: 400 }
      )
    }
    
    let success = false
    
    switch (type) {
      case 'daily_report':
        success = await sendDailyReportEmail(to)
        break
        
      case 'issue_alert':
        success = await sendIssueAlert(to, data)
        break
        
      case 'reminder':
        success = await sendReminder(to, data)
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        )
    }
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Notification sent successfully',
      })
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification' },
        { status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error sending notification:', error)
    return NextResponse.json(
      { error: 'Failed to send notification', details: error },
      { status: 500 }
    )
  }
}

async function sendDailyReportEmail(to: string): Promise<boolean> {
  try {
    const supabase = await createClient()
    const today = new Date().toISOString().split('T')[0]
    
    const { data: issues } = await supabase
      .from('issues')
      .select(`
        *,
        marshals (name)
      `)
      .gte('reported_at', `${today}T00:00:00`)
      .lte('reported_at', `${today}T23:59:59`)
    
    if (!issues || issues.length === 0) {
      return false
    }
    
    const stats = {
      total: issues.length,
      approved: issues.filter((i: any) => i.status === 'approved').length,
      denied: issues.filter((i: any) => i.status === 'denied').length,
      pending: issues.filter((i: any) => !i.status || i.status === 'pending').length,
      withImages: issues.filter((i: any) => i.images && i.images.length > 0).length,
    }
    
    const { generatePDF } = await import('@/lib/reports/pdf')
    const { generateExcel } = await import('@/lib/reports/excel')
    
    const pdfBuffer = await generatePDF({ issues, date: today }, today)
    const excelBuffer = await generateExcel({ issues, date: today }, today)
    
    return await emailSender.sendDailyReport(to, pdfBuffer, excelBuffer, stats)
    
  } catch (error) {
    console.error('Error sending daily report:', error)
    return false
  }
}

async function sendIssueAlert(to: string, data: any): Promise<boolean> {
  try {
    const message = `New issue reported in ${data.block}, Floor ${data.floor}: ${data.issue_type}`
    return await emailSender.sendNotification(to, message)
  } catch (error) {
    console.error('Error sending issue alert:', error)
    return false
  }
}

async function sendReminder(to: string, data: any): Promise<boolean> {
  try {
    const message = `Reminder: You have pending issues to review in the MAHE Facility Management System.`
    return await emailSender.sendNotification(to, message)
  } catch (error) {
    console.error('Error sending reminder:', error)
    return false
  }
}

// Test email endpoint
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const to = searchParams.get('to')
    
    if (!to) {
      return NextResponse.json(
        { error: 'Email address is required' },
        { status: 400 }
      )
    }
    
    const success = await emailSender.sendNotification(
      to,
      'This is a test email from MAHE Facility Management System'
    )
    
    return NextResponse.json({
      success,
      message: success ? 'Test email sent' : 'Failed to send test email',
    })
    
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { error: 'Failed to send test email', details: error },
      { status: 500 }
    )
  }
}