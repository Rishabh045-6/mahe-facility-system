'use client'

import { CheckCircle2, AlertCircle, Layers, Image as ImageIcon } from 'lucide-react'

interface SubmissionSummaryProps {
  block: string
  floor: string
  checklistCount: number
  issueCount: number
  imageCount: number
}

export default function SubmissionSummary({
  block,
  floor,
  checklistCount,
  issueCount,
  imageCount,
}: SubmissionSummaryProps) {
  const totalChecklistItems = 19 // Total items in checklist
  const completionPercentage = Math.round((checklistCount / totalChecklistItems) * 100)
  
  const isComplete = block && floor && checklistCount === totalChecklistItems
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-black mb-4">Submission Summary</h3>
      
      <div className="space-y-4">
        {/* Location */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <Layers className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Location</p>
              <p className="font-medium text-black">
                {block ? `${block}, Floor ${floor}` : 'Not selected'}
              </p>
            </div>
          </div>
          {block && floor ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 text-yellow-500" />
          )}
        </div>
        
        {/* Checklist Completion */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">📋</span>
            <div>
              <p className="text-sm text-gray-500">Checklist Completion</p>
              <p className="font-medium text-black">
                {checklistCount}/{totalChecklistItems} items
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm font-medium text-primary-600 mt-1">{completionPercentage}%</p>
          </div>
        </div>
        
        {/* Issues Reported */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Issues Reported</p>
              <p className="font-medium text-black">
                {issueCount} {issueCount === 1 ? 'issue' : 'issues'}
              </p>
            </div>
          </div>
          {issueCount > 0 ? (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
              {issueCount}
            </span>
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          )}
        </div>
        
        {/* Images Uploaded */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center">
            <ImageIcon className="w-5 h-5 text-gray-400 mr-3" />
            <div>
              <p className="text-sm text-gray-500">Images Uploaded</p>
              <p className="font-medium text-black">
                {imageCount} {imageCount === 1 ? 'image' : 'images'}
              </p>
            </div>
          </div>
          {imageCount > 0 ? (
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
              {imageCount}
            </span>
          ) : (
            <span className="text-gray-400 text-sm">Optional</span>
          )}
        </div>
        
        {/* Completion Status */}
        <div className={`p-4 rounded-lg ${
          isComplete
            ? 'bg-green-50 border border-green-200'
            : 'bg-yellow-50 border border-yellow-200'
        }`}>
          <div className="flex items-center">
            {isComplete ? (
              <>
                <CheckCircle2 className="w-6 h-6 text-green-500 mr-3" />
                <div>
                  <p className="font-semibold text-green-800">Ready to Submit</p>
                  <p className="text-sm text-green-700 mt-1">
                    All required fields are completed. You can submit your report.
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="w-6 h-6 text-yellow-500 mr-3" />
                <div>
                  <p className="font-semibold text-yellow-800">Incomplete Report</p>
                  <p className="text-sm text-yellow-700 mt-1">
                    Please complete all required fields before submitting.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}