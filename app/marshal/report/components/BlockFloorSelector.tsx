'use client'

import { useMemo, useState, useRef, useEffect } from 'react'
import { Building2, Layers, ChevronDown, DoorClosed, ClipboardSignature, CheckCircle2, XCircle } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG, ROOM_NUMBERS, type Block } from '@/lib/utils/constants'
import { getRoomDefaults, type RoomInspection } from '@/lib/utils/room-default'
import IssueForm from './IssueForm'
import ImageUploader from './ImageUploader'
import { SaveIssueButton } from './SaveIssueButton'

type Issue = {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
}

interface BlockFloorSelectorProps {
  block: Block | ''
  floor: string
  selectedRoom: string
  roomInspections: Record<string, RoomInspection>

  roomIssues: Record<string, Issue[]>
  roomImages: Record<string, File[]>

  onBlockChange: (block: Block) => void
  onFloorChange: (floor: string) => void
  onSelectedRoomChange: (room: string) => void
  onRoomInspectionsChange: (next: Record<string, RoomInspection>) => void
  onSaveIssue: (room: string, issueId: number, issueData: Partial<Issue>) => void

  setRoomHasIssues: (room: string, value: boolean) => void
  addIssueForRoom: (room: string) => void
  updateIssueForRoom: (room: string, id: number, field: string, value: any) => void
  removeIssueForRoom: (room: string, id: number) => void
  handleImageUploadForRoom: (room: string, files: File[]) => void
  removeImageForRoom: (room: string, index: number) => void

  isRoomCompleted: (room: string) => boolean
  markRoomCompleted: (room: string) => void
  handleMoveNextRoom: () => void

  disabled?: boolean

  // ✅ Optional (if parent passes): shared server truth + normalizer
  serverRoomsByFloor?: Record<string, Set<string>>
  normalizeFloor?: (floor: string) => string
}

const fieldLabel: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: '600',
  color: '#7a6a55',
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: '8px',
  fontFamily: "'DM Sans', sans-serif",
}

const fieldInput: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid rgba(180, 101, 30, 0.2)',
  borderRadius: '10px',
  fontSize: '0.9rem',
  outline: 'none',
  backgroundColor: '#fffcf7',
  color: '#1a1208',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

const innerCard: React.CSSProperties = {
  backgroundColor: 'rgba(255, 252, 247, 0.95)',
  border: '1px solid rgba(180, 101, 30, 0.12)',
  borderRadius: '16px',
  padding: '22px 22px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
}

const fallbackNormalizeFloor = (f: string) => {
  const raw = String(f ?? '').trim()
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'g' || lower.includes('ground')) return 'G'
  const match = raw.match(/\d+/)
  if (match) return match[0]
  return raw
}

