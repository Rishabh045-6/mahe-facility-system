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
import { supabase } from '@/lib/supabase/client'

type IssueFormItem = {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
  images: File[]
  saved?: boolean
}

type ServerRoomsByFloor = Record<string, Set<string>>

type MarshalAssignedRoom = {
  room_number: string
  status: 'pending' | 'completed'
  assignment: {
    date: string
    block: string
    floor: string
    room_number: string
  }
  inspection: {
    id: string
    marshal_id?: string | null
    marshal_name?: string | null
    has_issues?: boolean | null
    created_at?: string | null
  } | null
}

type MarshalAssignmentGroup = {
  block: string
  floors: Array<{
    floor: string
    pending_count: number
    completed_count: number
    rooms: MarshalAssignedRoom[]
  }>
}

type MarshalAssignmentsResponse = {
  date: string
  marshal: {
    marshal_id: string
    marshal_name: string
  }
  summary: {
    total_assigned: number
    pending: number
    completed: number
  }
  groups: MarshalAssignmentGroup[]
}

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

  const [serverRoomsByFloor, setServerRoomsByFloor] = useState<ServerRoomsByFloor>({})
  const [assignedRoomsData, setAssignedRoomsData] = useState<MarshalAssignmentsResponse | null>(null)
  const [assignmentsLoading, setAssignmentsLoading] = useState(false)
  const [assignmentsError, setAssignmentsError] = useState<string | null>(null)
  const manualMode = false

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

  const fetchAssignedRooms = useCallback(async (currentMarshalId: string, date: string) => {
    try {
      setAssignmentsLoading(true)
      setAssignmentsError(null)

      const response = await fetch(
        `/api/marshal/assignments?date=${encodeURIComponent(date)}&marshal_id=${encodeURIComponent(currentMarshalId)}`,
        { cache: 'no-store' }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to load assigned rooms')
      }

      setAssignedRoomsData(result)
    } catch (error) {
      console.error('Failed to load assigned rooms:', error)
      setAssignmentsError(error instanceof Error ? error.message : 'Failed to load assigned rooms')
      setAssignedRoomsData(null)
    } finally {
      setAssignmentsLoading(false)
    }
  }, [])

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

  const assignedRoomsFlat = useMemo(() => {
    const rooms: Array<MarshalAssignedRoom & { block: string; floor: string }> = []

    for (const group of assignedRoomsData?.groups ?? []) {
      for (const floorGroup of group.floors) {
        for (const room of floorGroup.rooms) {
          rooms.push({
            ...room,
            block: group.block,
            floor: floorGroup.floor,
          })
        }
      }
    }

    return rooms
  }, [assignedRoomsData])

  const getDraftRoomIssues = useCallback(() => {
    return Object.fromEntries(
      Object.entries(roomIssues).map(([room, list]) => [
        room,
        (list ?? []).map((issue) => ({
          ...issue,
          images: [],
        })),
      ])
    )
  }, [roomIssues])

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
      roomIssues: getDraftRoomIssues(),
      timestamp: new Date().toISOString(),
    }
    localStorage.setItem('marshalDraft', JSON.stringify(draft))
    setIsAutoSaving(true)
    setTimeout(() => setIsAutoSaving(false), 800)
  }, [marshalId, marshalName, block, floorNorm, selectedRoom, checklistResponses, roomInspections, getDraftRoomIssues])

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
    void fetchAssignedRooms(savedMarshalId, todayKey)

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
  }, [router, todayKey, fetchAssignedRooms])

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
  }

  const onFloorChange = (f: string) => {
    const nf = normalizeFloor(f)
    setFloor(nf)
    setSelectedRoom('')
    setRoomInspections({})
    setRoomIssues({})
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

  const handleAssignedRoomSelect = (nextBlock: Block, nextFloor: string, room: string) => {
    const normalizedFloor = normalizeFloor(nextFloor)
    const isContextSwitch = block !== nextBlock || floorNorm !== normalizedFloor

    if (isContextSwitch) {
      setRoomInspections({})
      setRoomIssues({})
      setSelectedRoom('')
    }

    setBlock(nextBlock)
    setFloor(normalizedFloor)
    setShowRoomSelector(false)

    setRoomInspections((prev) => {
      const base = isContextSwitch ? {} : prev
      if (base[room]) return base
      return { ...base, [room]: getRoomDefaults(nextBlock, normalizedFloor, room) }
    })
    setSelectedRoom(room)

    toast.success(`Selected ${nextBlock} Floor ${normalizedFloor} - Room ${room}`)
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
        images: [],
        saved: false,
      }
      return { ...prev, [room]: [...list, nextIssue] }
    })
  }

  const updateIssueForRoom = (room: string, id: number, field: string, value: any) => {
    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextList = list.map((issue) => {
        if (issue.id !== id) return issue
        const updatedIssue = { ...issue, [field]: value }
        if (field !== 'saved') {
          updatedIssue.saved = false
        }
        return updatedIssue
      })
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

  const handleImageUploadForIssue = (room: string, issueId: number, files: File[]) => {
    if (!block || !floorNorm) {
      toast.error('Please select Block and Floor before adding images')
      return
    }

    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextList = list.map((issue) => {
        if (issue.id !== issueId) return issue

        const existing = issue.images ?? []
        if (existing.length + files.length > MAX_IMAGES_PER_ISSUE) {
          toast.error(`Maximum ${MAX_IMAGES_PER_ISSUE} images allowed per issue`)
          return issue
        }

        return {
          ...issue,
          images: [...existing, ...files.slice(0, MAX_IMAGES_PER_ISSUE - existing.length)],
          saved: false,
        }
      })

      return { ...prev, [room]: nextList }
    })
  }

  const removeImageForIssue = (room: string, issueId: number, index: number) => {
    setRoomIssues((prev) => {
      const list = prev[room] ?? []
      const nextList = list.map((issue) => {
        if (issue.id !== issueId) return issue

        return {
          ...issue,
          images: (issue.images ?? []).filter((_, i) => i !== index),
          saved: false,
        }
      })

      return { ...prev, [room]: nextList }
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

    if (!manualMode) {
      const pendingAssignedRooms = assignedRoomsFlat.filter(
        room => room.status === 'pending' && room.block === block && room.floor === floorNorm
      )

      if (!pendingAssignedRooms.length) {
        toast('All assigned rooms for this floor are completed ✅')
        return
      }

      const currentIndex = pendingAssignedRooms.findIndex(room => room.room_number === selectedRoom)
      const nextAssignedRoom = pendingAssignedRooms[currentIndex + 1] ?? pendingAssignedRooms[0]

      handleAssignedRoomSelect(block, floorNorm, nextAssignedRoom.room_number)
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
      const issuesPayload: Array<{
        room_location: string
        issue_type: string
        description: string
        is_movable: boolean
        images: string[]
      }> = []

      if (derivedHasIssues) {
        const { uploadImages } = await import('@/lib/storage/upload')

        for (const [room, list] of Object.entries(roomIssues)) {
          for (const issue of list ?? []) {
            let uploadedImages: string[] = []

            if ((issue.images ?? []).length > 0) {
              const folderKey = `${block}-${floorNorm}-room-${room}-issue-${issue.id}`
              uploadedImages = await uploadImages(issue.images, block, folderKey)
            }

            issuesPayload.push({
              room_location: issue.room_location || `Room ${room}`,
              issue_type: issue.issue_type,
              description: issue.description,
              is_movable: issue.is_movable ?? false,
              images: uploadedImages,
            })
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

      const submissionData = {
        marshal_id: marshalId,
        marshal_name: marshalName,
        block,
        floor: floorNorm,
        manual_mode: false,
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
          if (marshalId) {
            await fetchAssignedRooms(marshalId, today)
          }
        } catch {}
      }, 300)

      setTimeout(() => {
        setBlock('')
        setFloor('')
        setSelectedRoom('')
        setChecklistResponses({})
        setRoomInspections({})
        setRoomIssues({})
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
            room_location: issue.room_location || `Room ${room}`,
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
          manual_mode: false,
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

    updateIssueForRoom(room, issueId, 'saved', true)
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
              padding: '0px',
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

  const checklistCount = Object.values(checklistResponses).filter(value => value !== undefined).length
  const issueCount = Object.values(roomIssues).reduce((acc, list) => acc + list.length, 0)
  const imageCount = Object.values(roomIssues).reduce(
    (acc, list) => acc + list.reduce((issueAcc, issue) => issueAcc + (issue.images?.length ?? 0), 0),
    0
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#faf8f5', paddingBottom: '80px' }}>
      <header
        style={{
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          position: 'relative',
          zIndex: 50,
          padding: '12px clamp(12px, 4vw, 20px)',
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ minWidth: 0, flex: '1 1 220px' }}>
            <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: 'clamp(1.08rem, 4.8vw, 1.3rem)', fontWeight: '600', color: '#1a1208', margin: 0, lineHeight: 1.2 }}>
              Daily Inspection Report
            </h1>
            <p style={{ color: '#7a6a55', marginTop: '4px', fontFamily: "'DM Sans', sans-serif", fontSize: 'clamp(0.82rem, 3.4vw, 0.9rem)' }}>
              Welcome, <span style={{ fontWeight: '600' }}>{marshalName}</span>
            </p>
          </div>

          <div
            style={{
              backgroundColor: '#fdf6ef',
              borderLeft: '4px solid #B4651E',
              padding: '8px 10px',
              borderRadius: '0 8px 8px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexShrink: 0,
            }}
          >
            <Clock size={15} color="#B4651E" />
            <div>
              <p style={{ fontSize: '0.72rem', color: '#7a6a55', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>Time</p>
              <p style={{ fontSize: '0.98rem', fontWeight: '700', color: '#B4651E', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>{timeRemaining}</p>
            </div>
          </div>
        </div>

        {block && floorNorm && (
          <div style={{ maxWidth: '800px', margin: '12px auto 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.85rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", minWidth: 0 }}>
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
                gap: '7px',
                backgroundColor: '#fffcf7',
                padding: '8px 10px',
                borderRadius: '10px',
                border: '1px solid rgba(180,101,30,0.15)',
                flexWrap: 'wrap',
              }}
            >
              <Building size={16} color="#B4651E" />
              <span style={{ fontSize: '0.85rem', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}>Current:</span>
              <span
                style={{
                  fontWeight: '600',
                  color: '#1a1208',
                  fontFamily: "'DM Sans', sans-serif",
                  backgroundColor: '#fdf6ef',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  minWidth: 0,
                  wordBreak: 'break-word',
                }}
              >
                {block} • Floor {floorNorm}
                {selectedRoom ? ` • ${/^\d+$/.test(selectedRoom) ? `Room ${selectedRoom}` : selectedRoom}` : ''}
              </span>
            </div>
          </div>
        )}
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: 'clamp(12px, 4vw, 20px)', boxSizing: 'border-box' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '88px' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(14px, 3.6vw, 20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: '1.1rem', fontWeight: '600', color: '#1a1208', margin: '0 0 8px' }}>
                  My Assigned Rooms
                </h3>
                <p style={{ color: '#7a6a55', fontSize: '0.88rem', margin: 0, fontFamily: "'DM Sans', sans-serif" }}>
                  Assigned rooms for {todayKey}. Pending rooms are actionable. Completed rooms are shown as read-only.
                </p>
              </div>

              {assignmentsLoading ? (
                <div style={{ color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
                  Loading assigned rooms...
                </div>
              ) : assignmentsError ? (
                <div style={{ color: '#991b1b', backgroundColor: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.12)', borderRadius: '12px', padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: '0.88rem' }}>
                  {assignmentsError}
                </div>
              ) : assignedRoomsData?.summary.total_assigned ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {assignedRoomsData.groups.map((group) => (
                    <div key={group.block} style={{ border: '1px solid rgba(180,101,30,0.12)', borderRadius: '14px', backgroundColor: '#fffcf7', overflow: 'hidden' }}>
                      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(180,101,30,0.08)', display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                        <strong style={{ color: '#1a1208', fontFamily: "'DM Sans', sans-serif" }}>{group.block}</strong>
                        <span style={{ color: '#7a6a55', fontSize: '0.82rem', fontFamily: "'DM Sans', sans-serif" }}>
                          {group.floors.reduce((sum, item) => sum + item.pending_count, 0)} pending • {group.floors.reduce((sum, item) => sum + item.completed_count, 0)} completed
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {group.floors.map((floorGroup) => (
                          <div key={`${group.block}-${floorGroup.floor}`} style={{ padding: '14px 16px', borderTop: '1px solid rgba(180,101,30,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                              <strong style={{ color: '#1a1208', fontSize: '0.92rem', fontFamily: "'DM Sans', sans-serif" }}>
                                Floor {floorGroup.floor}
                              </strong>
                              <span style={{ color: '#7a6a55', fontSize: '0.78rem', fontFamily: "'DM Sans', sans-serif" }}>
                                {floorGroup.pending_count} pending • {floorGroup.completed_count} completed
                              </span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
                              {floorGroup.rooms.map((room) => {
                                const isCompleted = room.status === 'completed'
                                return (
                                  <button
                                    key={`${group.block}-${floorGroup.floor}-${room.room_number}`}
                                    type="button"
                                    onClick={() => {
                                      if (!isCompleted) {
                                        handleAssignedRoomSelect(group.block as Block, floorGroup.floor, room.room_number)
                                      }
                                    }}
                                    disabled={isCompleted}
                                    style={{
                                      padding: '12px',
                                      borderRadius: '12px',
                                      border: isCompleted ? '1.5px solid rgba(22,163,74,0.22)' : '1.5px solid rgba(180,101,30,0.18)',
                                      backgroundColor: isCompleted ? '#f0fdf4' : '#fff',
                                      color: isCompleted ? '#166534' : '#1a1208',
                                      cursor: isCompleted ? 'not-allowed' : 'pointer',
                                      opacity: isCompleted ? 0.85 : 1,
                                      textAlign: 'left',
                                      fontFamily: "'DM Sans', sans-serif",
                                    }}
                                  >
                                    <div style={{ fontWeight: '700', marginBottom: '4px' }}>
                                      {room.room_number}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: isCompleted ? '#166534' : '#7a6a55' }}>
                                      {isCompleted ? 'Completed' : 'Pending'}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ border: '1px solid rgba(180,101,30,0.12)', borderRadius: '14px', backgroundColor: '#fffcf7', padding: '16px', color: '#7a6a55', fontFamily: "'DM Sans', sans-serif", fontSize: '0.9rem' }}>
                  No rooms assigned for today.
                </div>
              )}

              {selectedRoom && (
                <BlockFloorSelector
                  block={block}
                  floor={floorNorm}
                  selectedRoom={selectedRoom}
                  roomInspections={roomInspections}
                  roomIssues={roomIssues}
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
                  handleImageUploadForIssue={handleImageUploadForIssue}
                  removeImageForIssue={removeImageForIssue}
                  disabled={formLocked}
                  normalizeFloor={normalizeFloor}
                  hideLocationSelectors
                />
              )}
            </div>
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(14px, 3.6vw, 20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <ChecklistSection responses={checklistResponses} onChange={handleChecklistChange} disabled={formLocked} />
          </div>

          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: 'clamp(14px, 3.6vw, 20px)', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
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
