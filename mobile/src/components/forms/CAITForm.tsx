import React from 'react';
// @ts-ignore - JS clinical module, no type declarations
import { calcCAIT, CAIT_ITEMS } from '@clinical/cait';
import { WeightedQuestionnaireForm } from './WeightedQuestionnaireForm';

export function CAITForm({ patientId }: { patientId: string }) {
  return (
    <WeightedQuestionnaireForm
      patientId={patientId}
      measureId="CAIT"
      title="Cumberland Ankle Instability Tool"
      resultLabel="CAIT RESULT"
      items={CAIT_ITEMS}
      maxTotal={30}
      prompt="Score one ankle per assessment. Choose the response that best describes pain or instability for the affected ankle."
      infoText="CAIT: 9 items, total /30, higher is more stable. Functional ankle instability is indicated by 27 or lower in the original cut-off, with 25 or lower used in the later recalibration. Change of about 3 points exceeds measurement error."
      calc={calcCAIT}
    />
  );
}
