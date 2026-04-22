'use client'
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip } from 'recharts'

type Props = { rows: string[][] }

export default function TrafficTrendChart({ rows }: Props) {
  const visitors = rows.map(r => ({ day: r[0].substring(0, 3), value: parseInt(r[1]) || 0 }))
  const leads = rows.map(r => ({ day: r[0].substring(0, 3), value: parseInt(r[2]) || 0 }))

  // Merge into indexed data for scatter
  const vData = visitors.map((v, i) => ({ x: i, y: v.value, day: v.day }))
  const lData = leads.map((l, i) => ({ x: i, y: l.value, day: l.day }))

  const days = visitors.map(v => v.day)
  const maxVal = Math.max(...visitors.map(v => v.value), ...leads.map(l => l.value), 1)

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.15} />
        <XAxis
          type="number"
          dataKey="x"
          domain={[-0.5, days.length - 0.5]}
          ticks={days.map((_, i) => i)}
          tickFormatter={(i: number) => days[i] || ''}
          name="Day"
        />
        <YAxis type="number" dataKey="y" domain={[0, Math.ceil(maxVal * 1.2)]} name="Count" />
        <Tooltip
          content={({ payload }) => {
            if (!payload?.length) return null
            const p = payload[0].payload
            return (
              <div className="bg-white border border-gray-200 rounded px-3 py-2 text-xs shadow">
                <div className="font-medium">{days[p.x]}</div>
                {payload.map((entry: any, i: number) => (
                  <div key={i} style={{ color: entry.fill }}>{entry.name}: {entry.payload.y}</div>
                ))}
              </div>
            )
          }}
        />
        <Legend />
        <Scatter name="Visitors" data={vData} fill="#000000" r={6} />
        <Scatter name="Leads" data={lData} fill="#EF4444" r={5} />
      </ScatterChart>
    </ResponsiveContainer>
  )
}
