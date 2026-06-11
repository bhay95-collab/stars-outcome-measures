// Patient Specific Functional Scale (PSFS) — clinical engine
// Patient nominates up to 5 important activities they have difficulty with;
// each rated 0 (unable to perform) to 10 (able to perform at pre-injury level).
// Total = mean of nominated activity scores (Stratford et al. 1995, Physiotherapy Canada).
// No severity bands by design — interpret via change: MCID ≈ 2 pts average score
// (cervical radiculopathy 2.2, Cleland 2006; upper limb 1.2, Hefford 2012;
//  knee ~2.0–2.3, Chatman 1997). MDC 1.0–2.5 by region.
// At reassessment the ORIGINAL activities must be re-rated — swapping
// activities mid-episode makes scores non-comparable.
// Input: { activities: [{ name: string, score: 0–10 }] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const PSFS_MAX_ACTIVITIES = 5
export const PSFS_RECOMMENDED_ACTIVITIES = 3

export function calcPSFS({ activities }) {
  if (!Array.isArray(activities)) return null
  if (activities.length < 1 || activities.length > PSFS_MAX_ACTIVITIES) return null

  for (const activity of activities) {
    if (!activity || typeof activity.name !== 'string' || !activity.name.trim()) return null
    const score = Number(activity.score)
    if (!Number.isInteger(score) || score < 0 || score > 10) return null
  }

  const mean = activities.reduce((sum, activity) => sum + Number(activity.score), 0) / activities.length
  const value = parseFloat(mean.toFixed(1))

  return {
    primaryValue: value,
    primaryUnit: '/10',
    interpretation: `Average ability ${value}/10 across ${activities.length} patient-nominated activit${activities.length === 1 ? 'y' : 'ies'}`,
    // No published severity bands — colour stays neutral; meaning comes from change vs MCID.
    meta: {
      classColor: 'grey',
      activities: activities.map(activity => ({
        name: activity.name.trim(),
        score: Number(activity.score),
      })),
    },
  }
}

/**
 * Pull the activity list from a patient's most recent PSFS assessment so the
 * same activities are re-rated at follow-up.
 *
 * @param {Array<{ measure: string, created_at: string, inputs?: object }>} assessments - newest first
 * @returns {Array<{ name: string, score: number }> | null}
 */
export function getPreviousPSFSActivities(assessments = []) {
  const previous = assessments.find(item => item?.measure === 'PSFS')
  const activities = previous?.inputs?.activities
  if (!Array.isArray(activities) || !activities.length) return null
  return activities
    .filter(activity => activity && typeof activity.name === 'string' && activity.name.trim())
    .map(activity => ({ name: activity.name.trim(), score: Number(activity.score) }))
}
