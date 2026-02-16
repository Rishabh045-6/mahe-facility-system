export const BLOCKS = ['AB1', 'AB2', 'AB3', 'AB4', 'AB5'] as const
export type Block = typeof BLOCKS[number]

// Floor configurations per block
export const FLOOR_CONFIG: Record<Block, readonly string[]> = {
  AB1: ['0', '1', '2', '3', '4', '5'],
  AB2: ['1', '2', '3', '4', '5', '6'],
  AB3: ['1', '2', '3', '4', '5', '6'],
  AB4: ['1', '2', '3', '4', '5', '6'],
  AB5: ['1', '2', '3', '4', '5', '6'],
} as const

export const ISSUE_TYPES = {
  'Electrical': ['Lights', 'Switches/Outlets', 'Wiring'],
  'Fans/Ventilation': ['Fans/Ventilation'],
  'Air Conditioning': ['Air Conditioning'],
  'Projector/AV Equipment': ['Projector/AV Equipment'],
  'Furniture': ['Chairs', 'Desks', 'Boards', 'Others'],
  'Plumbing/Washroom': ['Plumbing/Washroom'],
  'Doors/Locks': ['Doors/Locks'],
  'Windows': ['Windows'],
  'Cleanliness': ['Cleanliness'],
  'Safety Equipment': ['Safety Equipment'],
  'Structural Damage': ['Structural Damage'],
  'Others': ['Others'],
} as const

export const CHECKLIST_CATEGORIES = [
  'Daily Observations',
  'Classroom/Lab Upkeep',
  'Washroom & Utility',
  'Maintenance/Snag'
] as const

export const CHECKLIST_ITEMS = [
  // Daily Observations
  { id: 1, category: 'Daily Observations', text: 'All classrooms cleaned before 8:30 AM' },
  { id: 2, category: 'Daily Observations', text: 'Corridors, staircases, and lobbies mopped and dry' },
  { id: 3, category: 'Daily Observations', text: 'Dustbins cleaned and placed properly' },
  { id: 4, category: 'Daily Observations', text: 'Janitor room arranged and soft door closed' },
  { id: 5, category: 'Daily Observations', text: 'Washrooms cleaned (check every 2-3 hrs)' },
  { id: 6, category: 'Daily Observations', text: 'Mirrors, taps, and floor in washrooms cleaned' },
  { id: 7, category: 'Daily Observations', text: 'Fire extinguishers available and valid' },
  { id: 8, category: 'Daily Observations', text: 'No obstruction near exits or corridors' },
  
  // Classroom/Lab Upkeep
  { id: 9, category: 'Classroom/Lab Upkeep', text: 'Furniture arranged properly' },
  { id: 10, category: 'Classroom/Lab Upkeep', text: 'Fans, lights, and projectors working' },
  { id: 11, category: 'Classroom/Lab Upkeep', text: 'Windows, notice boards, and whiteboards cleaned' },
  { id: 12, category: 'Classroom/Lab Upkeep', text: 'No posters or stickers on walls' },
  { id: 13, category: 'Classroom/Lab Upkeep', text: 'Any maintenance issue reported' },
  
  // Washroom & Utility
  { id: 14, category: 'Washroom & Utility', text: 'Sufficient hand wash and tissue rolls available' },
  { id: 15, category: 'Washroom & Utility', text: 'Plumbing/leakage issues noted' },
  { id: 16, category: 'Washroom & Utility', text: 'Restroom door locks and lights working' },
  
  // Maintenance/Snag
  { id: 17, category: 'Maintenance/Snag', text: 'Daily snag list prepared and sent' },
  { id: 18, category: 'Maintenance/Snag', text: 'Follow-up on pending complaints' },
  { id: 19, category: 'Maintenance/Snag', text: 'Electrical and plumbing items checked' },
] as const

// Time constraints
export const REPORTING_DEADLINE_HOUR = 18 // 6 PM IST
export const REPORTING_DEADLINE_MINUTE = 0
export const GRACE_PERIOD_MINUTES = 15

// Storage configuration
export const STORAGE_BUCKET = 'facility-images'
export const MAX_IMAGES_PER_ISSUE = 10
export const MAX_IMAGE_SIZE_MB = 5
export const TARGET_COMPRESSED_SIZE_KB = 300 // Target ~300KB per image

// Auto-save interval
export const AUTO_SAVE_INTERVAL_MS = 10000 // 10