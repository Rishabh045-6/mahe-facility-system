'use client'

import { AlertTriangle, CheckCircle2, MapPin, User } from 'lucide-react'
import { BLOCKS, FLOOR_CONFIG } from '@/lib/utils/constants'

interface FloorCoverage {
  date: string
  block: string
  floor: string
  marshal_id: string
  submitted_at: string
  marshals?: {
    name: string
  }
}

interface FloorCoverageAlertProps {
  floorCoverage: FloorCoverage[]
}

export default function FloorCoverageAlert({ floorCoverage }: FloorCoverageAlertProps) {
  // Calculate missing floors
  const allFloors = BLOCKS.flatMap(block => {
    const floors = FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG]
    return floors.map(floor => ({ block, floor }))
  })
  
  const coveredFloors = floorCoverage.map(fc => ({ block: fc.block, floor: fc.floor }))
  
  const missingFloors = allFloors.filter(
    af => !coveredFloors.some(cf => cf.block === af.block && cf.floor === af.floor)
  )
  
  if (missingFloors.length === 0) {
    return (
      <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r">
        <div className="flex items-center">
          <CheckCircle2 className="w-5 h-5 text-green-400 mr-3" />
          <div>
            <p className="font-medium text-green-800">All Floors Covered</p>
            <p className="text-sm text-green-700 mt-1">
              All {allFloors.length} floors have been inspected today.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-r">
      <div className="flex items-start">
        <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-yellow-800">
                Floor Coverage Alert
              </p>
              <p className="text-sm text-yellow-700 mt-1">
                {missingFloors.length} floor(s) not inspected today
              </p>
            </div>
            <span className="px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-sm font-medium">
              {missingFloors.length} Missing
            </span>
          </div>
          
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {missingFloors.map((floor, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 p-3 bg-white rounded-lg border border-yellow-200"
              >
                <MapPin className="w-4 h-4 text-yellow-500" />
                <div>
                  <p className="font-medium text-black">{floor.block}</p>
                  <p className="text-sm text-gray-700">Floor {floor.floor}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 bg-yellow-100 rounded-lg p-3">
            <p className="text-sm text-yellow-800 font-medium mb-2">
              Coverage Summary:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
              {BLOCKS.map((block) => {
                const totalFloors = FLOOR_CONFIG[block as keyof typeof FLOOR_CONFIG].length
                const covered = floorCoverage.filter(fc => fc.block === block).length
                const percentage = Math.round((covered / totalFloors) * 100)
                
                return (
                  <div key={block} className="p-2 bg-white rounded">
                    <p className="font-semibold text-black">{block}</p>
                    <p className="text-xs text-gray-700">
                      {covered}/{totalFloors} floors 
                    </p>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div
                        className={`h-1.5 rounded-full ${
                          percentage === 100 ? 'bg-green-500' :
                          percentage > 50 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}