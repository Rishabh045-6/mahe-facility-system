'use client'

import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { ISSUE_TYPES } from '@/lib/utils/constants'

interface Issue {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
}

interface IssueFormProps {
  issues: Issue[]
  onAddIssue: () => void
  onUpdateIssue: (id: number, field: string, value: any) => void
  onRemoveIssue: (id: number) => void
  disabled?: boolean
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

export default function IssueForm({
  issues,
  onAddIssue,
  onUpdateIssue,
  onRemoveIssue,
  disabled = false,
}: IssueFormProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(
    issues.length > 0 ? issues[0].id : null
  )

  const toggleExpand = (id: number) => {
    setExpandedIssue(expandedIssue === id ? null : id)
  }

  const isComplete = (issue: Issue) =>
    issue.issue_type && issue.description && issue.description.length >= 10

  return (
    <div>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '20px',
      }}>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1a1208',
          margin: 0,
        }}>
          Reported Issues
        </h3>
        <button
          type="button"
          onClick={onAddIssue}
          disabled={disabled}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '9px 16px',
            backgroundColor: '#B4651E',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '0.875rem',
            fontWeight: '600',
            cursor: disabled ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.5 : 1,
            boxShadow: '0 2px 8px rgba(180,101,30,0.25)',
            transition: 'background-color 0.15s',
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#8f4e16' }}
          onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = '#B4651E' }}
        >
          <Plus size={15} />
          Add Issue
        </button>
      </div>

      {/* Empty state */}
      {issues.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px 20px',
          backgroundColor: '#fdf6ef',
          borderRadius: '12px',
          border: '1.5px dashed rgba(180, 101, 30, 0.2)',
        }}>
          <p style={{ color: '#c4b5a0', fontSize: '0.9rem', margin: 0 }}>
            No issues added yet. Click Add Issue to begin.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {issues.map((issue, index) => {
            const complete = isComplete(issue)
            const isOpen = expandedIssue === issue.id

            return (
              <div
                key={issue.id}
                style={{
                  border: complete
                    ? '1.5px solid rgba(22, 163, 74, 0.25)'
                    : '1.5px solid rgba(180, 101, 30, 0.15)',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  backgroundColor: '#fffcf7',
                }}
              >
                {/* Issue card header */}
                <div
                  onClick={() => toggleExpand(issue.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    backgroundColor: isOpen ? '#fdf6ef' : 'transparent',
                    cursor: 'pointer',
                    gap: '12px',
                    transition: 'background-color 0.15s',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        backgroundColor: complete ? '#dcfce7' : '#fdf6ef',
                        border: complete ? '1.5px solid #16a34a' : '1.5px solid rgba(180,101,30,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        color: complete ? '#16a34a' : '#B4651E',
                        flexShrink: 0,
                      }}>
                        {index + 1}
                      </span>
                      {issue.issue_type ? (
                        <p style={{
                          fontWeight: '600',
                          color: '#1a1208',
                          fontSize: '0.9rem',
                          margin: 0,
                          fontFamily: "'DM Sans', sans-serif",
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {issue.issue_type}
                        </p>
                      ) : (
                        <p style={{
                          color: '#c4b5a0',
                          fontStyle: 'italic',
                          fontSize: '0.875rem',
                          margin: 0,
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          Issue type not selected
                        </p>
                      )}
                    </div>
                    {issue.room_location && (
                      <p style={{
                        fontSize: '0.78rem',
                        color: '#7a6a55',
                        margin: '4px 0 0 30px',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        {issue.room_location}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {complete && (
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        letterSpacing: '0.03em',
                      }}>
                        READY
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onRemoveIssue(issue.id)
                      }}
                      disabled={disabled}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        border: '1px solid rgba(220, 38, 38, 0.15)',
                        backgroundColor: 'rgba(220, 38, 38, 0.05)',
                        color: '#dc2626',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.12)'
                      }}
                      onMouseLeave={(e) => {
                        if (!disabled) e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.05)'
                      }}
                    >
                      <Trash2 size={14} />
                    </button>

                    {isOpen
                      ? <ChevronUp size={18} color="#B4651E" />
                      : <ChevronDown size={18} color="#c4b5a0" />
                    }
                  </div>
                </div>

                {/* Expanded fields */}
                {isOpen && (
                  <div style={{
                    padding: '20px',
                    borderTop: '1px solid rgba(180, 101, 30, 0.08)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '16px',
                    backgroundColor: '#fffcf7',
                  }}>

                    {/* Issue Type */}
                    <div>
                      <label style={fieldLabel}>Issue Type *</label>
                      <select
                        value={issue.issue_type}
                        onChange={(e) => onUpdateIssue(issue.id, 'issue_type', e.target.value)}
                        disabled={disabled}
                        style={{
                          ...fieldInput,
                          appearance: 'auto',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          opacity: disabled ? 0.5 : 1,
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#B4651E'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.2)'}
                      >
                        <option value="">Select issue type</option>
                        {Object.entries(ISSUE_TYPES).map(([category, types]) => (
                          <optgroup key={category} label={category}>
                            {(types as readonly string[]).map((type) => {
                              const value = type === category ? category : `${category} - ${type}`
                              const label = type === category ? category : type
                              return (
                                <option key={`${category}-${type}`} value={value}>
                                  {label}
                                </option>
                              )
                            })}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Room Location */}
                    <div>
                      <label style={fieldLabel}>Room / Location (Optional)</label>
                      <input
                        type="text"
                        value={issue.room_location}
                        onChange={(e) => onUpdateIssue(issue.id, 'room_location', e.target.value)}
                        disabled={disabled}
                        placeholder="e.g., Room 205, Corridor B"
                        style={{
                          ...fieldInput,
                          opacity: disabled ? 0.5 : 1,
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#B4651E'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.2)'}
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label style={fieldLabel}>
                        Description * &nbsp;
                        <span style={{ fontWeight: '400', textTransform: 'none', letterSpacing: 0 }}>
                          (minimum 10 characters)
                        </span>
                      </label>
                      <textarea
                        value={issue.description}
                        onChange={(e) => onUpdateIssue(issue.id, 'description', e.target.value)}
                        disabled={disabled}
                        placeholder="Describe the issue in detail..."
                        rows={4}
                        style={{
                          ...fieldInput,
                          resize: 'vertical',
                          opacity: disabled ? 0.5 : 1,
                          lineHeight: '1.5',
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#B4651E'}
                        onBlur={(e) => e.target.style.borderColor = 'rgba(180, 101, 30, 0.2)'}
                      />
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                      }}>
                        <span style={{
                          fontSize: '0.78rem',
                          color: issue.description.length < 10 && issue.description.length > 0
                            ? '#dc2626'
                            : '#7a6a55',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {issue.description.length < 10 && issue.description.length > 0
                            ? `${10 - issue.description.length} more characters needed`
                            : ''}
                        </span>
                        <span style={{
                          fontSize: '0.78rem',
                          color: '#c4b5a0',
                          fontFamily: "'DM Sans', sans-serif",
                        }}>
                          {issue.description.length}/500
                        </span>
                      </div>
                    </div>

                    {/* Movable checkbox */}
                    <label style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      opacity: disabled ? 0.5 : 1,
                    }}>
                      <input
                        type="checkbox"
                        id={`movable-${issue.id}`}
                        checked={issue.is_movable}
                        onChange={(e) => onUpdateIssue(issue.id, 'is_movable', e.target.checked)}
                        disabled={disabled}
                        style={{
                          width: '16px',
                          height: '16px',
                          accentColor: '#B4651E',
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          flexShrink: 0,
                        }}
                      />
                      <span style={{
                        fontSize: '0.875rem',
                        color: '#1a1208',
                        fontFamily: "'DM Sans', sans-serif",
                      }}>
                        This is a movable item (e.g., chair, table)
                      </span>
                    </label>
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