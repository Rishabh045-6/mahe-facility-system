'use client'

import { useEffect, useMemo, useState } from 'react'
import { XCircle, RefreshCw, Layers3 } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG, ROOM_NUMBERS } from '@/lib/utils/constants'

type MarshalOption = {
  marshal_id: string
  marshal_name: string
  is_active: boolean
  sources: string[]
}

type ConsecutivePreviewResponse = {
  date: string
  block: string
  floor: string
  starting_room: string
  room_count: number
  marshal: {
    marshal_id: string
    marshal_name: string
  }
  target_rooms: string[]
  summary: {
    total_targeted: number
    assignable: number
    skipped_assigned: number
    skipped_covered: number
  }
  rooms: Array<{
    room_number: string
    status: 'assignable' | 'skipped_assigned' | 'skipped_covered'
    existing_assignment?: {
      marshal_id: string
      marshal_name: string
    }
    inspection?: {
      marshal_id: string | null
      marshal_name: string | null
      has_issues: boolean
      created_at: string | null
    }
  }>
}

interface ConsecutiveAssignmentModalProps {
  open: boolean
  targetDate: string
  onClose: () => void
  onSuccess: (nextDate: string) => Promise<void> | void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid rgba(180, 101, 30, 0.2)',
  borderRadius: '10px',
  fontSize: '0.92rem',
  outline: 'none',
  backgroundColor: '#fffcf7',
  color: '#1a1208',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  color: '#7a6a55',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 6px',
}

