import { createClient } from '@/lib/supabase/server'
import {
  buildRoomUniverse,
  getConsecutiveRooms,
  getRoomsForFloor,
  isValidBlock,
  isValidFloor,
  isValidRoom,
  makeRoomKey,
} from './room-universe'
import { getAssignableMarshalById } from './marshal-compat'
import type {
  AssignmentMarshal,
  AssignmentRoomState,
  RoomAssignmentRow,
  RoomInspectionRow,
} from './types'

type ServerSupabaseClient = Awaited<ReturnType<typeof createClient>>

export class AssignmentApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type Scope = {
  block?: string
  floor?: string
}

interface CopyPreviewItem {
  block: string
  floor: string
  room_number: string
  marshal_id: string
  marshal_name: string
  status: 'will_copy' | 'skipped_existing' | 'skipped_covered'
}

interface ConsecutivePreviewItem {
  room_number: string
  status: 'assignable' | 'skipped_assigned' | 'skipped_covered'
  existing_assignment?: {
    marshal_id: string
    marshal_name: string
  }
  inspection?: {
    marshal_id: string | null
    marshal_name: string | null
    has_issues: boolean
    created_at: string | null
  }
}

export async function requireAdminUser(supabase: ServerSupabaseClient) {
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user?.email) {
    throw new AssignmentApiError(401, 'Unauthorized')
  }

  return {
    email: data.user.email.toLowerCase(),
    userId: data.user.id,
  }
}

export function ensureValidDateString(value: unknown, fieldName = 'date'): string {
  const date = String(value ?? '').trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new AssignmentApiError(400, `Invalid ${fieldName}`)
  }
  return date
}

export function normalizeLocationInput(input: {
  block?: unknown
  floor?: unknown
  room_number?: unknown
}) {
  const block = String(input.block ?? '').trim()
  const floor = String(input.floor ?? '').trim()
  const room_number = String(input.room_number ?? '').trim()

  if (!isValidBlock(block)) {
    throw new AssignmentApiError(400, 'Invalid block')
  }

  if (!isValidFloor(block, floor)) {
    throw new AssignmentApiError(400, 'Invalid floor for selected block')
  }

  if (room_number && !isValidRoom(block, floor, room_number)) {
    throw new AssignmentApiError(400, 'Invalid room for selected block and floor')
  }

  return { block, floor, room_number }
}

export function normalizeScope(input: {
  block?: unknown
  floor?: unknown
}): Scope {
  const block = input.block == null ? '' : String(input.block).trim()
  const floor = input.floor == null ? '' : String(input.floor).trim()

  if (!block && floor) {
    throw new AssignmentApiError(400, 'Floor filter requires block filter')
  }

  if (block && !isValidBlock(block)) {
    throw new AssignmentApiError(400, 'Invalid block filter')
  }

  if (block && floor && !isValidFloor(block, floor)) {
    throw new AssignmentApiError(400, 'Invalid floor filter')
  }

  return {
    block: block || undefined,
    floor: floor || undefined,
  }
}

async function fetchAssignmentsForDate(
  supabase: ServerSupabaseClient,
  date: string,
  scope?: Scope
): Promise<RoomAssignmentRow[]> {
  let query = supabase
    .from('room_assignments')
    .select('*')
    .eq('date', date)

  if (scope?.block) query = query.eq('block', scope.block)
  if (scope?.floor) query = query.eq('floor', scope.floor)

  const { data, error } = await query
  if (error) throw new AssignmentApiError(500, `Failed to load assignments: ${error.message}`)

  return (data ?? []) as RoomAssignmentRow[]
}

async function fetchInspectionsForDate(
  supabase: ServerSupabaseClient,
  date: string,
  scope?: Scope
): Promise<RoomInspectionRow[]> {
  let query = supabase
    .from('room_inspections')
    .select('id, date, block, floor, room_number, marshal_id, marshal_name, has_issues, created_at, updated_at')
    .eq('date', date)
    .order('created_at', { ascending: false })

  if (scope?.block) query = query.eq('block', scope.block)
  if (scope?.floor) query = query.eq('floor', scope.floor)

  const { data, error } = await query
  if (error) throw new AssignmentApiError(500, `Failed to load room inspections: ${error.message}`)

  return (data ?? []) as RoomInspectionRow[]
}

