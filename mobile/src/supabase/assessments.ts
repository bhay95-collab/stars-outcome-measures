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
