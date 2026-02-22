// report/components/ProgressHeader.tsx
'use client'

import { Clock, Building } from 'lucide-react'

interface ProgressHeaderProps {
  marshalName: string
  currentBlock: string
  currentFloor: string
  progressCount: number
  totalFloors: number
  progressPercentage: number
  timeRemaining: string
  formLocked: boolean
}

export default function ProgressHeader({
  marshalName,
  currentBlock,
  currentFloor,
  progressCount,
  totalFloors,
  progressPercentage,
  timeRemaining,
  formLocked
}: ProgressHeaderProps) {
  return (
    <header
      style={{
        backgroundColor: 'white',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          maxWidth: '800px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.3rem',
              fontWeight: '600',
              color: '#1a1208',
              margin: 0,
            }}
          >
            Daily Inspection Report
          </h1>
          <p
            style={{
              color: '#7a6a55',
              marginTop: '4px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem',
            }}
          >
            Welcome, <span style={{ fontWeight: '600' }}>{marshalName}</span>
          </p>
        </div>

        <div
          style={{
            backgroundColor: '#fdf6ef',
            borderLeft: '4px solid #B4651E',
            padding: '10px 14px',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Clock size={18} color="#B4651E" />
          <div>
            <p
              style={{
                fontSize: '0.75rem',
                color: '#7a6a55',
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Time Remaining
            </p>
            <p
              style={{
                fontSize: '1rem',
                fontWeight: '700',
                color: '#B4651E',
                margin: 0,
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ maxWidth: '800px', margin: '12px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span style={{ fontSize: '0.85rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
            Floor Progress
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#B4651E', fontFamily: "'DM Sans', sans-serif" }}>
            {progressCount}/{totalFloors} ({Math.round(progressPercentage)}%)
          </span>
        </div>
        <div style={{ 
          backgroundColor: '#f5f5f4', 
          borderRadius: '9999px', 
          height: '8px', 
          overflow: 'hidden' 
        }}>
          <div
            style={{
              backgroundColor: '#B4651E',
              height: '100%',
              width: `${progressPercentage}%`,
              transition: 'width 0.3s ease',
              borderRadius: '9999px'
            }}
          />
        </div>
      </div>

      {/* Current Location Badge */}
      <div style={{ maxWidth: '800px', margin: '12px auto 0' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#fffcf7',
            padding: '10px 14px',
            borderRadius: '10px',
            border: '1px solid rgba(180,101,30,0.15)',
          }}
        >
          <Building size={16} color="#B4651E" />
          <span style={{ fontSize: '0.9rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
            Current:
          </span>
          <span style={{ 
            fontWeight: '600', 
            color: '#1a1208', 
            fontFamily: "'DM Sans', sans-serif",
            backgroundColor: '#fdf6ef',
            padding: '4px 10px',
            borderRadius: '6px'
          }}>
            {currentBlock} • Floor {currentFloor}
          </span>
        </div>
      </div>

      {formLocked && (
        <div
          style={{
            maxWidth: '800px',
            margin: '12px auto 0',
            backgroundColor: '#fef2f2',
            borderLeft: '4px solid #dc2626',
            padding: '12px 16px',
            borderRadius: '0 8px 8px 0',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <p
            style={{
              color: '#991b1b',
              fontWeight: '500',
              margin: 0,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '0.9rem'
            }}
          >
            Submission deadline has passed (6:00 PM)
          </p>
        </div>
      )}
    </header>
  )
}