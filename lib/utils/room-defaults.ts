export interface RoomFeatureDefaults {
  room: string
  tableTop: string
  chairs: string
  lights: string
  fans: string
  ac: string
  projector: string
  podium: string
  speakers: string
  cement: string
  dustbin: string
  amplifier: string
  extraPlugs: string
  houseCode: string
}

const ROOM_SUFFIX_DEFAULTS = [
  { suffix: '01', tableTop: '9', chairs: '19 + 1 kids', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '01', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '02', tableTop: '1', chairs: 'Study chairs: 31', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '03', tableTop: '34', chairs: '69', lights: '8', fans: '4', ac: '2', projector: '1', podium: '1/1/1', speakers: '4+1', cement: '2', dustbin: '1', amplifier: '2', extraPlugs: '1', houseCode: '1' },
  { suffix: '04', tableTop: '34', chairs: '69', lights: '8', fans: '4', ac: '2', projector: '1', podium: '1/1/1', speakers: '4+1', cement: '2', dustbin: '1', amplifier: '1', extraPlugs: '-', houseCode: '1' },
  { suffix: '05', tableTop: '34', chairs: '69', lights: '8', fans: '4', ac: '2', projector: '1', podium: '1/1/1', speakers: '4', cement: '2', dustbin: '1', amplifier: '1', extraPlugs: '-', houseCode: '1' },
  { suffix: '06', tableTop: '34', chairs: '69', lights: '8', fans: '4', ac: '2', projector: '1', podium: '1/1/1', speakers: '2', cement: '2', dustbin: '1', amplifier: '0', extraPlugs: '-', houseCode: '1' },
  { suffix: '07', tableTop: '34', chairs: '69', lights: '8', fans: '4', ac: '2', projector: '1', podium: '1/1/1', speakers: '2', cement: '2', dustbin: '1', amplifier: 'Pins - 10', extraPlugs: '-', houseCode: '-' },
  { suffix: '08', tableTop: '11', chairs: '15', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '09', tableTop: '11', chairs: '15', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '01', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '10', tableTop: '8', chairs: '14 + 8 kids', lights: '2', fans: '2', ac: '1', projector: '01', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '11', tableTop: '1', chairs: 'Study chairs: 31', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '12', tableTop: '1', chairs: '31', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
  { suffix: '13', tableTop: '1', chairs: '31', lights: '2', fans: '2', ac: '1', projector: '1', podium: '-', speakers: '1', cement: '1', dustbin: '1', amplifier: '-', extraPlugs: '-', houseCode: '-' },
] as const

function makeFloorDefaults(floor: string): RoomFeatureDefaults[] {
  return ROOM_SUFFIX_DEFAULTS.map(({ suffix, ...rest }) => ({
    room: `${floor}${suffix}`,
    ...rest,
  }))
}

export const ROOM_DEFAULTS_BY_FLOOR: Record<string, RoomFeatureDefaults[]> = {
  '1': makeFloorDefaults('1'),
  '2': makeFloorDefaults('2'),
  '3': makeFloorDefaults('3'),
  '4': makeFloorDefaults('4'),
  '5': makeFloorDefaults('5'),
  '6': makeFloorDefaults('6'),
}
