import nodemailer from 'nodemailer'

interface EmailOptions {
  to: string | string[]
  subject: string
  text?: string
  html?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export class EmailSender {
  private transporter: nodemailer.Transporter
  
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    })
  }
  
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"MAHE Facility Management" <${process.env.SMTP_USER}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || this.generateHTMLBody(options.subject, options.text || ''),
        attachments: options.attachments,
      }
      
      const info = await this.transporter.sendMail(mailOptions)
      console.log('Email sent:', info.messageId)
      
      return true
    } catch (error) {
      console.error('Error sending email:', error)
      return false
    }
  }
  
  private generateHTMLBody(subject: string, message: string): string {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .message {
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
          .stats {
            background: #f9fafb;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
          }
          .stats div {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e5e7eb;
          }
          .stats div:last-child {
            border-bottom: none;
          }
          .stats .label {
            font-weight: bold;
            color: #1e3a8a;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MANIPAL ACADEMY OF HIGHER EDUCATION</h1>
          <p>FACILITY MANAGEMENT SYSTEM</p>
        </div>
        
        <div class="content">
          <h2>${subject}</h2>
          <div class="message">
            <p>${message.replace(/\n/g, '<br>')}</p>
          </div>
          
          ${this.getSignature()}
        </div>
        
        <div class="footer">
          <p>This is an automated message from MAHE Facility Management System</p>
          <p>© ${new Date().getFullYear()} Manipal Academy of Higher Education. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
  }
  
  private getSignature(): string {
    return `
      <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
        <p style="font-weight: bold; color: #1e3a8a; margin: 0;">Best regards,</p>
        <p style="margin: 5px 0 0 0;">MAHE Facility Management Team</p>
        <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">
          Manipal Academy of Higher Education<br>
          Phone: +91-XXXXXXXXXX<br>
          Email: facility@mahe.edu
        </p>
      </div>
    `
  }
  
  async sendDailyReport(to: string, pdfBuffer: Buffer, excelBuffer: Buffer, stats: any): Promise<boolean> {
    const date = new Date().toLocaleDateString('en-IN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    
    const subject = `MAHE Daily Facility Report - ${date}`
    
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .header h1 {
            margin: 0;
            font-size: 24px;
          }
          .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
          }
          .content {
            background: #ffffff;
            padding: 30px;
            border: 1px solid #e5e7eb;
            border-top: none;
            border-radius: 0 0 10px 10px;
          }
          .message {
            margin-bottom: 20px;
            line-height: 1.8;
          }
          .stats {
            background: linear-gradient(135deg, #f9fafb 0%, #ffffff 100%);
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
            border-left: 4px solid #2563eb;
          }
          .stats h3 {
            margin: 0 0 15px 0;
            color: #1e3a8a;
            font-size: 16px;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
          }
          .stat-item {
            background: #ffffff;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
          }
          .stat-label {
            font-size: 12px;
            color: #6b7280;
            margin-bottom: 4px;
          }
          .stat-value {
            font-size: 20px;
            font-weight: bold;
            color: #1e3a8a;
          }
          .stat-value.approved { color: #10b981; }
          .stat-value.denied { color: #ef4444; }
          .attachments {
            background: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .attachments h3 {
            margin: 0 0 15px 0;
            color: #1e3a8a;
            font-size: 16px;
          }
          .attachment-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: #ffffff;
            border-radius: 6px;
            margin-bottom: 8px;
            border: 1px solid #e5e7eb;
          }
          .attachment-icon {
            width: 30px;
            height: 30px;
            background: #2563eb;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-right: 12px;
            color: white;
            font-weight: bold;
          }
          .attachment-info {
            flex: 1;
          }
          .attachment-name {
            font-weight: bold;
            color: #1e3a8a;
            margin: 0 0 4px 0;
          }
          .attachment-size {
            font-size: 12px;
            color: #6b7280;
            margin: 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
          }
          .button {
            display: inline-block;
            background: #2563eb;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MANIPAL ACADEMY OF HIGHER EDUCATION</h1>
          <p>FACILITY MANAGEMENT SYSTEM</p>
        </div>
        
        <div class="content">
          <h2>Daily Facility Inspection Report</h2>
          
          <div class="message">
            <p>Dear Director,</p>
            <p>Please find attached the daily facility inspection report for ${date}.</p>
            <p>The report contains all issues identified by marshals during their inspections today.</p>
          </div>
          
          <div class="stats">
            <h3>📊 Today's Summary</h3>
            <div class="stats-grid">
              <div class="stat-item">
                <div class="stat-label">Total Issues</div>
                <div class="stat-value">${stats.total}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Approved</div>
                <div class="stat-value approved">${stats.approved}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">Denied</div>
                <div class="stat-value denied">${stats.denied}</div>
              </div>
              <div class="stat-item">
                <div class="stat-label">With Images</div>
                <div class="stat-value">${stats.withImages}</div>
              </div>
            </div>
          </div>
          
          <div class="attachments">
            <h3>📎 Attachments</h3>
            <div class="attachment-item">
              <div class="attachment-icon">PDF</div>
              <div class="attachment-info">
                <p class="attachment-name">MAHE_Daily_Report_${new Date().toISOString().split('T')[0]}.pdf</p>
                <p class="attachment-size">Comprehensive report with all details</p>
              </div>
            </div>
            <div class="attachment-item">
              <div class="attachment-icon">XLS</div>
              <div class="attachment-info">
                <p class="attachment-name">MAHE_Daily_Report_${new Date().toISOString().split('T')[0]}.xlsx</p>
                <p class="attachment-size">Excel spreadsheet with filterable data</p>
              </div>
            </div>
          </div>
          
          ${this.getSignature()}
        </div>
        
        <div class="footer">
          <p>This is an automated message from MAHE Facility Management System</p>
          <p>© ${new Date().getFullYear()} Manipal Academy of Higher Education. All rights reserved.</p>
        </div>
      </body>
      </html>
    `
    
    return this.sendEmail({
      to,
      subject,
      html,
      attachments: [
        {
          filename: `MAHE_Daily_Report_${new Date().toISOString().split('T')[0]}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
        {
          filename: `MAHE_Daily_Report_${new Date().toISOString().split('T')[0]}.xlsx`,
          content: excelBuffer,
          contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      ],
    })
  }
  
  async sendNotification(to: string, message: string): Promise<boolean> {
    const subject = 'MAHE Facility Management - Notification'
    
    return this.sendEmail({
      to,
      subject,
      text: message,
    })
  }
}

// Export singleton instance
export const emailSender = new EmailSender()