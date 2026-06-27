import KoosFamilyForm from './KoosFamilyForm'
import { calcHAGOS, HAGOS_SECTIONS } from '../lib/clinical'

export default function FormHAGOS({ onSubmit, loading }) {
  return (
    <KoosFamilyForm
      sections={HAGOS_SECTIONS}
      calc={calcHAGOS}
      measureName="Copenhagen Hip and Groin Outcome Score"
      infoText={
        <>
          <strong>HAGOS (Thorborg 2011, koos.nu family):</strong>{' '}
          37 items over the last week; 6 subscales each scored 0–100
          (100 = no problems) and never totalled. HAGOS has no anchored MCID —
          interpret change against each subscale&apos;s minimal detectable change
          (individual MDC ≈ 18–34 points; Groen 2017). Up to 2 unanswered items
          per subscale are tolerated.
        </>
      }
      onSubmit={onSubmit}
      loading={loading}
    />
  )
}