function buildAssignmentMap(assignments: RoomAssignmentRow[]) {
  return new Map(assignments.map(assignment => [
    makeRoomKey(assignment.block, assignment.floor, assignment.room_number),
    assignment,
  ]))
}

function buildInspectionMap(inspections: RoomInspectionRow[]) {
  const map = new Map<string, RoomInspectionRow>()

  for (const inspection of inspections) {
    const key = makeRoomKey(inspection.block, inspection.floor, inspection.room_number)
    if (!map.has(key)) {
      map.set(key, inspection)
    }
  }

  return map
}

export async function ensureMarshalExists(
  supabase: ServerSupabaseClient,
  marshalId: unknown
): Promise<AssignmentMarshal> {
  const resolvedMarshalId = String(marshalId ?? '').trim()
  if (!resolvedMarshalId) {
    throw new AssignmentApiError(400, 'marshal_id is required')
  }

  const marshal = await getAssignableMarshalById(supabase, resolvedMarshalId)
  if (!marshal) {
    throw new AssignmentApiError(404, 'Marshal not found')
  }

  return marshal
}

export async function ensureRoomNotCovered(
  supabase: ServerSupabaseClient,
  date: string,
  block: string,
  floor: string,
  room_number: string
): Promise<void> {
  const { data, error } = await supabase
    .from('room_inspections')
    .select('id')
    .eq('date', date)
    .eq('block', block)
    .eq('floor', floor)
    .eq('room_number', room_number)
    .limit(1)

  if (error) {
    throw new AssignmentApiError(500, `Failed to check room coverage: ${error.message}`)
  }

  if ((data ?? []).length > 0) {
    throw new AssignmentApiError(409, 'Cannot change assignment for a room that is already covered')
  }
}

export async function buildDashboardState(
  supabase: ServerSupabaseClient,
  date: string
) {
  const roomUniverse = buildRoomUniverse()
  const assignments = await fetchAssignmentsForDate(supabase, date)
  const inspections = await fetchInspectionsForDate(supabase, date)

  const assignmentMap = buildAssignmentMap(assignments)
  const inspectionMap = buildInspectionMap(inspections)

  const states: AssignmentRoomState[] = roomUniverse.map(room => {
    const key = makeRoomKey(room.block, room.floor, room.room_number)
    const assignment = assignmentMap.get(key) ?? null
    const inspection = inspectionMap.get(key) ?? null

    let category: AssignmentRoomState['category']
    if (!assignment && !inspection) {
      category = 'not_assigned_not_covered'
    } else if (assignment && !inspection) {
      category = 'assigned_not_covered'
    } else if (assignment && inspection) {
      category = 'assigned_covered'
    } else {
      category = 'unassigned_but_covered'
    }

    return {
      ...room,
      category,
      assignment,
      inspection,
    }
  })

  const categories = {
    not_assigned_not_covered: states.filter(room => room.category === 'not_assigned_not_covered'),
    assigned_not_covered: states.filter(room => room.category === 'assigned_not_covered'),
    assigned_covered: states.filter(room => room.category === 'assigned_covered'),
  }

  const anomalies = {
    unassigned_but_covered: states.filter(room => room.category === 'unassigned_but_covered'),
  }

  const floors = states.reduce((acc, room) => {
    const key = `${room.block}|${room.floor}`
    if (!acc.has(key)) {
      acc.set(key, {
        block: room.block,
        floor: room.floor,
        counts: {
          total_rooms: 0,
          not_assigned_not_covered: 0,
          assigned_not_covered: 0,
          assigned_covered: 0,
          unassigned_but_covered: 0,
        },
        rooms: [] as AssignmentRoomState[],
      })
    }

    const floorEntry = acc.get(key)!
    floorEntry.counts.total_rooms += 1
    floorEntry.counts[room.category] += 1
    floorEntry.rooms.push(room)
    return acc
  }, new Map<string, {
    block: string
    floor: string
    counts: {
      total_rooms: number
      not_assigned_not_covered: number
      assigned_not_covered: number
      assigned_covered: number
      unassigned_but_covered: number
    }
    rooms: AssignmentRoomState[]
  }>())

  return {
    date,
    summary: {
      total_rooms: states.length,
      not_assigned_not_covered: categories.not_assigned_not_covered.length,
      assigned_not_covered: categories.assigned_not_covered.length,
      assigned_covered: categories.assigned_covered.length,
      anomalies: anomalies.unassigned_but_covered.length,
    },
    categories,
    anomalies,
    floors: [...floors.values()],
  }
}


