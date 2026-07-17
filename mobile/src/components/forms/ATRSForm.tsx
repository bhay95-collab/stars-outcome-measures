import React from 'react';
// @ts-ignore - JS clinical module, no type declarations
import { calcATRS, ATRS_ITEMS, ATRS_OPTIONS } from '@clinical/atrs';
import { FunctionalQuestionnaireForm } from './FunctionalQuestionnaireForm';

export function ATRSForm({ patientId }: { patientId: string }) {
  const items = (ATRS_ITEMS as string[]).map(label => ({ label }));

  return (
    <FunctionalQuestionnaireForm
      patientId={patientId}
      measureId="ATRS"
      title="Achilles Tendon Total Rupture Score"
      resultLabel="ATRS RESULT"
      items={items}
      options={ATRS_OPTIONS}
      maxTotal={100}
      scaleTitle="LIMITATION SCALE"
      prompt="For each item, rate limitation due to the injured Achilles tendon."
      infoText="ATRS: 10 items, each 0 (very limited) to 10 (no limitation). Total /100, higher is better. There are no formal severity bands; track the score and change over time."
      calc={calcATRS}
      wrapChoices
    />
  );
}
