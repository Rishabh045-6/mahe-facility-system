import type { Block } from '@/lib/utils/constants'

export type RoomInspection = {
  room_number: string
  tables: number
  chairs: number
  lights: number
  fans: number
  ac: number
  projector: number
  podium: number
  speakers: number
  dustbin: number
  amplifier: number
  extra_plug: number
  house_code: string
  has_issues: boolean
  issue_notes: string
}

const BASE_DEFAULTS: Omit<RoomInspection, 'room_number'> = {
  tables: 20,
  chairs: 40,
  lights: 6,
  fans: 4,
  ac: 1,
  projector: 1,
  podium: 1,
  speakers: 2,
  dustbin: 1,
  amplifier: 1,
  extra_plug: 2,
  house_code: '',
  has_issues: false,
  issue_notes: '',
}

// Optional overrides per block/floor/room.
// Fill as needed:
// ROOM_DEFAULT_OVERRIDES.AB4['2']['201'] = { chairs: 60, tables: 30 }
const ROOM_DEFAULT_OVERRIDES: Partial<
  Record<Block, Record<string, Record<string, Partial<Omit<RoomInspection, 'room_number'>>>>>
> = {
  AB4: {},
  AB5: {},
}

export function getRoomDefaults(block: Block, floor: string, room: string): RoomInspection {
  const override = ROOM_DEFAULT_OVERRIDES?.[block]?.[floor]?.[room] ?? {}

  return {
    room_number: room,
    ...BASE_DEFAULTS,
    ...override,
  }
}