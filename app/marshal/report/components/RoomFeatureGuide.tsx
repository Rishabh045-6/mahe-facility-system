'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { ROOM_FEATURE_DEFAULTS, ROOM_FEATURE_HEADERS } from '@/lib/utils/constants'

interface RoomFeatureGuideProps {
  block: string
  floor: string
}

export default function RoomFeatureGuide({ block, floor }: RoomFeatureGuideProps) {
  const [openRoom, setOpenRoom] = useState<string | null>(null)

  const roomDefaults = useMemo(() => {
    if (!block || !floor) return {}
    return ROOM_FEATURE_DEFAULTS[block]?.[floor] ?? {}
  }, [block, floor])

  const rooms = Object.entries(roomDefaults)

  if (!block || !floor) return null

  return (
    <div>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1a1208',
        margin: '0 0 6px',
      }}>
        Room Default Features
      </h3>
      <p style={{ fontSize: '0.85rem', color: '#7a6a55', margin: '0 0 16px' }}>
        Click a room to view default feature values.
      </p>

      {rooms.length === 0 ? (
        <div style={{
          border: '1.5px dashed rgba(180, 101, 30, 0.2)',
          borderRadius: '12px',
          backgroundColor: '#fdf6ef',
          padding: '16px',
          fontSize: '0.85rem',
          color: '#7a6a55',
        }}>
          No default room feature map is set for {block}, Floor {floor} yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {rooms.map(([room, value]) => {
            const values = value.split('|').map((entry) => entry.trim())
            const isOpen = openRoom === room

            return (
              <div key={room} style={{
                border: '1.5px solid rgba(180, 101, 30, 0.14)',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#fffcf7',
              }}>
                <button
                  type="button"
                  onClick={() => setOpenRoom(isOpen ? null : room)}
                  style={{
                    width: '100%',
                    border: 'none',
                    backgroundColor: isOpen ? '#fdf6ef' : 'transparent',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                >
                  <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#1a1208' }}>
                    Room {room}
                  </span>
                  {isOpen ? <ChevronUp size={17} color="#B4651E" /> : <ChevronDown size={17} color="#c4b5a0" />}
                </button>

                {isOpen && (
                  <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(180, 101, 30, 0.08)' }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(145px, 1fr))',
                      gap: '8px',
                    }}>
                      {ROOM_FEATURE_HEADERS.map((header, index) => (
                        <div
                          key={`${room}-${header}`}
                          style={{
                            backgroundColor: '#fdf6ef',
                            borderRadius: '10px',
                            padding: '10px 12px',
                            border: '1px solid rgba(180, 101, 30, 0.1)',
                          }}
                        >
                          <p style={{
                            margin: '0 0 4px',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: '#7a6a55',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}>
                            {header}
                          </p>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, color: '#1a1208' }}>
                            {values[index] || '-'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}