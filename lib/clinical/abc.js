// Activities-specific Balance Confidence (ABC) Scale — clinical engine
// 16 items, each scored 0–100% → mean of all items
// Input: { items: [16 numbers] }
// Returns standard data contract: { primaryValue, primaryUnit, interpretation, meta }

export const ABC_ITEMS = [
  { label: 'Walk around the inside of your house'                              },
  { label: 'Walk up or down stairs'                                            },
  { label: 'Bend over and pick up a slipper from the front of a closet floor' },
  { label: 'Reach for a small can off a shelf at eye level'                   },
  { label: 'Stand on your tip toes and reach for something above your head'   },
  { label: 'Stand on a chair and reach for something'                         },
  { label: 'Sweep the floor'                                                  },
  { label: 'Walk outside the house to a car parked in the driveway'           },
  { label: 'Get into or out of a car'                                         },
  { label: 'Walk across a parking lot to the mall'                            },
  { label: 'Walk up or down a ramp'                                           },
  { label: 'Walk in a crowded mall where people rapidly walk past you'        },
  { label: 'Are bumped into by people as you walk through the mall'           },
  { label: 'Step onto or off an escalator while holding the railing'          },
  { label: 'Step onto or off an escalator while holding parcels'              },
  { label: 'Walk outside on icy sidewalks'                                    },
]

function classify(mean) {
  if (mean > 80)  return { label: 'High functioning (>80%) — lower fall risk',              color: 'green' }
  if (mean > 66)  return { label: 'Moderate functioning',                                   color: 'amber' }
  if (mean >= 50) return { label: 'Moderate–low functioning (50–66%) — elevated fall risk', color: 'amber' }
  return                 { label: 'Low functioning (<50%) — high fall risk',                color: 'red'   }
}

export function calcABC({ items }) {
  if (!Array.isArray(items) || items.length !== 16) return null
  if (items.some(v => !isFinite(v))) return null

  const mean = parseFloat((items.reduce((sum, v) => sum + v, 0) / 16).toFixed(1))
  const { label, color } = classify(mean)

  return {
    primaryValue: mean,
    primaryUnit: '%',
    interpretation: label,
    meta: { classColor: color },
  }
}
