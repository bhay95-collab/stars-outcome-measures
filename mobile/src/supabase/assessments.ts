import { supabase } from './client';
import type { Assessment } from '../types/domain';

function mapAssessmentReadError(code: string | undefined): string {
  if (code === '42501') {
    return 'Unable to load assessment history. Please check your access and try again.';
  }

  return 'Unable to load assessment history. Please try again.';
}

export async function getAssessmentsForPatient(patientId: string): Promise<Assessment[]> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || !session) throw new Error('Your session has expired. Please sign in again.');

  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('patient_id', patientId)
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) throw new Error(mapAssessmentReadError(error.code));
  return (data ?? []) as Assessment[];
}

export interface SavePayload {
  patient_id: string;
  measure: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
}

const inFlightSaveKeys = new Set<string>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeForSignature(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(normalizeForSignature);
  }

  if (isRecord(value)) {
    return Object.keys(value)
      .sort()
      .reduce<Record<string, unknown>>((acc, key) => {
        acc[key] = normalizeForSignature(value[key]);
        return acc;
      }, {});
  }

  return value;
}

function stableStringify(value: unknown): string {
  return JSON.stringify(normalizeForSignature(value));
}

function resultsWithoutEncounterDate(results: Record<string, unknown>): Record<string, unknown> {
  const meta = results.meta;

  if (!isRecord(meta) || !Object.prototype.hasOwnProperty.call(meta, 'encounterDate')) {
    return results;
  }

  const nextMeta = { ...meta };
  delete nextMeta.encounterDate;

  return {
    ...results,
    meta: nextMeta,
  };
}

function buildInFlightSaveKey(payload: SavePayload): string {
  return stableStringify({
    patient_id: payload.patient_id,
    measure: payload.measure,
    inputs: payload.inputs,
    results: resultsWithoutEncounterDate(payload.results),
  });
}

function mapInsertError(code: string | undefined): string {
  switch (code) {
    case '42501':  // RLS / insufficient_privilege
      return 'Unable to save. Please check your access and try again.';
    case '23503':  // foreign_key_violation — patient_id not found
      return 'Patient record not found. Please go back and try again.';
    case '23505':  // unique_violation
      return 'This result has already been saved.';
    default:
      return 'Unable to save result. Please try again.';
  }
}

export async function saveAssessment(payload: SavePayload): Promise<void> {
  const saveKey = buildInFlightSaveKey(payload);
  if (inFlightSaveKeys.has(saveKey)) return;

  inFlightSaveKeys.add(saveKey);

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session) {
      throw new Error('Your session has expired. Please sign in again.');
    }

    const { error } = await supabase
      .from('assessments')
      .insert({
        user_id: session.user.id,
        ...payload,
      });

    if (error) {
      throw new Error(mapInsertError(error.code));
    }
  } finally {
    inFlightSaveKeys.delete(saveKey);
  }
}