export async function clearAssignmentsForDate(
  supabase: ServerSupabaseClient,
  input: {
    date: unknown
  }
) {
  const date = ensureValidDateString(input.date)

  const { error } = await supabase
    .from('room_assignments')
    .delete()
    .eq('date', date)

  if (error) {
    throw new AssignmentApiError(500, `Failed to clear assignments: ${error.message}`)
  }

  return {
    success: true,
    date,
  }
}

export async function clearAssignmentsForFloor(
  supabase: ServerSupabaseClient,
  input: {
    date: unknown
    block: unknown
    floor: unknown
  }
) {
  const date = ensureValidDateString(input.date)
  const { block, floor } = normalizeLocationInput({
    block: input.block,
    floor: input.floor,
  })

  const { error } = await supabase
    .from('room_assignments')
    .delete()
    .eq('date', date)
    .eq('block', block)
    .eq('floor', floor)

  if (error) {
    throw new AssignmentApiError(500, `Failed to clear floor assignments: ${error.message}`)
  }

  return {
    success: true,
    date,
    block,
    floor,
  }
}

function applyScopeToRows<T extends { block: string; floor: string }>(rows: T[], scope: Scope) {
  return rows.filter(row => {
    if (scope.block && row.block !== scope.block) return false
    if (scope.floor && row.floor !== scope.floor) return false
    return true
  })
}

export async function previewCopyAssignments(
  supabase: ServerSupabaseClient,
  input: {
    source_date: unknown
    target_date: unknown
    block?: unknown
    floor?: unknown
  }
) {
  const sourceDate = ensureValidDateString(input.source_date, 'source_date')
  const targetDate = ensureValidDateString(input.target_date, 'target_date')
  const scope = normalizeScope(input)

  if (sourceDate === targetDate) {
    throw new AssignmentApiError(400, 'source_date and target_date must be different')
  }

  const sourceRows = applyScopeToRows(
    await fetchAssignmentsForDate(supabase, sourceDate),
    scope
  )

  if (sourceRows.length === 0) {
    throw new AssignmentApiError(404, 'No source assignments found for the selected scope')
  }

  const targetAssignments = buildAssignmentMap(await fetchAssignmentsForDate(supabase, targetDate, scope))
  const targetInspections = buildInspectionMap(await fetchInspectionsForDate(supabase, targetDate, scope))

  const items: CopyPreviewItem[] = sourceRows
    .slice()
    .sort((a, b) => {
      const blockCompare = a.block.localeCompare(b.block)
      if (blockCompare !== 0) return blockCompare
      const floorCompare = a.floor.localeCompare(b.floor, undefined, { numeric: true })
      if (floorCompare !== 0) return floorCompare

      const roomOrder = getRoomsForFloor(a.block, a.floor)
      return roomOrder.indexOf(a.room_number) - roomOrder.indexOf(b.room_number)
    })
    .map(row => {
      const key = makeRoomKey(row.block, row.floor, row.room_number)
      const isCovered = targetInspections.has(key)
      const isAssigned = targetAssignments.has(key)

      let status: CopyPreviewItem['status'] = 'will_copy'
      if (isCovered) {
        status = 'skipped_covered'
      } else if (isAssigned) {
        status = 'skipped_existing'
      }

      return {
        block: row.block,
        floor: row.floor,
        room_number: row.room_number,
        marshal_id: row.marshal_id,
        marshal_name: row.marshal_name || row.marshal_id,
        status,
      }
    })

  return {
    source_date: sourceDate,
    target_date: targetDate,
    scope,
    mode: 'merge_skip',
    summary: {
      source_rows: sourceRows.length,
      target_existing: items.filter(item => item.status === 'skipped_existing').length,
      target_covered: items.filter(item => item.status === 'skipped_covered').length,
      will_copy: items.filter(item => item.status === 'will_copy').length,
      will_skip: items.filter(item => item.status !== 'will_copy').length,
    },
    items,
  }
}

