'use client'

import { BarChart3, TrendingUp, AlertTriangle, MapPin ,CheckCircle2, XCircle} from 'lucide-react'
import { useState } from 'react'

interface Issue {
  block: string
  floor: string
  room_location?: string
  issue_type: string
  status: string
  marshal_id: string
  reported_at: string
}

interface AnalyticsSectionProps {
  issues: Issue[]
}

export default function AnalyticsSection({ issues }: AnalyticsSectionProps) {
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today')
  
  // Filter issues based on time range
  const filteredIssues = issues.filter(issue => {
    const issueDate = new Date(issue.reported_at)
    const now = new Date()
    
    switch (timeRange) {
      case 'today':
        return issueDate.toDateString() === now.toDateString()
      case 'week':
        const weekAgo = new Date()
        weekAgo.setDate(weekAgo.getDate() - 7)
        return issueDate >= weekAgo
      case 'month':
        const monthAgo = new Date()
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return issueDate >= monthAgo
      default:
        return true
    }
  })
  
  // Calculate analytics
  const totalIssues = filteredIssues.length
  const approvedIssues = filteredIssues.filter(i => i.status === 'approved').length
  const deniedIssues = filteredIssues.filter(i => i.status === 'denied').length
  
  // Top issue types
  const issueTypeCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.issue_type] = (acc[issue.issue_type] || 0) + 1
    return acc
  }, {})
  
  const topIssueTypes = Object.entries(issueTypeCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
  
  // Issues by block
  const blockCounts = filteredIssues.reduce((acc: Record<string, number>, issue) => {
    acc[issue.block] = (acc[issue.block] || 0) + 1
    return acc
  }, {})
  
  // Problematic locations
  const locationCounts = filteredIssues.reduce((acc: Record<string, { count: number; location: string }>, issue) => {
    const key = `${issue.block}-F${issue.floor}${issue.room_location ? '-' + issue.room_location : ''}`
    if (!acc[key]) {
      acc[key] = { count: 0, location: `${issue.block}, Floor ${issue.floor}${issue.room_location ? ', ' + issue.room_location : ''}` }
    }
    acc[key].count++
    return acc
  }, {})
  
  const problematicLocations = Object.values(locationCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-black">Analytics</h2>
          
          <div className="flex space-x-2">
            {(['today', 'week', 'month'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg text-sm font-medium capitalize ${
                  timeRange === range
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Issues</p>
                <p className="text-3xl font-bold text-black mt-2">{totalIssues}</p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-400" />
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-medium">Approved</p>
                <p className="text-3xl font-bold text-black mt-2">{approvedIssues}</p>
                {totalIssues > 0 && (
                  <p className="text-sm text-green-600 mt-1">
                    {Math.round((approvedIssues / totalIssues) * 100)}% approval rate
                  </p>
                )}
              </div>
              <CheckCircle2 className="w-12 h-12 text-green-400" />
            </div>
          </div>
          
          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-medium">Denied</p>
                <p className="text-3xl font-bold text-black mt-2">{deniedIssues}</p>
                {totalIssues > 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    {Math.round((deniedIssues / totalIssues) * 100)}% denial rate
                  </p>
                )}
              </div>
              <XCircle className="w-12 h-12 text-red-400" />
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-700 font-medium">Blocks</p>
                <p className="text-3xl font-bold text-black mt-2">{Object.keys(blockCounts).length}</p>
                <p className="text-sm text-purple-600 mt-1">
                  {totalIssues} issues reported
                </p>
              </div>
              <MapPin className="w-12 h-12 text-purple-400" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Issue Types */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mr-2" />
              <h3 className="text-lg font-semibold text-black">Top Issue Types</h3>
            </div>
            
            <div className="space-y-3">
              {topIssueTypes.map(([type, count], index) => (
                <div key={type} className="flex items-center">
                  <span className="text-sm text-gray-500 mr-4 w-6">{index + 1}.</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-black">{type}</span>
                      <span className="text-sm text-gray-500">{count} issues</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{ width: `${(count / Math.max(...topIssueTypes.map(([,c]) => c))) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Problematic Locations */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center mb-4">
              <MapPin className="w-6 h-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-black">Problematic Locations</h3>
            </div>
            
            <div className="space-y-3">
              {problematicLocations.map((location, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200"
                >
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-3 w-6">{index + 1}.</span>
                    <div>
                      <p className="text-sm font-medium text-black">{location.location}</p>
                      <p className="text-xs text-gray-500">{location.count} issues reported</p>
                    </div>
                  </div>
                  
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    location.count >= 3 ? 'bg-red-100 text-red-700' :
                    location.count >= 2 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {location.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Issues by Block Chart */}
        <div className="mt-6 bg-gray-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <BarChart3 className="w-6 h-6 text-blue-500 mr-2" />
            <h3 className="text-lg font-semibold text-black">Issues by Block</h3>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {Object.entries(blockCounts).map(([block, count]) => {
              const percentage = totalIssues > 0 ? (count as number / totalIssues) * 100 : 0
              
              return (
                <div key={block} className="text-center">
                  <div className="font-semibold text-black mb-2">{block}</div>
                  <div className="relative w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="absolute bottom-0 w-full .bg-gradient-to-t from-primary-600 to-primary-400"
                      style={{ height: `${Math.min(percentage, 100)}%` }}
                    ></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary-900">{count}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-700 mt-2">
                    {percentage.toFixed(1)}% of total
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}