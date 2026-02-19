'use client'

import { AlertTriangle, CheckCircle2, MapPin } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG } from '@/lib/utils/constants'

interface FloorCoverage {
  date: string
  block: string
  floor: string
  marshal_id: string
  submitted_at: string
  marshals?: { name: string }
}

interface FloorCoverageAlertProps {
  floorCoverage: FloorCoverage[]
}

export default function FloorCoverageAlert({ floorCoverage }: FloorCoverageAlertProps) {
  const allFloors = BLOCKS.flatMap(block =>
    FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG].map(floor => ({ block, floor }))
  )

  const coveredFloors = floorCoverage.map(fc => ({ block: fc.block, floor: fc.floor }))
  const missingFloors = allFloors.filter(
    af => !coveredFloors.some(cf => cf.block === af.block && cf.floor === af.floor)
  )

  if (missingFloors.length === 0) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '16px 20px',
        backgroundColor: 'rgba(22,163,74,0.06)',
        border: '1.5px solid rgba(22,163,74,0.2)',
        borderLeft: '4px solid #16a34a',
        borderRadius: '0 12px 12px 0',
      }}>
        <CheckCircle2 size={20} color="#16a34a" style={{ flexShrink: 0 }} />
        <div>
          <p style={{
            fontWeight: '700', color: '#166534', margin: '0 0 2px',
            fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
          }}>
            All Floors Covered
          </p>
          <p style={{
            fontSize: '0.82rem', color: '#166534', margin: 0, opacity: 0.8,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            All {allFloors.length} floors have been inspected today.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      backgroundColor: 'rgba(255, 252, 247, 0.95)',
      border: '1.5px solid rgba(180,101,30,0.15)',
      borderLeft: '4px solid #f59e0b',
      borderRadius: '0 12px 12px 0',
      padding: '20px 24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.04)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '16px', flexWrap: 'wrap', gap: '10px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} color="#f59e0b" />
          <div>
            <p style={{
              fontWeight: '700', color: '#1a1208', margin: '0 0 2px',
              fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif",
            }}>
              Floor Coverage Alert
            </p>
            <p style={{
              fontSize: '0.8rem', color: '#7a6a55', margin: 0,
              fontFamily: "'DM Sans', sans-serif",
            }}>
              {missingFloors.length} floor{missingFloors.length !== 1 ? 's' : ''} not inspected today
            </p>
          </div>
        </div>
        <span style={{
          backgroundColor: '#fef3c7',
          border: '1px solid rgba(245,158,11,0.3)',
          color: '#92400e',
          fontSize: '0.8rem', fontWeight: '700',
          padding: '4px 12px', borderRadius: '20px',
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {missingFloors.length} Missing
        </span>
      </div>

      {/* Missing floor grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
        gap: '10px',
        marginBottom: '20px',
      }}>
        {missingFloors.map((floor, index) => (
          <div key={index} style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 12px',
            backgroundColor: '#fffcf7',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '10px',
          }}>
            <MapPin size={13} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div>
              <p style={{
                fontWeight: '700', color: '#1a1208', margin: '0 0 1px',
                fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif",
              }}>
                {floor.block}
              </p>
              <p style={{
                fontSize: '0.75rem', color: '#7a6a55', margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Floor {floor.floor}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Coverage summary per block */}
      <div style={{
        backgroundColor: '#fdf6ef',
        border: '1px solid rgba(180,101,30,0.1)',
        borderRadius: '10px',
        padding: '14px 16px',
      }}>
        <p style={{
          fontSize: '0.78rem', fontWeight: '700', color: '#7a6a55',
          textTransform: 'uppercase', letterSpacing: '0.06em',
          margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif",
        }}>
          Coverage Summary
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
          gap: '10px',
        }}>
          {BLOCKS.map((block) => {
            const totalFloors = FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG].length
            const covered = floorCoverage.filter(fc => fc.block === block).length
            const pct = Math.round((covered / totalFloors) * 100)
            const barColor = pct === 100 ? '#16a34a' : pct > 50 ? '#f59e0b' : '#dc2626'

            return (
              <div key={block} style={{
                backgroundColor: '#fffcf7',
                border: '1px solid rgba(180,101,30,0.1)',
                borderRadius: '8px',
                padding: '10px',
              }}>
                <p style={{
                  fontWeight: '700', color: '#1a1208', margin: '0 0 4px',
                  fontSize: '0.85rem', fontFamily: "'DM Sans', sans-serif",
                }}>
                  {block}
                </p>
                <p style={{
                  fontSize: '0.75rem', color: '#7a6a55', margin: '0 0 6px',
                  fontFamily: "'DM Sans', sans-serif",
                }}>
                  {covered}/{totalFloors} floors
                </p>
                <div style={{
                  height: '5px', backgroundColor: 'rgba(180,101,30,0.1)',
                  borderRadius: '4px', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%', width: `${pct}%`,
                    backgroundColor: barColor,
                    borderRadius: '4px',
                    transition: 'width 0.4s ease',
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}