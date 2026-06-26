import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MEASURES } from '../lib/clinical/measures'
import { MCID_VALS } from '../lib/clinical/mcid'
import { fmtDate, toFiniteNumber } from '../lib/clinical/patientSummary'

function resolveThresh(mcidEntry, condition) {
  if (!mcidEntry || !condition || !mcidEntry.byCondition) return mcidEntry
  const condKey = Object.keys(mcidEntry.byCondition).find(
    k => k.toLowerCase() === condition.toLowerCase()
  )
  return condKey ? { ...mcidEntry, ...mcidEntry.byCondition[condKey] } : mcidEntry
}

function ChartTooltip({ active, payload, unit }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d9dacb',
      borderRadius: 7,
      padding: '8px 12px',
      fontSize: 11,
      boxShadow: '0 4px 14px rgba(28,43,54,0.10)',
      minWidth: 120,
    }}>
      <div style={{ color: '#69787a', marginBottom: 4, fontSize: 10 }}>{row.date}</div>
      <div style={{ fontWeight: 700, color: '#1c2b36', fontSize: 13 }}>
        {row.value} <span style={{ fontWeight: 400, color: '#69787a' }}>{unit}</span>
      </div>
      {row.label && (
        <div style={{ color: '#334b49', marginTop: 3, fontSize: 10 }}>{row.label}</div>
      )}
    </div>
  )
}

export default function MeasureTrendChart({ measureId, assessments, condition }) {
  const measure = MEASURES[measureId]
  if (!measure?.chart) return null

  const sorted = [...assessments].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  )
  const data = sorted
    .map(a => ({
      date: fmtDate(a.created_at),
      value: toFiniteNumber(a.results?.primaryValue),
      label: a.results?.interpretation ?? '',
    }))
    .filter(d => d.value != null)

  if (!data.length) return null

  const { yMin = 0, yMax = 100, thresholds = [] } = measure.chart
  const higherIsBetter = measure.higherIsBetter !== false

  // MCID goal: how far from MCID the patient needs to move from their latest value
  let mcidGoal = null
  if (measure.mcidKey) {
    const raw = MCID_VALS[measure.mcidKey]
    const resolved = resolveThresh(raw, condition)
    if (resolved) {
      const latest = data[data.length - 1].value
      const target = higherIsBetter
        ? latest + resolved.thresh
        : latest - resolved.thresh
      if (target >= yMin && target <= yMax) {
        mcidGoal = {
          value: parseFloat(target.toFixed(3)),
          thresh: resolved.thresh,
          unit: resolved.unit,
        }
      }
    }
  }

  const direction = higherIsBetter ? 'Higher is better' : 'Lower is better'

  return (
    <div className="measure-trend-chart">
      <div className="measure-trend-chart__header">
        <span className="measure-trend-chart__name">{measure.name}</span>
        <span className="measure-trend-chart__dir">{direction}</span>
      </div>
      <ResponsiveContainer width="100%" height={148}>
        <LineChart data={data} margin={{ top: 8, right: 10, bottom: 0, left: -14 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(0,0,0,0.05)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 9, fill: '#69787a' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 9, fill: '#69787a' }}
            tickLine={false}
            axisLine={false}
            width={36}
            tickFormatter={v => {
              if (Math.abs(v) >= 100) return Math.round(v)
              if (Number.isInteger(v)) return v
              return v.toFixed(1)
            }}
          />
          <Tooltip content={<ChartTooltip unit={measure.primaryUnit} />} />
          {thresholds.map((t, i) => (
            <ReferenceLine
              key={i}
              y={t.value}
              stroke={t.color}
              strokeWidth={1}
              strokeDasharray="5 3"
              opacity={0.7}
            />
          ))}
          {mcidGoal && (
            <ReferenceLine
              y={mcidGoal.value}
              stroke="#094b8a"
              strokeWidth={1.5}
              strokeDasharray="2 5"
              opacity={0.8}
            />
          )}
          <Line
            type="monotone"
            dataKey="value"
            stroke="#094b8a"
            strokeWidth={2}
            dot={{ r: 3.5, fill: '#094b8a', stroke: '#ffffff', strokeWidth: 2 }}
            activeDot={{ r: 5, fill: '#094b8a', stroke: '#ffffff', strokeWidth: 2 }}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="measure-trend-chart__legend">
        {thresholds.map((t, i) => (
          <span key={i} className="mtc-legend-item">
            <span className="mtc-legend-line" style={{ background: t.color }} />
            <span>{t.value}&nbsp;{measure.primaryUnit} — {t.label}</span>
          </span>
        ))}
        {mcidGoal && (
          <span className="mtc-legend-item">
            <span className="mtc-legend-dash" />
            <span>MCID goal: {mcidGoal.thresh}&nbsp;{mcidGoal.unit} from current</span>
          </span>
        )}
      </div>
    </div>
  )
}
