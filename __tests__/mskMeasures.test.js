import { calcNPRS } from '../lib/clinical/nprs'
import { calcPSFS, getPreviousPSFSActivities } from '../lib/clinical/psfs'

describe('calcNPRS', () => {
  it('scores and bands pain ratings', () => {
    expect(calcNPRS({ score: 0 })).toMatchObject({ primaryValue: 0, primaryUnit: '/10', interpretation: 'No pain' })
    expect(calcNPRS({ score: 2 }).meta.classColor).toBe('green')
    expect(calcNPRS({ score: 5 }).interpretation).toBe('Moderate pain (4–6)')
    expect(calcNPRS({ score: 5 }).meta.classColor).toBe('amber')
    expect(calcNPRS({ score: 8 }).interpretation).toBe('Severe pain (7–10)')
    expect(calcNPRS({ score: 8 }).meta.classColor).toBe('red')
  })

  it('records the rating context', () => {
    expect(calcNPRS({ score: 4, context: 'worst24h' }).meta.contextLabel).toBe('Worst over last 24 hours')
    expect(calcNPRS({ score: 4 }).meta.context).toBe('current')
  })

  it('rejects out-of-range or non-integer scores', () => {
    expect(calcNPRS({ score: -1 })).toBeNull()
    expect(calcNPRS({ score: 11 })).toBeNull()
    expect(calcNPRS({ score: 4.5 })).toBeNull()
    expect(calcNPRS({ score: 'bad' })).toBeNull()
  })
})

describe('calcPSFS', () => {
  const activities = [
    { name: 'Lifting my child', score: 3 },
    { name: 'Walking the dog', score: 5 },
    { name: 'Sitting through a movie', score: 4 },
  ]

  it('averages nominated activity scores', () => {
    const result = calcPSFS({ activities })
    expect(result.primaryValue).toBe(4)
    expect(result.primaryUnit).toBe('/10')
    expect(result.meta.activities).toHaveLength(3)
  })

  it('rounds the mean to one decimal place', () => {
    const result = calcPSFS({ activities: [{ name: 'A', score: 3 }, { name: 'B', score: 4 }, { name: 'C', score: 4 }] })
    expect(result.primaryValue).toBe(3.7)
  })

  it('uses a neutral colour — no invented severity bands', () => {
    expect(calcPSFS({ activities }).meta.classColor).toBe('grey')
  })

  it('rejects invalid input', () => {
    expect(calcPSFS({ activities: [] })).toBeNull()
    expect(calcPSFS({ activities: Array(6).fill({ name: 'A', score: 5 }) })).toBeNull()
    expect(calcPSFS({ activities: [{ name: '  ', score: 5 }] })).toBeNull()
    expect(calcPSFS({ activities: [{ name: 'A', score: 11 }] })).toBeNull()
    expect(calcPSFS({ activities: [{ name: 'A', score: 2.5 }] })).toBeNull()
  })

  it('trims activity names in the saved meta', () => {
    const result = calcPSFS({ activities: [{ name: '  Gardening  ', score: 6 }] })
    expect(result.meta.activities[0].name).toBe('Gardening')
  })
})

describe('getPreviousPSFSActivities', () => {
  it('returns activities from the most recent PSFS assessment (list is newest first)', () => {
    const assessments = [
      { measure: 'TUG', created_at: '2026-06-10', inputs: { time: 12 } },
      { measure: 'PSFS', created_at: '2026-06-01', inputs: { activities: [{ name: 'Running', score: 4 }] } },
      { measure: 'PSFS', created_at: '2026-05-01', inputs: { activities: [{ name: 'Old activity', score: 2 }] } },
    ]
    const previous = getPreviousPSFSActivities(assessments)
    expect(previous).toEqual([{ name: 'Running', score: 4 }])
  })

  it('returns null when the patient has no PSFS history', () => {
    expect(getPreviousPSFSActivities([{ measure: 'TUG', inputs: {} }])).toBeNull()
    expect(getPreviousPSFSActivities([])).toBeNull()
    expect(getPreviousPSFSActivities()).toBeNull()
  })
})
