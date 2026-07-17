import React from 'react';
// @ts-ignore — JS clinical module, no type declarations
import { calcLEFS, LEFS_ITEMS, LEFS_OPTIONS } from '@clinical/lefs';
import { FunctionalQuestionnaireForm } from './FunctionalQuestionnaireForm';

export function LEFSForm({ patientId }: { patientId: string }) {
  return (
    <FunctionalQuestionnaireForm
      patientId={patientId}
      measureId="LEFS"
      title="Lower Extremity Functional Scale"
      resultLabel="LEFS RESULT"
      items={LEFS_ITEMS}
      options={LEFS_OPTIONS}
      maxTotal={80}
      scaleTitle="DIFFICULTY SCALE"
      prompt="Today, do you or would you have any difficulty with these activities?"
      infoText="LEFS: 20 items, each 0 (extreme difficulty or unable) to 4 (no difficulty). Total /80, higher is better. MCID and MDC90 are approximately 9 points."
      calc={calcLEFS}
    />
  );
}
