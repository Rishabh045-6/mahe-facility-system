'use client'

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line
} from 'recharts'

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

// Warm palette — orange through navy
const COLORS = ['#B4651E', '#C97A2A', '#1e2d3d', '#e3903f', '#2a3f57']

const tooltipStyle = {
  backgroundColor: 'rgba(255,252,247,0.98)',
  border: '1px solid rgba(180,101,30,0.2)',
  borderRadius: '10px',
  boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
  fontFamily: "'DM Sans', sans-serif",
  fontSize: '0.82rem',
}

const chartCard: React.CSSProperties = {
  backgroundColor: '#fdf6ef',
  border: '1px solid rgba(180,101,30,0.1)',
  borderRadius: '12px',
  padding: '20px 24px',
}

const chartTitle: React.CSSProperties = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '1rem',
  fontWeight: '600',
  color: '#1a1208',
  margin: '0 0 20px',
}

const axisStyle = {
  fontSize: 11,
  fill: '#7a6a55',
  fontFamily: "'DM Sans', sans-serif",
}

export default function AnalyticsCharts({ data }: AnalyticsChartsProps) {
  const topIssuesData = data.topIssues.map(item => ({
    name: item.issue_type.length > 20 ? item.issue_type.substring(0, 20) + '…' : item.issue_type,
    issues: item.total,
  }))

  const locationsData = data.problematicLocations.map(item => ({
    name: `${item.block} F${item.floor}${item.room_location ? '-' + item.room_location : ''}`,
    count: item.count,
  }))

  const marshalData = data.marshalActivity.map(item => ({
    name: item.name || item.marshal_id,
    submissions: item.count,
  }))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Top Issues Bar Chart */}
      <div style={chartCard}>
        <h3 style={chartTitle}>Top Issues</h3>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topIssuesData} margin={{ top: 10, right: 20, left: 0, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,101,30,0.08)" />
              <XAxis
                dataKey="name"
                angle={-35}
                textAnchor="end"
                height={70}
                tick={axisStyle}
                axisLine={{ stroke: 'rgba(180,101,30,0.15)' }}
                tickLine={false}
              />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(180,101,30,0.05)' }} />
              <Bar dataKey="issues" fill="#B4651E" name="Issues Reported" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Problematic Locations Pie Chart */}
      <div style={chartCard}>
        <h3 style={chartTitle}>Problematic Locations</h3>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={locationsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                }
                outerRadius={110}
                dataKey="count"
              >
                {locationsData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Marshal Activity Horizontal Bar */}
      <div style={chartCard}>
        <h3 style={chartTitle}>Marshal Activity</h3>
        <div style={{ height: '280px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={marshalData} layout="vertical" margin={{ left: 120, right: 20, top: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,101,30,0.08)" horizontal={false} />
              <XAxis type="number" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                dataKey="name"
                type="category"
                width={110}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(180,101,30,0.05)' }} />
              <Bar dataKey="submissions" fill="#1e2d3d" name="Submissions" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trend Over Time Line Chart */}
      {data.trend.length > 0 && (
        <div style={chartCard}>
          <h3 style={chartTitle}>Trend Over Time</h3>
          <div style={{ height: '280px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,101,30,0.08)" />
                <XAxis dataKey="date" tick={axisStyle} axisLine={{ stroke: 'rgba(180,101,30,0.15)' }} tickLine={false} />
                <YAxis tick={axisStyle} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="#B4651E"
                  strokeWidth={2.5}
                  dot={{ fill: '#B4651E', strokeWidth: 0, r: 3 }}
                  activeDot={{ r: 5 }}
                  name="Total Issues"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}