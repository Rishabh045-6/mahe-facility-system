'use client'

import { CheckCircle2, AlertCircle, Layers, Image as ImageIcon, ClipboardList, AlertTriangle } from 'lucide-react'

interface SubmissionSummaryProps {
  block: string
  floor: string
  checklistCount: number
  issueCount: number
  imageCount: number
}

export default function SubmissionSummary({
  block,
  floor,
  checklistCount,
  issueCount,
  imageCount,
}: SubmissionSummaryProps) {
  const totalChecklistItems = 19
  const completionPct = Math.round((checklistCount / totalChecklistItems) * 100)
  const isComplete = !!(block && floor && checklistCount === totalChecklistItems)

  const row = (
    icon: React.ReactNode,
    label: string,
    value: string,
    right: React.ReactNode,
    highlight?: boolean,
  ) => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      backgroundColor: highlight ? '#fdf6ef' : '#fffcf7',
      borderRadius: '12px',
      border: `1px solid ${highlight ? 'rgba(180,101,30,0.15)' : 'rgba(180,101,30,0.08)'}`,
      gap: '12px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180,101,30,0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <p style={{
            fontSize: '0.75rem',
            color: '#7a6a55',
            margin: '0 0 2px',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: '500',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            {label}
          </p>
          <p style={{
            fontSize: '0.95rem',
            fontWeight: '600',
            color: '#1a1208',
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {value}
          </p>
        </div>
      </div>
      <div style={{ flexShrink: 0 }}>{right}</div>
    </div>
  )

  return (
    <div>
      <h3 style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontSize: '1.1rem',
        fontWeight: '600',
        color: '#1a1208',
        margin: '0 0 20px',
      }}>
        Submission Summary
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>

        {/* Location */}
        {row(
          <Layers size={16} color="#B4651E" />,
          'Location',
          block && floor ? `${block}, Floor ${floor}` : 'Not selected',
          block && floor
            ? <CheckCircle2 size={20} color="#16a34a" />
            : <AlertCircle size={20} color="#f59e0b" />,
          !!(block && floor),
        )}

        {/* Checklist */}
        {row(
          <ClipboardList size={16} color="#B4651E" />,
          'Checklist Completion',
          `${checklistCount}/${totalChecklistItems} items`,
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '72px',
              height: '6px',
              backgroundColor: 'rgba(180,101,30,0.1)',
              borderRadius: '6px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${completionPct}%`,
                backgroundColor: completionPct === 100 ? '#16a34a' : '#B4651E',
                borderRadius: '6px',
                transition: 'width 0.3s ease',
              }} />
            </div>
            <span style={{
              fontSize: '0.85rem',
              fontWeight: '700',
              color: completionPct === 100 ? '#16a34a' : '#B4651E',
              fontFamily: "'DM Sans', sans-serif",
              minWidth: '36px',
              textAlign: 'right',
            }}>
              {completionPct}%
            </span>
          </div>,
          checklistCount === totalChecklistItems,
        )}

        {/* Issues */}
        {row(
          <AlertTriangle size={16} color="#B4651E" />,
          'Issues Reported',
          `${issueCount} ${issueCount === 1 ? 'issue' : 'issues'}`,
          issueCount > 0
            ? (
              <span style={{
                backgroundColor: '#fef3c7',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#92400e',
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {issueCount}
              </span>
            )
            : <CheckCircle2 size={20} color="#16a34a" />,
          issueCount > 0,
        )}

        {/* Images */}
        {row(
          <ImageIcon size={16} color="#B4651E" />,
          'Images Uploaded',
          `${imageCount} ${imageCount === 1 ? 'image' : 'images'}`,
          imageCount > 0
            ? (
              <span style={{
                backgroundColor: '#fdf6ef',
                border: '1px solid rgba(180,101,30,0.2)',
                color: '#B4651E',
                fontSize: '0.8rem',
                fontWeight: '700',
                padding: '3px 10px',
                borderRadius: '20px',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                {imageCount}
              </span>
            )
            : (
              <span style={{
                fontSize: '0.8rem',
                color: '#c4b5a0',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                Optional
              </span>
            ),
          false,
        )}
      </div>

      {/* Status banner */}
      <div style={{
        padding: '16px 20px',
        borderRadius: '12px',
        backgroundColor: isComplete ? 'rgba(22, 163, 74, 0.06)' : 'rgba(245, 158, 11, 0.06)',
        border: `1.5px solid ${isComplete ? 'rgba(22, 163, 74, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
      }}>
        {isComplete
          ? <CheckCircle2 size={24} color="#16a34a" style={{ flexShrink: 0 }} />
          : <AlertCircle size={24} color="#f59e0b" style={{ flexShrink: 0 }} />
        }
        <div>
          <p style={{
            fontWeight: '700',
            color: isComplete ? '#166534' : '#92400e',
            margin: '0 0 3px',
            fontSize: '0.95rem',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {isComplete ? 'Ready to Submit' : 'Incomplete Report'}
          </p>
          <p style={{
            fontSize: '0.82rem',
            color: isComplete ? '#166534' : '#92400e',
            margin: 0,
            fontFamily: "'DM Sans', sans-serif",
            opacity: 0.85,
          }}>
            {isComplete
              ? 'All required fields are completed. You can submit your report.'
              : 'Please complete all required fields before submitting.'
            }
          </p>
        </div>
      </div>
    </div>
  )
}