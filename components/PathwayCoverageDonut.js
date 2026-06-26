import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'

const RECORDED_COLOR = '#094b8a'
const MISSING_COLOR = '#e2e8f0'
const DUE_COLOR = '#f59e0b'

function DonutTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #d1d9e6',
      borderRadius: 7,
      padding: '7px 11px',
      fontSize: 12,
      boxShadow: '0 4px 14px rgba(28,43,54,0.10)',
    }}>
      <strong>{payload[0].name}</strong>: {payload[0].value} measure{payload[0].value !== 1 ? 's' : ''}
    </div>
  )
}

export default function PathwayCoverageDonut({ pathway, onMeasure }) {
  if (!pathway) return null

  const recorded = pathway.recordedMeasures ?? []
  const missing = pathway.missingMeasures ?? []
  const due = pathway.dueMeasures ?? []
  const total = recorded.length + missing.length
  if (total === 0) return null

  const pieData = [
    { name: 'Recorded', value: recorded.length, color: RECORDED_COLOR },
    ...(due.length ? [{ name: 'Due for reassessment', value: due.length, color: DUE_COLOR }] : []),
    ...(missing.length ? [{ name: 'Not yet recorded', value: missing.length, color: MISSING_COLOR }] : []),
  ]

  const pct = pathway.coveragePercent ?? 0

  return (
    <div className="pathway-coverage-donut">
      <div className="pcd-header">
        <h3>Smart Pathway Coverage</h3>
        <p>Tap a missing measure to record it</p>
      </div>

      <div className="pcd-body">
        <div className="pcd-chart-wrap">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={72}
                startAngle={90}
                endAngle={-270}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<DonutTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pcd-centre-label">
            <strong>{pct}%</strong>
            <span>complete</span>
          </div>
        </div>

        <div className="pcd-lists">
          {recorded.length > 0 && (
            <div className="pcd-list pcd-list--recorded">
              <span className="pcd-list-label">Recorded</span>
              {recorded.map(item => (
                <button key={item.id} type="button" className="pcd-item pcd-item--recorded" onClick={() => onMeasure(item.id)}>
                  <span className="pcd-dot pcd-dot--recorded" />
                  <span className="pcd-item-name">{item.name}</span>
                  {item.lastRecordedLabel && <em>{item.lastRecordedLabel}</em>}
                </button>
              ))}
            </div>
          )}

          {due.length > 0 && (
            <div className="pcd-list pcd-list--due">
              <span className="pcd-list-label">Due for reassessment</span>
              {due.map(item => (
                <button key={item.id} type="button" className="pcd-item pcd-item--due" onClick={() => onMeasure(item.id)}>
                  <span className="pcd-dot pcd-dot--due" />
                  <span className="pcd-item-name">{item.name}</span>
                  <em>+ Record</em>
                </button>
              ))}
            </div>
          )}

          {missing.length > 0 && (
            <div className="pcd-list pcd-list--missing">
              <span className="pcd-list-label">Not yet recorded</span>
              {missing.map(item => (
                <button key={item.id} type="button" className="pcd-item pcd-item--missing" onClick={() => onMeasure(item.id)}>
                  <span className="pcd-dot pcd-dot--missing" />
                  <span className="pcd-item-name">{item.name}</span>
                  <em>+ Record</em>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
