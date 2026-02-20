import ExcelJS from 'exceljs'

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

interface RoomInspection {
  id: string
  block: string
  floor: string
  room_number: string
  feature_data: Record<string, string>
  has_issues: boolean
  marshal_id: string
  marshal_name?: string
  date: string
}

interface ExcelData {
  issues: Issue[]
  roomInspections?: RoomInspection[]
  date: string
}

// MAHE Brand Colors (ARGB format for ExcelJS)
const COLORS = {
  primaryDark: 'FF1e3a8a',
  primary: 'FF2563eb',
  success: 'FF10b981',
  danger: 'FFef4444',
  warning: 'FFf59e0b',
  headerText: 'FFFFFFFF',
  rowAlt: 'FFF8FAFC',
  rowApprovedAlt: 'FFF0FDF4',
  rowDeniedAlt: 'FFFEF2F2',
  border: 'FFE5E7EB',
  text: 'FF111827',
  subtext: 'FF6B7280',
}

export async function generateExcel(data: ExcelData, date: string): Promise<Buffer> {
  const { issues, roomInspections = [] } = data
  const approvedIssues = issues.filter(i => i.status === 'approved')
  const deniedIssues = issues.filter(i => i.status === 'denied')

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MAHE Facility Management System'
  workbook.created = new Date()

  // ============================================
  // SHEET 1: SUMMARY
  // ============================================
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait' },
  })

  summarySheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ]

  // Title rows
  const titleRow = summarySheet.addRow(['MAHE FACILITY MANAGEMENT SYSTEM'])
  titleRow.getCell(1).font = { bold: true, size: 16, color: { argb: COLORS.headerText } }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryDark } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.mergeCells('A1:E1')
  titleRow.height = 30

  const subtitleRow = summarySheet.addRow(['Daily Facility Inspection Report'])
  subtitleRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.headerText } }
  subtitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
  subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.mergeCells('A2:E2')
  subtitleRow.height = 22

  const dateRow = summarySheet.addRow([`Report Date: ${formatDate(date)}`])
  dateRow.getCell(1).font = { italic: true, size: 10, color: { argb: COLORS.subtext } }
  dateRow.getCell(1).alignment = { horizontal: 'center' }
  summarySheet.mergeCells('A3:E3')

  summarySheet.addRow([]) // spacer

  // Stats header
  const statsHeader = summarySheet.addRow(['SUMMARY STATISTICS', '', '', '', ''])
  statsHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.primaryDark } }
  summarySheet.mergeCells('A5:E5')

  const statRows = [
    ['Total Room Inspections', roomInspections.length],
    ['Total Issues Reported', issues.length],
    ['Approved Issues', approvedIssues.length],
    ['Denied Issues', deniedIssues.length],
    ['Issues With Images', issues.filter(i => i.images && i.images.length > 0).length],
    ['Total Images', issues.reduce((sum, i) => sum + (i.images?.length || 0), 0)],
  ]

  statRows.forEach(([label, value], index) => {
    const row = summarySheet.addRow([label, value])
    row.getCell(1).font = { size: 10 }
    row.getCell(2).font = { bold: true, size: 12, color: { argb: COLORS.primaryDark } }
    if (index % 2 === 0) {
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } }
      row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } }
    }
    applyBorder(row.getCell(1))
    applyBorder(row.getCell(2))
  })

  // Block breakdown
  summarySheet.addRow([])
  const blockHeader = summarySheet.addRow(['BREAKDOWN BY BLOCK', '', '', '', ''])
  blockHeader.getCell(1).font = { bold: true, size: 11, color: { argb: COLORS.primaryDark } }
  summarySheet.mergeCells(`A${blockHeader.number}:E${blockHeader.number}`)

  const blockRow = summarySheet.addRow(['Block', 'Total', 'Approved', 'Denied', 'Images'])
  ;(['A', 'B', 'C', 'D', 'E'] as const).forEach(col => {
    const cell = blockRow.getCell(col)
    cell.font = { bold: true, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryDark } }
    cell.alignment = { horizontal: 'center' }
    applyBorder(cell)
  })

  const blocks = Array.from(new Set([...issues.map(i => i.block), ...roomInspections.map(r => r.block)])).sort()
  blocks.forEach((block, idx) => {
    const blockIssues = issues.filter(i => i.block === block)
    const row = summarySheet.addRow([
      block,
      blockIssues.length,
      blockIssues.filter(i => i.status === 'approved').length,
      blockIssues.filter(i => i.status === 'denied').length,
      blockIssues.reduce((sum, i) => sum + (i.images?.length || 0), 0),
    ])
    if (idx % 2 === 0) {
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } }
      })
    }
    row.eachCell(cell => {
      cell.alignment = { horizontal: 'center' }
      applyBorder(cell)
    })
  })

  // ============================================
  // SHEET 2: ALL ISSUES
  // ============================================
  const allSheet = workbook.addWorksheet('All Issues')
  setupIssueSheet(allSheet, issues, 'All Issues', COLORS.primaryDark)

  // ============================================
  // SHEET 3: APPROVED ISSUES
  // ============================================
  const approvedSheet = workbook.addWorksheet('Approved Issues')
  setupIssueSheet(approvedSheet, approvedIssues, 'Approved Issues', COLORS.success)

  // ============================================
  // SHEET 4: DENIED ISSUES
  // ============================================
  const deniedSheet = workbook.addWorksheet('Denied Issues')
  setupIssueSheet(deniedSheet, deniedIssues, 'Denied Issues', COLORS.danger)


  // ============================================
  // SHEET 5: ROOM INSPECTIONS
  // ============================================
  const roomSheet = workbook.addWorksheet('Room Inspections')
  setupRoomInspectionSheet(roomSheet, roomInspections)

  // Write to buffer
  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}

