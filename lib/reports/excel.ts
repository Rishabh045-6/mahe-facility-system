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

interface ExcelData {
  issues: Issue[]
  date: string
}

// MAHE Brand Colors (ARGB format for ExcelJS)
const COLORS = {
  primaryDark: 'FF1e3a8a',      // Dark blue for main headers
  primary: 'FF2563eb',           // Medium blue for sub-headers
  primaryLight: 'FF3b82f6',      // Light blue for accents
  success: 'FF10b981',           // Green for approved
  danger: 'FFef4444',            // Red for denied
  warning: 'FFf59e0b',           // Orange for warnings
  headerText: 'FFFFFFFF',        // White text for headers
  rowEven: 'FFF8FAFC',          // Light gray for even rows
  rowOdd: 'FFFFFFFF',           // White for odd rows
  approvedBg: 'FFF0FDF4',       // Light green background
  deniedBg: 'FFFEF2F2',         // Light red background
  border: 'FFD1D5DB',           // Gray border
  text: 'FF111827',             // Dark text
  subtext: 'FF6B7280',          // Gray text
}

export async function generateExcel(data: ExcelData, date: string): Promise<Buffer> {
  const { issues } = data
  const approvedIssues = issues.filter(i => i.status === 'approved')
  const deniedIssues = issues.filter(i => i.status === 'denied')

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'MAHE Facility Management System'
  workbook.created = new Date()
  workbook.company = 'Manipal Academy of Higher Education'

  // ============================================
  // SHEET 1: SUMMARY
  // ============================================
  const summarySheet = workbook.addWorksheet('Summary', {
    pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true },
    views: [{ showGridLines: false }]
  })

  summarySheet.columns = [
    { width: 35 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ]

  // Main Title
  const titleRow = summarySheet.addRow(['MAHE FACILITY MANAGEMENT SYSTEM'])
  titleRow.height = 35
  titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: COLORS.headerText }, name: 'Calibri' }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryDark } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.getCell(1).border = {
    top: { style: 'medium', color: { argb: COLORS.primaryDark } },
    bottom: { style: 'medium', color: { argb: COLORS.primaryDark } }
  }
  summarySheet.mergeCells('A1:E1')

  // Subtitle
  const subtitleRow = summarySheet.addRow(['Daily Facility Inspection Report'])
  subtitleRow.height = 28
  subtitleRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.headerText }, name: 'Calibri' }
  subtitleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primary } }
  subtitleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.mergeCells('A2:E2')

  // Date
  const dateRow = summarySheet.addRow([`Report Date: ${formatDate(date)}`])
  dateRow.height = 22
  dateRow.getCell(1).font = { italic: true, size: 11, color: { argb: COLORS.subtext }, name: 'Calibri' }
  dateRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  dateRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowEven } }
  summarySheet.mergeCells('A3:E3')

  summarySheet.addRow([]) // Spacer

  // Stats Section Header
  const statsHeaderRow = summarySheet.addRow(['SUMMARY STATISTICS'])
  statsHeaderRow.height = 25
  statsHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.primaryDark }, name: 'Calibri' }
  statsHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
  statsHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  statsHeaderRow.getCell(1).border = { left: { style: 'thick', color: { argb: COLORS.primary } } }
  summarySheet.mergeCells('A5:E5')

  // Stats Data
  const statRows = [
    { label: 'Total Issues Reported', value: issues.length, color: COLORS.primary },
    { label: 'Approved Issues', value: approvedIssues.length, color: COLORS.success },
    { label: 'Denied Issues', value: deniedIssues.length, color: COLORS.danger },
    { label: 'Issues With Images', value: issues.filter(i => i.images && i.images.length > 0).length, color: COLORS.warning },
    { label: 'Total Images', value: issues.reduce((sum, i) => sum + (i.images?.length || 0), 0), color: COLORS.primaryLight },
  ]

  statRows.forEach((stat, index) => {
    const row = summarySheet.addRow([stat.label, stat.value])
    row.height = 24
    row.getCell(1).font = { size: 11, name: 'Calibri', color: { argb: COLORS.text } }
    row.getCell(2).font = { bold: true, size: 14, color: { argb: stat.color }, name: 'Calibri' }
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd } }
    row.getCell(2).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: index % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd } }
    row.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
    row.getCell(2).alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(row.getCell(1))
    applyBorder(row.getCell(2))
  })

  summarySheet.addRow([]) // Spacer

  // Block Breakdown Header
  const blockHeaderRow = summarySheet.addRow(['BREAKDOWN BY BLOCK'])
  blockHeaderRow.height = 25
  blockHeaderRow.getCell(1).font = { bold: true, size: 12, color: { argb: COLORS.primaryDark }, name: 'Calibri' }
  blockHeaderRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE0E7FF' } }
  blockHeaderRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle', indent: 1 }
  blockHeaderRow.getCell(1).border = { left: { style: 'thick', color: { argb: COLORS.primary } } }
  summarySheet.mergeCells(`A${blockHeaderRow.number}:E${blockHeaderRow.number}`)

  // Block Table Headers
  const blockTableHeader = summarySheet.addRow(['Block', 'Total', 'Approved', 'Denied', 'Images'])
  blockTableHeader.height = 22
  ;['A', 'B', 'C', 'D', 'E'].forEach(col => {
    const cell = blockTableHeader.getCell(col)
    cell.font = { bold: true, size: 11, color: { argb: COLORS.headerText }, name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.primaryDark } }
    cell.alignment = { horizontal: 'center', vertical: 'middle' }
    applyBorder(cell)
  })

  // Block Data
  const blocks = ['AB1', 'AB2', 'AB3', 'AB4', 'AB5']
  blocks.forEach((block, idx) => {
    const blockIssues = issues.filter(i => i.block === block)
    const row = summarySheet.addRow([
      block,
      blockIssues.length,
      blockIssues.filter(i => i.status === 'approved').length,
      blockIssues.filter(i => i.status === 'denied').length,
      blockIssues.reduce((sum, i) => sum + (i.images?.length || 0), 0),
    ])
    row.height = 20
    row.eachCell((cell, colNumber) => {
      cell.font = { size: 10, name: 'Calibri', bold: colNumber === 1 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd } }
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      applyBorder(cell)
    })
  })

  // ============================================
  // SHEET 2: ALL ISSUES
  // ============================================
  const allSheet = workbook.addWorksheet('All Issues', {
    views: [{ showGridLines: false }]
  })
  setupIssueSheet(allSheet, issues, 'All Issues', COLORS.primaryDark)

  // ============================================
  // SHEET 3: APPROVED ISSUES
  // ============================================
  const approvedSheet = workbook.addWorksheet('Approved Issues', {
    views: [{ showGridLines: false }]
  })
  setupIssueSheet(approvedSheet, approvedIssues, 'Approved Issues', COLORS.success)

  // ============================================
  // SHEET 4: DENIED ISSUES
  // ============================================
  const deniedSheet = workbook.addWorksheet('Denied Issues', {
    views: [{ showGridLines: false }]
  })
  setupIssueSheet(deniedSheet, deniedIssues, 'Denied Issues', COLORS.danger)

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
    { key: 'no', width: 6 },
    { key: 'block', width: 9 },
    { key: 'floor', width: 9 },
    { key: 'room', width: 20 },
    { key: 'issue_type', width: 32 },
    { key: 'description', width: 45 },
    { key: 'movable', width: 11 },
    { key: 'status', width: 13 },
    { key: 'marshal', width: 22 },
    { key: 'reported_at', width: 24 },
    { key: 'images', width: 11 },
  ]

  // Title row
  const titleRow = sheet.addRow([title.toUpperCase()])
  titleRow.height = 28
  sheet.mergeCells(`A1:K1`)
  titleRow.getCell(1).font = { bold: true, size: 14, color: { argb: COLORS.headerText }, name: 'Calibri' }
  titleRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } }
  titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
  titleRow.getCell(1).border = {
    top: { style: 'medium', color: { argb: headerColor } },
    bottom: { style: 'medium', color: { argb: headerColor } }
  }

  // Column headers
  const headers = ['#', 'Block', 'Floor', 'Room/Location', 'Issue Type', 'Description', 'Movable', 'Status', 'Marshal', 'Reported At', 'Images']
  const headerRow = sheet.addRow(headers)
  headerRow.height = 22
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, size: 10, color: { argb: COLORS.headerText }, name: 'Calibri' }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } }
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    applyBorder(cell, true)
  })

  if (issues.length === 0) {
    const emptyRow = sheet.addRow(['No issues found.'])
    emptyRow.height = 24
    sheet.mergeCells(`A3:K3`)
    emptyRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' }
    emptyRow.getCell(1).font = { italic: true, size: 11, color: { argb: COLORS.subtext }, name: 'Calibri' }
    emptyRow.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.rowEven } }
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

    row.height = 22

    // Alternate row colors based on status
    const bgColor = issue.status === 'approved'
      ? (index % 2 === 0 ? COLORS.approvedBg : COLORS.rowOdd)
      : issue.status === 'denied'
        ? (index % 2 === 0 ? COLORS.deniedBg : COLORS.rowOdd)
        : (index % 2 === 0 ? COLORS.rowEven : COLORS.rowOdd)

    row.eachCell((cell, colNum) => {
      cell.font = { size: 10, name: 'Calibri' }
      cell.alignment = { vertical: 'middle', wrapText: colNum === 6, horizontal: colNum === 1 || colNum === 11 ? 'center' : 'left', indent: colNum > 1 && colNum < 6 ? 0.5 : 0 }
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } }
      applyBorder(cell)
    })

    // Status cell coloring
    const statusCell = row.getCell(8)
    statusCell.font = {
      bold: true,
      size: 10,
      name: 'Calibri',
      color: { argb: issue.status === 'approved' ? COLORS.success : COLORS.danger },
    }
    statusCell.alignment = { horizontal: 'center', vertical: 'middle' }
  })

  // Auto-filter on header row
  sheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: 11 },
  }

  // Freeze top 2 rows
  sheet.views = [{ state: 'frozen', ySplit: 2, showGridLines: false }]
}

function applyBorder(cell: ExcelJS.Cell, thick = false) {
  const style = thick ? 'medium' : 'thin'
  cell.border = {
    top: { style, color: { argb: COLORS.border } },
    left: { style, color: { argb: COLORS.border } },
    bottom: { style, color: { argb: COLORS.border } },
    right: { style, color: { argb: COLORS.border } },
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