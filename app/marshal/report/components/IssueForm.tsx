'use client'

import { useState } from 'react'
import { X, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { ISSUE_TYPES } from '@/lib/utils/constants'

interface Issue {
  id: number
  issue_type: string
  description: string
  is_movable: boolean
  room_location: string
}

interface IssueFormProps {
  issues: Issue[]
  onAddIssue: () => void
  onUpdateIssue: (id: number, field: string, value: any) => void
  onRemoveIssue: (id: number) => void
  disabled?: boolean
}

export default function IssueForm({
  issues,
  onAddIssue,
  onUpdateIssue,
  onRemoveIssue,
  disabled = false,
}: IssueFormProps) {
  const [expandedIssue, setExpandedIssue] = useState<number | null>(null)
  
  const toggleExpand = (id: number) => {
    setExpandedIssue(expandedIssue === id ? null : id)
  }
  
  const getCategoryTypes = (category: string) => {
    return ISSUE_TYPES[category as keyof typeof ISSUE_TYPES]
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-black">Reported Issues</h3>
        <button
          type="button"
          onClick={onAddIssue}
          disabled={disabled}
          className="flex items-center px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Issue
        </button>
      </div>
      
      {issues.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No issues added yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {issues.map((issue) => (
            <div
              key={issue.id}
              className="border rounded-lg overflow-hidden"
            >
              {/* Issue Header */}
              <div
                className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer"
                onClick={() => toggleExpand(issue.id)}
              >
                <div className="flex-1">
                  {issue.issue_type ? (
                    <p className="font-medium text-black">{issue.issue_type}</p>
                  ) : (
                    <p className="text-gray-400 italic">Issue type not selected</p>
                  )}
                  {issue.room_location && (
                    <p className="text-sm text-gray-500 mt-1">Room: {issue.room_location}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  {issue.description && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                      {issue.description.length} chars
                    </span>
                  )}
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveIssue(issue.id)
                    }}
                    disabled={disabled}
                    className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  
                  {expandedIssue === issue.id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>
              
              {/* Issue Details (Collapsible) */}
              {expandedIssue === issue.id && (
                <div className="p-4 bg-white space-y-4">
                  {/* Issue Type */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Issue Type *
                    </label>
                    <select
                      value={issue.issue_type}
                      onChange={(e) => onUpdateIssue(issue.id, 'issue_type', e.target.value)}
                      disabled={disabled}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                      required
                    >
                      <option value="">Select issue type</option>
                      {Object.entries(ISSUE_TYPES).map(([category, types]) => (
                        <optgroup key={category} label={category}>
                          {types.map((type) => (
                            <option
                              key={`${category}-${type}`}
                              value={category.includes(type) ? category : `${category} - ${type}`}
                            >
                              {category.includes(type) ? category : `${type} (${category})`}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                  
                  {/* Room Location */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Room/Location (Optional)
                    </label>
                    <input
                      type="text"
                      value={issue.room_location}
                      onChange={(e) => onUpdateIssue(issue.id, 'room_location', e.target.value)}
                      disabled={disabled}
                      placeholder="e.g., Room 205, Corridor B"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                    />
                  </div>
                  
                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-black mb-2">
                      Description * (Minimum 10 characters)
                    </label>
                    <textarea
                      value={issue.description}
                      onChange={(e) => onUpdateIssue(issue.id, 'description', e.target.value)}
                      disabled={disabled}
                      placeholder="Describe the issue in detail..."
                      rows={4}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:opacity-50"
                      required
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      {issue.description.length}/500 characters
                    </p>
                  </div>
                  
                  {/* Movable Item Checkbox */}
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id={`movable-${issue.id}`}
                      checked={issue.is_movable}
                      onChange={(e) => onUpdateIssue(issue.id, 'is_movable', e.target.checked)}
                      disabled={disabled}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded disabled:opacity-50"
                    />
                    <label htmlFor={`movable-${issue.id}`} className="ml-2 text-sm text-black">
                      This is a movable item (e.g., chair, table)
                    </label>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}