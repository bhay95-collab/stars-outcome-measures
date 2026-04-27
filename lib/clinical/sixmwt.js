// Six Minute Walk Test — clinical engine
// Input: { distance, age?, gender?, height?, weight? }
// distance in metres; height in cm; weight in kg
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

// Predicted distance formulas — Enright & Sherrill 1998
function predictedDistance(age, gender, height, weight) {
  if (!age || !gender || !height || !weight) return null
  if (gender === 'M') {
    return 7.57 * height - 5.02 * age - 1.76 * weight - 309
  }
  return 2.11 * height - 2.29 * weight - 5.78 * age + 667
}

function classify(distance) {
  if (distance >= 500) return { label: 'Excellent functional capacity', color: 'green' }
  if (distance >= 400) return { label: 'Good functional capacity',      color: 'green' }
  if (distance >= 300) return { label: 'Fair functional capacity',      color: 'amber' }
  return                { label: 'Limited functional capacity',          color: 'red'   }
}

export function calc6MWT({ distance, age, gender, height, weight }) {
  const d = Number(distance)
  if (!d || d <= 0) return null

  const { label, color } = classify(d)
  const predicted = predictedDistance(Number(age), gender, Number(height), Number(weight))
  const pctPredicted = predicted && predicted > 0
    ? Math.round((d / predicted) * 100)
    : null

  return {
    primaryValue: d,
    primaryUnit: 'm',
    interpretation: label,
    meta: {
      classColor: color,
      pctPredicted,
      predicted: predicted ? Math.round(predicted) : null,
    },
  }
}
