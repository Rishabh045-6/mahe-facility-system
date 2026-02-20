'use client'

import { useMemo, useState } from 'react'
import { DoorOpen, ChevronDown } from 'lucide-react'
import { ROOM_DEFAULTS_BY_FLOOR } from '@/lib/utils/room-defaults'

interface RoomFeatureDropdownProps {
  block: string
  floor: string
}

const cellStyle: React.CSSProperties = {
  border: '1px solid rgba(180, 101, 30, 0.12)',
  borderRadius: '8px',
  padding: '10px',
  backgroundColor: '#fffcf7',
}

export default function RoomFeatureDropdown({ block, floor }: RoomFeatureDropdownProps) {
  const [selectedRoom, setSelectedRoom] = useState('')

  const rooms = useMemo(() => ROOM_DEFAULTS_BY_FLOOR[floor] || [], [floor])
  const roomData = rooms.find(({ room }) => room === selectedRoom)

  return (
    <div>
      <div style={{ marginBottom: '14px' }}>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1a1208',
          margin: '0 0 6px',
        }}>
          Room-wise Default Features
        </h3>
        <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.84rem' }}>
          Block {block}, Floor {floor} • Select a room to view the default values from the inspection sheet.
        </p>
      </div>

      {rooms.length === 0 ? (
        <div style={{
          padding: '14px',
          borderRadius: '10px',
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180, 101, 30, 0.15)',
          color: '#7a6a55',
          fontSize: '0.88rem',
        }}>
          Default room values are currently configured for Floor 2.
        </div>
      ) : (
        <>
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
            color: '#7a6a55',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            marginBottom: '8px',
          }}>
            <DoorOpen size={13} color="#B4651E" />
            Room
          </label>
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <select
              value={selectedRoom}
              onChange={(e) => setSelectedRoom(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '1.5px solid rgba(180, 101, 30, 0.2)',
                borderRadius: '10px',
                backgroundColor: '#fffcf7',
                color: selectedRoom ? '#1a1208' : '#7a6a55',
                fontSize: '0.92rem',
                appearance: 'none',
              }}
            >
              <option value="">Select room (e.g., 201)</option>
              {rooms.map(({ room }) => (
                <option key={room} value={room}>Room {room}</option>
              ))}
            </select>
            <ChevronDown size={16} color="#c4b5a0" style={{ position: 'absolute', right: 12, top: 14 }} />
          </div>

          {roomData && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '10px',
            }}>
              {[
                ['Table Top', roomData.tableTop],
                ["Chair's Qty", roomData.chairs],
                ['Lights', roomData.lights],
                ['Fans', roomData.fans],
                ['AC', roomData.ac],
                ['Projector', roomData.projector],
                ['Podium', roomData.podium],
                ['Speakers', roomData.speakers],
                ['Cement', roomData.cement],
                ['Dust Bin', roomData.dustbin],
                ['Amplifier', roomData.amplifier],
                ['Extra Plugs', roomData.extraPlugs],
                ['House Code', roomData.houseCode],
              ].map(([label, value]) => (
                <div key={label} style={cellStyle}>
                  <p style={{ margin: '0 0 4px', fontSize: '0.73rem', color: '#7a6a55', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {label}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.94rem', color: '#1a1208', fontWeight: 600 }}>
                    {value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
