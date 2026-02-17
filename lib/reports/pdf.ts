import PDFDocument from 'pdfkit'

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
  primary: '#1e3a8a',
  secondary: '#2563eb',
  accent: '#0ea5e9',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  text: '#000000',
  background: '#ffffff',
}

export async function generatePDF(data: PDFData, date: string): Promise<Buffer> {
  const { issues } = data
  const approvedIssues = issues.filter(i => i.status === 'approved')
  const deniedIssues = issues.filter(i => i.status === 'denied')

  return new Promise((resolve, reject) => {
    // Create new PDF document
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      autoFirstPage: true,
      bufferPages: true,
    })

    const buffers: Buffer[] = []
    doc.on('data', (chunk: Buffer) => buffers.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(buffers)))
    doc.on('error', reject)

    let yPos = 40

    // ============================================
    // HEADER SECTION
    // ============================================
    doc.rect(0, 0, 595, 80)
       .fillColor(MAHE_COLORS.primary)
       .fill()

    doc.fontSize(18)
       .fillColor('#ffffff')
       .font('Helvetica-Bold')
       .text('MANIPAL ACADEMY OF HIGHER EDUCATION', 40, 20, { align: 'center', width: 515 })

    doc.fontSize(12)
       .font('Helvetica')
       .text('FACILITY MANAGEMENT SYSTEM', 40, 45, { align: 'center', width: 515 })

    // Report Title
    doc.fontSize(16)
       .fillColor(MAHE_COLORS.text)
       .font('Helvetica-Bold')
       .text('DAILY FACILITY INSPECTION REPORT', 40, 100, { align: 'center', width: 515 })

    const formattedDate = formatDate(date)
    doc.fontSize(11)
       .font('Helvetica')
       .fillColor('#374151')
       .text(`Report Date: ${formattedDate}`, 40, 122, { align: 'center', width: 515 })

    yPos = 155

    // ============================================
    // EXECUTIVE SUMMARY BOX
    // ============================================
    doc.rect(40, yPos, 515, 100)
       .fillColor('#f8fafc')
       .fill()
    doc.rect(40, yPos, 515, 100)
       .strokeColor('#e2e8f0')
       .stroke()

    doc.fontSize(11)
       .font('Helvetica-Bold')
       .fillColor(MAHE_COLORS.primary)
       .text('EXECUTIVE SUMMARY', 55, yPos + 12)

    const summaryData = [
      { label: 'Total Issues Reported', value: issues.length.toString() },
      {
        label: 'Approved Issues',
        value: `${approvedIssues.length} (${issues.length > 0 ? Math.round((approvedIssues.length / issues.length) * 100) : 0}%)`,
      },
      {
        label: 'Denied Issues',
        value: `${deniedIssues.length} (${issues.length > 0 ? Math.round((deniedIssues.length / issues.length) * 100) : 0}%)`,
      },
      {
        label: 'Total Images Captured',
        value: issues.reduce((sum, i) => sum + (i.images?.length || 0), 0).toString(),
      },
    ]

    summaryData.forEach((item, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const x = col === 0 ? 55 : 300
      const y = yPos + 32 + row * 28

      doc.fontSize(9)
         .font('Helvetica')
         .fillColor('#6b7280')
         .text(item.label, x, y)

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(MAHE_COLORS.primary)
         .text(item.value, x, y + 11)
    })

    yPos += 115

    // ============================================
    // HELPER: Draw table header row
    // ============================================
    const drawTableHeader = (y: number, color: string) => {
      doc.rect(40, y, 515, 22)
         .fillColor(color)
         .fill()

      doc.fontSize(8)
         .font('Helvetica-Bold')
         .fillColor('#ffffff')
         .text('Block', 48, y + 7)
         .text('Floor', 95, y + 7)
         .text('Room', 140, y + 7)
         .text('Issue Type', 190, y + 7, { width: 140 })
         .text('Description', 335, y + 7, { width: 140 })
         .text('Marshal', 480, y + 7)

      return y + 22
    }

    // ============================================
    // HELPER: Draw issue row
    // ============================================
    const drawIssueRow = (issue: Issue, index: number, y: number, bgColor: string) => {
      if (index % 2 === 0) {
        doc.rect(40, y, 515, 36)
           .fillColor(bgColor)
           .fill()
      }

      doc.rect(40, y, 515, 36)
         .strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .stroke()

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor(MAHE_COLORS.text)
         .text(issue.block, 48, y + 5, { width: 42 })
         .text(`F${issue.floor}`, 95, y + 5, { width: 40 })
         .text(issue.room_location || '-', 140, y + 5, { width: 45 })
         .text(issue.issue_type, 190, y + 5, { width: 140, height: 26 })
         .text(
           issue.description.length > 55
             ? issue.description.substring(0, 55) + '...'
             : issue.description,
           335, y + 5, { width: 140, height: 26 }
         )
         .text(issue.marshal_name || issue.marshal_id, 480, y + 5, { width: 70 })

      return y + 36
    }

    // ============================================
    // APPROVED ISSUES SECTION
    // ============================================
    if (approvedIssues.length > 0) {
      if (yPos > 680) { doc.addPage(); yPos = 40 }

      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor(MAHE_COLORS.success)
         .text(`✓  APPROVED ISSUES (${approvedIssues.length})`, 40, yPos)

      yPos += 18
      yPos = drawTableHeader(yPos, MAHE_COLORS.success)

      approvedIssues.forEach((issue, index) => {
        if (yPos > 740) { doc.addPage(); yPos = 40 }
        yPos = drawIssueRow(issue, index, yPos, '#f0fdf4')
      })

      yPos += 20
    }

    // ============================================
    // DENIED ISSUES SECTION
    // ============================================
    if (deniedIssues.length > 0) {
      if (yPos > 680) { doc.addPage(); yPos = 40 }

      doc.fontSize(13)
         .font('Helvetica-Bold')
         .fillColor(MAHE_COLORS.danger)
         .text(`✗  DENIED ISSUES (${deniedIssues.length})`, 40, yPos)

      yPos += 18
      yPos = drawTableHeader(yPos, MAHE_COLORS.danger)

      deniedIssues.forEach((issue, index) => {
        if (yPos > 740) { doc.addPage(); yPos = 40 }
        yPos = drawIssueRow(issue, index, yPos, '#fef2f2')
      })

      yPos += 20
    }

    // ============================================
    // FOOTER ON EVERY PAGE
    // ============================================
    const pageCount = doc.bufferedPageRange().count
    for (let i = 0; i < pageCount; i++) {
      doc.switchToPage(i)

      doc.moveTo(40, 810)
         .lineTo(555, 810)
         .strokeColor('#e5e7eb')
         .lineWidth(1)
         .stroke()

      doc.fontSize(8)
         .font('Helvetica')
         .fillColor('#9ca3af')
         .text('MAHE Facility Management System', 40, 818, { width: 200 })
         .text(
           `Generated: ${new Date().toLocaleString('en-IN')}`,
           40, 818, { align: 'center', width: 515 }
         )
         .text(`Page ${i + 1} of ${pageCount}`, 40, 818, { align: 'right', width: 515 })
    }

    // Finalize — triggers 'end' event which resolves the Promise
    doc.end()
  })
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
