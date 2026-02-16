import PDFDocument from 'pdfkit'
import { getImageUrl } from '@/lib/storage/upload'

interface Issue {
  id: string
  block: string
  floor: string
  room_location?: string
  issue_type: string
  description: string
  is_movable: boolean
  images?: string[]
  marshal_id: string
  marshal_name?: string
  status: string
  reported_at: string
}

interface PDFData {
  issues: Issue[]
  date: string
}

// MAHE Brand Colors
const MAHE_COLORS = {
  primary: '#1e3a8a',      // Dark Blue
  secondary: '#2563eb',    // Blue
  accent: '#0ea5e9',       // Light Blue
  success: '#10b981',      // Green
  warning: '#f59e0b',      // Yellow
  danger: '#ef4444',       // Red
  text: '#000000',
  background: '#ffffff',
}

export async function generatePDF(data: PDFData, date: string): Promise<Buffer> {
  const { issues } = data
  const approvedIssues = issues.filter(i => i.status === 'approved')
  const deniedIssues = issues.filter(i => i.status === 'denied')
  
  // Create new PDF document
  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
    autoFirstPage: true,
  })
  
  const buffers: Buffer[] = []
  
  doc.on('data', buffers.push.bind(buffers))
  doc.on('end', () => {
    const pdfData = Buffer.concat(buffers)
  })
  
  let yPos = 40
  
  // ============================================
  // HEADER SECTION
  // ============================================
  
  // MAHE Header Banner
  doc.rect(0, 0, 595, 80)
     .fillColor(MAHE_COLORS.primary)
     .fill()
  
  // MAHE Logo placeholder (text-based)
  doc.fontSize(24)
     .fillColor('#ffffff')
     .font('Times-Roman')
     .text('MANIPAL ACADEMY OF HIGHER EDUCATION', 297, 25, { align: 'center' })
  
  doc.fontSize(14)
     .text('FACILITY MANAGEMENT SYSTEM', 297, 42, { align: 'center' })
  
  // Report Title
  doc.fontSize(20)
     .fillColor(MAHE_COLORS.text)
     .font('Times-Roman')
     .text('DAILY FACILITY INSPECTION REPORT', 297, 100, { align: 'center' })
  
  // Date
  const formattedDate = formatDate(date)
  doc.fontSize(12)
     .font('Times-Roman')
     .text(`Report Date: ${formattedDate}`, 297, 115, { align: 'center' })
  
  yPos = 140
  
  // ============================================
  // EXECUTIVE SUMMARY
  // ============================================
  
  doc.fontSize(14)
     .font('Times-Roman')
     .text('EXECUTIVE SUMMARY', 40, yPos)
  
  yPos += 25
  
  const summaryData = [
    { label: 'Total Issues Reported', value: issues.length.toString() },
    { label: 'Approved Issues', value: `${approvedIssues.length} (${Math.round((approvedIssues.length/issues.length)*100) || 0}%)` },
    { label: 'Denied Issues', value: `${deniedIssues.length} (${Math.round((deniedIssues.length/issues.length)*100) || 0}%)` },
    { label: 'Total Images Captured', value: issues.reduce((sum, i) => sum + (i.images?.length || 0), 0).toString() },
  ]
  
  summaryData.forEach((item, index) => {
    const y = yPos + (index * 20)
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(MAHE_COLORS.text)
       .text(item.label, 40, y, { width: 250 })
    
    doc.fontSize(10)
       .font('Times-Roman')
       .fillColor(MAHE_COLORS.primary)
       .text(item.value, 290, y)
  })
  
  yPos += 100
  
  // ============================================
  // APPROVED ISSUES SECTION
  // ============================================
  
  if (approvedIssues.length > 0) {
    doc.fontSize(14)
       .font('Times-Roman')

       .fillColor(MAHE_COLORS.success)
       .text(`APPROVED ISSUES (${approvedIssues.length})`, 40, yPos)
    
    yPos += 25
    
    // Table headers
    doc.fontSize(9)
       .font('Times-Roman')

       .fillColor('#ffffff')
       .rect(40, yPos, 515, 20)
       .fillColor(MAHE_COLORS.success)
       .fillAndStroke(MAHE_COLORS.success)
    
    doc.fillColor('#ffffff')
       .text('Block', 45, yPos + 5)
       .text('Floor', 100, yPos + 5)
       .text('Room', 150, yPos + 5)
       .text('Issue Type', 200, yPos + 5)
       .text('Description', 350, yPos + 5)
       .text('Marshal', 500, yPos + 5)
    
    yPos += 20
    
    approvedIssues.forEach((issue, index) => {
      if (yPos > 750) {
        doc.addPage()
        yPos = 40
      }
      
      const y = yPos
      
      // Row background
      if (index % 2 === 0) {
        doc.rect(40, y, 515, 40)
           .fillColor('#f8f9fa')
           .fill()
      }
      
      // Issue data
      doc.fontSize(8)
         .font('Times-Roman')
         .fillColor(MAHE_COLORS.text)
         .text(issue.block, 45, y + 5)
         .text(`Floor ${issue.floor}`, 100, y + 5)
         .text(issue.room_location || '-', 150, y + 5)
         .text(issue.issue_type, 200, y + 5, { width: 145, height: 30 })
         .text(issue.description.substring(0, 60) + (issue.description.length > 60 ? '...' : ''), 350, y + 5, { width: 145, height: 30 })
         .text(issue.marshal_name || issue.marshal_id, 500, y + 5)
      
      // Movable item indicator
      if (issue.is_movable) {
        doc.fontSize(7)
           .fillColor(MAHE_COLORS.accent)
           .text('📦 Movable', 45, y + 25)
      }
      
      yPos += 40
    })
    
    yPos += 20
  }
  
  // ============================================
  // DENIED ISSUES SECTION
  // ============================================
  
  if (deniedIssues.length > 0) {
    if (yPos > 750) {
      doc.addPage()
      yPos = 40
    }
    
    doc.fontSize(14)
       .font('Times-Roman')

       .fillColor(MAHE_COLORS.danger)
       .text(`DENIED ISSUES (${deniedIssues.length})`, 40, yPos)
    
    yPos += 25
    
    // Table headers
    doc.fontSize(9)
       .font('Times-Roman')

       .fillColor('#ffffff')
       .rect(40, yPos, 515, 20)
       .fillColor(MAHE_COLORS.danger)
       .fillAndStroke(MAHE_COLORS.danger)
    
    doc.fillColor('#ffffff')
       .text('Block', 45, yPos + 5)
       .text('Floor', 100, yPos + 5)
       .text('Room', 150, yPos + 5)
       .text('Issue Type', 200, yPos + 5)
       .text('Description', 350, yPos + 5)
       .text('Marshal', 500, yPos + 5)
    
    yPos += 20
    
    deniedIssues.forEach((issue, index) => {
      if (yPos > 750) {
        doc.addPage()
        yPos = 40
      }
      
      const y = yPos
      
      // Row background
      if (index % 2 === 0) {
        doc.rect(40, y, 515, 40)
           .fillColor('#fef2f2')
           .fill()
      }
      
      // Issue data
      doc.fontSize(8)
         .font('Times-Roman')
         .fillColor(MAHE_COLORS.text)
         .text(issue.block, 45, y + 5)
         .text(`Floor ${issue.floor}`, 100, y + 5)
         .text(issue.room_location || '-', 150, y + 5)
         .text(issue.issue_type, 200, y + 5, { width: 145, height: 30 })
         .text(issue.description.substring(0, 60) + (issue.description.length > 60 ? '...' : ''), 350, y + 5, { width: 145, height: 30 })
         .text(issue.marshal_name || issue.marshal_id, 500, y + 5)
      
      yPos += 40
    })
    
    yPos += 20
  }
  
  // ============================================
  // FOOTER SECTION
  // ============================================
  
  const pageCount = doc.bufferedPageRange().count
  
  for (let i = 0; i < pageCount; i++) {
    doc.switchToPage(i)
    
    // Footer line
    doc.moveTo(40, 800)
       .lineTo(555, 800)
       .strokeColor('#e5e7eb')
       .stroke()
    
    // Footer text
    doc.fontSize(8)
       .fillColor('#6b7280')
       .text('MAHE Facility Management System', 40, 810)
       .text(`Page ${i + 1} of ${pageCount}`, 555, 810, { align: 'right' })
       .text(`Generated on: ${new Date().toLocaleString('en-IN')}`, 297, 810, { align: 'center' })
  }
  
  doc.end()
  
  return new Promise((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(buffers))
    })
  })
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}