export default function BlockFloorSelector({
  block,
  floor,
  selectedRoom,
  roomInspections,
  roomIssues,
  roomImages,

  onBlockChange,
  onFloorChange,
  onSelectedRoomChange,
  serverRoomsByFloor,
  onRoomInspectionsChange,
  onSaveIssue,

  setRoomHasIssues,
  addIssueForRoom,
  updateIssueForRoom,
  removeIssueForRoom,
  handleImageUploadForRoom,
  removeImageForRoom,

  isRoomCompleted,
  markRoomCompleted,
  handleMoveNextRoom,

  disabled = false,

  normalizeFloor,
}: BlockFloorSelectorProps) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showFloorModal, setShowFloorModal] = useState(false)
  const [showRoomModal, setShowRoomModal] = useState(false)

  const inspectionSectionRef = useRef<HTMLDivElement | null>(null)
  const imagesSectionRef = useRef<HTMLDivElement | null>(null)

  const normFloor = useMemo(() => (normalizeFloor ?? fallbackNormalizeFloor)(floor), [floor, normalizeFloor])
  const availableFloors = block ? FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG] : []

  // ✅ KEY BUILDER (uses normalized floor)
  const makeKey = (b: string, f: string, r: string) => `${b}-${(normalizeFloor ?? fallbackNormalizeFloor)(f)}-${String(r).trim()}`

  // ✅ Hybrid completion (instant UI): SERVER OR LOCAL
  const isRoomDone = (room: string) => {
  if (!block || !normFloor) return false
  const serverDone = serverRoomsByFloor?.[normFloor]?.has(String(room)) ?? false
  const localDone = isRoomCompleted(String(room))
  return serverDone || localDone
}

  // ✅ Available rooms from constants (normalized)
  const availableRooms: string[] = useMemo(() => {
    if (!block || !normFloor) return []
    const b = block as Block
    return ROOM_NUMBERS[b]?.[normFloor] ?? []
  }, [block, normFloor])

  // ✅ Scroll to inspection after room select
  useEffect(() => {
    if (selectedRoom) {
      setTimeout(() => {
        inspectionSectionRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        })
      }, 150)
    }
  }, [selectedRoom])

  // ✅ Floor progress label: Floor X (done/total) — hybrid (server OR local)
  const floorProgressByFloor = useMemo(() => {
    if (!block) return {} as Record<string, { done: number; total: number }>

    const out: Record<string, { done: number; total: number }> = {}
    for (const f of availableFloors) {
      const fN = (normalizeFloor ?? fallbackNormalizeFloor)(String(f))
      const rooms = ROOM_NUMBERS[block as Block]?.[fN] ?? []
      const total = rooms.length
      let done = 0

      for (const r of rooms) {
        const serverDone = serverRoomsByFloor?.[fN]?.has(String(r)) ?? false
        // local completion only applies to current selected floor realistically, but safe to include:
        const localDone = fN === normFloor ? isRoomCompleted(String(r)) : false
        if (serverDone || localDone) done++
      }

      out[fN] = { done, total }
    }
    return out
  }, [block, availableFloors, serverRoomsByFloor, normalizeFloor, normFloor, isRoomCompleted])

  const currentInspection: RoomInspection | undefined = selectedRoom ? roomInspections[selectedRoom] : undefined
  const currentIssues: Issue[] = selectedRoom ? (roomIssues[selectedRoom] ?? []) : []
  const currentImages: File[] = selectedRoom ? (roomImages[selectedRoom] ?? []) : []
  const currentHasIssues = !!currentInspection?.has_issues

  const ensureInspectionExists = (room: string) => {
    if (!block || !normFloor) return
    const b = block as Block
    if (!roomInspections[room]) {
      onRoomInspectionsChange({
        ...roomInspections,
        [room]: getRoomDefaults(b, normFloor, room),
      })
    }
  }

  const setInspectionField = (field: keyof RoomInspection, value: any) => {
    if (!block || !normFloor || !selectedRoom) return
    const b = block as Block

    const existing = roomInspections[selectedRoom] ?? getRoomDefaults(b, normFloor, selectedRoom)
    const next: Record<string, RoomInspection> = {
      ...roomInspections,
      [selectedRoom]: { ...existing, [field]: value },
    }

    onRoomInspectionsChange(next)
  }

  const onMoveNextAndScroll = () => {
    handleMoveNextRoom()
    setTimeout(() => {
      imagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 200)
  }

  const selectorButton = (
    value: string,
    placeholder: string,
    onClick: () => void,
    isDisabled: boolean,
    isSelected: boolean,
  ) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '12px 16px',
        border: isSelected ? '1.5px solid #B4651E' : '1.5px solid rgba(180, 101, 30, 0.2)',
        borderRadius: '10px',
        backgroundColor: isSelected ? '#fdf6ef' : '#fffcf7',
        color: isSelected ? '#B4651E' : '#7a6a55',
        fontSize: '0.95rem',
        fontWeight: isSelected ? '600' : '400',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'all 0.15s',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <span>{value || placeholder}</span>
      <ChevronDown size={16} color={isSelected ? '#B4651E' : '#c4b5a0'} />
    </button>
  )

  const modalOverlay: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
    padding: '24px',
    backdropFilter: 'blur(4px)',
  }

  const modalBox: React.CSSProperties = {
    backgroundColor: 'rgba(255, 252, 247, 0.98)',
    border: '1px solid rgba(180, 101, 30, 0.15)',
    borderRadius: '18px',
    width: '100%',
    maxWidth: '380px',
    maxHeight: '80vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
  }

  const floorLabel = useMemo(() => {
    if (!block || !normFloor) return ''
    const p = floorProgressByFloor[normFloor] ?? { done: 0, total: (ROOM_NUMBERS[block as Block]?.[normFloor] ?? []).length }
    return `Floor ${normFloor} (${p.done}/${p.total})`
  }, [block, normFloor, floorProgressByFloor])

  return (
    <div>
      <h3
        style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1a1208',
          margin: '0 0 20px',
        }}
      >
        Location Selection
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Block */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#7a6a55',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Building2 size={13} color="#B4651E" />
            Block
          </label>
          {selectorButton(block, 'Select Block', () => setShowBlockModal(true), disabled, !!block)}
        </div>

        {/* Floor */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#7a6a55',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <Layers size={13} color="#B4651E" />
            Floor
          </label>

          {selectorButton(
            normFloor ? floorLabel : '',
            'Select Floor',
            () => setShowFloorModal(true),
            disabled || !block,
            !!normFloor && !!block,
          )}

          {!block && (
            <p style={{ fontSize: '0.8rem', color: '#c4b5a0', marginTop: '6px', fontFamily: "'DM Sans', sans-serif" }}>
              Please select a block first
            </p>
          )}
        </div>

        {/* Room */}
        <div>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.8rem',
              fontWeight: '600',
              color: '#7a6a55',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '8px',
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            <DoorClosed size={13} color="#B4651E" />
            Room
          </label>

          {selectorButton(
            selectedRoom ? (/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom) : '',
            'Select Room',
            () => setShowRoomModal(true),
            disabled || !block || !normFloor,
            !!selectedRoom && !!block && !!normFloor,
          )}

          {(!block || !normFloor) && (
            <p style={{ fontSize: '0.8rem', color: '#c4b5a0', marginTop: '6px', fontFamily: "'DM Sans', sans-serif" }}>
              Please select block and floor first
            </p>
          )}
        </div>

        {/* Equipment form */}
        {block && normFloor && selectedRoom && currentInspection && (
          <div
            ref={inspectionSectionRef}
            style={{
              scrollMarginTop: '300px',
              marginTop: '20px',
              padding: '18px',
              borderRadius: '14px',
              border: '1.5px solid rgba(180, 101, 30, 0.15)',
              backgroundColor: '#fffcf7',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '12px',
                  backgroundColor: '#fdf6ef',
                  border: '1px solid rgba(180,101,30,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ClipboardSignature size={16} color="#B4651E" />
              </div>
              <div>
                <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 800, color: '#1a1208' }}>
                  Room Inspection – {block}, Floor {normFloor}, {/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom}
                </p>
                <p style={{ margin: '2px 0 0', fontFamily: "'DM Sans', sans-serif", fontSize: '0.82rem', color: '#7a6a55' }}>
                  Defaults are prefilled. Update any counts if different.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {([
                ['tables', 'Tables'],
                ['chairs', 'Chairs'],
                ['lights', 'Lights'],
                ['fans', 'Fans'],
                ['ac', 'AC'],
                ['projector', 'Projector'],
                ['podium', 'Podium'],
                ['speakers', 'Speakers'],
                ['dustbin', 'Dustbin'],
                ['amplifier', 'Amplifier'],
                ['extra_plug', 'Extra Plug'],
              ] as const).map(([key, label]) => (
                <div key={key}>
                  <label style={fieldLabel}>{label}</label>
                  <input
                    type="number"
                    min={0}
                    value={(currentInspection as any)[key]}
                    disabled={disabled}
                    onChange={(e) => setInspectionField(key as any, Math.max(0, Number(e.target.value || 0)))}
                    style={{ ...fieldInput, opacity: disabled ? 0.5 : 1 }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = '#B4651E')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = 'rgba(180, 101, 30, 0.2)')}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Issue Declaration + IssueForm + ImageUploader */}
        {selectedRoom && currentInspection && (
          <div style={{ marginTop: '18px' }}>
            <div style={innerCard}>
              <h3
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: '1.15rem',
                  fontWeight: '600',
                  color: '#1a1208',
                  margin: '0 0 8px',
                }}
              >
                {/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom} – Issue Declaration
              </h3>
              <p style={{ color: '#7a6a55', fontSize: '0.9rem', margin: '0 0 20px', fontFamily: "'DM Sans', sans-serif" }}>
                Did you find any issues in this room?
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <button
                  type="button"
                  onClick={() => setRoomHasIssues(selectedRoom, true)}
                  disabled={disabled}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: currentHasIssues ? '2px solid #B4651E' : '2px solid rgba(180, 101, 30, 0.15)',
                    backgroundColor: currentHasIssues ? '#fdf6ef' : 'transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={24} color={currentHasIssues ? '#B4651E' : '#c4b5a0'} />
                    <span style={{ fontWeight: '600', color: currentHasIssues ? '#B4651E' : '#7a6a55', fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>
                      Yes, I found issues
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setRoomHasIssues(selectedRoom, false)}
                  disabled={disabled}
                  style={{
                    padding: '20px',
                    borderRadius: '12px',
                    border: !currentHasIssues ? '2px solid #16a34a' : '2px solid rgba(180, 101, 30, 0.15)',
                    backgroundColor: !currentHasIssues ? '#f0fdf4' : 'transparent',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <XCircle size={24} color={!currentHasIssues ? '#16a34a' : '#c4b5a0'} />
                    <span style={{ fontWeight: '600', color: !currentHasIssues ? '#16a34a' : '#7a6a55', fontSize: '0.95rem', fontFamily: "'DM Sans', sans-serif" }}>
                      No issues found
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {currentHasIssues && (
              <div style={{ ...innerCard, marginTop: '16px' }}>
                <IssueForm
                  issues={currentIssues}
                  onAddIssue={() => addIssueForRoom(selectedRoom)}
                  onUpdateIssue={(id, field, value) => updateIssueForRoom(selectedRoom, id, field, value)}
                  onRemoveIssue={(id) => removeIssueForRoom(selectedRoom, id)}
                  disabled={disabled}
                />
              </div>
            )}

            {currentHasIssues && (
              <div style={{ ...innerCard, marginTop: '16px' }}>
                <div ref={imagesSectionRef} />
                <ImageUploader
                  images={currentImages}
                  onUpload={(files) => handleImageUploadForRoom(selectedRoom, files)}
                  onRemove={(index) => removeImageForRoom(selectedRoom, index)}
                  disabled={disabled}
                />
              </div>
            )}

            {currentHasIssues && currentIssues.length > 0 && (
              <div style={{ ...innerCard, marginTop: '16px' }}>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    color: '#1a1208',
                    margin: '0 0 10px',
                  }}
                >
                  Save Issues
                </h3>

                <p style={{ color: '#7a6a55', fontSize: '0.88rem', margin: '0 0 14px', fontFamily: "'DM Sans', sans-serif" }}>
                  Save each issue after filling details. This is local-only; Submit Report sends everything to Supabase.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {currentIssues.map((issue) => (
                    <div
                      key={issue.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        padding: '12px',
                        borderRadius: '12px',
                        border: '1px solid rgba(180, 101, 30, 0.12)',
                        backgroundColor: '#fffcf7',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontFamily: "'DM Sans', sans-serif",
                            fontWeight: 800,
                            color: '#1a1208',
                            fontSize: '0.92rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '420px',
                          }}
                        >
                          {issue.issue_type || 'Issue type not selected'}
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontFamily: "'DM Sans', sans-serif",
                            color: '#7a6a55',
                            fontSize: '0.82rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            maxWidth: '420px',
                          }}
                        >
                          {issue.description || 'Description not added'}
                        </p>
                      </div>

                      <SaveIssueButton room={selectedRoom} issueId={issue.id} issueData={issue} disabled={disabled} onSaveIssue={onSaveIssue} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Room Actions */}
        {block && normFloor && selectedRoom && (
          <div
            style={{
              marginTop: '4px',
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
              border: '1px solid rgba(180,101,30,0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h3
                  style={{
                    fontFamily: "'Playfair Display', Georgia, serif",
                    fontSize: '1.05rem',
                    fontWeight: '600',
                    color: '#1a1208',
                    margin: '0 0 6px',
                  }}
                >
                  Room Actions — {block} Floor {normFloor} • {/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom}
                </h3>
                <p style={{ margin: 0, color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
                  Save locally. Submit Report sends everything to Administration.
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => markRoomCompleted(selectedRoom)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isRoomDone(selectedRoom) ? '2px solid #16a34a' : '2px solid rgba(180,101,30,0.18)',
                    backgroundColor: isRoomDone(selectedRoom) ? '#f0fdf4' : '#fffcf7',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    color: isRoomDone(selectedRoom) ? '#16a34a' : '#1a1208',
                  }}
                >
                  {isRoomDone(selectedRoom) ? '✓ Completed' : 'Mark as Completed'}
                </button>

                <button
                  type="button"
                  disabled={disabled}
                  onClick={onMoveNextAndScroll}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '2px solid rgba(180,101,30,0.18)',
                    backgroundColor: '#fdf6ef',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    opacity: disabled ? 0.5 : 1,
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 700,
                    color: '#B4651E',
                  }}
                >
                  Move to Next Room →
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.05rem', fontWeight: '600', color: '#1a1208', margin: 0 }}>
                Select Block
              </h4>
            </div>

            <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {BLOCKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onBlockChange(b)
                    onFloorChange('')
                    onSelectedRoomChange('')
                    setShowBlockModal(false)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: block === b ? '1.5px solid #B4651E' : '1.5px solid rgba(180, 101, 30, 0.1)',
                    backgroundColor: block === b ? '#B4651E' : '#fdf6ef',
                    color: block === b ? 'white' : '#1a1208',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {b}
                </button>
              ))}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#7a6a55',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floor Modal (shows done/total) */}
      {showFloorModal && block && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.05rem', fontWeight: '600', color: '#1a1208', margin: '0 0 4px' }}>
                Select Floor
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#B4651E', margin: 0, fontWeight: '500', fontFamily: "'DM Sans', sans-serif" }}>
                Block {block}
              </p>
            </div>

            <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableFloors.map((f) => {
                const fN = (normalizeFloor ?? fallbackNormalizeFloor)(String(f))
                const p = floorProgressByFloor[fN] ?? { done: 0, total: (ROOM_NUMBERS[block as Block]?.[fN] ?? []).length }
                const active = normFloor === fN

                return (
                  <button
                    key={String(f)}
                    type="button"
                    onClick={() => {
                      onFloorChange(fN) // ✅ always normalized
                      onSelectedRoomChange('')
                      setShowFloorModal(false)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '10px',
                      border: active ? '1.5px solid #B4651E' : '1.5px solid rgba(180, 101, 30, 0.1)',
                      backgroundColor: active ? '#B4651E' : '#fdf6ef',
                      color: active ? 'white' : '#1a1208',
                      fontSize: '0.95rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                    }}
                  >
                    <span>Floor {fN}</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, opacity: active ? 0.95 : 0.75 }}>
                      {p.done}/{p.total}
                    </span>
                  </button>
                )
              })}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <button
                type="button"
                onClick={() => setShowFloorModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#7a6a55',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal (✅ ticks update immediately because hybrid done) */}
      {showRoomModal && block && normFloor && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <h4 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.05rem', fontWeight: '600', color: '#1a1208', margin: '0 0 4px' }}>
                Select Room
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#B4651E', margin: 0, fontWeight: '500', fontFamily: "'DM Sans', sans-serif" }}>
                {block}, Floor {normFloor}
              </p>
            </div>

            <div
              style={{
                padding: '16px 24px',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '10px',
              }}
            >
              {availableRooms.map((r: string) => {
                const done = isRoomDone(r) // ✅ hybrid: server OR local
                const active = selectedRoom === r

                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onSelectedRoomChange(r)
                      ensureInspectionExists(r)
                      setShowRoomModal(false)
                      setTimeout(() => {
                        imagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }, 200)
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'center',
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border: done
                        ? '1.8px solid rgba(22,163,74,0.55)'
                        : active
                          ? '1.5px solid #B4651E'
                          : '1.5px solid rgba(180, 101, 30, 0.1)',
                      backgroundColor: done ? '#f0fdf4' : active ? '#B4651E' : '#fdf6ef',
                      color: done ? '#16a34a' : active ? 'white' : '#1a1208',
                      fontSize: '0.92rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      fontFamily: "'DM Sans', sans-serif",
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    {done && <CheckCircle2 size={16} color="#16a34a" />}
                    {r}
                  </button>
                )
              })}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(180, 101, 30, 0.1)' }}>
              <button
                type="button"
                onClick={() => setShowRoomModal(false)}
                style={{
                  width: '100%',
                  padding: '10px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#7a6a55',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}