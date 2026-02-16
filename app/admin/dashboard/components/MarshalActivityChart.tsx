// NEW FILE: app/admin/dashboard/components/MarshalActivityChart.tsx
'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Users } from 'lucide-react'

interface MarshalActivityData {
  date: string
  unique_count: number
  total_submissions: number
}

interface MarshalActivityChartProps {
  data: MarshalActivityData[]
}

export default function MarshalActivityChart({ data }: MarshalActivityChartProps) {
  // Format dates for display (UTC → IST friendly)
  const chartData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-IN', {
      month: 'short',
      day: 'numeric'
    })
  }))

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center mb-4">
        <Users className="w-6 h-6 text-orange-500 mr-2" />
        <h3 className="text-lg font-semibold text-black">Daily Marshal Activity</h3>
      </div>
      
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="displayDate" 
              angle={-45} 
              textAnchor="end" 
              height={70}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              label={{ value: 'Unique Marshals', angle: -90, position: 'insideLeft' }}
              tick={{ fontSize: 12 }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              labelStyle={{ fontWeight: 'bold' }}
              formatter={(value, name) => [
                value ?? 0,
                name === 'unique_count' ? 'Active Marshals' : 'Total Submissions'
              ]}
            />
            <Line 
              type="monotone" 
              dataKey="unique_count" 
              stroke="#f97316" 
              strokeWidth={3}
              dot={{ fill: '#f97316', strokeWidth: 2 }}
              name="Active Marshals"
            />
            <Line 
              type="monotone" 
              dataKey="total_submissions" 
              stroke="#9ca3af" 
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              name="Total Submissions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-4 text-center">
        <div className="bg-orange-50 p-3 rounded-lg">
          <p className="text-sm text-orange-700 font-medium">Avg. Daily Marshals</p>
          <p className="text-2xl font-bold text-orange-600 mt-1">
            {data.length ? Math.round(data.reduce((sum, d) => sum + d.unique_count, 0) / data.length) : 0}
          </p>
        </div>
        <div className="bg-blue-50 p-3 rounded-lg">
          <p className="text-sm text-blue-700 font-medium">Peak Activity</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {data.length ? Math.max(...data.map(d => d.unique_count)) : 0}
          </p>
        </div>
      </div>
    </div>
  )
}