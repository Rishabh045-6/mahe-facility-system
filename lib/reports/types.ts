// lib/reports/types.ts
// ✅ Shared types for all report generators

export interface Issue {
  id: string
  block: string
  floor: string
  room_number?: string | null
  room_location?: string | null
  issue_type: string
  description: string
  is_movable: boolean
  images: string[]
  marshal_id: string
  marshal_name: string
  status: 'approved' | 'denied' | 'pending'
  reported_at: string
}

export interface RoomInspection {
  id: string
  block: string
  floor: string
  room_number: string
  feature_data: Record<string, any>
  has_issues: boolean
  marshal_id: string
  marshal_name: string
  created_at: string
}

// ✅ Match your ACTUAL database schema (no is_checked column)
export interface FloorCoverage {
  id: string
  date: string
  block: string
  floor: string
  marshal_id?: string
  marshal_name?: string
  submitted_at?: string
}

export interface ReportData {
  issues: Issue[]
  room_inspections: RoomInspection[]
  floor_coverage: FloorCoverage[]
  date: string
  summary: {
    total_issues: number
    approved_issues: number
    denied_issues: number
    total_rooms_inspected: number
    rooms_with_issues: number
    blocks_covered: string[]
  }
}