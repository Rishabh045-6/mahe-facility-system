// report/components/IssueActionBar.tsx
'use client'

import { Save, ArrowRight, CheckCircle } from 'lucide-react'
import { getFloorKey } from '@/lib/utils/progress'

interface IssueActionBarProps {
  currentBlock: string
  currentFloor: string
  currentRoom: string
  roomIssues: any[]
  onSaveIssue: () => void
  onMoveNext: () => void
  disabled?: boolean
}

export default function IssueActionBar({
  currentBlock,
  currentFloor,
  currentRoom,
  roomIssues,
  onSaveIssue,
  onMoveNext,
  disabled = false
}: IssueActionBarProps) {
  const hasValidIssues = roomIssues.some(
    issue => issue.issue_type && issue.description?.trim().length >= 10
  )

  return (
    <div style={{ 
      display: 'flex', 
      gap: '12px', 
      marginTop: '16px',
      flexWrap: 'wrap'
    }}>
      {/* Save Issue Button */}
      <button
        type="button"
        onClick={onSaveIssue}
        disabled={disabled || !hasValidIssues}
        style={{
          flex: '1 1 200px',
          padding: '14px 16px',
          backgroundColor: hasValidIssues && !disabled ? '#B4651E' : '#c4b5a0',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: (hasValidIssues && !disabled) ? 'pointer' : 'not-allowed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s',
          fontFamily: "'DM Sans', sans-serif",
          opacity: disabled ? 0.6 : 1
        }}
        title={!hasValidIssues ? "Fill issue type & description (min 10 chars)" : "Save this issue"}
      >
        <Save size={18} />
        <span>Save Issue</span>
      </button>

      {/* Move to Next Room Button */}
      <button
        type="button"
        onClick={onMoveNext}
        disabled={disabled}
        style={{
          flex: '1 1 200px',
          padding: '14px 16px',
          backgroundColor: disabled ? '#c4b5a0' : '#1a1208',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '0.95rem',
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          transition: 'all 0.15s',
          fontFamily: "'DM Sans', sans-serif",
          opacity: disabled ? 0.6 : 1
        }}
      >
        <span>Next: {currentRoom ? `Room ${currentRoom}` : 'Select Room'}</span>
        <ArrowRight size={18} />
      </button>
    </div>
  )
}