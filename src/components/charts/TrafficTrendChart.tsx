'use client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts'

type Props = { rows: string[][] }

export default function TrafficTrendChart({ rows }: Props) {
  const data = rows.map(r => {
    const raw = r[0] || ''
    // Format: "2026-04-29" → "Apr 29", day name "Monday" → "Mon"
    let label = raw
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const d = new Date(raw + 'T00:00:00')
      label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (raw.length > 3) {
      label = raw.substring(0, 3)
    }
    return { day: label, sessions: parseInt(r[1]) || 0, leads: parseInt(r[2]) || 0 }
  })

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="sessions" stroke="#000000" strokeWidth={2} dot={{ r: 4 }} name="Sessions" />
        <Line type="monotone" dataKey="leads" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Leads" />
      </LineChart>
    </ResponsiveContainer>
  )
}
