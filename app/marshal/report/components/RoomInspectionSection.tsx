'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, DoorOpen, Plus, Trash2 } from 'lucide-react'
import { ISSUE_TYPES } from '@/lib/utils/constants'
import { ROOM_DEFAULTS_BY_FLOOR, RoomFeatureDefaults } from '@/lib/utils/room-defaults'

export interface RoomIssue {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
}

export interface RoomInspection {
  room: string
  features: Omit<RoomFeatureDefaults, 'room'>
  hasIssues: boolean | null
  issues: RoomIssue[]
}

interface Props {
  block: string
  floor: string
  disabled?: boolean
  onChange: (inspections: RoomInspection[]) => void
}

const featureKeys: Array<keyof Omit<RoomFeatureDefaults, 'room'>> = [
  'tableTop', 'chairs', 'lights', 'fans', 'ac', 'projector', 'podium', 'speakers', 'cement', 'dustbin', 'amplifier', 'extraPlugs', 'houseCode',
]

const featureLabels: Record<keyof Omit<RoomFeatureDefaults, 'room'>, string> = {
  tableTop: 'Table Top', chairs: "Chair's Qty", lights: 'Lights', fans: 'Fans', ac: 'AC', projector: 'Projector', podium: 'Podium',
  speakers: 'Speakers', cement: 'Cement', dustbin: 'Dust Bin', amplifier: 'Amplifier', extraPlugs: 'Extra Plugs', houseCode: 'House Code',
}

const toInspection = (room: RoomFeatureDefaults): RoomInspection => ({
  room: room.room,
  features: {
    tableTop: room.tableTop,
    chairs: room.chairs,
    lights: room.lights,
    fans: room.fans,
    ac: room.ac,
    projector: room.projector,
    podium: room.podium,
    speakers: room.speakers,
    cement: room.cement,
    dustbin: room.dustbin,
    amplifier: room.amplifier,
    extraPlugs: room.extraPlugs,
    houseCode: room.houseCode,
  },
  hasIssues: null,
  issues: [],
})