export default function ConsecutiveAssignmentModal({
  open,
  targetDate,
  onClose,
  onSuccess,
}: ConsecutiveAssignmentModalProps) {
  const [date, setDate] = useState(targetDate)
  const [block, setBlock] = useState('')
  const [floor, setFloor] = useState('')
  const [startingRoom, setStartingRoom] = useState('')
  const [marshalId, setMarshalId] = useState('')
  const [roomCount, setRoomCount] = useState('')
  const [marshals, setMarshals] = useState<MarshalOption[]>([])
  const [marshalLoading, setMarshalLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [executeLoading, setExecuteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<ConsecutivePreviewResponse | null>(null)

  useEffect(() => {
    if (!open) return

    setDate(targetDate)
    setBlock('')
    setFloor('')
    setStartingRoom('')
    setMarshalId('')
    setRoomCount('')
    setPreview(null)
    setError(null)
  }, [open, targetDate])

  useEffect(() => {
    if (!open) return

    let cancelled = false

    const loadMarshals = async () => {
      try {
        setMarshalLoading(true)
        const response = await fetch('/api/admin/marshals', { cache: 'no-store' })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load marshals')
        }

        if (!cancelled) {
          setMarshals(result.marshals || [])
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load marshals')
        }
      } finally {
        if (!cancelled) {
          setMarshalLoading(false)
        }
      }
    }

    loadMarshals()

    return () => {
      cancelled = true
    }
  }, [open])

  const floorOptions = useMemo(() => {
    if (!block) return []
    if (!BLOCKS.includes(block as (typeof BLOCKS)[number])) return []
    return [...FLOOR_CONFIG[block as (typeof BLOCKS)[number]]]
  }, [block])

  const roomOptions = useMemo(() => {
    if (!block || !floor) return []
    return ROOM_NUMBERS[block as keyof typeof ROOM_NUMBERS]?.[floor] || []
  }, [block, floor])

  const startIndex = useMemo(() => {
    if (!startingRoom) return -1
    return roomOptions.indexOf(startingRoom)
  }, [roomOptions, startingRoom])

  const remainingRoomCount = useMemo(() => {
    if (startIndex === -1) return 0
    return roomOptions.length - startIndex
  }, [roomOptions.length, startIndex])

  const roomCountOptions = useMemo(() => {
    return Array.from({ length: remainingRoomCount }, (_, index) => String(index + 1))
  }, [remainingRoomCount])

  useEffect(() => {
    if (!startingRoom || startIndex === -1 || remainingRoomCount === 0) {
      if (roomCount !== '') setRoomCount('')
      return
    }

    const numericRoomCount = Number(roomCount)
    if (!Number.isInteger(numericRoomCount) || numericRoomCount < 1 || numericRoomCount > remainingRoomCount) {
      setRoomCount('1')
    }
  }, [startingRoom, startIndex, remainingRoomCount, roomCount])

  const canPreview = Boolean(
    date &&
    block &&
    floor &&
    startingRoom &&
    marshalId &&
    roomCount &&
    Number.isInteger(Number(roomCount)) &&
    Number(roomCount) >= 1 &&
    Number(roomCount) <= remainingRoomCount
  )

  const canExecute = preview !== null && !executeLoading

  if (!open) return null

  const clearDerivedState = () => {
    setPreview(null)
    setError(null)
  }

  const handleBlockChange = (value: string) => {
    setBlock(value)
    setFloor('')
    setStartingRoom('')
    setRoomCount('')
    clearDerivedState()
  }

  const handleFloorChange = (value: string) => {
    setFloor(value)
    setStartingRoom('')
    setRoomCount('')
    clearDerivedState()
  }

  const handleStartingRoomChange = (value: string) => {
    setStartingRoom(value)
    setRoomCount('')
    clearDerivedState()
  }

  const buildPayload = () => ({
    date,
    block,
    floor,
    starting_room: startingRoom,
    marshal_id: marshalId,
    room_count: Number(roomCount),
  })

  const handlePreview = async () => {
    try {
      setPreviewLoading(true)
      setError(null)
      setPreview(null)

      const payload = buildPayload()

      const response = await fetch('/api/admin/room-assignments/consecutive/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to preview consecutive assignment')
      }

      setPreview(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to preview consecutive assignment')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExecute = async () => {
    const payload = {
      ...buildPayload(),
      mode: 'merge_skip',
    }

    try {
      setExecuteLoading(true)
      setError(null)

      const response = await fetch('/api/admin/room-assignments/consecutive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to assign consecutive rooms')
      }

      setPreview(null)
      setError(null)
      onClose()
      await onSuccess(result.effective_date || result.date || date)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to assign consecutive rooms')
    } finally {
      setExecuteLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: 'calc(100vh - 48px)',
          backgroundColor: 'rgba(255, 252, 247, 0.98)',
          border: '1px solid rgba(180, 101, 30, 0.14)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: '0 0 4px',
              }}
            >
              Assign Consecutive Rooms
            </h3>
            <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.84rem' }}>
              Preview the exact room order before applying a merge-skip assignment.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <XCircle size={24} color="#7a6a55" />
          </button>
        </div>

        <div
          style={{
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
            overflowY: 'auto',
            flex: 1,
            minHeight: 0,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  clearDerivedState()
                }}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Marshal</label>
              <select
                value={marshalId}
                onChange={(e) => {
                  setMarshalId(e.target.value)
                  clearDerivedState()
                }}
                style={inputStyle}
                disabled={marshalLoading}
              >
                <option value="">Select a marshal</option>
                {marshals.map((marshal) => (
                  <option key={marshal.marshal_id} value={marshal.marshal_id}>
                    {marshal.marshal_name} ({marshal.marshal_id})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Block</label>
              <select value={block} onChange={(e) => handleBlockChange(e.target.value)} style={inputStyle}>
                <option value="">Select block</option>
                {BLOCKS.map((blockValue) => (
                  <option key={blockValue} value={blockValue}>
                    {blockValue}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Floor</label>
              <select
                value={floor}
                onChange={(e) => handleFloorChange(e.target.value)}
                style={inputStyle}
                disabled={!block}
              >
                <option value="">Select floor</option>
                {floorOptions.map((floorValue) => (
                  <option key={floorValue} value={floorValue}>
                    Floor {floorValue}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Starting Room</label>
              <select
                value={startingRoom}
                onChange={(e) => handleStartingRoomChange(e.target.value)}
                style={inputStyle}
                disabled={!block || !floor}
              >
                <option value="">Select starting room</option>
                {roomOptions.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={labelStyle}>Number of Rooms</label>
              <select
                value={roomCount}
                onChange={(e) => {
                  setRoomCount(e.target.value)
                  clearDerivedState()
                }}
                style={inputStyle}
                disabled={!startingRoom || remainingRoomCount === 0}
              >
                {!startingRoom ? (
                  <option value="">Select a starting room first</option>
                ) : (
                  <>
                    <option value="">Select room count</option>
                    {roomCountOptions.map((value) => (
                      <option key={value} value={value}>
                        {value} room{value === '1' ? '' : 's'}
                      </option>
                    ))}
                  </>
                )}
              </select>
              {startingRoom && remainingRoomCount > 0 && (
                <p style={{ margin: '8px 0 0', color: '#7a6a55', fontSize: '0.8rem' }}>
                  {remainingRoomCount} room{remainingRoomCount === 1 ? '' : 's'} available from this starting point.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.15)',
                color: '#991b1b',
                fontSize: '0.88rem',
              }}
            >
              {error}
            </div>
          )}

          {preview && (
            <div
              style={{
                border: '1px solid rgba(180,101,30,0.12)',
                borderRadius: '14px',
                backgroundColor: '#fffcf7',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  ['Target Rooms', preview.summary.total_targeted],
                  ['Assignable', preview.summary.assignable],
                  ['Skipped Assigned', preview.summary.skipped_assigned],
                  ['Skipped Covered', preview.summary.skipped_covered],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(180,101,30,0.1)',
                      backgroundColor: '#fff',
                    }}
                  >
                    <p style={{ margin: '0 0 6px', color: '#7a6a55', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, color: '#1a1208', fontSize: '1.6rem', fontWeight: '700' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div>
                <p style={labelStyle}>Target Room Order</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {preview.target_rooms.map((room) => (
                    <span
                      key={room}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        backgroundColor: '#fff',
                        border: '1px solid rgba(180,101,30,0.12)',
                        color: '#1a1208',
                        fontSize: '0.8rem',
                        fontWeight: '600',
                      }}
                    >
                      {room}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {preview.rooms.map((room) => (
                  <div
                    key={room.room_number}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(180,101,30,0.1)',
                      backgroundColor: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <p style={{ margin: '0 0 4px', color: '#1a1208', fontWeight: '700', fontSize: '0.92rem' }}>
                        {room.room_number}
                      </p>
                      <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.8rem' }}>
                        {room.status === 'skipped_assigned'
                          ? `Already assigned to ${room.existing_assignment?.marshal_name || room.existing_assignment?.marshal_id}`
                          : room.status === 'skipped_covered'
                            ? `Already covered by ${room.inspection?.marshal_name || room.inspection?.marshal_id || 'Unknown'}`
                            : 'Ready to assign'}
                      </p>
                    </div>

                    <span
                      style={{
                        padding: '6px 10px',
                        borderRadius: '999px',
                        backgroundColor:
                          room.status === 'assignable'
                            ? 'rgba(22,163,74,0.08)'
                            : room.status === 'skipped_assigned'
                              ? 'rgba(245,158,11,0.08)'
                              : 'rgba(220,38,38,0.08)',
                        border:
                          room.status === 'assignable'
                            ? '1px solid rgba(22,163,74,0.18)'
                            : room.status === 'skipped_assigned'
                              ? '1px solid rgba(245,158,11,0.2)'
                              : '1px solid rgba(220,38,38,0.18)',
                        color:
                          room.status === 'assignable'
                            ? '#166534'
                            : room.status === 'skipped_assigned'
                              ? '#92400e'
                              : '#991b1b',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                      }}
                    >
                      {room.status === 'assignable'
                        ? 'Assignable'
                        : room.status === 'skipped_assigned'
                          ? 'Skipped Assigned'
                          : 'Skipped Covered'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
            borderTop: '1px solid rgba(180, 101, 30, 0.1)',
            backgroundColor: 'rgba(255, 252, 247, 0.98)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={handlePreview}
            disabled={!canPreview || previewLoading || executeLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#1e2d3d',
              color: 'white',
              fontWeight: '700',
              cursor: !canPreview || previewLoading || executeLoading ? 'not-allowed' : 'pointer',
              opacity: !canPreview || previewLoading || executeLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {previewLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Layers3 size={16} />}
            Preview
          </button>

          <button
            type="button"
            onClick={handleExecute}
            disabled={!canExecute}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#B4651E',
              color: 'white',
              fontWeight: '700',
              cursor: !canExecute ? 'not-allowed' : 'pointer',
              opacity: !canExecute ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {executeLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Layers3 size={16} />}
            {preview ? `Assign ${preview.room_count} Room${preview.room_count === 1 ? '' : 's'}` : 'Assign Rooms'}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={previewLoading || executeLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(180,101,30,0.14)',
              backgroundColor: 'transparent',
              color: '#7a6a55',
              fontWeight: '700',
              cursor: previewLoading || executeLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