export async function executeCopyAssignments(
  supabase: ServerSupabaseClient,
  adminEmail: string,
  input: {
    source_date: unknown
    target_date: unknown
    block?: unknown
    floor?: unknown
    mode?: unknown
  }
) {
  const mode = String(input.mode ?? 'merge_skip')
  if (mode !== 'merge_skip') {
    throw new AssignmentApiError(400, 'Only merge_skip mode is supported')
  }

  const preview = await previewCopyAssignments(supabase, input)
  const sourceAssignments = await fetchAssignmentsForDate(supabase, preview.source_date, preview.scope)

  const copyableKeys = new Set(
    preview.items
      .filter(item => item.status === 'will_copy')
      .map(item => makeRoomKey(item.block, item.floor, item.room_number))
  )

  const rowsToInsert = sourceAssignments
    .filter(row => copyableKeys.has(makeRoomKey(row.block, row.floor, row.room_number)))
    .map(row => ({
      date: preview.target_date,
      block: row.block,
      floor: row.floor,
      room_number: row.room_number,
      marshal_id: row.marshal_id,
      marshal_name: row.marshal_name || row.marshal_id,
      assigned_at: new Date().toISOString(),
      assigned_by: adminEmail,
      copied_from_date: preview.source_date,
      copied_from_assignment_id: row.id,
      updated_at: new Date().toISOString(),
    }))

  if (rowsToInsert.length > 0) {
    const { error } = await supabase
      .from('room_assignments')
      .insert(rowsToInsert)

    if (error) {
      throw new AssignmentApiError(500, `Failed to copy assignments: ${error.message}`)
    }
  }

  return {
    success: true,
    source_date: preview.source_date,
    target_date: preview.target_date,
    scope: preview.scope,
    mode: preview.mode,
    summary: {
      copied: rowsToInsert.length,
      skipped_existing: preview.summary.target_existing,
      skipped_covered: preview.summary.target_covered,
    },
    items: preview.items,
  }
}

