'use client'

import { useState } from 'react'
import {
  CheckCircle2, XCircle, Image as ImageIcon,
  MapPin, Clock, User, ChevronDown, ChevronUp, Tag, Package
} from 'lucide-react'
import { formatTime } from '@/lib/utils/time'
import IssueGallery from './IssueGallery'

interface Issue {
  id: string
  block: string
  floor: string
  room_location?: string
  issue_type: string
  description: string
  is_movable: boolean
  images?: string[]
  marshal_id: string
  status: 'approved' | 'denied' | 'pending'
  reported_at: string
  marshals?: { name: string }
}

interface IssueCardProps {
  issue: Issue
  onStatusChange: (issueId: string, newStatus: 'approved' | 'denied') => void
}

export default function IssueCard({ issue, onStatusChange }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)

  const isApproved = issue.status === 'approved'
  const isDenied = issue.status === 'denied'
  const isPending = !isApproved && !isDenied

  const statusStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '3px 10px',
    borderRadius: '20px',
    fontSize: '0.75rem',
    fontWeight: '700',
    letterSpacing: '0.04em',
    fontFamily: "'DM Sans', sans-serif",
    backgroundColor: isApproved ? '#dcfce7' : isDenied ? '#fee2e2' : '#fef3c7',
    color: isApproved ? '#166534' : isDenied ? '#991b1b' : '#92400e',
    border: `1px solid ${isApproved ? 'rgba(22,163,74,0.2)' : isDenied ? 'rgba(220,38,38,0.2)' : 'rgba(245,158,11,0.2)'}`,
  }

  const metaItem = (icon: React.ReactNode, text: string) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      fontSize: '0.8rem', color: '#7a6a55',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      {icon}
      <span>{text}</span>
    </div>
  )

  return (
    <div style={{
      padding: '20px 24px',
      backgroundColor: 'rgba(255,252,247,0.6)',
      transition: 'background-color 0.15s',
    }}
      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fdf6ef'}
      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,252,247,0.6)'}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>

        {/* Left */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Status + type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <span style={statusStyle}>
              {isApproved ? '✓' : isDenied ? '✕' : '·'}
              {(issue.status || 'pending').charAt(0).toUpperCase() + (issue.status || 'pending').slice(1)}
            </span>
            {issue.is_movable && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                padding: '3px 10px', borderRadius: '20px',
                fontSize: '0.75rem', fontWeight: '600',
                backgroundColor: '#fdf6ef',
                border: '1px solid rgba(180,101,30,0.2)',
                color: '#B4651E',
                fontFamily: "'DM Sans', sans-serif",
              }}>
                <Package size={11} />
                Movable
              </span>
            )}
          </div>

          <h3 style={{
            fontSize: '1rem', fontWeight: '700',
            color: '#1a1208', margin: '0 0 10px',
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {issue.issue_type}
          </h3>

          {/* Meta row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: '12px',
            marginBottom: '12px',
          }}>
            {metaItem(<MapPin size={13} color="#B4651E" />, `${issue.block}, Floor ${issue.floor}`)}
            {issue.room_location && metaItem(<Tag size={13} color="#B4651E" />, issue.room_location)}
            {metaItem(<Clock size={13} color="#B4651E" />, formatTime(issue.reported_at))}
            {metaItem(<User size={13} color="#B4651E" />, issue.marshals?.name || issue.marshal_id || 'Unknown')}
          </div>

          <p style={{
            fontSize: '0.875rem', color: '#3d2f1e', lineHeight: 1.6,
            margin: '0 0 12px', fontFamily: "'DM Sans', sans-serif",
          }}>
            {issue.description}
          </p>

          {/* Image toggle */}
          {issue.images && issue.images.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '6px 12px',
                backgroundColor: expanded ? '#fdf6ef' : 'transparent',
                border: '1.5px solid rgba(180,101,30,0.2)',
                borderRadius: '8px',
                color: '#B4651E',
                fontSize: '0.8rem', fontWeight: '600',
                cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
                transition: 'all 0.15s',
              }}
            >
              <ImageIcon size={13} />
              {issue.images.length} {issue.images.length === 1 ? 'image' : 'images'}
              {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          )}
        </div>

        {/* Right — approve / deny */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            backgroundColor: '#fdf6ef',
            border: '1px solid rgba(180,101,30,0.12)',
            borderRadius: '12px',
            padding: '10px 12px',
          }}>
            <p style={{
              fontSize: '0.7rem', color: '#7a6a55', fontWeight: '600',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              margin: '0 0 8px', textAlign: 'center',
              fontFamily: "'DM Sans', sans-serif",
            }}>
              Quick Actions
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => onStatusChange(issue.id, 'approved')}
                title="Approve"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: isApproved ? '2px solid #16a34a' : '1.5px solid rgba(22,163,74,0.25)',
                  backgroundColor: isApproved ? '#16a34a' : '#dcfce7',
                  color: isApproved ? 'white' : '#16a34a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isApproved) e.currentTarget.style.backgroundColor = '#bbf7d0' }}
                onMouseLeave={(e) => { if (!isApproved) e.currentTarget.style.backgroundColor = '#dcfce7' }}
              >
                <CheckCircle2 size={17} />
              </button>

              <button
                onClick={() => onStatusChange(issue.id, 'denied')}
                title="Deny"
                style={{
                  width: '36px', height: '36px', borderRadius: '50%',
                  border: isDenied ? '2px solid #dc2626' : '1.5px solid rgba(220,38,38,0.25)',
                  backgroundColor: isDenied ? '#dc2626' : '#fee2e2',
                  color: isDenied ? 'white' : '#dc2626',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { if (!isDenied) e.currentTarget.style.backgroundColor = '#fecaca' }}
                onMouseLeave={(e) => { if (!isDenied) e.currentTarget.style.backgroundColor = '#fee2e2' }}
              >
                <XCircle size={17} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      {expanded && issue.images && issue.images.length > 0 && (
        <div style={{
          marginTop: '16px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(180,101,30,0.1)',
        }}>
          <IssueGallery images={issue.images} />
        </div>
      )}
    </div>
  )
}