import { supabase } from './client';
import type { Patient } from '../types/domain';

type PatientGender = 'M' | 'F' | 'Other';

export interface CreatePatientInput {
  firstName: string;
  lastInitial: string;
  dob: string;
  diagnosis?: string | null;
  gender?: PatientGender | null;
}

export interface UpdatePatientInput {
  initials: string;
  dob: string | null;
  dob_year: number | null;
  gender: PatientGender | null;
  diagnosis: string | null;
}

function mapPatientWriteError(code: string | undefined): string {
  switch (code) {
    case '42501':
      return 'Unable to create patient. Please check your access and try again.';
    case '23502':
      return 'Please complete the required patient details.';
    default:
      return 'Unable to create patient. Please try again.';
  }
}

function mapPatientReadError(scope: 'list' | 'detail', code: string | undefined): string {
  if (code === '42501') {
    return 'Unable to load patient data. Please check your access and try again.';
  }

  return scope === 'list'
    ? 'Unable to load patients. Please try again.'
    : 'Unable to load patient data. Please try again.';
}

function isValidDOB(dob: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
}

export async function listPatients(): Promise<Patient[]> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('initials', { ascending: true });

  if (error) throw new Error(mapPatientReadError('list', error.code));
  return (data ?? []) as Patient[];
}

export async function getPatient(id: string): Promise<Patient | null> {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw new Error(mapPatientReadError('detail', error.code));
  return data as Patient | null;
}

export async function createPatient(input: CreatePatientInput): Promise<void> {
  const firstName = input.firstName.trim();
  const lastInitial = input.lastInitial.trim().toUpperCase();
  const dob = input.dob.trim();
  const diagnosis = input.diagnosis?.trim() || null;
  const gender = input.gender ?? null;

  if (!firstName || !/^[A-Z]$/.test(lastInitial) || !isValidDOB(dob)) {
    throw new Error('Please complete the required patient details.');
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const dobYear = Number(dob.slice(0, 4));
  const initials = `${firstName} ${lastInitial}.`;

  const { error } = await supabase
    .from('patients')
    .insert({
      user_id: session.user.id,
      initials,
      dob,
      dob_year: dobYear,
      gender,
      diagnosis,
    });

  if (error) {
    throw new Error(mapPatientWriteError(error.code));
  }
}

function mapPatientUpdateError(code: string | undefined): string {
  switch (code) {
    case '42501':
      return 'Unable to update patient. Please check your access and try again.';
    case '23502':
      return 'Please complete the required patient details.';
    default:
      return 'Unable to update patient. Please try again.';
  }
}

export async function updatePatient(patientId: string, input: UpdatePatientInput): Promise<Patient> {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session) {
    throw new Error('Your session has expired. Please sign in again.');
  }

  const { data, error } = await supabase
    .from('patients')
    .update({
      initials: input.initials,
      dob: input.dob,
      dob_year: input.dob_year,
      gender: input.gender,
      diagnosis: input.diagnosis,
    })
    .eq('id', patientId)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) throw new Error(mapPatientUpdateError(error.code));
  if (!data) throw new Error('Patient record could not be updated. Please try again.');
  return data as Patient;
}
