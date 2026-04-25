import { MEASURES } from '../lib/clinical'

function fmtDateShort(iso) {
  return new Date(iso).toLocaleDateString('en-AU', { day: '2-digit', month: 'short' })
}

const W = 540
const H = 180
const PAD = { top: 20, right: 20, bottom: 36, left: 48 }
const INNER_W = W - PAD.left - PAD.right
const INNER_H = H - PAD.top - PAD.bottom

export default function ProgressChart({ data, measureId }) {
  const chart = MEASURES[measureId]?.chart
  if (!chart || data.length < 2) return null

  const { yMin, yMax, thresholds } = chart

  function toX(i) {
    return PAD.left + (i / (data.length - 1)) * INNER_W
  }

  function toY(v) {
    return PAD.top + INNER_H - ((v - yMin) / (yMax - yMin)) * INNER_H
  }

  const points = data.map((d, i) => `${toX(i)},${toY(d.value)}`).join(' ')

  return (
    <>
      <style jsx>{styles}</style>
      <div className="chart-wrap">
        <svg viewBox={`0 0 ${W} ${H}`} className="chart-svg" aria-hidden="true">
          {thresholds.map(t => (
            <line
              key={t.label}
              x1={PAD.left}
              x2={W - PAD.right}
              y1={toY(t.value)}
              y2={toY(t.value)}
              stroke={t.color}
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.6"
            />
          ))}

          <line
            x1={PAD.left} y1={PAD.top}
            x2={PAD.left} y2={PAD.top + INNER_H}
            style={{ stroke: 'var(--color-border)' }} strokeWidth="1"
          />
          <line
            x1={PAD.left} y1={PAD.top + INNER_H}
            x2={W - PAD.right} y2={PAD.top + INNER_H}
            style={{ stroke: 'var(--color-border)' }} strokeWidth="1"
          />

          <text x={PAD.left - 6} y={toY(yMax)} fontSize="10" style={{ fill: 'var(--color-subtle)' }} textAnchor="end" dominantBaseline="middle">{yMax}</text>
          <text x={PAD.left - 6} y={toY(yMin)} fontSize="10" style={{ fill: 'var(--color-subtle)' }} textAnchor="end" dominantBaseline="middle">{yMin}</text>
          <text
            fontSize="9"
            style={{ fill: 'var(--color-subtle)' }}
            textAnchor="middle"
            transform={`rotate(-90,${PAD.left - 28},${PAD.top + INNER_H / 2})`}
          >
            m/s
          </text>

          <polyline
            points={points}
            fill="none"
            style={{ stroke: 'var(--color-primary)' }}
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {data.map((d, i) => (
            <g key={i}>
              <circle cx={toX(i)} cy={toY(d.value)} r="4" style={{ fill: 'var(--color-primary)', stroke: 'var(--color-surface)' }} strokeWidth="2" />
              <text x={toX(i)} y={toY(d.value) - 10} fontSize="10" style={{ fill: 'var(--color-ink)' }} textAnchor="middle" fontWeight="600">
                {d.value.toFixed(2)}
              </text>
              <text x={toX(i)} y={PAD.top + INNER_H + 16} fontSize="10" style={{ fill: 'var(--color-subtle)' }} textAnchor="middle">
                {fmtDateShort(d.date)}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </>
  )
}

const styles = `
  .chart-wrap {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 16px 8px 8px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 16px;
  }

  .chart-svg {
    width: 100%;
    height: auto;
    display: block;
  }
`
