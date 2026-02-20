'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from '@/lib/utils/constants'

interface ChecklistSectionProps {
  responses: Record<string, boolean>
  onChange: (itemId: string, response: boolean) => void
  disabled?: boolean
}

export default function ChecklistSection({
  responses,
  onChange,
  disabled = false,
}: ChecklistSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Classroom/Lab Upkeep': true,
    'Washroom & Utility': false,
    'Maintenance/Snag': false,
    'Daily Observations': false,
  })

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({ ...prev, [category]: !prev[category] }))
  }

  const getCategoryStats = (category: string) => {
    const items = CHECKLIST_ITEMS.filter(item => item.category === category)
    const completed = items.filter(item => responses[item.id.toString()] !== undefined).length
    return { total: items.length, completed }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem',
          fontWeight: '600',
          color: '#1a1208',
          margin: '0 0 6px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <span>📋</span>
          Daily Inspection Checklist
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#7a6a55', margin: 0 }}>
          Please mark each item as completed (✓) or not completed (✗)
        </p>
      </div>

      {/* Categories */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {CHECKLIST_CATEGORIES.map((category) => {
          const { total, completed } = getCategoryStats(category)
          const isExpanded = expandedCategories[category]
          const allDone = completed === total
          const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

          return (
            <div
              key={category}
              style={{
                border: '1.5px solid rgba(180, 101, 30, 0.12)',
                borderRadius: '12px',
                overflow: 'hidden',
                backgroundColor: '#fffcf7',
              }}
            >
              {/* Category header — clickable */}
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 18px',
                  backgroundColor: isExpanded ? '#fdf6ef' : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                  gap: '12px',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontWeight: '600',
                      color: '#1a1208',
                      fontSize: '0.9rem',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {category}
                    </span>
                    {allDone && (
                      <span style={{
                        backgroundColor: '#dcfce7',
                        color: '#16a34a',
                        fontSize: '0.7rem',
                        fontWeight: '700',
                        padding: '2px 8px',
                        borderRadius: '20px',
                        letterSpacing: '0.03em',
                      }}>
                        DONE
                      </span>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      flex: 1,
                      height: '4px',
                      backgroundColor: 'rgba(180, 101, 30, 0.1)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        height: '100%',
                        width: `${progressPct}%`,
                        backgroundColor: allDone ? '#16a34a' : '#B4651E',
                        borderRadius: '4px',
                        transition: 'width 0.3s ease',
                      }} />
                    </div>
                    <span style={{
                      fontSize: '0.75rem',
                      color: '#7a6a55',
                      whiteSpace: 'nowrap',
                      fontFamily: "'DM Sans', sans-serif",
                    }}>
                      {completed}/{total}
                    </span>
                  </div>
                </div>

                <div style={{ flexShrink: 0 }}>
                  {isExpanded
                    ? <ChevronUp size={18} color="#B4651E" />
                    : <ChevronDown size={18} color="#c4b5a0" />
                  }
                </div>
              </button>

              {/* Checklist items */}
              {isExpanded && (
                <div style={{
                  borderTop: '1px solid rgba(180, 101, 30, 0.08)',
                  padding: '12px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}>
                  {CHECKLIST_ITEMS.filter(item => item.category === category).map((item) => {
                    const response = responses[item.id.toString()]
                    const isCompleted = response === true
                    const isFailed = response === false

                    return (
                      <div
                        key={item.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '12px 14px',
                          borderRadius: '10px',
                          backgroundColor: isCompleted
                            ? 'rgba(22, 163, 74, 0.05)'
                            : isFailed
                            ? 'rgba(220, 38, 38, 0.04)'
                            : '#F5F0EA',
                          border: isCompleted
                            ? '1px solid rgba(22, 163, 74, 0.15)'
                            : isFailed
                            ? '1px solid rgba(220, 38, 38, 0.12)'
                            : '1px solid transparent',
                          gap: '12px',
                          transition: 'all 0.15s',
                        }}
                      >
                        <span style={{
                          flex: 1,
                          fontSize: '0.875rem',
                          color: isCompleted ? '#166534' : isFailed ? '#991b1b' : '#1a1208',
                          fontFamily: "'DM Sans', sans-serif",
                          lineHeight: 1.4,
                        }}>
                          {item.text}
                        </span>

                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                          {/* Tick button */}
                          <button
                            type="button"
                            onClick={() => onChange(item.id.toString(), true)}
                            disabled={disabled}
                            title="Mark as completed"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: isCompleted
                                ? '2px solid #16a34a'
                                : '2px solid rgba(180, 101, 30, 0.15)',
                              backgroundColor: isCompleted ? '#dcfce7' : '#fffcf7',
                              color: isCompleted ? '#16a34a' : '#c4b5a0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              opacity: disabled ? 0.5 : 1,
                              transition: 'all 0.15s',
                              flexShrink: 0,
                            }}
                          >
                            <Check size={16} />
                          </button>

                          {/* X button */}
                          <button
                            type="button"
                            onClick={() => onChange(item.id.toString(), false)}
                            disabled={disabled}
                            title="Mark as not completed"
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '50%',
                              border: isFailed
                                ? '2px solid #dc2626'
                                : '2px solid rgba(180, 101, 30, 0.15)',
                              backgroundColor: isFailed ? '#fee2e2' : '#fffcf7',
                              color: isFailed ? '#dc2626' : '#c4b5a0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: disabled ? 'not-allowed' : 'pointer',
                              opacity: disabled ? 0.5 : 1,
                              transition: 'all 0.15s',
                              flexShrink: 0,
                            }}
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}