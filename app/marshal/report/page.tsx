'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, Save, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { offlineQueue } from '@/lib/offline/queue'
import { isBeforeDeadline, shouldLockForm, getTimeRemaining } from '@/lib/utils/time'
import { MAX_IMAGES_PER_ISSUE } from '@/lib/utils/constants'
import BlockFloorSelector from './components/BlockFloorSelector'
import ChecklistSection from './components/ChecklistSection'
import ImageUploader from './components/ImageUploader'
import SubmissionSummary from './components/SubmissionSummary'
import RoomInspectionSection, { RoomInspection } from './components/RoomInspectionSection'

const card: React.CSSProperties = {
  backgroundColor: 'rgba(255, 252, 247, 0.95)',
  border: '1px solid rgba(180, 101, 30, 0.12)',
  borderRadius: '16px',
  padding: '28px 32px',
  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
}

export default function MarshalReportPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formLocked, setFormLocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')
  const [marshalId, setMarshalId] = useState('')
  const [marshalName, setMarshalName] = useState('')
  const [block, setBlock] = useState<string>('')
  const [floor, setFloor] = useState<string>('')
  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({})
  const [roomInspections, setRoomInspections] = useState<RoomInspection[]>([])
  const [images, setImages] = useState<File[]>([])
  const [isAutoSaving, setIsAutoSaving] = useState(false)

  useEffect(() => {
    const savedMarshalId = localStorage.getItem('marshalId')
    const savedMarshalName = localStorage.getItem('marshalName')
    if (!savedMarshalId || !savedMarshalName) {
      router.push('/marshal/login')
      return
    }
    setMarshalId(savedMarshalId)
    setMarshalName(savedMarshalName)
  }, [router])

  useEffect(() => {
    const checkDeadline = () => {
      setFormLocked(shouldLockForm())
      setTimeRemaining(getTimeRemaining())
    }
    checkDeadline()
    const interval = setInterval(checkDeadline, 1000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (isBeforeDeadline()) {
      const autoSaveInterval = setInterval(() => {
        if (block && floor && Object.keys(checklistResponses).length > 0) {
          handleAutoSave()
        }
      }, 10000)
      return () => clearInterval(autoSaveInterval)
    }
  }, [block, floor, checklistResponses, roomInspections, images])

  const handleAutoSave = () => {
    const draft = {
      marshalId, block, floor, checklistResponses,
      roomInspections, imagesCount: images.length,
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('marshalDraft', JSON.stringify(draft))
  }

  useEffect(() => {
    const savedDraft = localStorage.getItem('marshalDraft')
    if (savedDraft) {
      const draft = JSON.parse(savedDraft)
      if (draft.marshalId === marshalId) {
        setBlock(draft.block || '')
        setFloor(draft.floor || '')
        setChecklistResponses(draft.checklistResponses || {})
        setRoomInspections(draft.roomInspections || [])
      }
    }
  }, [marshalId])

  const clearDraft = () => localStorage.removeItem('marshalDraft')


  const flattenedIssues = roomInspections.flatMap((inspection) => (
    inspection.hasIssues
      ? inspection.issues
          .filter((issue) => issue.issue_type && issue.description && issue.description.length >= 10)
          .map((issue) => ({
            issue_type: issue.issue_type,
            description: issue.description,
            is_movable: issue.is_movable,
            room_location: `Room ${inspection.room}`,
          }))
      : []
  ))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formLocked) { toast.error('Submission deadline has passed (6:00 PM)'); return }
    if (!block || !floor) { toast.error('Please select Block and Floor'); return }
    if (Object.keys(checklistResponses).length === 0) { toast.error('Please complete the checklist'); return }
    const roomIssueSelectionsMissing = roomInspections.some((room) => room.hasIssues === null)
    if (roomIssueSelectionsMissing) { toast.error('Please mark issue status for all rooms you reviewed'); return }

    setIsSubmitting(true)

    try {
      let uploadedImagePaths: string[] = []
      if (flattenedIssues.length > 0 && images.length > 0) {
        try {
          const { uploadImages } = await import('@/lib/storage/upload')
          const tempIssueId = `temp-${Date.now()}`
          uploadedImagePaths = await uploadImages(images, block, tempIssueId)
        } catch {
          toast.error('Image upload failed. Submitting without images.')
        }
      }

      const submissionData = {
        marshal_id: marshalId,
        marshal_name: marshalName,
        block,
        floor,
        checklist_responses: checklistResponses,
        has_issues: flattenedIssues.length > 0,
        room_inspections: roomInspections,
        issues: flattenedIssues.map((issue) => ({
          ...issue,
          images: uploadedImagePaths,
        })),
        submitted_at: new Date().toISOString(),
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error || 'Failed to submit report')
        setIsSubmitting(false)
        return
      }

      clearDraft()
      toast.success(result.message || 'Report submitted successfully!')

      setTimeout(() => {
        setBlock('')
        setFloor('')
        setChecklistResponses({})
        setRoomInspections([])
        setImages([])
        setIsSubmitting(false)
      }, 2000)

    } catch (error: unknown) {
      if (!navigator.onLine) {
        offlineQueue?.addToQueue('issue', {
          marshal_id: marshalId,
          marshal_name: marshalName,
          block, floor,
          checklist_responses: checklistResponses,
          has_issues: flattenedIssues.length > 0,
          room_inspections: roomInspections,
          issues: flattenedIssues,
        })
        toast.success('Report queued for submission when online')
        clearDraft()
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Failed to submit report'
        toast.error(errorMessage)
      }
      setIsSubmitting(false)
    }
  }

  const handleChecklistChange = (itemId: string, response: boolean) => {
    setChecklistResponses(prev => ({ ...prev, [itemId]: response }))
  }

  const handleImageUpload = (files: File[]) => {
    if (images.length + files.length > MAX_IMAGES_PER_ISSUE) {
      toast.error(`Maximum ${MAX_IMAGES_PER_ISSUE} images allowed`)
      return
    }
    setImages(prev => [...prev, ...files.slice(0, MAX_IMAGES_PER_ISSUE - prev.length)])
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  if (!marshalId) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid #B4651E', borderTopColor: 'transparent',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px',
          }} />
          <p style={{ color: '#7a6a55' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Welcome bar + timer */}
      <div style={{
        ...card,
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: '1.5rem',
            fontWeight: '600',
            color: '#1a1208',
            margin: '0 0 4px',
          }}>
            Daily Inspection Report
          </h2>
          <p style={{ color: '#7a6a55', margin: 0, fontSize: '0.9rem' }}>
            Welcome, <strong style={{ color: '#B4651E' }}>{marshalName}</strong>
          </p>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180, 101, 30, 0.2)',
          borderRadius: '12px',
          padding: '12px 20px',
        }}>
          <Clock size={20} color="#B4651E" />
          <div>
            <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: '0 0 2px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Time Remaining
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#B4651E', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
              {timeRemaining}
            </p>
          </div>
        </div>
      </div>

      {/* Deadline warning */}
      {formLocked && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <AlertTriangle size={20} color="#ef4444" />
          <p style={{ color: '#dc2626', fontWeight: '500', margin: 0 }}>
            Submission deadline has passed (6:00 PM). The form is now locked.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Block & Floor */}
        <div style={card}>
          <BlockFloorSelector
            block={block}
            floor={floor}
            onBlockChange={setBlock}
            onFloorChange={setFloor}
            disabled={formLocked}
          />
        </div>

        {block && floor && (
          <div style={card}>
            <RoomInspectionSection key={`${block}-${floor}`} block={block} floor={floor} onChange={setRoomInspections} disabled={formLocked} />
          </div>
        )}

        {/* Checklist */}
        <div style={card}>
          <ChecklistSection
            responses={checklistResponses}
            onChange={handleChecklistChange}
            disabled={formLocked}
          />
        </div>

        {/* Image Uploader */}
        {flattenedIssues.length > 0 && (
          <div style={card}>
            <ImageUploader
              images={images}
              onUpload={handleImageUpload}
              onRemove={removeImage}
              disabled={formLocked}
            />
          </div>
        )}

        {/* Submission Summary */}
        <div style={card}>
          <SubmissionSummary
            block={block}
            floor={floor}
            checklistCount={Object.keys(checklistResponses).length}
            issueCount={flattenedIssues.length}
            imageCount={images.length}
          />
        </div>

        {/* Submit Button */}
        <div style={{
          position: 'sticky',
          bottom: '16px',
          zIndex: 10,
        }}>
          <button
            type="submit"
            disabled={formLocked || isSubmitting}
            style={{
              width: '100%',
              padding: '18px',
              backgroundColor: formLocked ? '#c4b5a0' : '#B4651E',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              fontSize: '1.05rem',
              fontWeight: '700',
              cursor: formLocked || isSubmitting ? 'not-allowed' : 'pointer',
              opacity: isSubmitting ? 0.8 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: formLocked ? 'none' : '0 8px 24px rgba(180, 101, 30, 0.35)',
              transition: 'all 0.2s',
              letterSpacing: '0.01em',
            }}
          >
            {isSubmitting ? (
              <>
                <div style={{
                  width: '20px', height: '20px', borderRadius: '50%',
                  border: '2.5px solid rgba(255,255,255,0.4)',
                  borderTopColor: 'white',
                  animation: 'spin 0.8s linear infinite',
                }} />
                <span>Submitting...</span>
              </>
            ) : (
              <>
                <Send size={20} />
                <span>Submit Report</span>
              </>
            )}
          </button>

          {isAutoSaving && (
            <p style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#7a6a55',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}>
              <Save size={14} />
              Auto-saving draft...
            </p>
          )}
        </div>
      </form>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}