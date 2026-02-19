'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { Users, TrendingUp } from 'lucide-react'

interface MarshalActivityData {
  date: string
  unique_count: number
  total_submissions: number
}

interface MarshalActivityChartProps {
  data: MarshalActivityData[]
}

export default function MarshalActivityChart({ data }: MarshalActivityChartProps) {
  const chartData = data.map(item => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-IN', {
      month: 'short', day: 'numeric',
    }),
  }))

  const avgMarshals = data.length
    ? Math.round(data.reduce((sum, d) => sum + d.unique_count, 0) / data.length)
    : 0
  const peakMarshals = data.length ? Math.max(...data.map(d => d.unique_count)) : 0

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
        <Users size={18} color="#B4651E" />
        <h3 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: '1.1rem', fontWeight: '600',
          color: '#1a1208', margin: 0,
        }}>
          Daily Marshal Activity
        </h3>
      </div>

      {/* Chart */}
      <div style={{ height: '280px', marginBottom: '20px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(180,101,30,0.08)" />
            <XAxis
              dataKey="displayDate"
              angle={-35}
              textAnchor="end"
              height={60}
              tick={{ fontSize: 11, fill: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}
              axisLine={{ stroke: 'rgba(180,101,30,0.15)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#7a6a55', fontFamily: "'DM Sans', sans-serif" }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255,252,247,0.98)',
                border: '1px solid rgba(180,101,30,0.2)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: '0.82rem',
              }}
              labelStyle={{ fontWeight: '700', color: '#1a1208', marginBottom: '4px' }}
              formatter={(value, name) => [
                value ?? 0,
                name === 'unique_count' ? 'Active Marshals' : 'Total Submissions',
              ]}
            />
            <Line
              type="monotone"
              dataKey="unique_count"
              stroke="#B4651E"
              strokeWidth={2.5}
              dot={{ fill: '#B4651E', strokeWidth: 0, r: 3 }}
              activeDot={{ r: 5, fill: '#B4651E' }}
              name="unique_count"
            />
            <Line
              type="monotone"
              dataKey="total_submissions"
              stroke="rgba(180,101,30,0.25)"
              strokeWidth={1.5}
              strokeDasharray="5 5"
              dot={false}
              name="total_submissions"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180,101,30,0.12)',
          borderRadius: '12px',
          padding: '14px 16px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: '600', color: '#7a6a55',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif",
          }}>
            Avg. Daily Marshals
          </p>
          <p style={{
            fontSize: '1.75rem', fontWeight: '800', color: '#B4651E',
            margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
          }}>
            {avgMarshals}
          </p>
        </div>
        <div style={{
          backgroundColor: '#fdf6ef',
          border: '1px solid rgba(180,101,30,0.12)',
          borderRadius: '12px',
          padding: '14px 16px',
          textAlign: 'center',
        }}>
          <p style={{
            fontSize: '0.72rem', fontWeight: '600', color: '#7a6a55',
            textTransform: 'uppercase', letterSpacing: '0.06em',
            margin: '0 0 6px', fontFamily: "'DM Sans', sans-serif",
          }}>
            Peak Activity
          </p>
          <p style={{
            fontSize: '1.75rem', fontWeight: '800', color: '#1e2d3d',
            margin: 0, fontFamily: "'DM Sans', sans-serif", lineHeight: 1,
          }}>
            {peakMarshals}
          </p>
        </div>
      </div>
    </div>
  )
}