// ============================================
// HELPER: Set up an issues worksheet
// ============================================
function setupIssueSheet(
  sheet: ExcelJS.Worksheet,
  issues: Issue[],
  title: string,
  headerColor: string
) {
  sheet.columns = [
    { key: 'no', width: 5 },
    { key: 'block', width: 8 },
    { key: 'floor', width: 8 },
    { key: 'room', width: 18 },
    { key: 'issue_type', width: 28 },
    { key: 'description', width: 40 },
    { key: 'movable', width: 10 },
    { key: 'status', width: 12 },
    { key: 'marshal', width: 20 },
    { key: 'reported_at', width: 22 },
    { key: 'images', width: 10 },
  ]

  // Title row
  const titleRow = sheet.addRow([title.toUpperCase()])
  sheet.mergeCells(`A1:K1`)
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: COLORS.headerText } }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.height = 24

  // Column headers
  const headers = ['#', 'Block', 'Floor', 'Room/Location', 'Issue Type', 'Description', 'Movable', 'Status', 'Marshal', 'Reported At', 'Images']
  const headerRow = sheet.addRow(headers)
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, size: 9, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    applyBorder(cell)
  })
  headerRow.height = 18

  if (issues.length === 0) {
    const emptyRow = sheet.addRow(['No issues found.'])
    sheet.mergeCells(`A3:K3`)
    emptyRow.getCell(1).alignment = { horizontal: 'center' }
    emptyRow.getCell(1).font = { italic: true, color: { argb: COLORS.subtext } }
    return
  }

  // Data rows
  issues.forEach((issue, index) => {
    const reportedAt = new Date(issue.reported_at).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    const row = sheet.addRow([
      index + 1,
      issue.block,
      `Floor ${issue.floor}`,
      issue.room_location || '-',
      issue.issue_type,
      issue.description,
      issue.is_movable ? 'Yes' : 'No',
      issue.status.toUpperCase(),
      issue.marshal_name || issue.marshal_id,
      reportedAt,
      issue.images?.length || 0,
    ])

    // Alternate row shading
    const isAlt = index % 2 === 0
    const altColor = issue.status === 'approved'
      ? (isAlt ? COLORS.rowApprovedAlt : COLORS.headerText)
      : issue.status === 'denied'
        ? (isAlt ? COLORS.rowDeniedAlt : COLORS.headerText)
        : (isAlt ? COLORS.rowAlt : COLORS.headerText)

    row.eachCell((cell, colNum) => {
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', wrapText: colNum === 6 }
      if (isAlt) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: altColor } }
      }
      applyBorder(cell)
    })

    // Status cell coloring
    const statusCell = row.getCell(8)
    statusCell.font = {
      bold: true,
      size: 9,
      color: {
        argb: issue.status === 'approved' ? COLORS.success : COLORS.danger,
      },
    }

    row.height = 20
  })

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: 11 },
  }

  // Freeze top 2 rows
  sheet.views = [{ state: 'frozen', ySplit: 2 }]
}


function setupRoomInspectionSheet(sheet: ExcelJS.Worksheet, roomInspections: RoomInspection[]) {
  sheet.columns = [
    { key: 'no', width: 5 },
    { key: 'block', width: 8 },
    { key: 'floor', width: 8 },
    { key: 'room', width: 12 },
    { key: 'marshal', width: 20 },
    { key: 'has_issues', width: 12 },
    { key: 'features', width: 85 },
  ]

  const titleRow = sheet.addRow(['ROOM INSPECTIONS'])
  sheet.mergeCells('A1:G1')
  titleRow.getCell(1).font = { bold: true, size: 13, color: { argb: COLORS.headerText } }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryDark } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }

  const headerRow = sheet.addRow(['#', 'Block', 'Floor', 'Room', 'Marshal', 'Has Issues', 'Feature Values'])
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 9, color: { argb: COLORS.headerText } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(cell)
  })

  if (roomInspections.length === 0) {
    const row = sheet.addRow(['No room inspections found.'])
    sheet.mergeCells('A3:G3')
    row.getCell(1).alignment = { horizontal: 'center' }
    row.getCell(1).font = { italic: true, color: { argb: COLORS.subtext } }
    return
  }

  roomInspections.forEach((inspection, index) => {
    const featureText = Object.entries(inspection.feature_data || {})
      .map(([key, value]) => `${key}: ${value}`)
      .join(' | ')

    const row = sheet.addRow([
      index + 1,
      inspection.block,
      `Floor ${inspection.floor}`,
      inspection.room_number,
      inspection.marshal_name || inspection.marshal_id,
      inspection.has_issues ? 'Yes' : 'No',
      featureText,
    ])

    row.eachCell((cell, colNum) => {
      cell.font = { size: 9 }
      cell.alignment = { vertical: 'middle', wrapText: colNum === 7 }
      if (index % 2 === 0) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowAlt } }
      }
      applyBorder(cell)
    })
    row.height = 22
  })

  sheet.views = [{ state: 'frozen', ySplit: 2 }]
}

function applyBorder(cell: ExcelJS.Cell) {
  cell.border = {
    top: { style: 'thin', color: { argb: COLORS.border } },
    left: { style: 'thin', color: { argb: COLORS.border } },
    bottom: { style: 'thin', color: { argb: COLORS.border } },
    right: { style: 'thin', color: { argb: COLORS.border } },
  }
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}