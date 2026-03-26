'use client'

import { useEffect, useMemo, useState } from 'react'
import { XCircle, RefreshCw, UserPlus, UserMinus, Repeat } from 'lucide-react'

type AssignmentRoomState = {
  block: string
  floor: string
  room_number: string
  category: 'not_assigned_not_covered' | 'assigned_not_covered' | 'assigned_covered' 
  assignment: {
    marshal_id: string
    marshal_name?: string | null
  } | null
  inspection: {
    marshal_id?: string | null
    marshal_name?: string | null
    has_issues?: boolean | null
    created_at?: string | null
  } | null
}

type MarshalOption = {
  marshal_id: string
  marshal_name: string
  is_active: boolean
  sources: string[]
}

interface RoomAssignmentModalProps {
  open: boolean
  date: string
  room: AssignmentRoomState | null
  onClose: () => void
  onSuccess: () => Promise<void> | void
}

const fieldLabel: React.CSSProperties = {
  fontSize: '0.78rem',
  color: '#7a6a55',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 6px',
}

const fieldValue: React.CSSProperties = {
  fontSize: '0.95rem',
  color: '#1a1208',
  fontWeight: '600',
  margin: 0,
}

const selectStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid rgba(180, 101, 30, 0.2)',
  borderRadius: '10px',
  fontSize: '0.92rem',
  outline: 'none',
  backgroundColor: '#fffcf7',
  color: '#1a1208',
  fontFamily: "'DM Sans', sans-serif",
}

export default function RoomAssignmentModal({
  open,
  date,
  room,
  onClose,
  onSuccess,
}: RoomAssignmentModalProps) {
  const [marshals, setMarshals] = useState<MarshalOption[]>([])
  const [marshalLoading, setMarshalLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedMarshalId, setSelectedMarshalId] = useState('')

  useEffect(() => {
    if (!open || !room) return

    let cancelled = false

    const loadMarshals = async () => {
      try {
        setMarshalLoading(true)
        setError(null)

        const response = await fetch('/api/admin/marshals', { cache: 'no-store' })
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to load marshals')
        }

        if (!cancelled) {
          setMarshals(result.marshals || [])
          setSelectedMarshalId(room.assignment?.marshal_id || '')
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
  }, [open, room])

  const currentStateLabel = useMemo(() => {
    switch (room?.category) {
      case 'assigned_covered':
        return 'Assigned & Covered'
      case 'assigned_not_covered':
        return 'Assigned & Not Covered'
      default:
        return 'Not Assigned & Not Covered'
    }
  }, [room])

  if (!open || !room) return null

  const handleAction = async (mode: 'assign' | 'unassign' | 'reassign') => {
    try {
      setActionLoading(true)
      setError(null)

      if ((mode === 'assign' || mode === 'reassign') && !selectedMarshalId) {
        setError('Please select a marshal')
        return
      }

      const endpoint =
        mode === 'assign'
          ? '/api/admin/room-assignments/assign'
          : mode === 'unassign'
            ? '/api/admin/room-assignments/unassign'
            : '/api/admin/room-assignments/reassign'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date,
          block: room.block,
          floor: room.floor,
          room_number: room.room_number,
          marshal_id: mode === 'unassign' ? undefined : selectedMarshalId,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          setError(result.error || 'This room cannot be changed because it is already covered')
          return
        }
        throw new Error(result.error || 'Failed to update room assignment')
      }

      await onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update room assignment')
    } finally {
      setActionLoading(false)
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
          maxWidth: '560px',
          backgroundColor: 'rgba(255, 252, 247, 0.98)',
          border: '1px solid rgba(180, 101, 30, 0.14)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
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
              Room Assignment
            </h3>
            <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.84rem' }}>
              {room.block} Floor {room.floor} • {room.room_number}
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <XCircle size={24} color="#7a6a55" />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <p style={fieldLabel}>Date</p>
              <p style={fieldValue}>{date}</p>
            </div>
            <div>
              <p style={fieldLabel}>Current State</p>
              <p style={fieldValue}>{currentStateLabel}</p>
            </div>
            <div>
              <p style={fieldLabel}>Assigned Marshal</p>
              <p style={fieldValue}>{room.assignment?.marshal_name || room.assignment?.marshal_id || 'Unassigned'}</p>
            </div>
            <div>
              <p style={fieldLabel}>Coverage</p>
              <p style={fieldValue}>
                {room.inspection
                  ? `Covered by ${room.inspection.marshal_name || room.inspection.marshal_id || 'Unknown'}`
                  : 'Not covered'}
              </p>
            </div>
          </div>

          <div>
            <p style={fieldLabel}>Select Marshal</p>
            {marshalLoading ? (
              <div style={{ ...fieldValue, color: '#7a6a55' }}>Loading marshals...</div>
            ) : (
              <select
                value={selectedMarshalId}
                onChange={(e) => setSelectedMarshalId(e.target.value)}
                style={selectStyle}
                disabled={actionLoading}
              >
                <option value="">Select a marshal</option>
                {marshals.map((marshal) => (
                  <option key={marshal.marshal_id} value={marshal.marshal_id}>
                    {marshal.marshal_name} ({marshal.marshal_id})
                  </option>
                ))}
              </select>
            )}
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
        </div>

        <div
          style={{
            padding: '16px 24px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '10px',
          }}
        >
          {!room.assignment ? (
            <button
              onClick={() => handleAction('assign')}
              disabled={actionLoading || marshalLoading}
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                border: 'none',
                backgroundColor: '#B4651E',
                color: 'white',
                fontWeight: '700',
                cursor: actionLoading ? 'not-allowed' : 'pointer',
                opacity: actionLoading ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <UserPlus size={16} />
              Assign
            </button>
          ) : (
            <>
              <button
                onClick={() => handleAction('reassign')}
                disabled={actionLoading || marshalLoading}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#1e2d3d',
                  color: 'white',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <Repeat size={16} />
                Reassign
              </button>

              <button
                onClick={() => handleAction('unassign')}
                disabled={actionLoading}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(220,38,38,0.16)',
                  backgroundColor: 'rgba(220,38,38,0.08)',
                  color: '#991b1b',
                  fontWeight: '700',
                  cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                <UserMinus size={16} />
                Unassign
              </button>
            </>
          )}

          <button
            onClick={onClose}
            disabled={actionLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(180,101,30,0.14)',
              backgroundColor: 'transparent',
              color: '#7a6a55',
              fontWeight: '700',
              cursor: actionLoading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {actionLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : null}
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

