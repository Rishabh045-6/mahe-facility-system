'use client'

import { useEffect, useMemo, useState } from 'react'
import { XCircle, RefreshCw, Copy } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG } from '@/lib/utils/constants'

type CopyPreviewResponse = {
  source_date: string
  target_date: string
  scope: {
    block?: string
    floor?: string
  }
  mode: 'merge_skip'
  summary: {
    source_rows: number
    target_existing: number
    target_covered: number
    will_copy: number
    will_skip: number
  }
}

interface CopyAssignmentsModalProps {
  open: boolean
  targetDate: string
  onClose: () => void
  onSuccess: (nextDate: string) => Promise<void> | void
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '11px 14px',
  border: '1.5px solid rgba(180, 101, 30, 0.2)',
  borderRadius: '10px',
  fontSize: '0.92rem',
  outline: 'none',
  backgroundColor: '#fffcf7',
  color: '#1a1208',
  fontFamily: "'DM Sans', sans-serif",
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.78rem',
  color: '#7a6a55',
  fontWeight: '700',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  margin: '0 0 6px',
}

export default function CopyAssignmentsModal({
  open,
  targetDate,
  onClose,
  onSuccess,
}: CopyAssignmentsModalProps) {
  const [sourceDate, setSourceDate] = useState('')
  const [selectedTargetDate, setSelectedTargetDate] = useState(targetDate)
  const [block, setBlock] = useState('')
  const [floor, setFloor] = useState('')
  const [preview, setPreview] = useState<CopyPreviewResponse | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [executeLoading, setExecuteLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setSelectedTargetDate(targetDate)
    setPreview(null)
    setError(null)
    setBlock('')
    setFloor('')

    const base = new Date(`${targetDate}T00:00:00`)
    if (!Number.isNaN(base.getTime())) {
      base.setDate(base.getDate() - 1)
      setSourceDate(base.toISOString().split('T')[0])
    } else {
      setSourceDate('')
    }
  }, [open, targetDate])

  const floorOptions = useMemo(() => {
    if (!block) return []
    if (!BLOCKS.includes(block as (typeof BLOCKS)[number])) return []
    return [...FLOOR_CONFIG[block as (typeof BLOCKS)[number]]]
  }, [block])

  if (!open) return null

  const buildPayload = () => ({
    source_date: sourceDate,
    target_date: selectedTargetDate,
    block: block || undefined,
    floor: floor || undefined,
  })

  const handlePreview = async () => {
    try {
      setPreviewLoading(true)
      setError(null)
      setPreview(null)

      const response = await fetch('/api/admin/room-assignments/copy/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to preview copy')
      }

      setPreview(result)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to preview copy')
    } finally {
      setPreviewLoading(false)
    }
  }

  const handleExecute = async () => {
    try {
      setExecuteLoading(true)
      setError(null)

      const response = await fetch('/api/admin/room-assignments/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPayload(),
          mode: 'merge_skip',
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to copy assignments')
      }

      await onSuccess(result.target_date || selectedTargetDate)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to copy assignments')
    } finally {
      setExecuteLoading(false)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 60,
        padding: '24px',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '620px',
          backgroundColor: 'rgba(255, 252, 247, 0.98)',
          border: '1px solid rgba(180, 101, 30, 0.14)',
          borderRadius: '18px',
          overflow: 'hidden',
          boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(180, 101, 30, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div>
            <h3
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: '1.2rem',
                fontWeight: '600',
                color: '#1a1208',
                margin: '0 0 4px',
              }}
            >
              Copy Previous Day Assignments
            </h3>
            <p style={{ margin: 0, color: '#7a6a55', fontSize: '0.84rem' }}>
              Preview copy results before applying merge-skip copy.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <XCircle size={24} color="#7a6a55" />
          </button>
        </div>

        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyle}>Source Date</label>
              <input
                type="date"
                value={sourceDate}
                onChange={(e) => setSourceDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Target Date</label>
              <input
                type="date"
                value={selectedTargetDate}
                onChange={(e) => setSelectedTargetDate(e.target.value)}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Block Filter</label>
              <select
                value={block}
                onChange={(e) => {
                  setBlock(e.target.value)
                  setFloor('')
                }}
                style={inputStyle}
              >
                <option value="">All Blocks</option>
                {BLOCKS.map((blockValue) => (
                  <option key={blockValue} value={blockValue}>
                    {blockValue}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Floor Filter</label>
              <select
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                style={inputStyle}
                disabled={!block}
              >
                <option value="">All Floors</option>
                {floorOptions.map((floorValue) => (
                  <option key={floorValue} value={floorValue}>
                    Floor {floorValue}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.15)',
                color: '#991b1b',
                fontSize: '0.88rem',
              }}
            >
              {error}
            </div>
          )}

          {preview && (
            <div
              style={{
                border: '1px solid rgba(180,101,30,0.12)',
                borderRadius: '14px',
                backgroundColor: '#fffcf7',
                padding: '18px',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '12px',
                }}
              >
                {[
                  ['Source Rows', preview.summary.source_rows],
                  ['Target Existing', preview.summary.target_existing],
                  ['Target Covered', preview.summary.target_covered],
                  ['Will Copy', preview.summary.will_copy],
                  ['Will Skip', preview.summary.will_skip],
                ].map(([label, value]) => (
                  <div
                    key={String(label)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: '1px solid rgba(180,101,30,0.1)',
                      backgroundColor: '#fff',
                    }}
                  >
                    <p style={{ margin: '0 0 6px', color: '#7a6a55', fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {label}
                    </p>
                    <p style={{ margin: 0, color: '#1a1208', fontSize: '1.6rem', fontWeight: '700' }}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            padding: '16px 24px 24px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '10px',
          }}
        >
          <button
            onClick={handlePreview}
            disabled={previewLoading || executeLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#1e2d3d',
              color: 'white',
              fontWeight: '700',
              cursor: previewLoading || executeLoading ? 'not-allowed' : 'pointer',
              opacity: previewLoading || executeLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {previewLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Copy size={16} />}
            Preview
          </button>

          <button
            onClick={handleExecute}
            disabled={!preview || executeLoading || previewLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: '#B4651E',
              color: 'white',
              fontWeight: '700',
              cursor: !preview || executeLoading || previewLoading ? 'not-allowed' : 'pointer',
              opacity: !preview || executeLoading || previewLoading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {executeLoading ? <RefreshCw size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> : <Copy size={16} />}
            Copy Assignments
          </button>

          <button
            onClick={onClose}
            disabled={previewLoading || executeLoading}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              border: '1px solid rgba(180,101,30,0.14)',
              backgroundColor: 'transparent',
              color: '#7a6a55',
              fontWeight: '700',
              cursor: previewLoading || executeLoading ? 'not-allowed' : 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
