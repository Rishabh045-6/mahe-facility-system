import { BLOCKS, FLOOR_CONFIG, ROOM_NUMBERS, type Block } from '@/lib/utils/constants'
import type { RoomUniverseItem } from './types'

export function getActiveBlocks(): readonly string[] {
  return BLOCKS
}

export function isValidBlock(block: string): block is Block {
  return BLOCKS.includes(block as Block)
}

export function getFloorsForBlock(block: string): readonly string[] {
  if (!isValidBlock(block)) return []
  return FLOOR_CONFIG[block]
}

export function isValidFloor(block: string, floor: string): boolean {
  return getFloorsForBlock(block).includes(floor)
}

export function getRoomsForFloor(block: string, floor: string): readonly string[] {
  if (!isValidBlock(block) || !isValidFloor(block, floor)) return []
  return ROOM_NUMBERS[block][floor] ?? []
}

export function isValidRoom(block: string, floor: string, roomNumber: string): boolean {
  return getRoomsForFloor(block, floor).includes(roomNumber)
}

export function buildRoomUniverse(): RoomUniverseItem[] {
  const rooms: RoomUniverseItem[] = []

  for (const block of BLOCKS) {
    const floors = FLOOR_CONFIG[block]
    floors.forEach((floor, floorOrder) => {
      const floorRooms = ROOM_NUMBERS[block][floor] ?? []
      floorRooms.forEach((room_number, roomOrder) => {
        rooms.push({
          block,
          floor,
          room_number,
          room_order: roomOrder,
          floor_order: floorOrder,
        })
      })
    })
  }

  return rooms
}

export function makeRoomKey(block: string, floor: string, roomNumber: string): string {
  return `${block}|${floor}|${roomNumber}`
}

export function getConsecutiveRooms(
  block: string,
  floor: string,
  startingRoom: string,
  count = 6
): string[] | null {
  const rooms = [...getRoomsForFloor(block, floor)]
  const startIndex = rooms.indexOf(startingRoom)

  if (startIndex === -1) return null

  const slice = rooms.slice(startIndex, startIndex + count)
  if (slice.length !== count) return null

  return slice
}
