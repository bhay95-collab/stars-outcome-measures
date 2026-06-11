import KoosFamilyForm from './KoosFamilyForm'
import { calcKOOS, KOOS_SECTIONS } from '../lib/clinical'

export default function FormKOOS({ onSubmit, loading }) {
  return (
    <KoosFamilyForm
      sections={KOOS_SECTIONS}
      calc={calcKOOS}
      measureName="Knee Injury and Osteoarthritis Outcome Score"
      infoText={
        <>
          <strong>KOOS (Roos 1998, koos.nu):</strong>{' '}
          42 items over the last week; 5 subscales each scored 0–100
          (100 = no problems) and never totalled. MCID ≈ 8–10 points per subscale
          (knee OA); post-ACL reconstruction Sport/Rec 12.1 and QOL 18.3 (Ingelsrud 2018).
          Up to 2 unanswered items per subscale are tolerated.
        </>
      }
      onSubmit={onSubmit}
      loading={loading}
    />
  )
}
