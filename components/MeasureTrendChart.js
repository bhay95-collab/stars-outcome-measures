import { useState } from 'react'
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { MEASURES } from '../lib/clinical/measures'
import { MCID_VALS } from '../lib/clinical/mcid'
import { fmtDate, toFiniteNumber } from '../lib/clinical/patientSummary'

const SERIES_PALETTE = ['#094b8a', '#0891b2', '#7c3aed']

function resolveThresh(mcidEntry, condition) {
  if (!mcidEntry || !condition || !mcidEntry.byCondition) return mcidEntry
  const condKey = Object.keys(mcidEntry.byCondition).find(
    k => k.toLowerCase() === condition.toLowerCase()
  )
  return condKey ? { ...mcidEntry, ...mcidEntry.byCondition[condKey] } : mcidEntry
}

// Each zone between adjacent boundaries gets the color of the threshold at the upper edge.
function buildZones(thresholds, yMin, yMax) {
  if (!thresholds?.length) return []
  const sorted = [...thresholds].sort((a, b) => a.value - b.value)
  const inner = sorted.filter(t => t.value > yMin && t.value < yMax)
  const bounds = [yMin, ...inner.map(t => t.value), yMax]
  return bounds.slice(0, -1).map((y1, i) => {
    const y2 = bounds[i + 1]
    const thresh = sorted.find(t => t.value >= y2) ?? sorted[sorted.length - 1]
    return { y1, y2, color: thresh.color }
  })
}

