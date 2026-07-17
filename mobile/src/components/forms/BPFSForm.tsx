import React from 'react';
// @ts-ignore — JS clinical module, no type declarations
import { calcBPFS, BPFS_ITEMS, BPFS_OPTIONS } from '@clinical/bpfs';
import { FunctionalQuestionnaireForm } from './FunctionalQuestionnaireForm';

export function BPFSForm({ patientId }: { patientId: string }) {
  return (
    <FunctionalQuestionnaireForm
      patientId={patientId}
      measureId="BPFS"
      title="Back Pain Functional Scale"
      resultLabel="BPFS RESULT"
      items={BPFS_ITEMS}
      options={BPFS_OPTIONS}
      maxTotal={60}
      scaleTitle="DIFFICULTY SCALE"
      prompt="Because of your back, do you have any difficulty with these activities?"
      infoText="BPFS: 12 items, each 0 (unable) to 5 (no difficulty). Total /60, higher is better. Change of at least 6.5 points exceeds measurement error."
      calc={calcBPFS}
    />
  );
}
