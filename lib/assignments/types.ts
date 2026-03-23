export type AssignmentCategoryKey =
  | 'not_assigned_not_covered'
  | 'assigned_not_covered'
  | 'assigned_covered'

export type AssignmentAnomalyKey = 'unassigned_but_covered'

export type AssignmentRoomStatus =
  | AssignmentCategoryKey
  | AssignmentAnomalyKey

export interface RoomUniverseItem {
  block: string
  floor: string
  room_number: string
  room_order: number
  floor_order: number
}

export interface RoomAssignmentRow {
  id: string
  date: string
  block: string
  floor: string
  room_number: string
  marshal_id: string
  marshal_name?: string | null
  assigned_at?: string | null
  assigned_by?: string | null
  copied_from_date?: string | null
  copied_from_assignment_id?: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface RoomInspectionRow {
  id: string
  date: string
  block: string
  floor: string
  room_number: string
  marshal_id?: string | null
  marshal_name?: string | null
  has_issues?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export interface AssignmentMarshal {
  marshal_id: string
  marshal_name: string
  is_active: boolean
  sources: string[]
}

export interface AssignmentRoomState extends RoomUniverseItem {
  category: AssignmentRoomStatus
  assignment: RoomAssignmentRow | null
  inspection: RoomInspectionRow | null
}
