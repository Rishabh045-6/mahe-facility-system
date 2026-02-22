import * as XLSX from 'xlsx'
import type { Issue, RoomInspection, FloorCoverage, ReportData } from './types'

export async function generateExcel( data:ReportData, date: string): Promise<Buffer> {
  const workbook = XLSX.utils.book_new()

  // Color palette
  const colors = {
    primary: 'B4651E',
    primaryLight: 'FDF6EF',
    success: '16a34a',
    successLight: 'dcfce7',
    warning: 'f59e0b',
    warningLight: 'fef3c7',
    danger: 'dc2626',
    dangerLight: 'fee2e2',
    header: '1a1208',
    headerText: 'FFFFFF',
    border: 'E5E5E5',
  }

  // ==================== SHEET 1: SUMMARY ====================
  const summaryData = [
    ['📋 MAHE Daily Facility Report - Summary'],
    ['Date', new Date(data.date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })],
    ['Generated On', new Date().toLocaleString('en-IN')],
    [],
    ['📊 OVERALL STATISTICS'],
    ['Total Issues Reported', data.summary.total_issues.toString()],
    ['✅ Approved Issues', data.summary.approved_issues.toString()],
    ['❌ Denied Issues', data.summary.denied_issues.toString()],
    ['🏫 Total Rooms Inspected', data.summary.total_rooms_inspected.toString()],
    ['⚠️ Rooms with Issues', data.summary.rooms_with_issues.toString()],
    ['📍 Blocks Covered', data.summary.blocks_covered.join(', ')],
    [],
    ['🏢 FLOOR COVERAGE STATUS'],
    ['Block', 'Floor', 'Status', 'Marshal', 'Submitted At'],
    ...(data.floor_coverage || []).map((fc: FloorCoverage) => [
      fc.block,
      fc.floor,
      '✓ Checked',
      fc.marshal_name || 'N/A',
      fc.submitted_at ? new Date(fc.submitted_at).toLocaleString('en-IN') : 'N/A',
    ]),
  ]

  const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
  
  // Apply styling
  const summaryRange = XLSX.utils.decode_range(summarySheet['!ref'] || 'A1')
  
  // Title
  summarySheet['A1'] = { ...summarySheet['A1'], s: { 
    font: { bold: true, sz: 16, color: { rgb: colors.header } },
    fill: { fgColor: { rgb: colors.primaryLight } },
    alignment: { horizontal: 'center' }
  }}
  
  // Section headers
  ;['A5', 'A13'].forEach(cell => {
    if (summarySheet[cell]) {
      summarySheet[cell] = { 
        ...summarySheet[cell], 
        s: { 
          font: { bold: true, sz: 12, color: { rgb: colors.primary } },
          fill: { fgColor: { rgb: colors.primaryLight } }
        }
      }
    }
  })
  
  // Column headers
  const headerRow = 14
  for (let col = 0; col < 5; col++) {
    const cell = String.fromCharCode(65 + col) + headerRow
    if (summarySheet[cell]) {
      summarySheet[cell] = {
        ...summarySheet[cell],
        s: {
          font: { bold: true, color: { rgb: colors.headerText } },
          fill: { fgColor: { rgb: colors.primary } }
        }
      }
    }
  }
  
  summarySheet['!cols'] = [
    { wch: 30 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 30 }
  ]
  
  XLSX.utils.book_append_sheet(workbook, summarySheet, '📋 Summary')

  // ==================== SHEET 2: ALL ISSUES ====================
  const issuesData = [
    ['#', 'Status', 'Block', 'Floor', 'Room', 'Location', 'Issue Type', 'Description', 'Movable', 'Images', 'Image Links', 'Marshal ID', 'Marshal Name', 'Reported At'],
  ]

  ;(data.issues || []).forEach((issue: Issue, index: number) => {
    issuesData.push([
      (index + 1).toString(),
      issue.status.toUpperCase(),
      issue.block,
      issue.floor,
      issue.room_number || '-',
      issue.room_location || '-',
      issue.issue_type,
      issue.description,
      issue.is_movable ? 'Yes' : 'No',
      (issue.images?.length || 0).toString(),
      issue.images?.join('; ') || '-',
      issue.marshal_id,
      issue.marshal_name,
      new Date(issue.reported_at).toLocaleString('en-IN'),
    ])
  })

  const issuesSheet = XLSX.utils.aoa_to_sheet(issuesData)
  
  // Style header
  for (let col = 0; col < 14; col++) {
    const cell = String.fromCharCode(65 + col) + '1'
    if (issuesSheet[cell]) {
      issuesSheet[cell] = {
        ...issuesSheet[cell],
        s: {
          font: { bold: true, color: { rgb: colors.headerText } },
          fill: { fgColor: { rgb: colors.primary } }
        }
      }
    }
  }
  
  // Color code status
  for (let row = 2; row <= issuesData.length; row++) {
    const statusCell = 'B' + row
    if (issuesSheet[statusCell]) {
      const status = issuesSheet[statusCell].v
      const fillColor = status === 'APPROVED' ? colors.successLight : 
                       status === 'DENIED' ? colors.dangerLight : colors.warningLight
      const textColor = status === 'APPROVED' ? colors.success : 
                       status === 'DENIED' ? colors.danger : colors.warning
      
      issuesSheet[statusCell] = {
        ...issuesSheet[statusCell],
        s: {
          font: { bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: fillColor } }
        }
      }
    }
  }
  
  issuesSheet['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 8 }, { wch: 8 }, { wch: 10 }, { wch: 12 },
    { wch: 22 }, { wch: 45 }, { wch: 8 }, { wch: 8 }, { wch: 50 },
    { wch: 12 }, { wch: 20 }, { wch: 22 },
  ]

  XLSX.utils.book_append_sheet(workbook, issuesSheet, '🔍 All Issues')

  // ==================== SHEET 3: ROOM INSPECTIONS ====================
  console.log('[EXCEL] Room inspections data:', {
    count: data.room_inspections?.length || 0,
    first: data.room_inspections?.[0],
  })
  
  // Get all unique feature keys
  const allFeatureKeys = Array.from(
    new Set(
      (data.room_inspections || []).flatMap((r: RoomInspection) => 
        Object.keys(r.feature_data || {})
      )
    )
  )

  const roomInspectionData = [
    ['🏫 Inspection ID', '📍 Block', '🏢 Floor', '🚪 Room Number', '⚠️ Has Issues', '👤 Marshal ID', '👤 Marshal Name', '🕐 Inspected At', ...allFeatureKeys.map(key => key.replace(/([A-Z])/g, ' $1').trim())],
  ]

  ;
  (data.room_inspections || []).forEach((inspection: RoomInspection) => {
  // ✅ Row must be string[] because roomInspectionData expects string[] rows
  const row: string[] = [
    String(inspection.id ?? ''),
    String(inspection.block ?? ''),
    String(inspection.floor ?? ''),
    String(inspection.room_number ?? ''),
    inspection.has_issues ? 'Yes' : 'No',
    String(inspection.marshal_id ?? ''),
    String(inspection.marshal_name ?? ''),
    inspection.created_at ? new Date(inspection.created_at).toLocaleString('en-IN') : 'N/A',
  ]

  // ✅ Extract features once
  const features: Record<string, unknown> = inspection.feature_data || {}

  // ✅ Iterate through the unique keys collected from all inspections
  allFeatureKeys.forEach((key) => {
    const value = features[key]

    if (value !== undefined && value !== null) {
      if (typeof value === 'object') {
        row.push(JSON.stringify(value))
      } else {
        row.push(String(value))
      }
    } else {
      row.push('')
    }
  })

  roomInspectionData.push(row) // ✅ now row is string[] so TS is happy
  })

  console.log('[EXCEL] Room inspection rows:', roomInspectionData.length)

  const roomInspectionSheet = XLSX.utils.aoa_to_sheet(roomInspectionData)
  
  // Style header
  const roomHeaderRow = 1
  for (let col = 0; col < 8 + allFeatureKeys.length; col++) {
    const cell = String.fromCharCode(65 + col) + roomHeaderRow
    if (roomInspectionSheet[cell]) {
      roomInspectionSheet[cell] = {
        ...roomInspectionSheet[cell],
        s: {
          font: { bold: true, color: { rgb: colors.headerText } },
          fill: { fgColor: { rgb: colors.primary } }
        }
      }
    }
  }
  
  // Color code has_issues
  for (let row = 2; row <= roomInspectionData.length; row++) {
    const hasIssuesCell = 'E' + row
    if (roomInspectionSheet[hasIssuesCell]) {
      const hasIssues = roomInspectionSheet[hasIssuesCell].v
      const fillColor = hasIssues === 'Yes ⚠️' ? colors.dangerLight : colors.successLight
      const textColor = hasIssues === 'Yes ⚠️' ? colors.danger : colors.success
      
      roomInspectionSheet[hasIssuesCell] = {
        ...roomInspectionSheet[hasIssuesCell],
        s: {
          font: { bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: fillColor } }
        }
      }
    }
  }
  
  roomInspectionSheet['!cols'] = [
    { wch: 38 }, { wch: 10 }, { wch: 8 }, { wch: 14 }, { wch: 14 },
    { wch: 14 }, { wch: 22 }, { wch: 24 },
    ...Array(allFeatureKeys.length).fill({ wch: 16 }),
  ]

  XLSX.utils.book_append_sheet(workbook, roomInspectionSheet, '🏫 Room Inspections')

  // ==================== SHEET 4: BLOCK SUMMARY ====================
  const blockSummary: Record<string, { issues: number; rooms: number; floors: Set<string> }> = {}
  
  ;(data.issues || []).forEach((issue: Issue) => {
    if (!blockSummary[issue.block]) {
      blockSummary[issue.block] = { issues: 0, rooms: 0, floors: new Set() }
    }
    blockSummary[issue.block].issues++
    blockSummary[issue.block].floors.add(issue.floor)
  })

  ;(data.room_inspections || []).forEach((inspection: RoomInspection) => {
    if (!blockSummary[inspection.block]) {
      blockSummary[inspection.block] = { issues: 0, rooms: 0, floors: new Set() }
    }
    blockSummary[inspection.block].rooms++
    blockSummary[inspection.block].floors.add(inspection.floor)
  })

  const blockSummaryData = [
    ['📊 Block-wise Summary'],
    ['Block', 'Total Issues', 'Rooms Inspected', 'Floors Covered', 'Coverage %'],
    ...Object.entries(blockSummary).map(([block, stats]) => [
      block,
      stats.issues.toString(),
      stats.rooms.toString(),
      Array.from(stats.floors).join(', '),
      `${Math.round((stats.floors.size / 6) * 100)}%`,
    ]),
  ]

  const blockSummarySheet = XLSX.utils.aoa_to_sheet(blockSummaryData)
  
  blockSummarySheet['A1'] = { 
    ...blockSummarySheet['A1'], 
    s: { 
      font: { bold: true, sz: 14, color: { rgb: colors.header } },
      fill: { fgColor: { rgb: colors.primaryLight } }
    }
  }
  
  const blockHeaderRow = 2
  for (let col = 0; col < 5; col++) {
    const cell = String.fromCharCode(65 + col) + blockHeaderRow
    if (blockSummarySheet[cell]) {
      blockSummarySheet[cell] = {
        ...blockSummarySheet[cell],
        s: {
          font: { bold: true, color: { rgb: colors.headerText } },
          fill: { fgColor: { rgb: colors.primary } }
        }
      }
    }
  }
  
  // Color code coverage
  for (let row = 3; row <= blockSummaryData.length; row++) {
    const pctCell = 'E' + row
    if (blockSummarySheet[pctCell]) {
      const pct = parseInt(blockSummarySheet[pctCell].v)
      let fillColor = colors.dangerLight
      let textColor = colors.danger
      
      if (pct >= 80) {
        fillColor = colors.successLight
        textColor = colors.success
      } else if (pct >= 50) {
        fillColor = colors.warningLight
        textColor = colors.warning
      }
      
      blockSummarySheet[pctCell] = {
        ...blockSummarySheet[pctCell],
        s: {
          font: { bold: true, color: { rgb: textColor } },
          fill: { fgColor: { rgb: fillColor } }
        }
      }
    }
  }
  
  blockSummarySheet['!cols'] = [
    { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 22 }, { wch: 14 },
  ]

  XLSX.utils.book_append_sheet(workbook, blockSummarySheet, '📊 Block Summary')

  // ==================== SHEET 5: ISSUE TYPE ANALYSIS ====================
  const issueTypeStats: Record<string, number> = {}
  ;(data.issues || [])
    .filter((i: Issue) => i.status === 'approved')
    .forEach((issue: Issue) => {
      issueTypeStats[issue.issue_type] = (issueTypeStats[issue.issue_type] || 0) + 1
    })

  const issueTypeData = [
    ['📈 Issue Type Analysis'],
    ['Issue Type', 'Count', 'Percentage', 'Visual'],
    ...Object.entries(issueTypeStats)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => {
        const pct = data.summary.approved_issues > 0 
          ? ((count / data.summary.approved_issues) * 100).toFixed(1)
          : '0'
        const bars = '█'.repeat(Math.round(parseInt(pct) / 10))
        return [type, count.toString(), `${pct}%`, bars]
      }),
  ]

  const issueTypeSheet = XLSX.utils.aoa_to_sheet(issueTypeData)
  
  issueTypeSheet['A1'] = { 
    ...issueTypeSheet['A1'], 
    s: { 
      font: { bold: true, sz: 14, color: { rgb: colors.header } },
      fill: { fgColor: { rgb: colors.primaryLight } }
    }
  }
  
  const analysisHeaderRow = 2
  for (let col = 0; col < 4; col++) {
    const cell = String.fromCharCode(65 + col) + analysisHeaderRow
    if (issueTypeSheet[cell]) {
      issueTypeSheet[cell] = {
        ...issueTypeSheet[cell],
        s: {
          font: { bold: true, color: { rgb: colors.headerText } },
          fill: { fgColor: { rgb: colors.primary } }
        }
      }
    }
  }
  
  // Style bars
  for (let row = 3; row <= issueTypeData.length; row++) {
    const barCell = 'D' + row
    if (issueTypeSheet[barCell]) {
      issueTypeSheet[barCell] = {
        ...issueTypeSheet[barCell],
        s: {
          font: { color: { rgb: colors.primary } },
          fill: { fgColor: { rgb: colors.primaryLight } }
        }
      }
    }
  }
  
  issueTypeSheet['!cols'] = [
    { wch: 35 }, { wch: 10 }, { wch: 12 }, { wch: 20 },
  ]

  XLSX.utils.book_append_sheet(workbook, issueTypeSheet, '📈 Issue Analysis')

  // ==================== GENERATE BUFFER ====================
  const buffer = XLSX.write(workbook, {
    type: 'buffer',
    bookType: 'xlsx',
    cellStyles: true,
  })

  return buffer
}