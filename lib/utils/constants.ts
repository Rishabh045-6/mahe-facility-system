// lib/utils/constants.ts

export const BLOCKS = ['AB4', 'AB5'] as const
export type Block = typeof BLOCKS[number]

// Floor configurations per block
export const FLOOR_CONFIG: Record<Block, readonly string[]> = {
  AB4: ['1', '2', '3', '4', '5', '6'],
  AB5: ['0', '1', '2', '3', '4', '5'], // Floor 0 exists in AB5
} as const

export const ROOM_NUMBERS: Record<Block, Record<string, string[]>> = {
  AB4: {
    '1': [
      '101', '102', 'Library', 'Admin',
    ],
    '2': [
      '201', '202', '203', '204', '205', '206', '207', '208', '209',
      '210', '211', '212', '213', '214', '215', '216', '217', '218',
    ],
    '3': [
      '301', '302', '303', '304', '305', '306', '307', '308', '309',
      '310', '311', '312', '313', '314', '315', '316', '317', '318',
    ],
    '4': [
      '401', '402', '403', '404', '405', '406', '407', '408', '409',
      '410', '411', '412', '413', '414', '415',
    ],
    '5': [
      '501', '502', '503', '504',
      'Faculty Zone 1', 'Faculty Zone 2', 'Library', 'Meeting Room',
    ],
    '6': [
      '601', 'Board Room',
      'Faculty Zone 3', 'Faculty Zone 4', 'Faculty Zone 5',
      'Office of Deputy Registrar Evaluation',
    ],
  },
  AB5: {
    '0': [
      'Interview Cabin 1', 'Interview Cabin 2', 'Interview Cabin 3',
      'Interview Cabin 4', 'Interview Cabin 5', 'Interview Cabin 6',
      'Interview Cabin 7', 'Interview Cabin 8', 'Interview Cabin 9',
      'Interview Cabin 10', 'Interview Cabin 11',
      'Board Room 1', 'Mavro',
    ],
    '1': [
      '101', '102', '103', '104', '105', '106', '107', '108', '109',
    ],
    '2': [
      '201', '202', '203', '204', '205', '206',
      '207', '208', '209', '210', '211', '212',
    ],
    '3': [
      '301', '302',
      '309', '310', '311', '312', '313', '314', '315', '316',
    ],
    '4': [
      'Faculty Room',
    ],
    '5': [
      'Faculty Room',
    ],
  },
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
  'Classroom/Lab Upkeep',
  'Washroom & Utility',
  'Maintenance/Snag',
  'Daily Observations',
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
export const TARGET_COMPRESSED_SIZE_KB = 300

// Auto-save interval
export const AUTO_SAVE_INTERVAL_MS = 10000 // 10 seconds