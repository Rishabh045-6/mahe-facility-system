'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'

interface AnalyticsData {
  topIssues: Array<{ issue_type: string; total: number }>
  problematicLocations: Array<{ block: string; floor: string; room_location: string; count: number }>
  blockComparison: Array<{ date: string; block: string; total: number }>
  marshalActivity: Array<{ marshal_id: string; name: string; count: number }>
  trend: Array<{ date: string; total: number }>
}

interface AnalyticsChartsProps {
  data: AnalyticsData
}

const COLORS = ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  // Top Issues Chart Data
  const topIssuesData = data.topIssues.map(item => ({
    name: item.issue_type.length > 20 ? item.issue_type.substring(0, 20) + '...' : item.issue_type,
    issues: item.total,
  }))

  // Problematic Locations Data
  const locationsData = data.problematicLocations.map(item => ({
    name: `${item.block} F${item.floor}${item.room_location ? '-' + item.room_location : ''}`,
    count: item.count,
  }))

  // Marshal Activity Data
  const marshalData = data.marshalActivity.map(item => ({
    name: item.name || item.marshal_id,
    submissions: item.count,
  }))

  return (
    <div className="space-y-8">
      {/* Top Issues Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-black mb-4">Top Issues</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topIssuesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="issues" fill="#1e3a8a" name="Issues Reported" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Problematic Locations Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-black mb-4">Problematic Locations</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={locationsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${`${((percent ?? 0) * 100).toFixed(0)}%`}`}
                outerRadius={150}
                fill="#8884d8"
                dataKey="count"
              >
                {locationsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marshal Activity Bar Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold text-black mb-4">Marshal Activity</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marshalData} layout="vertical" margin={{ left: 150 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={120} />
              <Tooltip />
              <Legend />
              <Bar dataKey="submissions" fill="#2563eb" name="Submissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Over Time Line Chart */}
      {data.trend.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-bold text-black mb-4">Trend Over Time</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#1e3a8a" strokeWidth={2} name="Total Issues" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}