'use client'

import React, { useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'

type IssueFormItem = {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
}

type SaveIssueButtonProps = {
  room: string
  issueId: number
  issueData: Partial<IssueFormItem>
  disabled?: boolean
  onSaveIssue: (room: string, issueId: number, issueData: Partial<IssueFormItem>) => void
}

export function SaveIssueButton({
  room,
  issueId,
  issueData,
  onSaveIssue,
  disabled = false,
}: SaveIssueButtonProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)

  const handleSave = async () => {
    if (!issueData.issue_type) {
      alert('Please select issue type')
      return
    }
    if (!issueData.description || issueData.description.trim().length < 10) {
      alert('Please add description (min 10 characters)')
      return
    }

    setIsSaving(true)
    try {
      await new Promise((r) => setTimeout(r, 250))
      onSaveIssue(room, issueId, issueData)
      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1200)
    } catch (e) {
      console.error(e)
      alert('Failed to save issue')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={disabled || isSaving}
      className={`
        font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 
        transition-all duration-200
        ${showSuccess ? 'bg-green-600 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white hover:shadow-lg'}
        ${(disabled || isSaving) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      {showSuccess ? (
        <>
          <CheckCircle className="w-5 h-5" />
          Saved!
        </>
      ) : (
        <>
          <Save className="w-5 h-5" />
          {isSaving ? 'Saving...' : 'Save Issue'}
        </>
      )}
    </button>
  )
}