import { CronJob } from 'cron'
import { emailSender } from '@/lib/email/sender'
import { createClient } from '@/lib/supabase/server'

export class NotificationScheduler {
  private cronJob: CronJob | null = null
  
  constructor() {
    this.initialize()
  }
  
  private async initialize() {
    // Schedule daily notification at 6:00 PM IST
    // Cron format: second minute hour day month weekday
    // IST is UTC+5:30, so 6:00 PM IST = 12:30 PM UTC
    this.cronJob = new CronJob(
      '0 30 12 * * *', // Every day at 12:30 PM UTC (6:00 PM IST)
      async () => {
        console.log('🔄 Running daily notification job...')
        await this.sendDailyReport()
      },
      null,
      true,
      'Asia/Kolkata' // Set timezone to IST
    )
    
    console.log('✅ Notification scheduler initialized')
  }
  
  private async sendDailyReport() {
    try {
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
      
      // Skip if no issues
      if (!issues || issues.length === 0) {
        console.log('ℹ️ No issues to report today')
        return
      }
      
      // Calculate statistics
      const stats = {
        total: issues.length,
        approved: issues.filter((i: any) => i.status === 'approved').length,
        denied: issues.filter((i: any) => i.status === 'denied').length,
        pending: issues.filter((i: any) => !i.status || i.status === 'pending').length,
        withImages: issues.filter((i: any) => i.images && i.images.length > 0).length,
      }
      
      // Get director email from env
      const directorEmail = process.env.DIRECTOR_EMAIL || 'director@mahe.edu'
      
      // Generate reports
      const { generatePDF } = await import('@/lib/reports/pdf')
      const { generateExcel } = await import('@/lib/reports/excel')
      
      const pdfBuffer = await generatePDF({ issues, date: today }, today)
      const excelBuffer = await generateExcel({ issues, date: today }, today)
      
      // Send email
      const success = await emailSender.sendDailyReport(
        directorEmail,
        pdfBuffer,
        excelBuffer,
        stats
      )
      
      if (success) {
        console.log('✅ Daily report sent successfully')
        
        // Also notify admin
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@mahe.edu'
        await emailSender.sendNotification(
          adminEmail,
          `Daily facility report has been sent to the director. Total issues: ${stats.total} (Approved: ${stats.approved}, Denied: ${stats.denied})`
        )
      } else {
        console.error('❌ Failed to send daily report')
      }
      
    } catch (error) {
      console.error('❌ Error in daily notification job:', error)
    }
  }
  
  public start() {
    if (this.cronJob) {
      this.cronJob.start()
      console.log('▶️ Notification scheduler started')
    }
  }
  
  public stop() {
    if (this.cronJob) {
      this.cronJob.stop()
      console.log('⏹️ Notification scheduler stopped')
    }
  }
  
  public getNextRunDate(): Date | null {
  if (!this.cronJob) return null

  const next = this.cronJob.nextDates(1)

  return next.length > 0 ? next[0].toJSDate() : null
}

}

// Export singleton instance
export const notificationScheduler = new NotificationScheduler()