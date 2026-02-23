import PDFDocument from 'pdfkit'
import { Buffer } from 'buffer'
import type { Issue, RoomInspection, FloorCoverage, ReportData } from './types'

const PRIMARY   = '#B4651E'
const DARK      = '#1a1208'
const SECONDARY = '#7a6a55'
const SUCCESS   = '#16a34a'
const DANGER    = '#dc2626'
const LIGHT_BG  = '#fdf6ef'
const DIVIDER   = '#e5d5c0'

// FIX: always format in IST
const fmtDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })
  } catch {
    return iso
  }
}

export async function generatePDF(data: ReportData, date: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 60, left: 50, right: 50 },
        info: {
          Title: `MAHE Facility Report - ${date}`,
          Author: 'MAHE Facility Management System',
        },
      })

      const chunks: Buffer[] = []
      doc.on('data', (chunk: Buffer) => chunks.push(chunk))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      const PAGE_W = 595 - 100
      const LEFT   = 50
      const RIGHT  = 545
      let pageNum  = 1

      // ─── HELPERS ────────────────────────────────────────────────────────

      const hline = (y: number, color = DIVIDER, width = 1) => {
        doc.moveTo(LEFT, y).lineTo(RIGHT, y)
          .strokeColor(color).lineWidth(width).stroke()
      }

      const sectionHeader = (title: string) => {
        if (doc.y > 680) { addPage() }
        doc.moveDown(0.6)
        const y = doc.y
        doc.rect(LEFT, y, PAGE_W, 22).fill(LIGHT_BG)
        doc.fontSize(10).font('Helvetica-Bold')
          .fillColor(PRIMARY)
          .text(title.toUpperCase(), LEFT + 8, y + 6, { width: PAGE_W - 16 })
        doc.y = y + 28
      }

      const addHeader = () => {
        doc.rect(LEFT - 50, 0, 595, 90).fill(DARK)
        doc.fontSize(7).font('Helvetica')
          .fillColor('white')
          .text('MANIPAL ACADEMY OF HIGHER EDUCATION', LEFT, 18, {
            width: PAGE_W, align: 'center', characterSpacing: 2,
          })
        doc.fontSize(16).font('Helvetica-Bold')
          .fillColor('white')
          .text('FACILITY MANAGEMENT SYSTEM', LEFT, 30, {
            width: PAGE_W, align: 'center',
          })
        doc.fontSize(8).font('Helvetica')
          .fillColor(PRIMARY)
          .text('DAILY FACILITY INSPECTION REPORT', LEFT, 54, {
            width: PAGE_W, align: 'center', characterSpacing: 1.5,
          })
        doc.rect(LEFT - 50, 90, 595, 22).fill(PRIMARY)
        const dateStr = new Date(data.date + 'T12:00:00').toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
        doc.fontSize(8.5).font('Helvetica-Bold')
          .fillColor('white')
          .text(`Report Date: ${dateStr}`, LEFT, 97, { width: PAGE_W, align: 'center' })
        doc.y = 128
      }

      const addFooter = () => {
        hline(760, DIVIDER, 0.5)
        doc.fontSize(7.5).font('Helvetica').fillColor(SECONDARY)
          .text('MAHE Facility Management System', LEFT, 768, { width: PAGE_W / 2 })
          .text(
            `Generated: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}  |  Page ${pageNum}`,
            LEFT, 768, { width: PAGE_W, align: 'right' }
          )
      }

      const addPage = () => {
        addFooter()
        doc.addPage()
        pageNum++
        doc.rect(LEFT - 50, 0, 595, 32).fill(DARK)
        doc.fontSize(8).font('Helvetica-Bold')
          .fillColor('white')
          .text('MAHE — DAILY FACILITY INSPECTION REPORT (continued)', LEFT, 10, {
            width: PAGE_W, align: 'center',
          })
        doc.rect(LEFT - 50, 32, 595, 14).fill(PRIMARY)
        const dateStr = new Date(data.date + 'T12:00:00').toLocaleDateString('en-IN', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          timeZone: 'Asia/Kolkata',
        })
        doc.fontSize(7).font('Helvetica')
          .fillColor('white')
          .text(`Report Date: ${dateStr}`, LEFT, 36, { width: PAGE_W, align: 'center' })
        doc.y = 60
      }

      const statRow = (label: string, value: string, valueColor = DARK) => {
        const y = doc.y
        doc.fontSize(9.5).font('Helvetica').fillColor(SECONDARY)
          .text(label, LEFT + 10, y, { width: 200 })
        doc.fontSize(10).font('Helvetica-Bold').fillColor(valueColor)
          .text(value, LEFT + 220, y, { width: 200 })
        doc.y = y + 16
      }

      // ─── PAGE 1 ─────────────────────────────────────────────────────────
      addHeader()

      sectionHeader('Executive Summary')

      const boxTop = doc.y
      doc.rect(LEFT, boxTop, PAGE_W, 130).fillAndStroke('#fffcf7', DIVIDER)
      doc.y = boxTop + 10

      const totalImages = data.issues.reduce(
        (acc: number, i: Issue) => acc + (i.images?.length || 0), 0
      )

      statRow('Total Issues Reported',   data.summary.total_issues.toString(),            DARK)
      statRow('Approved Issues',
        `${data.summary.approved_issues}  (${data.summary.total_issues > 0
          ? Math.round(data.summary.approved_issues / data.summary.total_issues * 100) : 0}%)`,
        SUCCESS)
      statRow('Denied Issues',
        `${data.summary.denied_issues}  (${data.summary.total_issues > 0
          ? Math.round(data.summary.denied_issues / data.summary.total_issues * 100) : 0}%)`,
        DANGER)
      statRow('Total Rooms Inspected',   data.summary.total_rooms_inspected.toString(),   DARK)
      statRow('Rooms with Issues',       data.summary.rooms_with_issues.toString(),
        data.summary.rooms_with_issues > 0 ? DANGER : SUCCESS)
      statRow('Total Images Captured',   totalImages.toString(),                          PRIMARY)

      doc.y = boxTop + 148

      if (data.summary.blocks_covered.length > 0) {
        let bx = LEFT + 110
        const by = doc.y
        doc.fontSize(8).font('Helvetica-Bold').fillColor(SECONDARY)
          .text('BLOCKS COVERED:', LEFT + 10, by + 3)
        data.summary.blocks_covered.forEach((block: string) => {
          doc.rect(bx, by, 40, 16).fillAndStroke(PRIMARY, PRIMARY)
          doc.fontSize(8).font('Helvetica-Bold').fillColor('white')
            .text(block, bx, by + 4, { width: 40, align: 'center' })
          bx += 48
        })
        doc.y = by + 28
      }

      // ── Floor Coverage ──
      sectionHeader('Floor Coverage Status')

      const checkedFloors = (data.floor_coverage || []).filter(
        (fc: FloorCoverage) => fc.block && fc.floor
      )

      if (checkedFloors.length === 0) {
        doc.fontSize(9.5).font('Helvetica').fillColor(DANGER)
          .text('⚠  No floor inspections recorded today', LEFT + 10, doc.y)
        doc.moveDown(0.6)
      } else {
        const blocks = [...new Set(checkedFloors.map((fc: FloorCoverage) => fc.block))].join(', ')
        doc.fontSize(9.5).font('Helvetica').fillColor(SUCCESS)
          .text(
            `✓  ${checkedFloors.length} floor${checkedFloors.length !== 1 ? 's' : ''} inspected successfully across ${blocks}`,
            LEFT + 10, doc.y, { width: PAGE_W - 20 }
          )
        doc.moveDown(0.4)
        doc.fontSize(8.5).font('Helvetica').fillColor(SECONDARY)
          .text(
            `Floors: ${checkedFloors.map((fc: FloorCoverage) => `${fc.block}/F${fc.floor}`).join('  ·  ')}`,
            LEFT + 10, doc.y, { width: PAGE_W - 20 }
          )
        doc.moveDown(0.6)
        doc.fontSize(9.5).font('Helvetica-Bold').fillColor(SUCCESS)
          .text(`✓  All ${checkedFloors.length} inspected floors submitted successfully`, LEFT + 10, doc.y)
        doc.moveDown(0.8)
      }

      // ── Room Inspection Summary ──
      if (data.room_inspections.length > 0) {
        sectionHeader('Room Inspection Summary')

        const byBlockFloor = data.room_inspections.reduce(
          (acc: Record<string, RoomInspection[]>, insp: RoomInspection) => {
            const key = `${insp.block}-F${insp.floor}`
            if (!acc[key]) acc[key] = []
            acc[key].push(insp)
            return acc
          }, {}
        )

        Object.entries(byBlockFloor).forEach(([key, inspections]) => {
          if (doc.y > 700) addPage()
          const withIssues = (inspections as RoomInspection[]).filter(
            (i: RoomInspection) => i.has_issues
          ).length
          const parts = key.split('-F')
          const block = parts[0]
          const floor = parts[1]

          const ry = doc.y
          doc.rect(LEFT, ry, PAGE_W, 18).fill(withIssues > 0 ? '#fff5f5' : '#f0fdf4')

          // FIX: write label and value separately, no { continued: true } across font changes
          doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
            .text(`Block ${block} — Floor ${floor}`, LEFT + 10, ry + 4, { width: 160 })

          const roomCount = (inspections as RoomInspection[]).length
          const issueLabel = withIssues > 0
            ? `${roomCount} rooms inspected  (${withIssues} with issues)`
            : `${roomCount} rooms inspected  (All clear)`
          const issueColor = withIssues > 0 ? DANGER : SUCCESS

          doc.fontSize(9).font('Helvetica').fillColor(issueColor)
            .text(issueLabel, LEFT + 175, ry + 4, { width: PAGE_W - 185 })

          doc.y = ry + 22
        })

        doc.moveDown(0.5)
      }

      // ─── APPROVED ISSUES ─────────────────────────────────────────────────
      const approvedIssues = data.issues.filter(
        (i: Issue) => (i.status ?? '').toLowerCase() === 'approved'
      )
      const deniedIssues = data.issues.filter(
        (i: Issue) => (i.status ?? '').toLowerCase() === 'denied'
      )

      sectionHeader(`Detailed Issue Report — Approved (${approvedIssues.length})`)

      if (approvedIssues.length === 0) {
        doc.fontSize(9.5).font('Helvetica').fillColor(SECONDARY)
          .text(
            'No approved issues to report today. All inspected areas are in satisfactory condition.',
            LEFT + 10, doc.y, { width: PAGE_W - 20, align: 'center' }
          )
        doc.moveDown(1)
      } else {
        approvedIssues.forEach((issue: Issue, index: number) => {
          // Estimate card height: header(14) + type(14) + desc(variable) + meta(12) + flags + padding
          const descLines = Math.ceil((issue.description || '').length / 80)
          const estimatedHeight = 14 + 14 + (descLines * 12) + 12 + 20 + 16
          if (doc.y + estimatedHeight > 700) addPage()

          // ── Card header band ──────────────────────────────────────────
          const iy = doc.y
          doc.rect(LEFT, iy, PAGE_W, 14).fill(LIGHT_BG)

          // Issue number — left side
          doc.fontSize(9.5).font('Helvetica-Bold').fillColor(PRIMARY)
            .text(`Issue #${index + 1}`, LEFT + 8, iy + 2, { width: 65 })

          // Location — right of number, no { continued } to avoid overlap
          const roomLabel = issue.room_number
            ? `, Room ${issue.room_number}`
            : ''
          const locationLabel = `${issue.block} — Floor ${issue.floor}${roomLabel}${issue.room_location ? ' · ' + issue.room_location : ''}`
          doc.fontSize(9.5).font('Helvetica').fillColor(DARK)
            .text(locationLabel, LEFT + 80, iy + 2, { width: PAGE_W - 90 })

          doc.y = iy + 18

          // ── Type row ─────────────────────────────────────────────────
          const typeY = doc.y
          doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
            .text('Type:', LEFT + 10, typeY, { width: 42 })
          doc.fontSize(9).font('Helvetica').fillColor(SECONDARY)
            .text(issue.issue_type || '-', LEFT + 55, typeY, { width: PAGE_W - 65 })
          doc.y = Math.max(doc.y, typeY + 13)

          // ── Description ──────────────────────────────────────────────
          const descY = doc.y
          doc.fontSize(9).font('Helvetica-Bold').fillColor(DARK)
            .text('Description:', LEFT + 10, descY, { width: 80 })
          // Description on next line to avoid overlap on long text
          doc.y = descY + 13
          doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(issue.description || '-', LEFT + 10, doc.y, { width: PAGE_W - 20 })
          doc.moveDown(0.3)

          // ── Meta row ─────────────────────────────────────────────────
          const metaY = doc.y
          const reportedAt = issue.reported_at ? fmtDate(issue.reported_at) : 'N/A'
          doc.fontSize(8).font('Helvetica').fillColor(SECONDARY)
            .text(
              `Reported by: ${issue.marshal_name || '—'} (ID: ${issue.marshal_id})   |   ${reportedAt}`,
              LEFT + 10, metaY, { width: PAGE_W - 20 }
            )
          doc.moveDown(0.3)

          // ── Flags ────────────────────────────────────────────────────
          if (issue.is_movable) {
            doc.fontSize(8).font('Helvetica-Bold').fillColor(DANGER)
              .text('⚠  MOVABLE ITEM — Requires immediate attention', LEFT + 10, doc.y)
            doc.moveDown(0.2)
          }
          if (issue.images && issue.images.length > 0) {
            doc.fontSize(8).font('Helvetica').fillColor(PRIMARY)
              .text(
                `📷  ${issue.images.length} photo${issue.images.length !== 1 ? 's' : ''} attached — see Excel for links`,
                LEFT + 10, doc.y
              )
            doc.moveDown(0.2)
          }

          doc.moveDown(0.3)
          hline(doc.y, DIVIDER, 0.5)
          doc.moveDown(0.5)
        })
      }

      // ─── DENIED ISSUES ────────────────────────────────────────────────────
      if (deniedIssues.length > 0) {
        sectionHeader(`Denied Issues (${deniedIssues.length})`)

        deniedIssues.forEach((issue: Issue, index: number) => {
          if (doc.y > 700) addPage()

          const dy = doc.y
          // Number
          doc.fontSize(9).font('Helvetica-Bold').fillColor(DANGER)
            .text(`${index + 1}.`, LEFT + 10, dy, { width: 20 })
          // Type + location
          doc.fontSize(9).font('Helvetica').fillColor(DARK)
            .text(
              `${issue.issue_type}  —  ${issue.block}/F${issue.floor}${issue.room_number ? `/R${issue.room_number}` : ''}`,
              LEFT + 30, dy, { width: PAGE_W - 40 }
            )
          doc.y = Math.max(doc.y, dy + 13)
          // Description
          doc.fontSize(8.5).font('Helvetica').fillColor(SECONDARY)
            .text(issue.description || '-', LEFT + 30, doc.y, { width: PAGE_W - 40 })
          doc.moveDown(0.4)
        })
      }

      addFooter()
      doc.end()

    } catch (error) {
      reject(error)
    }
  })
}