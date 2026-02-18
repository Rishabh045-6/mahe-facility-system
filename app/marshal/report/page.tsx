'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle2, XCircle, AlertTriangle, Clock, Upload, Image as ImageIcon, Save, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { offlineQueue } from '@/lib/offline/queue'
import { isBeforeDeadline, shouldLockForm, getTimeRemaining, getTodayDateString } from '@/lib/utils/time'
import { BLOCKS, FLOOR_CONFIG, ISSUE_TYPES, CHECKLIST_ITEMS, MAX_IMAGES_PER_ISSUE } from '@/lib/utils/constants'
import BlockFloorSelector from './components/BlockFloorSelector'
import ChecklistSection from './components/ChecklistSection'
import IssueForm from './components/IssueForm'
import ImageUploader from './components/ImageUploader'
import SubmissionSummary from './components/SubmissionSummary'

export default function MarshalReportPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formLocked, setFormLocked] = useState(false)
    const [timeRemaining, setTimeRemaining] = useState('')

    // Form state
    const [marshalId, setMarshalId] = useState('')
    const [marshalName, setMarshalName] = useState('')
    const [block, setBlock] = useState<string>('')
    const [floor, setFloor] = useState<string>('')
    const [checklistResponses, setChecklistResponses] = useState<Record<string, boolean>>({})
    const [hasIssues, setHasIssues] = useState<boolean | null>(null)
    const [issues, setIssues] = useState<any[]>([])
    const [images, setImages] = useState<File[]>([])
    const [isAutoSaving, setIsAutoSaving] = useState(false)

    // Load marshal data from localStorage
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

    // Check deadline and update countdown
    useEffect(() => {
        const checkDeadline = () => {
            const locked = shouldLockForm()
            setFormLocked(locked)
            setTimeRemaining(getTimeRemaining())
        }

        checkDeadline()
        const interval = setInterval(checkDeadline, 1000)

        return () => clearInterval(interval)
    }, [])

    // Auto-save draft every 10 seconds
    useEffect(() => {
        if (isBeforeDeadline()) {
            const autoSaveInterval = setInterval(() => {
                if (block && floor && Object.keys(checklistResponses).length > 0) {
                    handleAutoSave()
                }
            }, 10000) // 10 seconds

            return () => clearInterval(autoSaveInterval)
        }
    }, [block, floor, checklistResponses, hasIssues, issues, images])

    // Auto-save function
    const handleAutoSave = () => {
        const draft = {
            marshalId,
            block,
            floor,
            checklistResponses,
            hasIssues,
            issues,
            imagesCount: images.length,
            timestamp: new Date().toISOString(),
        }

        localStorage.setItem('marshalDraft', JSON.stringify(draft))
        console.log('Draft auto-saved')
    }

    // Restore draft on mount
    useEffect(() => {
        const savedDraft = localStorage.getItem('marshalDraft')
        if (savedDraft) {
            const draft = JSON.parse(savedDraft)
            if (draft.marshalId === marshalId) {
                setBlock(draft.block || '')
                setFloor(draft.floor || '')
                setChecklistResponses(draft.checklistResponses || {})
                setHasIssues(draft.hasIssues)
                setIssues(draft.issues || [])
            }
        }
    }, [marshalId])

    // Clear draft on successful submission
    const clearDraft = () => {
        localStorage.removeItem('marshalDraft')
    }

    // Handle form submission
    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formLocked) {
            toast.error('Submission deadline has passed (6:00 PM)')
            return
        }

        if (!block || !floor) {
            toast.error('Please select Block and Floor')
            return
        }

        if (Object.keys(checklistResponses).length === 0) {
            toast.error('Please complete the checklist')
            return
        }

        if (hasIssues === null) {
            toast.error('Please indicate if you found any issues')
            return
        }

        if (hasIssues && (!issues || issues.length === 0)) {
            toast.error('Please add at least one issue')
            return
        }

        // Validate each issue has required fields
        if (hasIssues && issues) {
            const invalidIssues = issues.filter(issue =>
                !issue.issue_type ||
                !issue.description ||
                issue.description.length < 10
            )

            if (invalidIssues.length > 0) {
                toast.error(`Please complete all required fields for issue(s)`)
                return
            }
        }

        setIsSubmitting(true)

        try {
            // Prepare submission data matching new API schema
           // Upload images first if any
            let uploadedImagePaths: string[] = []
            if (hasIssues && images.length > 0) {
                try {
                    const { uploadImages } = await import('@/lib/storage/upload')
                    const tempIssueId = `temp-${Date.now()}`
                    uploadedImagePaths = await uploadImages(images, block, tempIssueId)
                } catch (uploadError: any) {
    console.error('Image upload failed:', uploadError)
    toast.error('Upload error: ' + (uploadError?.message || JSON.stringify(uploadError)))
}
            }

            const submissionData = {
                marshal_id: marshalId,
                marshal_name: marshalName,
                block,
                floor,
                checklist_responses: Object.entries(checklistResponses).map(([itemId, response]) => ({
                    item_id: itemId,
                    value: response,
                })),
                has_issues: hasIssues || false,
                issues: hasIssues && issues ? issues.map((issue, index) => ({
                    issue_type: issue.issue_type,
                    description: issue.description,
                    is_movable: issue.is_movable,
                    room_location: issue.room_location || undefined,
                    images: uploadedImagePaths,
                })) : undefined,
                submitted_at: new Date().toISOString(),
            }
            // Submit to API
            const response = await fetch('/api/issues', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(submissionData),
            })

            const result = await response.json()

            if (!response.ok) {
                // Show specific validation errors
                if (result.details && Array.isArray(result.details)) {
                    const errorMessages = result.details.map((err: any) =>
                        `${err.field}: ${err.message}`
                    ).join('\n')
                    toast.error(`Validation failed:\n${errorMessages}`)
                } else {
                    toast.error(result.error || 'Failed to submit report')
                }
                setIsSubmitting(false)
                return
            }

            // Clear form and draft
            clearDraft()

            toast.success(result.message || 'Report submitted successfully!')

            // Reset form after 2 seconds
            setTimeout(() => {
                setBlock('')
                setFloor('')
                setChecklistResponses({})
                setHasIssues(null)
                setIssues([])
                setImages([])
                setIsSubmitting(false)
            }, 2000)

        } catch (error: any) {
            console.error('Submission error:', error)

            // If offline, queue for later sync
            if (!navigator.onLine) {
                const queueId = offlineQueue?.addToQueue('issue', {
                    marshal_id: marshalId,
                    marshal_name: marshalName,
                    block,
                    floor,
                    checklist_responses: checklistResponses,
                    has_issues: hasIssues || false,
                    issues: hasIssues && issues ? issues.map(issue => ({
                        issue_type: issue.issue_type,
                        description: issue.description,
                        is_movable: issue.is_movable,
                        room_location: issue.room_location || undefined
                    })) : undefined,
                })

                toast.success('Report queued for submission when online')
                clearDraft()
            } else {
                toast.error(error.message || 'Failed to submit report')
            }

            setIsSubmitting(false)
        }
    }

    // Handle checklist response change
    const handleChecklistChange = (itemId: string, response: boolean) => {
        setChecklistResponses(prev => ({
            ...prev,
            [itemId]: response,
        }))
    }

    // Add new issue
    const addIssue = () => {
        setIssues(prev => [
            ...prev,
            {
                id: Date.now(),
                issue_type: '',
                description: '',
                is_movable: false,
                room_location: '',
            },
        ])
    }

    // Update issue
    const updateIssue = (id: number, field: string, value: any) => {
        setIssues(prev =>
            prev.map(issue =>
                issue.id === id ? { ...issue, [field]: value } : issue
            )
        )
    }

    // Remove issue
    const removeIssue = (id: number) => {
        setIssues(prev => prev.filter(issue => issue.id !== id))
    }

    // Handle image upload
    const handleImageUpload = (files: File[]) => {
        if (images.length + files.length > MAX_IMAGES_PER_ISSUE) {
            toast.error(`Maximum ${MAX_IMAGES_PER_ISSUE} images allowed`)
            return
        }

        setImages(prev => [...prev, ...files.slice(0, MAX_IMAGES_PER_ISSUE - prev.length)])
    }

    // Remove image
    const removeImage = (index: number) => {
        setImages(prev => prev.filter((_, i) => i !== index))
    }

    if (!marshalId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
                    <p className="mt-4 text-gray-700">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-black">Daily Inspection Report</h1>
                            <p className="text-gray-700 mt-1">Welcome, <span className="font-semibold">{marshalName}</span></p>
                        </div>

                        <div className="bg-primary-50 border-l-4 border-primary-600 p-3 rounded-r">
                            <div className="flex items-center space-x-2">
                                <Clock className="w-5 h-5 text-primary-600" />
                                <div>
                                    <p className="text-sm font-medium text-gray-700">Time Remaining</p>
                                    <p className="text-lg font-bold text-primary-600">{timeRemaining}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {formLocked && (
                        <div className="mt-4 bg-red-50 border-l-4 border-red-400 p-4 rounded-r">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-400 mr-3" />
                                <p className="text-red-700 font-medium">Submission deadline has passed (6:00 PM)</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Block & Floor Selection */}
                    <BlockFloorSelector
                        block={block}
                        floor={floor}
                        onBlockChange={setBlock}
                        onFloorChange={setFloor}
                        disabled={formLocked}
                    />

                    {/* Checklist Section */}
                    <ChecklistSection
                        responses={checklistResponses}
                        onChange={handleChecklistChange}
                        disabled={formLocked}
                    />

                    {/* Issue Declaration */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <h3 className="text-lg font-semibold text-black mb-4">
                            Issue Declaration
                        </h3>

                        <div className="space-y-4">
                            <p className="text-gray-700">
                                Did you find any issues during your inspection?
                            </p>

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setHasIssues(true)}
                                    disabled={formLocked}
                                    className={`p-6 rounded-lg border-2 text-left transition-all ${hasIssues === true
                                        ? 'border-primary-600 bg-primary-50'
                                        : 'border-gray-300 hover:border-primary-400'
                                        } ${formLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <CheckCircle2 className={`w-6 h-6 mr-3 ${hasIssues === true ? 'text-primary-600' : 'text-gray-400'}`} />
                                        <span className="font-semibold text-black">Yes, I found issues</span>
                                    </div>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setHasIssues(false)}
                                    disabled={formLocked}
                                    className={`p-6 rounded-lg border-2 text-left transition-all ${hasIssues === false
                                        ? 'border-green-600 bg-green-50'
                                        : 'border-gray-300 hover:border-green-400'
                                        } ${formLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <div className="flex items-center">
                                        <XCircle className={`w-6 h-6 mr-3 ${hasIssues === false ? 'text-green-600' : 'text-gray-400'}`} />
                                        <span className="font-semibold text-black">No issues found</span>
                                    </div>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Issues Form (only if hasIssues is true) */}
                    {hasIssues && (
                        <IssueForm
                            issues={issues}
                            onAddIssue={addIssue}
                            onUpdateIssue={updateIssue}
                            onRemoveIssue={removeIssue}
                            disabled={formLocked}
                        />
                    )}

                    {/* Image Upload */}
                    {hasIssues && (
                        <ImageUploader
                            images={images}
                            onUpload={handleImageUpload}
                            onRemove={removeImage}
                            disabled={formLocked}
                        />
                    )}

                    {/* Submission Summary */}
                    <SubmissionSummary
                        block={block}
                        floor={floor}
                        checklistCount={Object.keys(checklistResponses).length}
                        issueCount={issues.length}
                        imageCount={images.length}
                    />

                    {/* Submit Button */}
                    <div className="sticky bottom-4 bg-gray-50 py-4">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <button
                                type="submit"
                                disabled={formLocked || isSubmitting || loading}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 px-6 rounded-lg text-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Submitting...</span>
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-5 h-5" />
                                        <span>Submit Report</span>
                                    </>
                                )}
                            </button>

                            {isAutoSaving && (
                                <p className="text-sm text-gray-500 text-center mt-2 flex items-center justify-center">
                                    <Save className="w-4 h-4 mr-2 animate-pulse" />
                                    Auto-saving draft...
                                </p>
                            )}
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}