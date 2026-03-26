'use client'

import { useState } from 'react'
import { AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react'

type ChecklistExceptionItem = {
  checklist_item_id: string
  label: string
  category: string
}

type ChecklistExceptionGroup = {
  marshal_id: string
  marshal_name: string
  date: string
  block: string
  floor: string
  items: ChecklistExceptionItem[]
}

interface ChecklistExceptionsSectionProps {
  items: ChecklistExceptionGroup[]
}

export default function ChecklistExceptionsSection({ items }: ChecklistExceptionsSectionProps) {
  const [expandedMarshals, setExpandedMarshals] = useState<Record<string, boolean>>({})

  const groupedByMarshal = items.reduce<Record<string, {
    marshal_id: string
    marshal_name: string
    entries: ChecklistExceptionGroup[]
    itemCount: number
  }>>((acc, entry) => {
    const key = entry.marshal_id
    if (!acc[key]) {
      acc[key] = {
        marshal_id: entry.marshal_id,
        marshal_name: entry.marshal_name,
        entries: [],
        itemCount: 0,
      }
    }

    acc[key].entries.push(entry)
    acc[key].itemCount += entry.items.length
    return acc
  }, {})

  const marshalGroups = Object.values(groupedByMarshal).sort((a, b) =>
    a.marshal_name.localeCompare(b.marshal_name)
  )

  const toggleMarshal = (marshalId: string) => {
    setExpandedMarshals(prev => ({ ...prev, [marshalId]: !prev[marshalId] }))
  }

  return (
    <div>
      <div
        style={{
          padding: '20px 28px',
          borderBottom: '1px solid rgba(180,101,30,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h2
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: '1.2rem',
              fontWeight: '600',
              color: '#1a1208',
              margin: '0 0 4px',
            }}
          >
            Checklist Exceptions
          </h2>
          <p style={{ color: '#7a6a55', fontSize: '0.84rem', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
            Only checklist items marked not completed.
          </p>
        </div>

        <span
          style={{
            backgroundColor: '#fdf6ef',
            border: '1px solid rgba(180,101,30,0.18)',
            borderRadius: '999px',
            padding: '4px 12px',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#B4651E',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {marshalGroups.length}
        </span>
      </div>

      {marshalGroups.length === 0 ? (
        <div style={{ padding: '28px', color: '#7a6a55', fontSize: '0.9rem', fontFamily: "'DM Sans', sans-serif" }}>
          No checklist exceptions found.
        </div>
      ) : (
        <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {marshalGroups.map((group) => {
            const isExpanded = !!expandedMarshals[group.marshal_id]

            return (
            <div
              key={group.marshal_id}
              style={{
                backgroundColor: '#fffcf7',
                border: '1px solid rgba(180,101,30,0.1)',
                borderRadius: '14px',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={() => toggleMarshal(group.marshal_id)}
                style={{
                  padding: '14px 16px',
                  width: '100%',
                  backgroundColor: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  flexWrap: 'wrap',
                  textAlign: 'left',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  {isExpanded ? <ChevronDown size={18} color="#B4651E" /> : <ChevronRight size={18} color="#B4651E" />}
                  <div>
                    <p style={{ margin: '0 0 4px', color: '#1a1208', fontSize: '0.92rem', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>
                      {group.marshal_name}
                    </p>
                    <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.8rem', fontFamily: "'DM Sans', sans-serif" }}>
                      {group.entries.length} location{group.entries.length !== 1 ? 's' : ''} with checklist exceptions
                    </p>
                  </div>
                </div>

                <span
                  style={{
                    backgroundColor: 'rgba(220,38,38,0.06)',
                    border: '1px solid rgba(220,38,38,0.14)',
                    borderRadius: '999px',
                    padding: '4px 10px',
                    color: '#991b1b',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {group.itemCount} item{group.itemCount !== 1 ? 's' : ''}
                </span>
              </button>

              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid rgba(180,101,30,0.08)' }}>
                  {group.entries.map((entry) => (
                    <div key={`${entry.marshal_id}|${entry.date}|${entry.block}|${entry.floor}`}>
                      <div
                        style={{
                          padding: '14px 16px',
                          borderBottom: '1px solid rgba(180,101,30,0.06)',
                          backgroundColor: '#fffaf3',
                        }}
                      >
                        <p style={{ margin: '0 0 4px', color: '#1a1208', fontSize: '0.84rem', fontWeight: '700', fontFamily: "'DM Sans', sans-serif" }}>
                          {entry.date} - {entry.block} - Floor {entry.floor}
                        </p>
                        <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
                          {entry.items.length} failed checklist item{entry.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {entry.items.map((item, index) => (
                          <div
                            key={`${entry.marshal_id}|${entry.date}|${entry.block}|${entry.floor}|${item.checklist_item_id}`}
                            style={{
                              padding: '12px 16px',
                              borderTop: index === 0 ? 'none' : '1px solid rgba(180,101,30,0.06)',
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: '10px',
                            }}
                          >
                            <AlertTriangle size={16} color="#dc2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                              <p style={{ margin: '0 0 3px', color: '#1a1208', fontSize: '0.85rem', fontWeight: '600', fontFamily: "'DM Sans', sans-serif" }}>
                                {item.label}
                              </p>
                              <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.75rem', fontFamily: "'DM Sans', sans-serif" }}>
                                {item.category}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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
