// app/marshal/report/page.tsx
'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, Clock, Save, Send, Building } from 'lucide-react'
import toast from 'react-hot-toast'

import { offlineQueue } from '@/lib/offline/queue'
import { isBeforeDeadline, shouldLockForm, getTimeRemaining } from '@/lib/utils/time'
import { MAX_IMAGES_PER_ISSUE, ROOM_NUMBERS, type Block } from '@/lib/utils/constants'
import { getRoomDefaults, type RoomInspection } from '@/lib/utils/room-default'

import BlockFloorSelector from './components/BlockFloorSelector'
import ChecklistSection from './components/ChecklistSection'
import SubmissionSummary from './components/SubmissionSummary'
import { SaveIssueButton } from './components/SaveIssueButton'
import { supabase } from '@/lib/supabase/client'

type IssueFormItem = {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
}

type ServerRoomsByFloor = Record<string, Set<string>>

export default function MarshalReportPage() {
  const router = useRouter()

  // ---------- Helpers ----------
  const getISTDateString = useCallback(() => {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date())
  }, [])

  const normalizeFloor = useCallback((f: string) => {
    const s = String(f ?? '').trim()
    if (!s) return ''
    const lower = s.toLowerCase()
    const m = s.match(/\d+/)
    if (m) return m[0]
    if (lower === 'g' || lower.includes('ground')) return 'G'
    return s
  }, [])

  const makeRoomKey = useCallback(
    (b: string, f: string, r: string) => `${b}-${normalizeFloor(f)}-${String(r).trim()}`,
    [normalizeFloor]
  )

  // ---------- State ----------
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formLocked, setFormLocked] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState('')

  const [completedRooms, setCompletedRooms] = useState<Set<string>>(new Set())

  const [marshalId, setMarshalId] = useState('')
  const [marshalName, setMarshalName] = useState('')

  const [block, setBlock] = useState<Block | ''>('')
  const [floor, setFloor] = useState<string>('')

  const floorNorm = useMemo(() => normalizeFloor(floor), [floor, normalizeFloor])

  const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({})

  // REMOVED: hasIssues page-level state — derived from roomIssues instead

  const [selectedRoom, setSelectedRoom] = useState<string>('')
  const [roomInspections, setRoomInspections] = useState<Record<string, RoomInspection>>({})
  const [roomIssues, setRoomIssues] = useState<Record<string, IssueFormItem[]>>({})
  const [roomImages, setRoomImages] = useState<Record<string, File[]>>({})

  const [serverRoomsByFloor, setServerRoomsByFloor] = useState<ServerRoomsByFloor>({})

  const [isAutoSaving, setIsAutoSaving] = useState(false)
  const [showRoomSelector, setShowRoomSelector] = useState(false)

  const todayKey = useMemo(() => getISTDateString(), [getISTDateString])
  const imagesSectionRef = useRef<HTMLDivElement | null>(null)

  // ---------- Derived ----------
  // FIX: Derive hasIssues from actual room issue data instead of dead state
  const derivedHasIssues = useMemo(() => {
    return Object.values(roomIssues).some(list => (list?.length ?? 0) > 0)
  }, [roomIssues])

  const isRoomCompletedLocal = useCallback(
    (room: string) => {
      if (!block || !floorNorm) return false
      return completedRooms.has(makeRoomKey(block, floorNorm, room))
    },
    [block, floorNorm, completedRooms, makeRoomKey]
  )

  const isRoomDoneOnServer = useCallback(
    (room: string) => {
      const doneSet = serverRoomsByFloor[floorNorm] ?? new Set<string>()
      return doneSet.has(String(room))
    },
    [serverRoomsByFloor, floorNorm]
  )

  const isRoomDoneForUI = useCallback(
    (room: string) => isRoomDoneOnServer(room) || isRoomCompletedLocal(room),
    [isRoomDoneOnServer, isRoomCompletedLocal]
  )

  const currentFloorRooms = useMemo(() => {
    if (!block || !floorNorm) return []
    return ROOM_NUMBERS[block]?.[floorNorm] ?? []
  }, [block, floorNorm])

  const completedRoomsOnFloor = useMemo(() => {
    const serverSet = serverRoomsByFloor[floorNorm] ?? new Set<string>()
    let count = 0
    for (const r of currentFloorRooms) {
      const rr = String(r)
      const local = isRoomCompletedLocal(rr)
      const server = serverSet.has(rr)
      if (local || server) count++
    }
    return count
  }, [currentFloorRooms, floorNorm, serverRoomsByFloor, isRoomCompletedLocal])

  // ---------- Autosave draft ----------
  const handleAutoSave = useCallback(() => {
    const draft = {
      marshalId,
      marshalName,
      block,
      floor: floorNorm,
      selectedRoom,
      checklistResponses,
      roomInspections,
      roomIssues,
      roomImagesCount: Object.fromEntries(Object.entries(roomImages).map(([k, v]) => [k, v.length])),
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('marshalDraft', JSON.stringify(draft))
    setIsAutoSaving(true)
    setTimeout(() => setIsAutoSaving(false), 800)
  }, [marshalId, marshalName, block, floorNorm, selectedRoom, checklistResponses, roomInspections, roomIssues, roomImages])

  // ---------- Load marshal + local progress ----------
  useEffect(() => {
    const savedMarshalId = localStorage.getItem('marshalId')
    const savedMarshalName = localStorage.getItem('marshalName')

    if (!savedMarshalId || !savedMarshalName) {
      router.push('/marshal/login')
      return
    }

    setMarshalId(savedMarshalId)
    setMarshalName(savedMarshalName)

    const savedProgress = localStorage.getItem(`marshal_progress_${savedMarshalId}_${todayKey}`)
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress)
        setCompletedRooms(new Set(progressData.completedRooms || []))
      } catch (e) {
        console.error('Failed to load progress:', e)
      }
    }

    setLoading(false)
  }, [router, todayKey])

  // ---------- Load SERVER progress ----------
  useEffect(() => {
    const run = async () => {
      if (!block) {
        setServerRoomsByFloor({})
        return
      }

      const today = getISTDateString()
      const { data, error } = await supabase
        .from('room_inspections')
        .select('floor, room_number')
        .eq('date', today)
        .eq('block', block)

      if (error) {
        console.error('Failed to load room progress:', (error as any)?.message ?? error)
        setServerRoomsByFloor({})
        return
      }

      const next: ServerRoomsByFloor = {}
      for (const row of data ?? []) {
        const f = normalizeFloor(String((row as any).floor))
        const r = String((row as any).room_number).trim()
        if (!f || !r) continue
        if (!next[f]) next[f] = new Set<string>()
        next[f].add(r)
      }

      setServerRoomsByFloor(next)
    }

    run()
  }, [block, getISTDateString, normalizeFloor])

  // ---------- Deadline timer ----------
  useEffect(() => {
    const checkDeadline = () => {
      setFormLocked(shouldLockForm())
      setTimeRemaining(getTimeRemaining())
    }
    checkDeadline()
    const interval = setInterval(checkDeadline, 1000)
    return () => clearInterval(interval)
  }, [])

  // ---------- Auto-save draft timer ----------
  // FIX: Reduced dependency array to prevent excessive interval resets
  useEffect(() => {
    if (!isBeforeDeadline() || !marshalId) return

    const autoSaveInterval = setInterval(() => {
      if (block && floorNorm && Object.keys(checklistResponses).length > 0) {
        handleAutoSave()
      }
    }, 10000)

    return () => clearInterval(autoSaveInterval)
  }, [marshalId, handleAutoSave]) // Only restart if marshal or save function changes

  // ---------- Load saved draft ----------
  useEffect(() => {
    if (!marshalId) return
    const savedDraft = localStorage.getItem('marshalDraft')
    if (!savedDraft) return

    try {
      const draft = JSON.parse(savedDraft)
      if (draft.marshalId === marshalId) {
        setBlock(draft.block || '')
        setFloor(draft.floor || '')
        setSelectedRoom(draft.selectedRoom || '')
        setChecklistResponses(draft.checklistResponses || {})
        setRoomInspections(draft.roomInspections || {})
        setRoomIssues(draft.roomIssues || {})
        setRoomImages({})
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }, [marshalId])

  // ---------- Save local progress ----------
  useEffect(() => {
    if (!marshalId) return
    localStorage.setItem(
      `marshal_progress_${marshalId}_${todayKey}`,
      JSON.stringify({ completedRooms: Array.from(completedRooms) })
    )
  }, [completedRooms, marshalId, todayKey])

  const clearDraft = () => localStorage.removeItem('marshalDraft')

  // ---------- Handlers ----------
  const handleChecklistChange = (itemId: string, response: boolean) => {
    setChecklistResponses((prev) => ({ ...prev, [itemId]: response }))
  }

  const onBlockChange = (b: Block) => {
    setBlock(b)
    setFloor('')
    setSelectedRoom('')
    setRoomInspections({})
    setRoomIssues({})
    setRoomImages({})
  }

  const onFloorChange = (f: string) => {
    const nf = normalizeFloor(f)
    setFloor(nf)
    setSelectedRoom('')
    setRoomInspections({})
    setRoomIssues({})
    setRoomImages({})
  }

  const onSelectedRoomChange = (room: string) => {
    setSelectedRoom(room)
    if (block && floorNorm && room) {
      setRoomInspections((prev) => {
        if (prev[room]) return prev
        return { ...prev, [room]: getRoomDefaults(block, floorNorm, room) }
      })
    }
  }

  const onRoomInspectionsChange = (next: Record<string, RoomInspection>) => {
    setRoomInspections(next)
  }

  const setRoomHasIssues = (room: string, value: boolean) => {
    setRoomInspections((prev) => {
      if (!block || !floorNorm) return prev
      const existing = prev[room] ?? getRoomDefaults(block, floorNorm, room)
      return { ...prev, [room]: { ...existing, has_issues: value } }
    })
    if (!value) {
      setRoomIssues((prev) => {
        const copy = { ...prev }
        delete copy[room]
        return copy
      })
      setRoomImages((prev) => {
        const copy = { ...prev }
        delete copy[room]
        return copy
      })
    }
  }

  const addIssueForRoom = (room: string) => {
    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextIssue: IssueFormItem = {
        id: Date.now(),
        issue_type: '',
        description: '',
        is_movable: false,
        room_location: `Room ${room}`,
      }
      return { ...prev, [room]: [...list, nextIssue] }
    })
  }

  const updateIssueForRoom = (room: string, id: number, field: string, value: any) => {
    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextList = list.map((issue) => (issue.id === id ? { ...issue, [field]: value } : issue))
      return { ...prev, [room]: nextList }
    })
  }

  const removeIssueForRoom = (room: string, id: number) => {
    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextList = list.filter((issue) => issue.id !== id)
      return { ...prev, [room]: nextList }
    })
  }

  const handleImageUploadForRoom = (room: string, files: File[]) => {
    if (!block || !floorNorm) {
      toast.error('Please select Block and Floor before adding images')
      return
    }
    setRoomImages((prev) => {
      const existing = prev[room] ?? []
      if (existing.length + files.length > MAX_IMAGES_PER_ISSUE) {
        toast.error(`Maximum ${MAX_IMAGES_PER_ISSUE} images allowed per room`)
        return prev
      }
      return { ...prev, [room]: [...existing, ...files.slice(0, MAX_IMAGES_PER_ISSUE - existing.length)] }
    })
  }

  const removeImageForRoom = (room: string, index: number) => {
    setRoomImages((prev) => {
      const existing = prev[room] ?? []
      return { ...prev, [room]: existing.filter((_, i) => i !== index) }
    })
  }

  const getRoomsForCurrentFloor = () => {
    if (!block || !floorNorm) return []
    return ROOM_NUMBERS[block]?.[floorNorm] ?? []
  }

  const markRoomCompleted = useCallback(
    (room: string) => {
      if (!block || !floorNorm || !room) return
      const roomKey = makeRoomKey(block, floorNorm, room)
      setCompletedRooms((prev) => {
        const next = new Set(prev)
        next.add(roomKey)
        return next
      })
      toast.success(`Room ${room} marked completed`)
    },
    [block, floorNorm, makeRoomKey]
  )

  const handleMoveNextRoom = () => {
    if (!block || !floorNorm) {
      toast.error('Select Block and Floor first')
      return
    }

    const rooms = getRoomsForCurrentFloor()
    if (!rooms.length) return

    const currentIndex = selectedRoom ? rooms.indexOf(selectedRoom) : -1

    let nextRoom = ''
    for (let i = currentIndex + 1; i < rooms.length; i++) {
      if (!isRoomDoneOnServer(rooms[i])) {
        nextRoom = rooms[i]
        break
      }
    }

    if (!nextRoom) {
      for (let i = 0; i < rooms.length; i++) {
        if (!isRoomDoneOnServer(rooms[i])) {
          nextRoom = rooms[i]
          break
        }
      }
    }

    if (!nextRoom) {
      toast('All rooms on this floor are completed ✅')
      return
    }

    setSelectedRoom(nextRoom)
    setRoomInspections((prev) => {
      if (prev[nextRoom]) return prev
      return { ...prev, [nextRoom]: getRoomDefaults(block, floorNorm, nextRoom) }
    })

    setShowRoomSelector(true)

    setTimeout(() => {
      imagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 150)

    toast.success(`Moved to Room ${nextRoom}`)
  }

  const handleSelectRoom = (room: string) => {
    if (!block || !floorNorm) {
      toast.error('Select block and floor first')
      return
    }

    const r = String(room).trim()

    if (isRoomDoneOnServer(r)) {
      toast('This room is already completed ✅')
      return
    }

    setSelectedRoom(r)
    setShowRoomSelector(false)

    setRoomInspections((prev) => {
      if (prev[r]) return prev
      return { ...prev, [r]: getRoomDefaults(block, floorNorm, r) }
    })

    toast.success(`Selected Room ${r}`)
  }

  const handleViewMarshalSubmissions = () => {
    if (!marshalId) {
      toast.error('Marshal ID not found')
      return
    }
    router.push(`/marshal/history?marshalId=${marshalId}`)
  }

  // ---------- Submit ----------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (formLocked) {
      toast.error('Submission deadline has passed (6:00 PM)')
      return
    }
    if (!block || !floorNorm) {
      toast.error('Please select Block and Floor')
      return
    }
    if (Object.keys(checklistResponses).length === 0) {
      toast.error('Please complete the checklist')
      return
    }

    // FIX: No longer checking page-level hasIssues (which was never set).
    // Instead, we validate based on actual room data.
    // If rooms have issues declared, validate those issues are complete.
    if (derivedHasIssues) {
      const roomsWithIssueList = Object.entries(roomIssues).filter(([, list]) => (list?.length ?? 0) > 0)
      const totalIssues = roomsWithIssueList.reduce((acc, [, list]) => acc + (list?.length ?? 0), 0)

      if (totalIssues === 0) {
        toast.error('Please add at least one issue in at least one room')
        return
      }

      for (const [, list] of roomsWithIssueList) {
        for (const issue of list ?? []) {
          if (!issue.issue_type || !issue.description || issue.description.trim().length < 10) {
            toast.error('Please complete all required issue fields (min 10 chars description)')
            return
          }
        }
      }
    }

    // Require at least one room to have been inspected
    if (Object.keys(roomInspections).length === 0) {
      toast.error('Please inspect at least one room before submitting')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Submitting report...')

    try {
      const uploadedByRoom: Record<string, string[]> = {}

      if (derivedHasIssues) {
        const rooms = Object.keys(roomImages)
        if (rooms.length > 0) {
          const { uploadImages } = await import('@/lib/storage/upload')

          for (const room of rooms) {
            const files = roomImages[room] ?? []
            if (!files.length) continue

            const folderKey = `${block}-${floorNorm}-room-${room}`
            const paths = await uploadImages(files, block, folderKey)
            uploadedByRoom[room] = paths
          }
        }
      }

      // FIX: Include ALL rooms that were visited (have inspection data),
      // not just those explicitly marked completed. If a marshal fills
      // everything out but forgets "Mark as Completed", the data must not be lost.
      const roomInspectionPayload = Object.entries(roomInspections)
        .map(([room, insp]) => {
          const roomIssueList = roomIssues[room] ?? []
          const roomHasIssues = roomIssueList.length > 0

          return {
            room,
            features: {
              tables: insp.tables || 0,
              chairs: insp.chairs || 0,
              lights: insp.lights || 0,
              fans: insp.fans || 0,
              ac: insp.ac || 0,
              projector: insp.projector || 0,
              podium: insp.podium || 0,
              speakers: insp.speakers || 0,
              dustbin: insp.dustbin || 0,
              amplifier: insp.amplifier || 0,
              extra_plug: insp.extra_plug || 0,
              house_code: insp.house_code || '',
              issue_notes: insp.issue_notes || '',
            },
            hasIssues: roomHasIssues,
            issues: roomIssueList.map((issue) => ({
              issue_type: issue.issue_type || '',
              description: issue.description || '',
              is_movable: issue.is_movable || false,
            })),
          }
        })

      const issuesPayload = Object.entries(roomIssues).flatMap(([room, list]) => {
        const imagesForRoom = uploadedByRoom[room] ?? []
        return (list ?? []).map((issue) => ({
          room_location: `Room ${room}`,
          issue_type: issue.issue_type,
          description: issue.description,
          is_movable: issue.is_movable ?? false,
          images: imagesForRoom,
        }))
      })

      const submissionData = {
        marshal_id: marshalId,
        marshal_name: marshalName,
        block,
        floor: floorNorm,
        checklist_responses: checklistResponses,
        has_issues: issuesPayload.length > 0,
        room_inspections: roomInspectionPayload,
        issues: issuesPayload,
        submitted_at: new Date().toISOString(),
      }

      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      })

      const raw = await response.text()
      let result: any
      try {
        result = JSON.parse(raw)
      } catch {
        result = raw
      }

      if (!response.ok) {
        toast.error(result.error || 'Failed to submit report', { id: toastId })
        setIsSubmitting(false)
        return
      }

      toast.success(result.message || 'Report submitted successfully!', { id: toastId })
      clearDraft()

      // Refresh server progress after submit
      setTimeout(async () => {
        try {
          const today = getISTDateString()
          const { data, error } = await supabase
            .from('room_inspections')
            .select('floor, room_number')
            .eq('date', today)
            .eq('block', block)

          if (error) return

          const next: ServerRoomsByFloor = {}
          for (const row of data ?? []) {
            const f = normalizeFloor(String((row as any).floor))
            const r = String((row as any).room_number).trim()
            if (!f || !r) continue
            if (!next[f]) next[f] = new Set<string>()
            next[f].add(r)
          }
          setServerRoomsByFloor(next)
        } catch {}
      }, 300)

      setTimeout(() => {
        setBlock('')
        setFloor('')
        setSelectedRoom('')
        setChecklistResponses({})
        setRoomInspections({})
        setRoomIssues({})
        setRoomImages({})
        setIsSubmitting(false)
      }, 1200)
    } catch (error: unknown) {
      console.error('Submission error:', error)
      toast.dismiss(toastId)

      if (!navigator.onLine) {
        // FIX: Build proper API payload shape for offline queue,
        // not raw state objects which the API cannot parse
        const issuesPayloadForQueue = Object.entries(roomIssues).flatMap(([room, list]) =>
          (list ?? []).map((issue) => ({
            room_location: `Room ${room}`,
            issue_type: issue.issue_type,
            description: issue.description,
            is_movable: issue.is_movable ?? false,
            images: [],
          }))
        )

        const roomInspectionPayloadForQueue = Object.entries(roomInspections).map(([room, insp]) => ({
          room,
          features: {
            tables: insp.tables || 0,
            chairs: insp.chairs || 0,
            lights: insp.lights || 0,
            fans: insp.fans || 0,
            ac: insp.ac || 0,
            projector: insp.projector || 0,
            podium: insp.podium || 0,
            speakers: insp.speakers || 0,
            dustbin: insp.dustbin || 0,
            amplifier: insp.amplifier || 0,
            extra_plug: insp.extra_plug || 0,
            house_code: insp.house_code || '',
            issue_notes: insp.issue_notes || '',
          },
          hasIssues: (roomIssues[room] ?? []).length > 0,
          issues: (roomIssues[room] ?? []).map((issue) => ({
            issue_type: issue.issue_type || '',
            description: issue.description || '',
            is_movable: issue.is_movable || false,
          })),
        }))

        offlineQueue?.addToQueue('issue', {
          marshal_id: marshalId,
          marshal_name: marshalName,
          block,
          floor: floorNorm,
          checklist_responses: checklistResponses,
          has_issues: issuesPayloadForQueue.length > 0,
          room_inspections: roomInspectionPayloadForQueue,
          issues: issuesPayloadForQueue,
          submitted_at: new Date().toISOString(),
        })
        toast.success('Report queued for submission when online')
        clearDraft()
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to submit report')
      }
      setIsSubmitting(false)
    }
  }

  const handleSaveIssue = (room: string, issueId: number, issueData: Partial<IssueFormItem>) => {
    Object.entries(issueData).forEach(([field, value]) => {
      if (value !== undefined) {
        updateIssueForRoom(room, issueId, field, value)
      }
    })

    markRoomCompleted(room)
    toast.success('Issue saved successfully!')
  }

  // ---------- UI ----------
  if (loading || !marshalId) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#faf8f5' }}>
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '3px solid rgba(180,101,30,0.2)',
              borderTopColor: '#B4651E',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px',
            }}
          />
          <p style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>Loading...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    )
  }

  const totalRoomsOnFloor = currentFloorRooms.length || 1
  const progressPercentage = (completedRoomsOnFloor / totalRoomsOnFloor) * 100

  const checklistCount = Object.values(checklistResponses).filter(Boolean).length
  const issueCount = Object.values(roomIssues).reduce((acc, list) => acc + list.length, 0)
  const imageCount = Object.values(roomImages).reduce((acc, list) => acc + list.length, 0)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5', paddingBottom: '80px' }}>
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
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: '600', color: '#1a1208', margin: 0 }}>
              Daily Inspection Report
            </h1>
            <p style={{ color: '#7a6a55', marginTop: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
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
              <p style={{ fontSize: '0.75rem', color: '#7a6a55', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Time Remaining</p>
              <p style={{ fontSize: '1rem', fontWeight: '700', color: '#B4651E', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{timeRemaining}</p>
            </div>
          </div>
        </div>

        {block && floorNorm && (
          <div style={{ maxWidth: '800px', margin: '12px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.85rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>
                Room Progress - {block} Floor {floorNorm}
              </span>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#B4651E', fontFamily: "'DM Sans', sans-serif" }}>
                {completedRoomsOnFloor}/{totalRoomsOnFloor} ({Math.round(progressPercentage)}%)
              </span>
            </div>

            <div style={{ backgroundColor: '#f5f5f4', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
              <div
                style={{
                  backgroundColor: '#B4651E',
                  height: '100%',
                  width: `${progressPercentage}%`,
                  transition: 'width 0.3s ease',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>
        )}

        {block && floorNorm && (
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
              <span style={{ fontSize: '0.9rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>Current:</span>
              <span
                style={{
                  fontWeight: '600',
                  color: '#1a1208',
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: '#fdf6ef',
                  padding: '4px 10px',
                  borderRadius: '6px',
                }}
              >
                {block} • Floor {floorNorm}
                {selectedRoom ? ` • ${/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom}` : ''}
              </span>
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <BlockFloorSelector
              block={block}
              floor={floorNorm}
              selectedRoom={selectedRoom}
              roomInspections={roomInspections}
              roomIssues={roomIssues}
              roomImages={roomImages}
              serverRoomsByFloor={serverRoomsByFloor}
              isRoomCompleted={isRoomCompletedLocal}
              markRoomCompleted={markRoomCompleted}
              handleMoveNextRoom={handleMoveNextRoom}
              onSaveIssue={handleSaveIssue}
              onBlockChange={onBlockChange}
              onFloorChange={onFloorChange}
              onSelectedRoomChange={onSelectedRoomChange}
              onRoomInspectionsChange={onRoomInspectionsChange}
              setRoomHasIssues={setRoomHasIssues}
              addIssueForRoom={addIssueForRoom}
              updateIssueForRoom={updateIssueForRoom}
              removeIssueForRoom={removeIssueForRoom}
              handleImageUploadForRoom={handleImageUploadForRoom}
              removeImageForRoom={removeImageForRoom}
              disabled={formLocked}
              normalizeFloor={normalizeFloor}
            />
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <ChecklistSection responses={checklistResponses} onChange={handleChecklistChange} disabled={formLocked} />
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <SubmissionSummary block={block} floor={floorNorm} checklistCount={checklistCount} issueCount={issueCount} imageCount={imageCount} />
          </div>

          <div style={{ position: 'sticky', bottom: '16px', zIndex: 10 }}>
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
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      border: '2.5px solid rgba(255,255,255,0.4)',
                      borderTopColor: 'white',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
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
              <p
                style={{
                  textAlign: 'center',
                  fontSize: '0.8rem',
                  color: '#7a6a55',
                  marginTop: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                <Save size={14} />
                Auto-saving draft...
              </p>
            )}
          </div>

          <div>
            <button
              type="button"
              onClick={handleViewMarshalSubmissions}
              disabled={!marshalId}
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.9rem',
                fontWeight: '600',
                color: '#B4651E',
                backgroundColor: 'transparent',
                border: '1.5px solid rgba(180,101,30,0.3)',
                borderRadius: '8px',
                padding: '10px 20px',
                cursor: marshalId ? 'pointer' : 'not-allowed',
                opacity: marshalId ? 1 : 0.5,
                transition: 'all 0.2s ease',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              My Previous Submissions
            </button>
          </div>
        </form>
      </main>

      {showRoomSelector && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '24px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflow: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.3rem', fontWeight: '600', color: '#1a1208', margin: 0 }}>
                Select Room - {block} Floor {floorNorm}
              </h2>
              <button
                onClick={() => setShowRoomSelector(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', opacity: 0.6 }}
              >
                <XCircle size={24} color="#7a6a55" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '12px' }}>
              {getRoomsForCurrentFloor().map((room) => {
                const isCompletedUI = isRoomDoneForUI(room)
                const isServerDone = isRoomDoneOnServer(room)

                return (
                  <button
                    key={room}
                    onClick={() => handleSelectRoom(room)}
                    disabled={isServerDone}
                    style={{
                      padding: '16px 12px',
                      borderRadius: '12px',
                      border: isCompletedUI ? '2px solid #16a34a' : '2px solid rgba(180,101,30,0.2)',
                      backgroundColor: isCompletedUI ? '#f0fdf4' : '#fffcf7',
                      cursor: isServerDone ? 'not-allowed' : 'pointer',
                      opacity: isServerDone ? 0.7 : 1,
                      transition: 'all 0.15s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '8px',
                      position: 'relative',
                    }}
                  >
                    {isCompletedUI && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '4px',
                          right: '4px',
                          backgroundColor: '#16a34a',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CheckCircle2 size={12} color="white" />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isCompletedUI && <CheckCircle2 size={16} color="#16a34a" />}
                      <span style={{ fontWeight: '600', color: isCompletedUI ? '#16a34a' : '#1a1208', fontFamily: "'DM Sans', sans-serif", fontSize: '0.95rem' }}>
                        Room {room}
                      </span>
                    </div>
                    {isServerDone ? (
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', fontFamily: "'DM Sans', sans-serif" }}>Submitted</span>
                    ) : isCompletedUI ? (
                      <span style={{ fontSize: '0.7rem', color: '#16a34a', fontFamily: "'DM Sans', sans-serif" }}>Completed</span>
                    ) : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}