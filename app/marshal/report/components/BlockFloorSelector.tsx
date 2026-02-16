'use client'

import { useState } from 'react'
import { Building2, Layers } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG } from '@/lib/utils/constants'

interface BlockFloorSelectorProps {
  block: string
  floor: string
  onBlockChange: (block: string) => void
  onFloorChange: (floor: string) => void
  disabled?: boolean
}

export default function BlockFloorSelector({
  block,
  floor,
  onBlockChange,
  onFloorChange,
  disabled = false,
}: BlockFloorSelectorProps) {
  const [showBlockModal, setShowBlockModal] = useState(false)
  const [showFloorModal, setShowFloorModal] = useState(false)
  
  const availableFloors = block ? FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG] : []
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-black mb-4">
        Location Selection
      </h3>
      
      <div className="space-y-4">
        {/* Block Selection */}
        <div>
          <label className="text-sm font-medium text-black mb-2 flex items-center">
            <Building2 className="w-4 h-4 mr-2" />
            Block
          </label>
          <button
            type="button"
            onClick={() => setShowBlockModal(true)}
            disabled={disabled}
            className={`w-full text-left px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              disabled
                ? 'bg-gray-100 cursor-not-allowed'
                : block
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            {block || 'Select Block'}
          </button>
        </div>
        
        {/* Floor Selection */}
        <div>
          <label className="text-sm font-medium text-black mb-2 flex items-center">
            <Layers className="w-4 h-4 mr-2" />
            Floor
          </label>
          <button
            type="button"
            onClick={() => setShowFloorModal(true)}
            disabled={disabled || !block}
            className={`w-full text-left px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
              disabled
                ? 'bg-gray-100 cursor-not-allowed'
                : floor && block
                ? 'border-primary-500 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
            } ${!block ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {floor || 'Select Floor'}
          </button>
          {!block && (
            <p className="mt-1 text-sm text-gray-500">Please select a block first</p>
          )}
        </div>
      </div>
      
      {/* Block Selection Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h4 className="text-lg font-semibold text-black">Select Block</h4>
            </div>
            
            <div className="p-4 space-y-3">
              {BLOCKS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    onBlockChange(b)
                    onFloorChange('') // Reset floor when block changes
                    setShowBlockModal(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    block === b
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-black'
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={() => setShowBlockModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floor Selection Modal */}
      {showFloorModal && block && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="p-4 border-b">
              <h4 className="text-lg font-semibold text-black">
                Select Floor (Block: {block})
              </h4>
            </div>
            
            <div className="p-4 space-y-3">
              {availableFloors.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    onFloorChange(f)
                    setShowFloorModal(false)
                  }}
                  className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                    floor === f
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-50 hover:bg-gray-100 text-black'
                  }`}
                >
                  Floor {f}
                </button>
              ))}
            </div>
            
            <div className="p-4 border-t">
              <button
                type="button"
                onClick={() => setShowFloorModal(false)}
                className="w-full px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}