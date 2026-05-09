import { supabase } from './client';
import type { Assessment } from '../types/domain';

export async function getAssessmentsForPatient(patientId: string): Promise<Assessment[]> {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('patient_id', patientId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Assessment[];
}

export interface SavePayload {
  patient_id: string;
  measure: string;
  inputs: Record<string, unknown>;
  results: Record<string, unknown>;
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
}
