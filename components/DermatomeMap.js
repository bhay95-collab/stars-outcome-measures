import { useEffect, useRef } from 'react'
import { ISNCSCI_LEVELS } from '../lib/clinical'

function scoreToStr(v) {
  const s = String(v || '').toUpperCase()
  if (!v || v === '' || s.startsWith('NT')) return ''
  return v
}

export default function DermatomeMap({ ltR, ltL, ppR, ppL }) {
  const ref = useRef(null)

  useEffect(() => { import('isncsci-ui') }, [])

  useEffect(() => {
    if (!ref.current) return
    ISNCSCI_LEVELS.forEach(lv => {
      const key = lv.toLowerCase().replace(/-/g, '_')
      ref.current.setAttribute(`right-${key}`, `${scoreToStr(ltR[lv])}-${scoreToStr(ppR[lv])}`)
      ref.current.setAttribute(`left-${key}`,  `${scoreToStr(ltL[lv])}-${scoreToStr(ppL[lv])}`)
    })
  }, [ltR, ltL, ppR, ppL])

  return <praxis-isncsci-key-points-diagram ref={ref} />
}
