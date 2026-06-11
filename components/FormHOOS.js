import KoosFamilyForm from './KoosFamilyForm'
import { calcHOOS, HOOS_SECTIONS } from '../lib/clinical'

export default function FormHOOS({ onSubmit, loading }) {
  return (
    <KoosFamilyForm
      sections={HOOS_SECTIONS}
      calc={calcHOOS}
      measureName="Hip Disability and Osteoarthritis Outcome Score"
      infoText={
        <>
          <strong>HOOS (Nilsdotter 2003, koos.nu):</strong>{' '}
          40 items over the last week; 5 subscales each scored 0–100
          (100 = no problems) and never totalled. MCID ≈ 8–10 points per subscale
          (hip OA, conservative care); after total hip replacement substantially
          larger changes are typical (MCII Pain 24, QOL 17 — Paulsen 2014).
          Up to 2 unanswered items per subscale are tolerated.
        </>
      }
      onSubmit={onSubmit}
      loading={loading}
    />
  )
}