export default function RoomInspectionSection({ block, floor, disabled = false, onChange }: Props) {
  const rooms = useMemo(() => ROOM_DEFAULTS_BY_FLOOR[floor] || [], [floor])
  const [inspections, setInspections] = useState<RoomInspection[]>(() => rooms.map(toInspection))
  const [selectedRoom, setSelectedRoom] = useState(() => rooms[0]?.room || '')

  useEffect(() => {
    onChange(inspections)
  }, [inspections, onChange])

  const currentInspection = inspections.find((i) => i.room === selectedRoom)

  const updateInspection = (room: string, updater: (inspection: RoomInspection) => RoomInspection) => {
    setInspections((prev) => prev.map((item) => (item.room === room ? updater(item) : item)))
  }

  const isRoomInfoComplete = (inspection: RoomInspection) => featureKeys.every((key) => inspection.features[key]?.toString().trim())

  return (
    <div>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: '600', color: '#1a1208', margin: '0 0 8px' }}>
        Room-wise Inspection
      </h3>
      <p style={{ margin: '0 0 14px', color: '#7a6a55', fontSize: '0.84rem' }}>
        Block {block}, Floor {floor}. Select each room, verify default values, then submit issues for that room.
      </p>

      {rooms.length === 0 ? (
        <p style={{ margin: 0, color: '#7a6a55' }}>No rooms configured for this floor.</p>
      ) : (
        <>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
            <DoorOpen size={13} color="#B4651E" />
            Room
          </label>

          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <select value={selectedRoom} onChange={(e) => setSelectedRoom(e.target.value)} disabled={disabled} style={{ width: '100%', padding: '12px 16px', border: '1.5px solid rgba(180,101,30,0.2)', borderRadius: '10px', backgroundColor: '#fffcf7', fontSize: '0.92rem', appearance: 'none' }}>
              {rooms.map(({ room }) => <option key={room} value={room}>Room {room}</option>)}
            </select>
            <ChevronDown size={16} color="#c4b5a0" style={{ position: 'absolute', right: 12, top: 14 }} />
          </div>

          {currentInspection && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '14px' }}>
                {featureKeys.map((key) => (
                  <div key={key} style={{ border: '1px solid rgba(180,101,30,0.12)', borderRadius: '8px', padding: '10px', backgroundColor: '#fffcf7' }}>
                    <p style={{ margin: '0 0 4px', fontSize: '0.73rem', color: '#7a6a55', textTransform: 'uppercase' }}>{featureLabels[key]}</p>
                    <input
                      value={currentInspection.features[key]}
                      disabled={disabled}
                      onChange={(e) => updateInspection(currentInspection.room, (item) => ({ ...item, features: { ...item.features, [key]: e.target.value } }))}
                      style={{ width: '100%', border: '1.5px solid rgba(180,101,30,0.2)', borderRadius: '8px', padding: '8px 9px', backgroundColor: 'white' }}
                    />
                  </div>
                ))}
              </div>

              {isRoomInfoComplete(currentInspection) ? (
                <div style={{ borderTop: '1px solid rgba(180,101,30,0.12)', paddingTop: '14px' }}>
                  <p style={{ color: '#7a6a55', margin: '0 0 10px', fontSize: '0.9rem' }}>Any issue in Room {currentInspection.room}?</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <button type="button" disabled={disabled} onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, hasIssues: true }))} style={{ padding: '10px', borderRadius: '10px', border: currentInspection.hasIssues ? '2px solid #B4651E' : '1px solid rgba(180,101,30,0.15)', backgroundColor: currentInspection.hasIssues ? '#fdf6ef' : 'white' }}>Yes</button>
                    <button type="button" disabled={disabled} onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, hasIssues: false, issues: [] }))} style={{ padding: '10px', borderRadius: '10px', border: currentInspection.hasIssues === false ? '2px solid #16a34a' : '1px solid rgba(180,101,30,0.15)', backgroundColor: currentInspection.hasIssues === false ? '#f0fdf4' : 'white' }}>No</button>
                  </div>

                  {currentInspection.hasIssues && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {currentInspection.issues.map((issue) => (
                        <div key={issue.id} style={{ border: '1px solid rgba(180,101,30,0.12)', borderRadius: '10px', padding: '10px', backgroundColor: '#fffcf7' }}>
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px', marginBottom: '8px' }}>
                            <select value={issue.issue_type} disabled={disabled} onChange={(e) => updateInspection(currentInspection.room, (item) => ({ ...item, issues: item.issues.map((x) => x.id === issue.id ? { ...x, issue_type: e.target.value } : x) }))} style={{ padding: '10px', border: '1.5px solid rgba(180,101,30,0.2)', borderRadius: '8px' }}>
                              <option value="">Select issue type</option>
                              {Object.entries(ISSUE_TYPES).map(([category, types]) => (
                                <optgroup key={category} label={category}>
                                  {(types as readonly string[]).map((type) => {
                                    const value = type === category ? category : `${category} - ${type}`
                                    const label = type === category ? category : type
                                    return <option key={value} value={value}>{label}</option>
                                  })}
                                </optgroup>
                              ))}
                            </select>
                            <button type="button" disabled={disabled} onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, issues: item.issues.filter((x) => x.id !== issue.id) }))} style={{ border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626', borderRadius: '8px', padding: '0 10px', backgroundColor: '#fff' }}><Trash2 size={14} /></button>
                          </div>
                          <textarea value={issue.description} disabled={disabled} onChange={(e) => updateInspection(currentInspection.room, (item) => ({ ...item, issues: item.issues.map((x) => x.id === issue.id ? { ...x, description: e.target.value } : x) }))} rows={3} placeholder="Describe the issue" style={{ width: '100%', border: '1.5px solid rgba(180,101,30,0.2)', borderRadius: '8px', padding: '10px' }} />
                        </div>
                      ))}

                      <button type="button" disabled={disabled} onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, issues: [...item.issues, { id: Date.now(), issue_type: '', description: '', is_movable: false }] }))} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', width: 'fit-content', padding: '8px 12px', borderRadius: '8px', border: 'none', backgroundColor: '#B4651E', color: 'white' }}>
                        <Plus size={14} /> Add Issue for Room {currentInspection.room}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', borderRadius: '10px', backgroundColor: '#fef3c7', color: '#92400e' }}>
                  <AlertTriangle size={16} />
                  Complete all room fields to unlock issue reporting.
                </div>
              )}
            </>
          )}

          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#166534' }}>
            <CheckCircle2 size={15} /> Rooms configured: {rooms.length}
          </div>
        </>
      )}
    </div>
  )
}
