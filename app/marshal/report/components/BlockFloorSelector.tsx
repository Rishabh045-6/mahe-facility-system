'use client'

import { useState } from 'react'
import { Building2, Layers, ChevronDown } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG } from '@/lib/utils/constants'

interface BlockFloorSelectorProps {
  block: string
  floor: string
  onBlockChange: (block: string) => void
  onFloorChange: (floor: string) => void
  disabled?: boolean
}

export default function BlockFloorSelector({
  block,
  floor,
  onBlockChange,
  onFloorChange,
  disabled = false,
}: BlockFloorSelectorProps) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showFloorModal, setShowFloorModal] = useState(false)

  const availableFloors = block ? FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG] : []

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
        border: isSelected
          ? '1.5px solid #B4651E'
          : '1.5px solid rgba(180, 101, 30, 0.2)',
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

  return (
    <div>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1a1208',
        margin: '0 0 20px',
      }}>
        Location Selection
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Block */}
        <div>
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
            <Building2 size={13} color="#B4651E" />
            Block
          </label>
          {selectorButton(block, 'Select Block', () => setShowBlockModal(true), disabled, !!block)}
        </div>

        {/* Floor */}
        <div>
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
            <Layers size={13} color="#B4651E" />
            Floor
          </label>
          {selectorButton(
            floor ? `Floor ${floor}` : '',
            'Select Floor',
            () => setShowFloorModal(true),
            disabled || !block,
            !!floor && !!block,
          )}
          {!block && (
            <p style={{ fontSize: '0.8rem', color: '#c4b5a0', marginTop: '6px' }}>
              Please select a block first
            </p>
          )}
        </div>
      </div>

      {/* Block Modal */}
      {showBlockModal && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
            }}>
              <h4 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.05rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: 0,
              }}>
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
                    setShowBlockModal(false)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: block === b
                      ? '1.5px solid #B4651E'
                      : '1.5px solid rgba(180, 101, 30, 0.1)',
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

      {/* Floor Modal */}
      {showFloorModal && block && (
        <div style={modalOverlay}>
          <div style={modalBox}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
            }}>
              <h4 style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.05rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: '0 0 4px',
              }}>
                Select Floor
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#B4651E', margin: 0, fontWeight: '500' }}>
                Block {block}
              </p>
            </div>

            <div style={{ padding: '16px 24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {availableFloors.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    onFloorChange(f)
                    setShowFloorModal(false)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    border: floor === f
                      ? '1.5px solid #B4651E'
                      : '1.5px solid rgba(180, 101, 30, 0.1)',
                    backgroundColor: floor === f ? '#B4651E' : '#fdf6ef',
                    color: floor === f ? 'white' : '#1a1208',
                    fontSize: '0.95rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  Floor {f}
                </button>
              ))}
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
    </div>
  )
}