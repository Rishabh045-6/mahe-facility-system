'use client'

import { useState } from 'react'
import { 
  CheckCircle2, 
  XCircle, 
  Image as ImageIcon, 
  MapPin, 
  Clock, 
  User,
  ChevronDown,
  ChevronUp,
  Tag
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
  status: 'approved' | 'denied'
  reported_at: string
  marshals?: {
    name: string
  }
}

interface IssueCardProps {
  issue: Issue
  onStatusChange: (issueId: string, newStatus: 'approved' | 'denied') => void
}

export default function IssueCard({ issue, onStatusChange }: IssueCardProps) {
  const [expanded, setExpanded] = useState(false)
  
  const getStatusColor = () => {
    switch (issue.status) {
      case 'approved':
        return 'bg-green-100 text-green-700'
      case 'denied':
        return 'bg-red-100 text-red-700'
      default:
        return 'bg-yellow-100 text-yellow-700'
    }
  }
  
  const getStatusIcon = () => {
    switch (issue.status) {
      case 'approved':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />
      case 'denied':
        return <XCircle className="w-5 h-5 text-red-600" />
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />
    }
  }
  
  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-start justify-between">
        {/* Left Section - Issue Info */}
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
              {issue.status.charAt(0).toUpperCase() + issue.status.slice(1)}
            </span>
            {getStatusIcon()}
          </div>
          
          <h3 className="text-lg font-semibold text-black mb-2">
            {issue.issue_type}
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-700 mb-3">
            <div className="flex items-center">
              <MapPin className="w-4 h-4 mr-2 text-gray-400" />
              <span>{issue.block}, Floor {issue.floor}</span>
            </div>
            
            {issue.room_location && (
              <div className="flex items-center">
                <Tag className="w-4 h-4 mr-2 text-gray-400" />
                <span>{issue.room_location}</span>
              </div>
            )}
            
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2 text-gray-400" />
              <span>{formatTime(issue.reported_at)}</span>
            </div>
            
            <div className="flex items-center">
              <User className="w-4 h-4 mr-2 text-gray-400" />
              <span>{issue.marshals?.name || issue.marshal_id || 'Unknown Marshal'}</span>
            </div>
          </div>
          
          <p className="text-gray-700 mb-3">{issue.description}</p>
          
          {issue.is_movable && (
            <div className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm mb-3">
              <span>📦 Movable Item</span>
            </div>
          )}
          
          {issue.images && issue.images.length > 0 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="flex items-center text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              {issue.images.length} {issue.images.length === 1 ? 'image' : 'images'}
              {expanded ? (
                <ChevronUp className="w-4 h-4 ml-1" />
              ) : (
                <ChevronDown className="w-4 h-4 ml-1" />
              )}
            </button>
          )}
        </div>
        
        {/* Right Section - Status Toggle */}
        <div className="flex flex-col items-end space-y-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
            <div className="flex space-x-2">
              <button
                onClick={() => onStatusChange(issue.id, 'approved')}
                className={`p-2 rounded-full transition-colors ${
                  issue.status === 'approved'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-600 hover:bg-green-200'
                }`}
                title="Approve"
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => onStatusChange(issue.id, 'denied')}
                className={`p-2 rounded-full transition-colors ${
                  issue.status === 'denied'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-600 hover:bg-red-200'
                }`}
                title="Deny"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Gallery (Collapsible) */}
      {expanded && issue.images && issue.images.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <IssueGallery images={issue.images} />
        </div>
      )}
    </div>
  )
}