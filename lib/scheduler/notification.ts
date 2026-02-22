import { CronJob } from 'cron'
import { emailSender } from '@/lib/email/sender'
import { createClient } from '@/lib/supabase/server'

export class NotificationScheduler {
  private cronJob: CronJob | null = null

  constructor() {
    this.initialize()
  }

  private async initialize() {
    this.cronJob = new CronJob(
      '0 30 12 * * *', // 12:30 PM UTC = 6:00 PM IST
      async () => {
        console.log('🔄 Running daily notification job...')
        await this.sendDailyReport()
      },
      null,
      true,
      'Asia/Kolkata'
    )

    console.log('✅ Notification scheduler initialized')
  }

  private async sendDailyReport() {
    try {
      const supabase = await createClient()

      // FIX: Use IST date, not UTC date
      const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())

      // Get today's issues using IST-aware bounds
      const { data: issues } = await supabase
        .from('issues')
        .select('*')
        .gte('reported_at', `${today}T00:00:00+05:30`)
        .lte('reported_at', `${today}T23:59:59+05:30`)

      // FIX: Also fetch room_inspections and floor_coverage (were hardcoded as [] before)
      const { data: roomInspections } = await supabase
        .from('room_inspections')
        .select('*')
        .eq('date', today)

      const { data: floorCoverage } = await supabase
        .from('floor_coverage')
        .select('*')
        .eq('date', today)

      if (!issues || issues.length === 0) {
        console.log('ℹ️ No issues to report today')
        return
      }

      const stats = {
        total: issues.length,
        approved: issues.filter((i: any) => i.status === 'approved').length,
        denied: issues.filter((i: any) => i.status === 'denied').length,
        pending: issues.filter((i: any) => !i.status || i.status === 'pending').length,
        withImages: issues.filter((i: any) => i.images && i.images.length > 0).length,
      }

      const directorEmail = process.env.DIRECTOR_EMAIL || 'director@mahe.edu'

      const { generatePDF } = await import('@/lib/reports/pdf')
      const { generateExcel } = await import('@/lib/reports/excel')

      const roomInspData = roomInspections ?? []
      const blocksSet = new Set<string>()
      roomInspData.forEach((r: any) => { if (r.block) blocksSet.add(r.block) })

      const reportData = {
        issues,
        date: today,
        room_inspections: roomInspData,
        floor_coverage: floorCoverage ?? [],
        summary: {
          total_issues: issues.length,
          approved_issues: stats.approved,
          denied_issues: stats.denied,
          total_rooms_inspected: roomInspData.length,
          rooms_with_issues: roomInspData.filter((r: any) => r.has_issues).length,
          blocks_covered: Array.from(blocksSet),
        },
      }

      const pdfBuffer = await generatePDF(reportData, today)
      const excelBuffer = await generateExcel(reportData, today)

      const success = await emailSender.sendDailyReport(
        directorEmail,
        pdfBuffer,
        excelBuffer,
        stats
      )

      if (success) {
        console.log('✅ Daily report sent successfully')
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@mahe.edu'
        await emailSender.sendNotification(
          adminEmail,
          `Daily facility report sent to director. Total issues: ${stats.total} (Approved: ${stats.approved}, Denied: ${stats.denied}). Rooms inspected: ${reportData.summary.total_rooms_inspected}.`
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
    try {
      const next = this.cronJob.nextDate()
      return next ? next.toJSDate() : null
    } catch {
      return null
    }
  }
}

export const notificationScheduler = new NotificationScheduler()