function ChartTooltip({ active, payload, allSeries }) {
  if (!active || !payload?.length) return null
  const row = payload[0].payload
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d1d9e6',
      borderRadius: 7,
      padding: '8px 12px',
      fontSize: 11,
      boxShadow: '0 4px 14px rgba(28,43,54,0.10)',
      minWidth: 130,
    }}>
      <div style={{ color: '#69787a', marginBottom: 5, fontSize: 10 }}>{row.date}</div>
      {allSeries.map(s => {
        const v = row[s.key]
        if (v == null) return null
        return (
          <div key={s.key} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 3 }}>
            <span style={{ color: s.color, fontWeight: 600 }}>{s.label}</span>
            <span style={{ fontWeight: 700, color: '#1c2b36' }}>
              {v} <span style={{ fontWeight: 400, color: '#69787a' }}>{s.unit}</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

const TYPE_ICONS = {
  line: (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path d="M1 8C3 5 5 3 7 5C9 7 11 2 13 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  area: (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path d="M1 8C3 5 5 3 7 5C9 7 11 2 13 2L13 9L1 9Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="currentColor" fillOpacity="0.22" />
    </svg>
  ),
  bar: (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <rect x="1" y="5" width="3" height="4" rx="1" fill="currentColor" />
      <rect x="5.5" y="3" width="3" height="6" rx="1" fill="currentColor" />
      <rect x="10" y="1" width="3" height="8" rx="1" fill="currentColor" />
    </svg>
  ),
}

export default function MeasureTrendChart({ measureId, assessments, condition }) {
  const [chartType, setChartType] = useState('line')

  const measure = MEASURES[measureId]
  if (!measure?.chart) return null

  const subscales = measure.subscales ?? []
  const hasSubscales = subscales.length > 0

  const allSeries = [
    {
      key: 'primary',
      label: measure.primaryLabel ?? measure.name,
      unit: measure.primaryUnit,
      color: SERIES_PALETTE[0],
    },
    ...subscales.map((s, i) => ({
      key: s.key,
      label: s.label,
      unit: s.unit ?? measure.primaryUnit,
      color: SERIES_PALETTE[i + 1] ?? '#64748b',
    })),
  ]

  const sorted = [...assessments].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))

  const data = sorted
    .map(a => {
      const point = { date: fmtDate(a.created_at) }
      point.primary = toFiniteNumber(a.results?.primaryValue)
      for (const s of subscales) {
        point[s.key] = toFiniteNumber(a.results?.meta?.[s.key])
      }
      return point
    })
    .filter(d => allSeries.some(s => d[s.key] != null))

  if (!data.length) return null

  const { yMin = 0, yMax = 100, thresholds = [] } = measure.chart
  const higherIsBetter = measure.higherIsBetter !== false
  const zones = buildZones(thresholds, yMin, yMax)

  let mcidGoal = null
  if (measure.mcidKey) {
    const raw = MCID_VALS[measure.mcidKey]
    const resolved = resolveThresh(raw, condition)
    if (resolved) {
      const latest = data[data.length - 1].primary
      if (latest != null) {
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
  }

  const direction = higherIsBetter ? 'Higher is better' : 'Lower is better'
  const chartTypes = hasSubscales ? ['line', 'bar'] : ['line', 'area', 'bar']

  const yTickFmt = v => {
    if (Math.abs(v) >= 100) return Math.round(v)
    if (Number.isInteger(v)) return v
    return v.toFixed(1)
  }

  return (
    <div className="measure-trend-chart">
      <div className="measure-trend-chart__header">
        <span className="measure-trend-chart__name">{measure.name}</span>
        <div className="mtc-header-right">
          <div className="mtc-type-switcher" role="radiogroup" aria-label="Chart type">
            {chartTypes.map(t => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={chartType === t}
                aria-label={t.charAt(0).toUpperCase() + t.slice(1) + ' chart'}
                title={t.charAt(0).toUpperCase() + t.slice(1) + ' chart'}
                className={`mtc-type-btn${chartType === t ? ' mtc-type-btn--active' : ''}`}
                onClick={() => setChartType(t)}
              >
                {TYPE_ICONS[t]}
              </button>
            ))}
          </div>
          <span className="measure-trend-chart__dir">{direction}</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <ComposedChart data={data} margin={{ top: 10, right: 14, bottom: 4, left: -10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />

          {zones.map((z, i) => (
            <ReferenceArea key={i} y1={z.y1} y2={z.y2} fill={z.color} fillOpacity={0.07} strokeOpacity={0} />
          ))}

          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: '#69787a' }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fontSize: 11, fill: '#69787a' }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickFormatter={yTickFmt}
          />
          <Tooltip content={<ChartTooltip allSeries={allSeries} />} />

          {mcidGoal && (
            <ReferenceLine
              y={mcidGoal.value}
              stroke="#094b8a"
              strokeWidth={2}
              strokeDasharray="3 5"
              opacity={0.85}
            />
          )}

          {allSeries.map(s => {
            if (chartType === 'bar') {
              return (
                <Bar
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  fill={s.color}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              )
            }
            if (chartType === 'area') {
              return (
                <Area
                  key={s.key}
                  dataKey={s.key}
                  name={s.label}
                  type="monotoneX"
                  stroke={s.color}
                  strokeWidth={2.5}
                  fill={s.color}
                  fillOpacity={0.1}
                  dot={{ r: 5, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                  connectNulls={!hasSubscales}
                />
              )
            }
            return (
              <Line
                key={s.key}
                dataKey={s.key}
                name={s.label}
                type="monotoneX"
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 5, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                activeDot={{ r: 7, fill: s.color, stroke: '#ffffff', strokeWidth: 2 }}
                connectNulls={!hasSubscales}
              />
            )
          })}
        </ComposedChart>
      </ResponsiveContainer>

      <div className="measure-trend-chart__legend">
        {thresholds.map((t, i) => (
          <span key={i} className="mtc-legend-item">
            <span className="mtc-legend-zone" style={{ background: t.color }} />
            <span>{t.label}</span>
          </span>
        ))}
        {mcidGoal && (
          <span className="mtc-legend-item">
            <span className="mtc-legend-dash" />
            <span>MCID goal: {mcidGoal.thresh}&nbsp;{mcidGoal.unit} from current</span>
          </span>
        )}
        {hasSubscales && allSeries.map(s => (
          <span key={s.key} className="mtc-legend-item mtc-legend-item--series">
            <span className="mtc-legend-line" style={{ background: s.color }} />
            <span>{s.label}</span>
          </span>
        ))}
      </div>
    </div>
  )
}