export async function previewConsecutiveAssignments(
  supabase: ServerSupabaseClient,
  input: {
    date: unknown
    block: unknown
    floor: unknown
    starting_room: unknown
    marshal_id: unknown
    room_count: unknown
  }
) {
  const date = ensureValidDateString(input.date)
  const { block, floor } = normalizeLocationInput({
    block: input.block,
    floor: input.floor,
    room_number: input.starting_room,
  })
  const startingRoom = String(input.starting_room ?? '').trim()
  const marshal = await ensureMarshalExists(supabase, input.marshal_id)
  const roomCount = Number(input.room_count)

  if (!Number.isInteger(roomCount)) {
    throw new AssignmentApiError(400, 'room_count must be an integer')
  }

  if (roomCount < 1) {
    throw new AssignmentApiError(400, 'room_count must be at least 1')
  }

  const floorRooms = getRoomsForFloor(block, floor)
  const startIndex = floorRooms.indexOf(startingRoom)
  if (startIndex === -1) {
    throw new AssignmentApiError(400, 'Invalid starting room for the selected block and floor')
  }

  const remainingRooms = floorRooms.length - startIndex
  if (roomCount > remainingRooms) {
    throw new AssignmentApiError(400, 'Requested room_count exceeds remaining rooms from the selected starting room')
  }

  const targetRooms = getConsecutiveRooms(block, floor, startingRoom, roomCount)
  if (!targetRooms) {
    throw new AssignmentApiError(400, 'Failed to resolve consecutive rooms for the selected inputs')
  }

  const targetAssignments = buildAssignmentMap(await fetchAssignmentsForDate(supabase, date, { block, floor }))
  const targetInspections = buildInspectionMap(await fetchInspectionsForDate(supabase, date, { block, floor }))

  const rooms: ConsecutivePreviewItem[] = targetRooms.map(roomNumber => {
    const key = makeRoomKey(block, floor, roomNumber)
    const assignment = targetAssignments.get(key) ?? null
    const inspection = targetInspections.get(key) ?? null

    if (inspection) {
      return {
        room_number: roomNumber,
        status: 'skipped_covered',
        inspection: {
          marshal_id: inspection.marshal_id ?? null,
          marshal_name: inspection.marshal_name ?? null,
          has_issues: inspection.has_issues === true,
          created_at: inspection.created_at ?? null,
        },
      }
    }

    if (assignment) {
      return {
        room_number: roomNumber,
        status: 'skipped_assigned',
        existing_assignment: {
          marshal_id: assignment.marshal_id,
          marshal_name: assignment.marshal_name || assignment.marshal_id,
        },
      }
    }

    return {
      room_number: roomNumber,
      status: 'assignable',
    }
  })

  return {
    date,
    block,
    floor,
    starting_room: startingRoom,
    room_count: roomCount,
    marshal: {
      marshal_id: marshal.marshal_id,
      marshal_name: marshal.marshal_name,
    },
    target_rooms: targetRooms,
    summary: {
      total_targeted: targetRooms.length,
      assignable: rooms.filter(room => room.status === 'assignable').length,
      skipped_assigned: rooms.filter(room => room.status === 'skipped_assigned').length,
      skipped_covered: rooms.filter(room => room.status === 'skipped_covered').length,
    },
    rooms,
  }
}

export async function executeConsecutiveAssignments(
  supabase: ServerSupabaseClient,
  adminEmail: string,
  input: {
    date: unknown
    block: unknown
    floor: unknown
    starting_room: unknown
    marshal_id: unknown
    room_count: unknown
    mode?: unknown
  }
) {
  const mode = String(input.mode ?? 'merge_skip')
  if (mode !== 'merge_skip') {
    throw new AssignmentApiError(400, 'Only merge_skip mode is supported')
  }

  const preview = await previewConsecutiveAssignments(supabase, input)
  const rowsToInsert = preview.rooms
    .filter(room => room.status === 'assignable')
    .map(room => ({
      date: preview.date,
      block: preview.block,
      floor: preview.floor,
      room_number: room.room_number,
      marshal_id: preview.marshal.marshal_id,
      marshal_name: preview.marshal.marshal_name,
      assigned_at: new Date().toISOString(),
      assigned_by: adminEmail,
      updated_at: new Date().toISOString(),
    }))

  if (rowsToInsert.length > 0) {
    const { error } = await supabase
      .from('room_assignments')
      .insert(rowsToInsert)

    if (error) {
      throw new AssignmentApiError(500, `Failed to assign consecutive rooms: ${error.message}`)
    }
  }

  return {
    success: true,
    date: preview.date,
    effective_date: preview.date,
    block: preview.block,
    floor: preview.floor,
    room_count: preview.room_count,
    marshal: preview.marshal,
    target_rooms: preview.target_rooms,
    summary: {
      assigned: rowsToInsert.length,
      skipped_assigned: preview.summary.skipped_assigned,
      skipped_covered: preview.summary.skipped_covered,
    },
    rooms: preview.rooms,
  }
}
