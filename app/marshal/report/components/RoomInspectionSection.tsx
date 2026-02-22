'use client'

import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, ChevronDown, DoorOpen, Plus, Trash2 } from 'lucide-react'
import { ISSUE_TYPES, type Block } from '@/lib/utils/constants'
import { getRoomDefaults, type RoomInspection as RoomDefaults } from '@/lib/utils/room-default'

export interface RoomIssue {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
}

type RoomFeatures = Pick<
  RoomDefaults,
  | 'tables'
  | 'chairs'
  | 'lights'
  | 'fans'
  | 'ac'
  | 'projector'
  | 'podium'
  | 'speakers'
  | 'dustbin'
  | 'amplifier'
  | 'extra_plug'
  | 'house_code'
>

export interface RoomInspection {
  room: string
  features: RoomFeatures
  hasIssues: boolean | null
  issues: RoomIssue[]
}

interface Props {
  block: Block
  floor: string
  disabled?: boolean
  onChange: (inspections: RoomInspection[]) => void
}

/**
 * Room generator:
 * - If floor is "1" -> 101..199
 * - If floor is "2" -> 201..299
 * Adjust counts here if you want fewer rooms.
 */
function generateRoomsForFloor(floor: string, count = 20) {
  const f = Number(floor)
  if (!Number.isFinite(f) || f <= 0) return []
  const start = f * 100 + 1
  return Array.from({ length: count }, (_, i) => String(start + i))
}

type FeatureKey = keyof RoomFeatures & string

const featureKeys: FeatureKey[] = [
  'tables',
  'chairs',
  'lights',
  'fans',
  'ac',
  'projector',
  'podium',
  'speakers',
  'dustbin',
  'amplifier',
  'extra_plug',
  'house_code',
]

const featureLabels: Record<FeatureKey, string> = {
  tables: 'Tables',
  chairs: "Chair's Qty",
  lights: 'Lights',
  fans: 'Fans',
  ac: 'AC',
  projector: 'Projector',
  podium: 'Podium',
  speakers: 'Speakers',
  dustbin: 'Dust Bin',
  amplifier: 'Amplifier',
  extra_plug: 'Extra Plugs',
  house_code: 'House Code',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  border: '1.5px solid rgba(180,101,30,0.2)',
  borderRadius: '8px',
  backgroundColor: 'white',
  fontSize: '0.9rem',
  fontFamily: "'DM Sans', sans-serif",
  color: '#1a1208',
  outline: 'none',
  transition: 'border-color 0.15s',
}

const cellStyle: React.CSSProperties = {
  border: '1px solid rgba(180,101,30,0.12)',
  borderRadius: '8px',
  padding: '10px',
  backgroundColor: '#fffcf7',
}

function toInspectionFromDefaults(d: RoomDefaults): RoomInspection {
  return {
    room: d.room_number,
    features: {
      tables: d.tables,
      chairs: d.chairs,
      lights: d.lights,
      fans: d.fans,
      ac: d.ac,
      projector: d.projector,
      podium: d.podium,
      speakers: d.speakers,
      dustbin: d.dustbin,
      amplifier: d.amplifier,
      extra_plug: d.extra_plug,
      house_code: d.house_code,
    },
    hasIssues: null,
    issues: [],
  }
}

