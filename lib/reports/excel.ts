import ExcelJS from 'exceljs'
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
  status: string
  reported_at: string
  marshals?: {
    name: string
  }
}

interface ExcelData {
  issues: Issue[]
  date: string
}

export async function generateExcel(data: ExcelData, date: string): Promise<Buffer> {
  const { issues } = data
  const approvedIssues = issues.filter(i => i.status === 'approved')
  const deniedIssues = issues.filter(i => i.status === 'denied')
  
  // Create new workbook
  const workbook = new ExcelJS.Workbook()
  
  // ============================================
  // SUMMARY SHEET
  // ============================================
  
  const summarySheet = workbook.addWorksheet('Summary', {
    properties: { tabColor: { argb: 'FF1E3A8A' } }
  })
  
  // Title
  summarySheet.mergeCells('A1:F1')
  summarySheet.getCell('A1').value = 'MAHE FACILITY MANAGEMENT SYSTEM'
  summarySheet.getCell('A1').font = { size: 16, bold: true, color: { argb: 'FF1E3A8A' } }
  summarySheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' }
  summarySheet.getCell('A1').fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF0F5FF' }
  }
  summarySheet.getCell('A1').border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
  
  // Report Date
  summarySheet.mergeCells('A2:F2')
  summarySheet.getCell('A2').value = `Daily Inspection Report - ${formatDate(date)}`
  summarySheet.getCell('A2').font = { size: 12, bold: true }
  summarySheet.getCell('A2').alignment = { horizontal: 'center' }
  summarySheet.getCell('A2').border = {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' }
  }
  
  // Summary Statistics
  const summaryData = [
    ['Metric', 'Value', 'Percentage'],
    ['Total Issues Reported', issues.length, '100%'],
    ['Approved Issues', approvedIssues.length, `${Math.round((approvedIssues.length/issues.length)*100) || 0}%`],
    ['Denied Issues', deniedIssues.length, `${Math.round((deniedIssues.length/issues.length)*100) || 0}%`],
    ['Issues with Images', issues.filter(i => i.images && i.images.length > 0).length, `${Math.round((issues.filter(i => i.images && i.images.length > 0).length/issues.length)*100) || 0}%`],
    ['Total Images', issues.reduce((sum, i) => sum + (i.images?.length || 0), 0), ''],
  ]
  
  let row = 4
  summaryData.forEach((rowData, index) => {
    const excelRow = summarySheet.getRow(row + index)
    excelRow.values = rowData
    
    // Header row styling
    if (index === 0) {
      excelRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
      excelRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E3A8A' }
      }
      excelRow.height = 25
    } else {
      excelRow.height = 20
      if (rowData[1] === approvedIssues.length) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD1FAE5' }
        }
      } else if (rowData[1] === deniedIssues.length) {
        excelRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFEE2E2' }
        }
      }
    }
    
    // Center align all cells
    excelRow.eachCell((cell, colNumber) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle' }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
  })
  
  summarySheet.columns = [
    { header: 'Metric', width: 25 },
    { header: 'Value', width: 15 },
    { header: 'Percentage', width: 15 }
  ]
  
  // ============================================
  // APPROVED ISSUES SHEET
  // ============================================
  
  if (approvedIssues.length > 0) {
    const approvedSheet = workbook.addWorksheet('Approved Issues', {
      properties: { tabColor: { argb: 'FF10B981' } }
    })
    
    const approvedHeaders = [
      'Issue ID',
      'Block',
      'Floor',
      'Room/Location',
      'Issue Type',
      'Description',
      'Movable Item',
      'Images',
      'Marshal ID',
      'Marshal Name',
      'Reported At',
      'Status'
    ]
    
    const approvedHeaderRow = approvedSheet.getRow(1)
    approvedHeaderRow.values = approvedHeaders
    approvedHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    approvedHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' }
    }
    approvedHeaderRow.height = 30
    
    approvedHeaderRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    approvedIssues.forEach((issue, index) => {
      const row = approvedSheet.getRow(index + 2)
      row.values = [
        issue.id.substring(0, 8),
        issue.block,
        issue.floor,
        issue.room_location || '-',
        issue.issue_type,
        issue.description,
        issue.is_movable ? 'Yes' : 'No',
        issue.images?.length || 0,
        issue.marshal_id,
        issue.marshals?.name || '-',
        formatDateTime(issue.reported_at),
        issue.status
      ]
      
      row.height = 50
      row.eachCell((cell, colNumber) => {
        cell.alignment = { vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
        
        // Color coding for movable items
        if (issue.is_movable && colNumber === 7) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0F2FE' }
          }
        }
      })
    })
    
    approvedSheet.columns = [
      { header: 'Issue ID', width: 12 },
      { header: 'Block', width: 10 },
      { header: 'Floor', width: 10 },
      { header: 'Room/Location', width: 15 },
      { header: 'Issue Type', width: 20 },
      { header: 'Description', width: 35 },
      { header: 'Movable Item', width: 12 },
      { header: 'Images', width: 10 },
      { header: 'Marshal ID', width: 12 },
      { header: 'Marshal Name', width: 20 },
      { header: 'Reported At', width: 18 },
      { header: 'Status', width: 10 }
    ]
    
    // Add image links as hyperlinks
    approvedIssues.forEach((issue, index) => {
      if (issue.images && issue.images.length > 0) {
        const cell = approvedSheet.getCell(`H${index + 2}`)
        cell.value = {
          text: `${issue.images.length} image(s)`,
          hyperlink: getImageUrl(issue.images[0]),
          tooltip: 'Click to view image'
        }
        cell.font = { color: { argb: 'FF1E3A8A' }, underline: true }
      }
    })
  }
  
  // ============================================
  // DENIED ISSUES SHEET
  // ============================================
  
  if (deniedIssues.length > 0) {
    const deniedSheet = workbook.addWorksheet('Denied Issues', {
      properties: { tabColor: { argb: 'FFEF4444' } }
    })
    
    const deniedHeaders = [
      'Issue ID',
      'Block',
      'Floor',
      'Room/Location',
      'Issue Type',
      'Description',
      'Movable Item',
      'Images',
      'Marshal ID',
      'Marshal Name',
      'Reported At',
      'Status'
    ]
    
    const deniedHeaderRow = deniedSheet.getRow(1)
    deniedHeaderRow.values = deniedHeaders
    deniedHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    deniedHeaderRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFEF4444' }
    }
    deniedHeaderRow.height = 30
    
    deniedHeaderRow.eachCell((cell) => {
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    })
    
    deniedIssues.forEach((issue, index) => {
      const row = deniedSheet.getRow(index + 2)
      row.values = [
        issue.id.substring(0, 8),
        issue.block,
        issue.floor,
        issue.room_location || '-',
        issue.issue_type,
        issue.description,
        issue.is_movable ? 'Yes' : 'No',
        issue.images?.length || 0,
        issue.marshal_id,
        issue.marshals?.name || '-',
        formatDateTime(issue.reported_at),
        issue.status
      ]
      
      row.height = 50
      row.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', wrapText: true }
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        }
      })
    })
    
    deniedSheet.columns = [
      { header: 'Issue ID', width: 12 },
      { header: 'Block', width: 10 },
      { header: 'Floor', width: 10 },
      { header: 'Room/Location', width: 15 },
      { header: 'Issue Type', width: 20 },
      { header: 'Description', width: 35 },
      { header: 'Movable Item', width: 12 },
      { header: 'Images', width: 10 },
      { header: 'Marshal ID', width: 12 },
      { header: 'Marshal Name', width: 20 },
      { header: 'Reported At', width: 18 },
      { header: 'Status', width: 10 }
    ]
  }
  
  // ============================================
  // ALL ISSUES SHEET
  // ============================================
  
  const allSheet = workbook.addWorksheet('All Issues', {
    properties: { tabColor: { argb: 'FF6B7280' } }
  })
  
  const allHeaders = [
    'Issue ID',
    'Block',
    'Floor',
    'Room/Location',
    'Issue Type',
    'Description',
    'Movable Item',
    'Images',
    'Marshal ID',
    'Marshal Name',
    'Reported At',
    'Status'
  ]
  
  const allHeaderRow = allSheet.getRow(1)
  allHeaderRow.values = allHeaders
  allHeaderRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  allHeaderRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF6B7280' }
  }
  allHeaderRow.height = 30
  
  allHeaderRow.eachCell((cell) => {
    cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true }
    cell.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  })
  
  issues.forEach((issue, index) => {
    const row = allSheet.getRow(index + 2)
    row.values = [
      issue.id.substring(0, 8),
      issue.block,
      issue.floor,
      issue.room_location || '-',
      issue.issue_type,
      issue.description,
      issue.is_movable ? 'Yes' : 'No',
      issue.images?.length || 0,
      issue.marshal_id,
      issue.marshals?.name || '-',
      formatDateTime(issue.reported_at),
      issue.status
    ]
    
    row.height = 50
    row.eachCell((cell, colNumber) => {
      cell.alignment = { vertical: 'middle', wrapText: true }
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
      
      // Status-based coloring
      if (colNumber === 12) { // Status column
        if (issue.status === 'approved') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFD1FAE5' }
          }
        } else if (issue.status === 'denied') {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFEE2E2' }
          }
        }
      }
    })
  })
  
  allSheet.columns = [
    { header: 'Issue ID', width: 12 },
    { header: 'Block', width: 10 },
    { header: 'Floor', width: 10 },
    { header: 'Room/Location', width: 15 },
    { header: 'Issue Type', width: 20 },
    { header: 'Description', width: 35 },
    { header: 'Movable Item', width: 12 },
    { header: 'Images', width: 10 },
    { header: 'Marshal ID', width: 12 },
    { header: 'Marshal Name', width: 20 },
    { header: 'Reported At', width: 18 },
    { header: 'Status', width: 10 }
  ]
  
  // Add image hyperlinks
  issues.forEach((issue, index) => {
    if (issue.images && issue.images.length > 0) {
      const cell = allSheet.getCell(`H${index + 2}`)
      cell.value = {
        text: `${issue.images.length} image(s)`,
        hyperlink: getImageUrl(issue.images[0]),
        tooltip: 'Click to view image'
      }
      cell.font = { color: { argb: 'FF1E3A8A' }, underline: true }
    }
  })
  
  // ============================================
  // GENERATE BUFFER
  // ============================================
  
  const buffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(buffer as ArrayBuffer)
}

// Helper functions
function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function formatDateTime(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleString('en-IN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}