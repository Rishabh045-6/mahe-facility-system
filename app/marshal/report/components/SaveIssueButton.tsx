// app/marshal/report/components/SaveIssueButton.tsx
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

  const isDisabledState = disabled || isSaving

  return (
    <button
      type="button"
      onClick={handleSave}
      disabled={isDisabledState}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '10px 18px',
        borderRadius: '10px',
        border: 'none',
        backgroundColor: showSuccess ? '#16a34a' : '#B4651E',
        color: 'white',
        fontSize: '0.9rem',
        fontWeight: '600',
        fontFamily: "'DM Sans', sans-serif",
        cursor: isDisabledState ? 'not-allowed' : 'pointer',
        opacity: isDisabledState ? 0.5 : 1,
        transition: 'background-color 0.2s, opacity 0.2s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => {
        if (!isDisabledState) {
          e.currentTarget.style.backgroundColor = showSuccess ? '#15803d' : '#8f4e16'
        }
      }}
      onMouseLeave={(e) => {
        if (!isDisabledState) {
          e.currentTarget.style.backgroundColor = showSuccess ? '#16a34a' : '#B4651E'
        }
      }}
    >
      {showSuccess ? (
        <>
          <CheckCircle size={16} />
          Saved!
        </>
      ) : (
        <>
          <Save size={16} />
          {isSaving ? 'Saving...' : 'Save Issue'}
        </>
      )}
    </button>
  )
}