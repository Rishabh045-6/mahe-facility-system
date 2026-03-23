import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { getAssignableMarshalById } from '@/lib/assignments/marshal-compat'
import { getFloorsForBlock, getRoomsForFloor, makeRoomKey } from '@/lib/assignments/room-universe'
import type { RoomAssignmentRow, RoomInspectionRow } from '@/lib/assignments/types'

function isValidDateString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const date = String(searchParams.get('date') ?? '').trim()
    const marshalId = String(searchParams.get('marshal_id') ?? '').trim()

    if (!isValidDateString(date)) {
      return NextResponse.json({ error: 'Invalid date' }, { status: 400 })
    }

    if (!marshalId) {
      return NextResponse.json({ error: 'marshal_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const marshal = await getAssignableMarshalById(supabase as never, marshalId)

    if (!marshal) {
      return NextResponse.json({ error: 'Marshal not found' }, { status: 404 })
    }

    const { data: assignmentRows, error: assignmentError } = await supabase
      .from('room_assignments')
      .select('*')
      .eq('date', date)
      .eq('marshal_id', marshalId)

    if (assignmentError) {
      return NextResponse.json(
        { error: `Failed to load assignments: ${assignmentError.message}` },
        { status: 500 }
      )
    }

    const assignments = (assignmentRows ?? []) as RoomAssignmentRow[]

    if (assignments.length === 0) {
      return NextResponse.json({
        date,
        marshal: {
          marshal_id: marshal.marshal_id,
          marshal_name: marshal.marshal_name,
        },
        summary: {
          total_assigned: 0,
          pending: 0,
          completed: 0,
        },
        groups: [],
      })
    }

    const { data: inspectionRows, error: inspectionError } = await supabase
      .from('room_inspections')
      .select('id, date, block, floor, room_number, marshal_id, marshal_name, has_issues, created_at, updated_at')
      .eq('date', date)
      .order('created_at', { ascending: false })

    if (inspectionError) {
      return NextResponse.json(
        { error: `Failed to load room inspections: ${inspectionError.message}` },
        { status: 500 }
      )
    }

    const inspections = (inspectionRows ?? []) as RoomInspectionRow[]
    const inspectionMap = new Map<string, RoomInspectionRow>()

    for (const inspection of inspections) {
      const key = makeRoomKey(inspection.block, inspection.floor, inspection.room_number)
      if (!inspectionMap.has(key)) {
        inspectionMap.set(key, inspection)
      }
    }

    const groupsByBlock = new Map<string, {
      block: string
      floors: Array<{
        floor: string
        pending_count: number
        completed_count: number
        rooms: Array<{
          room_number: string
          status: 'pending' | 'completed'
          assignment: {
            date: string
            block: string
            floor: string
            room_number: string
          }
          inspection: RoomInspectionRow | null
        }>
      }>
    }>()

    const byBlockFloor = new Map<string, RoomAssignmentRow[]>()
    for (const assignment of assignments) {
      const key = `${assignment.block}|${assignment.floor}`
      const list = byBlockFloor.get(key) ?? []
      list.push(assignment)
      byBlockFloor.set(key, list)
    }

    let pending = 0
    let completed = 0

    const blockOrder = assignments
      .map(item => item.block)
      .filter((value, index, array) => array.indexOf(value) === index)
      .sort()

    for (const block of blockOrder) {
      const floorGroups: Array<{
        floor: string
        pending_count: number
        completed_count: number
        rooms: Array<{
          room_number: string
          status: 'pending' | 'completed'
          assignment: {
            date: string
            block: string
            floor: string
            room_number: string
          }
          inspection: RoomInspectionRow | null
        }>
      }> = []

      const floorOrder = getFloorsForBlock(block)
      for (const floor of floorOrder) {
        const floorAssignments = byBlockFloor.get(`${block}|${floor}`) ?? []
        if (floorAssignments.length === 0) continue

        const roomOrder = getRoomsForFloor(block, floor)
        const sortedAssignments = floorAssignments.slice().sort((a, b) => (
          roomOrder.indexOf(a.room_number) - roomOrder.indexOf(b.room_number)
        ))

        const rooms = sortedAssignments.map((assignment) => {
          const inspection = inspectionMap.get(makeRoomKey(assignment.block, assignment.floor, assignment.room_number)) ?? null
          const status: "pending" | "completed" = inspection ? 'completed' : 'pending'

          if (status === 'completed') completed += 1
          else pending += 1

          return {
            room_number: assignment.room_number,
            status,
            assignment: {
              date: assignment.date,
              block: assignment.block,
              floor: assignment.floor,
              room_number: assignment.room_number,
            },
            inspection,
          }
        })

        floorGroups.push({
          floor,
          pending_count: rooms.filter(room => room.status === 'pending').length,
          completed_count: rooms.filter(room => room.status === 'completed').length,
          rooms,
        })
      }

      if (floorGroups.length > 0) {
        groupsByBlock.set(block, { block, floors: floorGroups })
      }
    }

    return NextResponse.json({
      date,
      marshal: {
        marshal_id: marshal.marshal_id,
        marshal_name: marshal.marshal_name,
      },
      summary: {
        total_assigned: assignments.length,
        pending,
        completed,
      },
      groups: [...groupsByBlock.values()],
    })
  } catch (error) {
    console.error('Marshal assignments error:', error)
    return NextResponse.json(
      { error: 'Failed to load marshal assignments' },
      { status: 500 }
    )
  }
}

