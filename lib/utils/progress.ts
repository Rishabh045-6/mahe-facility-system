// lib/utils/progress.ts
import { BLOCKS, FLOOR_CONFIG, type Block } from './constants'

export type ProgressState = {
  completedFloors: Set<string> // format: "AB4-1", "AB5-6"
  totalFloors: number
}

const FLOORS = FLOOR_CONFIG[BLOCKS[0]] // ['1','2','3','4','5','6'] as const

export const TOTAL_FLOORS = BLOCKS.length * FLOORS.length

export const getFloorKey = (block: Block, floor: string): string => `${block}-${floor}`

export const calculateProgress = (completed: Set<string>): {
  count: number
  percentage: number
  label: string
} => {
  const count = completed.size
  const percentage = (count / TOTAL_FLOORS) * 100
  return {
    count,
    percentage: Math.min(percentage, 100),
    label: `${count}/${TOTAL_FLOORS}`,
  }
}

export const getNextLocation = (currentBlock: Block, currentFloor: string): {
  nextBlock: Block
  nextFloor: string
  isComplete: boolean
} => {
  const currentFloorIndex = FLOORS.indexOf(currentFloor)
  const currentBlockIndex = BLOCKS.indexOf(currentBlock)

  if (currentFloorIndex >= 0 && currentFloorIndex < FLOORS.length - 1) {
    return {
      nextBlock: currentBlock,
      nextFloor: FLOORS[currentFloorIndex + 1],
      isComplete: false,
    }
  }

  if (currentBlockIndex >= 0 && currentBlockIndex < BLOCKS.length - 1) {
    return {
      nextBlock: BLOCKS[currentBlockIndex + 1],
      nextFloor: FLOORS[0],
      isComplete: false,
    }
  }

  return {
    nextBlock: currentBlock,
    nextFloor: currentFloor,
    isComplete: true,
  }
}

export const loadProgressFromStorage = (marshalId: string): Set<string> => {
  if (typeof window === 'undefined') return new Set()
  const key = `progress_${marshalId}`
  const stored = localStorage.getItem(key)
  if (!stored) return new Set()

  try {
    const arr: string[] = JSON.parse(stored)
    return new Set(arr)
  } catch {
    return new Set()
  }
}

export const saveProgressToStorage = (marshalId: string, completed: Set<string>): void => {
  if (typeof window === 'undefined') return
  const key = `progress_${marshalId}`
  localStorage.setItem(key, JSON.stringify(Array.from(completed)))
}