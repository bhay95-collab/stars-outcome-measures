import React from 'react';
// @ts-ignore - JS clinical module, no type declarations
import { calcOMAS, OMAS_ITEMS } from '@clinical/omas';
import { WeightedQuestionnaireForm } from './WeightedQuestionnaireForm';

export function OMASForm({ patientId }: { patientId: string }) {
  return (
    <WeightedQuestionnaireForm
      patientId={patientId}
      measureId="OMAS"
      title="Olerud-Molander Ankle Score"
      resultLabel="OMAS RESULT"
      items={OMAS_ITEMS}
      maxTotal={100}
      prompt="Rate ankle fracture recovery across pain, symptoms, mobility, support use, and work or activity level."
      infoText="OMAS: 9 weighted items, total /100, higher is better. Bands are poor 0-30, fair 31-60, good 61-90, and excellent 91-100. Anchored MCID is approximately 12.5 points."
      calc={calcOMAS}
    />
  );
}