export default function RoomInspectionSection({ block, floor, disabled = false, onChange }: Props) {
  // build room numbers for this floor
  const roomNumbers = useMemo(() => generateRoomsForFloor(floor, 20), [floor])

  // build default inspections using your getRoomDefaults()
  const initialInspections = useMemo<RoomInspection[]>(() => {
    return roomNumbers.map((room) => toInspectionFromDefaults(getRoomDefaults(block, floor, room)))
  }, [block, floor, roomNumbers])

  const [inspections, setInspections] = useState<RoomInspection[]>(initialInspections)
  const [selectedRoom, setSelectedRoom] = useState(() => initialInspections[0]?.room || '')
  const [expandedIssues, setExpandedIssues] = useState<Record<number, boolean>>({})

  // reset when block/floor changes
  useEffect(() => {
    setInspections(initialInspections)
    setSelectedRoom(initialInspections[0]?.room || '')
    setExpandedIssues({})
  }, [initialInspections])

  // notify parent
  useEffect(() => {
    onChange(inspections)
  }, [inspections, onChange])

  const currentInspection = inspections.find((i) => i.room === selectedRoom)

  const updateInspection = (room: string, updater: (inspection: RoomInspection) => RoomInspection) => {
    setInspections((prev) => prev.map((item) => (item.room === room ? updater(item) : item)))
  }

  const isRoomInfoComplete = (inspection: RoomInspection) =>
    featureKeys.every((key) => {
      const v = inspection.features[key]
      return v !== null && v !== undefined && v.toString().trim().length > 0
    })

  const addIssue = (roomId: string) => {
    updateInspection(roomId, (item) => ({
      ...item,
      issues: [...item.issues, { id: Date.now(), issue_type: '', description: '', is_movable: false }],
    }))
  }

  const updateIssue = (roomId: string, issueId: number, field: keyof RoomIssue, value: any) => {
    updateInspection(roomId, (item) => ({
      ...item,
      issues: item.issues.map((issue) => (issue.id === issueId ? { ...issue, [field]: value } : issue)),
    }))
  }

  const removeIssue = (roomId: string, issueId: number) => {
    updateInspection(roomId, (item) => ({
      ...item,
      issues: item.issues.filter((issue) => issue.id !== issueId),
    }))
  }

  const toggleIssueExpand = (issueId: number) => {
    setExpandedIssues((prev) => ({ ...prev, [issueId]: !prev[issueId] }))
  }

  if (roomNumbers.length === 0) {
    return (
      <div style={{ padding: '20px', backgroundColor: '#fdf6ef', borderRadius: '12px', border: '1px solid rgba(180,101,30,0.15)' }}>
        <p style={{ margin: 0, color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
          No rooms configured for Floor {floor}. Please select a different floor.
        </p>
      </div>
    )
  }

  return (
    <div>
      <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: '600', color: '#1a1208', margin: '0 0 8px' }}>
        Room-wise Inspection
      </h3>
      <p style={{ margin: '0 0 16px', color: '#7a6a55', fontSize: '0.84rem', fontFamily: "'DM Sans', sans-serif" }}>
        Block {block}, Floor {floor}. Select each room, verify default values, then submit issues for that room.
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: '600', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
        <DoorOpen size={13} color="#B4651E" />
        Room
      </label>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
          disabled={disabled}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1.5px solid rgba(180,101,30,0.2)',
            borderRadius: '10px',
            backgroundColor: '#fffcf7',
            fontSize: '0.92rem',
            appearance: 'none',
            fontFamily: "'DM Sans', sans-serif",
            color: '#1a1208',
          }}
        >
          {roomNumbers.map((room) => (
            <option key={room} value={room}>
              Room {room}
            </option>
          ))}
        </select>
        <ChevronDown size={16} color="#c4b5a0" style={{ position: 'absolute', right: 12, top: 14, pointerEvents: 'none' }} />
      </div>

      {currentInspection && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '16px' }}>
            {featureKeys.map((key) => (
              <div key={key} style={cellStyle}>
                <p style={{ margin: '0 0 4px', fontSize: '0.73rem', color: '#7a6a55', textTransform: 'uppercase', fontFamily: "'DM Sans', sans-serif" }}>
                  {featureLabels[key]}
                </p>

                <input
                  type="text"
                  value={currentInspection.features[key] as any}
                  disabled={disabled}
                  onChange={(e) =>
                    updateInspection(currentInspection.room, (item) => ({
                      ...item,
                      features: {
                        ...item.features,
                        [key]: key === 'house_code' ? e.target.value : Number(e.target.value),
                      } as RoomFeatures,
                    }))
                  }
                  style={{
                    ...inputStyle,
                    opacity: disabled ? 0.6 : 1,
                    cursor: disabled ? 'not-allowed' : 'text',
                  }}
                  onFocus={(e) => {
                    if (!disabled) e.currentTarget.style.borderColor = '#B4651E'
                  }}
                  onBlur={(e) => {
                    if (!disabled) e.currentTarget.style.borderColor = 'rgba(180,101,30,0.2)'
                  }}
                />
              </div>
            ))}
          </div>

          {isRoomInfoComplete(currentInspection) ? (
            <div style={{ borderTop: '1px solid rgba(180,101,30,0.12)', paddingTop: '16px' }}>
              <p style={{ color: '#7a6a55', margin: '0 0 12px', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" }}>
                Any issue in Room {currentInspection.room}?
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, hasIssues: true }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: currentInspection.hasIssues ? '2px solid #B4651E' : '1px solid rgba(180,101,30,0.15)',
                    backgroundColor: currentInspection.hasIssues ? '#fdf6ef' : '#fffcf7',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.15s',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '600',
                    color: currentInspection.hasIssues ? '#B4651E' : '#7a6a55',
                  }}
                >
                  Yes
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => updateInspection(currentInspection.room, (item) => ({ ...item, hasIssues: false, issues: [] }))}
                  style={{
                    padding: '12px',
                    borderRadius: '10px',
                    border: currentInspection.hasIssues === false ? '2px solid #16a34a' : '1px solid rgba(180,101,30,0.15)',
                    backgroundColor: currentInspection.hasIssues === false ? '#f0fdf4' : '#fffcf7',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    transition: 'all 0.15s',
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: '600',
                    color: currentInspection.hasIssues === false ? '#16a34a' : '#7a6a55',
                  }}
                >
                  No
                </button>
              </div>

              {currentInspection.hasIssues && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentInspection.issues.map((issue, index) => {
                    const isExpanded = expandedIssues[issue.id]
                    const isComplete = !!issue.issue_type && (issue.description?.trim().length ?? 0) >= 10

                    return (
                      <div
                        key={issue.id}
                        style={{
                          border: isComplete ? '1.5px solid rgba(22,163,74,0.25)' : '1.5px solid rgba(180,101,30,0.15)',
                          borderRadius: '12px',
                          overflow: 'hidden',
                          backgroundColor: '#fffcf7',
                        }}
                      >
                        <div
                          onClick={() => toggleIssueExpand(issue.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 14px',
                            backgroundColor: isExpanded ? '#fdf6ef' : 'transparent',
                            cursor: 'pointer',
                            gap: '10px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
                            <span
                              style={{
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                backgroundColor: isComplete ? '#dcfce7' : '#fdf6ef',
                                border: isComplete ? '1.5px solid #16a34a' : '1.5px solid rgba(180,101,30,0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                color: isComplete ? '#16a34a' : '#B4651E',
                                flexShrink: 0,
                                fontFamily: "'DM Sans', sans-serif",
                              }}
                            >
                              {index + 1}
                            </span>
                            <span
                              style={{
                                fontWeight: '600',
                                color: '#1a1208',
                                fontSize: '0.9rem',
                                fontFamily: "'DM Sans', sans-serif",
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {issue.issue_type || 'Select issue type'}
                            </span>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                removeIssue(currentInspection.room, issue.id)
                              }}
                              disabled={disabled}
                              style={{
                                width: '28px',
                                height: '28px',
                                borderRadius: '8px',
                                border: '1px solid rgba(220,38,38,0.15)',
                                backgroundColor: 'rgba(220,38,38,0.05)',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: disabled ? 'not-allowed' : 'pointer',
                                opacity: disabled ? 0.5 : 1,
                              }}
                            >
                              <Trash2 size={14} />
                            </button>

                            {isExpanded ? <ChevronDown size={18} color="#B4651E" /> : <ChevronDown size={18} color="#c4b5a0" style={{ transform: 'rotate(-90deg)' }} />}
                          </div>
                        </div>

                        {isExpanded && (
                          <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(180,101,30,0.08)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" }}>
                                Issue Type *
                              </label>
                              <select
                                value={issue.issue_type}
                                disabled={disabled}
                                onChange={(e) => updateIssue(currentInspection.room, issue.id, 'issue_type', e.target.value)}
                                style={{
                                  ...inputStyle,
                                  appearance: 'auto',
                                  cursor: disabled ? 'not-allowed' : 'pointer',
                                  opacity: disabled ? 0.6 : 1,
                                }}
                                onFocus={(e) => {
                                  if (!disabled) e.currentTarget.style.borderColor = '#B4651E'
                                }}
                                onBlur={(e) => {
                                  if (!disabled) e.currentTarget.style.borderColor = 'rgba(180,101,30,0.2)'
                                }}
                              >
                                <option value="">Select issue type</option>
                                {Object.entries(ISSUE_TYPES).map(([category, types]) => (
                                  <optgroup key={category} label={category}>
                                    {(types as readonly string[]).map((type) => {
                                      const value = type === category ? category : `${category} - ${type}`
                                      const label = type === category ? category : type
                                      return (
                                        <option key={value} value={value}>
                                          {label}
                                        </option>
                                      )
                                    })}
                                  </optgroup>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '600', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: "'DM Sans', sans-serif" }}>
                                Description * <span style={{ fontWeight: '400', textTransform: 'none' }}>(min 10 chars)</span>
                              </label>
                              <textarea
                                value={issue.description}
                                disabled={disabled}
                                onChange={(e) => updateIssue(currentInspection.room, issue.id, 'description', e.target.value)}
                                rows={3}
                                placeholder="Describe the issue in detail..."
                                style={{
                                  ...inputStyle,
                                  resize: 'vertical',
                                  opacity: disabled ? 0.6 : 1,
                                  lineHeight: '1.5',
                                }}
                                onFocus={(e) => {
                                  if (!disabled) e.currentTarget.style.borderColor = '#B4651E'
                                }}
                                onBlur={(e) => {
                                  if (!disabled) e.currentTarget.style.borderColor = 'rgba(180,101,30,0.2)'
                                }}
                              />
                            </div>

                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}>
                              <input
                                type="checkbox"
                                checked={issue.is_movable}
                                disabled={disabled}
                                onChange={(e) => updateIssue(currentInspection.room, issue.id, 'is_movable', e.target.checked)}
                                style={{ width: '16px', height: '16px', accentColor: '#B4651E', cursor: disabled ? 'not-allowed' : 'pointer' }}
                              />
                              <span style={{ fontSize: '0.85rem', color: '#1a1208', fontFamily: "'DM Sans', sans-serif" }}>This is a movable item (e.g., chair, table)</span>
                            </label>
                          </div>
                        )}
                      </div>
                    )
                  })}

                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => addIssue(currentInspection.room)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '10px 16px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#B4651E',
                      color: 'white',
                      fontWeight: '600',
                      fontSize: '0.9rem',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'background-color 0.15s',
                    }}
                    onMouseEnter={(e) => {
                      if (!disabled) e.currentTarget.style.backgroundColor = '#8f4e16'
                    }}
                    onMouseLeave={(e) => {
                      if (!disabled) e.currentTarget.style.backgroundColor = '#B4651E'
                    }}
                  >
                    <Plus size={16} /> Add Issue for Room {currentInspection.room}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: '#fef3c7',
                color: '#92400e',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.85rem',
              }}
            >
              <AlertTriangle size={16} style={{ flexShrink: 0 }} />
              Complete all room fields above to unlock issue reporting.
            </div>
          )}

          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#166534', fontFamily: "'DM Sans', sans-serif" }}>
            <CheckCircle2 size={14} />
            Rooms configured: {roomNumbers.length}
          </div>
        </>
      )}
    </div>
  )
}