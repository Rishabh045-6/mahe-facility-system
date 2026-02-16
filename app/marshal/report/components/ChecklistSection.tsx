'use client'

import { useState } from 'react'
import { Check, X, ChevronDown, ChevronUp } from 'lucide-react'
import { CHECKLIST_ITEMS, CHECKLIST_CATEGORIES } from '@/lib/utils/constants'

interface ChecklistSectionProps {
  responses: Record<string, boolean>
  onChange: (itemId: string, response: boolean) => void
  disabled?: boolean
}

export default function ChecklistSection({
  responses,
  onChange,
  disabled = false,
}: ChecklistSectionProps) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'Daily Observations': true,
    'Classroom/Lab Upkeep': false,
    'Washroom & Utility': false,
    'Maintenance/Snag': false,
  })
  
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category],
    }))
  }
  
  const getCategoryStats = (category: string) => {
    const items = CHECKLIST_ITEMS.filter(item => item.category === category)
    const completed = items.filter(item => responses[item.id.toString()] !== undefined).length
    return { total: items.length, completed }
  }
  
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="border-b p-4">
        <h3 className="text-lg font-semibold text-black flex items-center">
          <span>📋</span>
          <span className="ml-2">Daily Inspection Checklist</span>
        </h3>
        <p className="text-sm text-gray-700 mt-1">
          Please mark each item as completed (✓) or not completed (✗)
        </p>
      </div>
      
      <div className="divide-y">
        {CHECKLIST_CATEGORIES.map((category) => {
          const { total, completed } = getCategoryStats(category)
          const isExpanded = expandedCategories[category]
          
          return (
            <div key={category} className="p-4">
              <button
                type="button"
                onClick={() => toggleCategory(category)}
                className="w-full text-left flex items-center justify-between mb-3"
              >
                <div>
                  <h4 className="font-semibold text-black">{category}</h4>
                  <p className="text-sm text-gray-500">
                    {completed}/{total} items completed
                  </p>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              
              {isExpanded && (
                <div className="space-y-3 mt-4">
                  {CHECKLIST_ITEMS.filter(item => item.category === category).map((item) => {
                    const response = responses[item.id.toString()]
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-gray-800 flex-1">{item.text}</span>
                        
                        <div className="flex space-x-2">
                          <button
                            type="button"
                            onClick={() => onChange(item.id.toString(), true)}
                            disabled={disabled}
                            className={`p-2 rounded-full transition-colors ${
                              response === true
                                ? 'bg-green-100 text-green-600'
                                : 'bg-white text-gray-400 hover:bg-green-50 hover:text-green-600'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Mark as completed"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => onChange(item.id.toString(), false)}
                            disabled={disabled}
                            className={`p-2 rounded-full transition-colors ${
                              response === false
                                ? 'bg-red-100 text-red-600'
                                : 'bg-white text-gray-400 hover:bg-red-50 hover:text-red-600'
                            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                            title="Mark as not completed"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}