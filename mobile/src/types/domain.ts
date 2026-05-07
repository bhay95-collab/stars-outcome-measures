export interface Patient {
  id: string;
  user_id: string;
  initials: string;
  date_of_birth: string | null;
  condition: string | null;
}

export interface AssessmentResults {
  primaryValue: number | null;
  primaryUnit: string;
  interpretation: string;
  meta: Record<string, unknown>;
}

export interface Assessment {
  id: string;
  user_id: string;
  patient_id: string;
  measure: string;
  inputs: Record<string, unknown>;
  results: AssessmentResults;
  created_at: string;
}
