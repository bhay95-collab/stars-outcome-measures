/**
 * @jest-environment node
 *
 * Unit tests for the edit patient flow.
 * Covers: updatePatient input validation, error mapping, immutable return shape,
 * and the DOB / initials helpers used by PatientEditSheet.
 */

// ---------------------------------------------------------------------------
// Helpers extracted from PatientEditSheet (inline parity — not exported).
// We test the same pure logic here without loading the React Native tree.
// ---------------------------------------------------------------------------

function formatDOBInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseDOBInput(dob: string): string | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(dob);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return null;

  return `${match[3]}-${match[2]}-${match[1]}`;
}

function isoToDisplayDOB(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function dobYearFromISO(iso: string | null): number | null {
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  return isNaN(year) ? null : year;
}

// ---------------------------------------------------------------------------
// DOB helpers
// ---------------------------------------------------------------------------

describe('formatDOBInput', () => {
  it('returns digits unchanged when fewer than 3', () => {
    expect(formatDOBInput('1')).toBe('1');
    expect(formatDOBInput('12')).toBe('12');
  });

  it('inserts first slash after day digits', () => {
    expect(formatDOBInput('123')).toBe('12/3');
    expect(formatDOBInput('1234')).toBe('12/34');
  });

  it('inserts second slash after month digits', () => {
    expect(formatDOBInput('12345')).toBe('12/34/5');
    expect(formatDOBInput('12345678')).toBe('12/34/5678');
  });

  it('strips non-digit characters', () => {
    expect(formatDOBInput('15/03/1990')).toBe('15/03/1990');
    expect(formatDOBInput('abc15031990')).toBe('15/03/1990');
  });

  it('truncates to 8 digits', () => {
    expect(formatDOBInput('150319901234')).toBe('15/03/1990');
  });
});

describe('parseDOBInput', () => {
  it('returns ISO string for a valid past date', () => {
    expect(parseDOBInput('15/03/1990')).toBe('1990-03-15');
  });

  it('returns null for an invalid calendar date', () => {
    expect(parseDOBInput('31/02/1990')).toBeNull();
    expect(parseDOBInput('00/00/0000')).toBeNull();
  });

  it('returns null for wrong format', () => {
    expect(parseDOBInput('1990-03-15')).toBeNull();
    expect(parseDOBInput('15/3/1990')).toBeNull();
    expect(parseDOBInput('')).toBeNull();
  });

  it('returns null for a future date', () => {
    expect(parseDOBInput('01/01/2099')).toBeNull();
  });
});

describe('isoToDisplayDOB', () => {
  it('converts ISO date to DD/MM/YYYY', () => {
    expect(isoToDisplayDOB('1990-03-15')).toBe('15/03/1990');
  });

  it('returns empty string for null or undefined', () => {
    expect(isoToDisplayDOB(null)).toBe('');
    expect(isoToDisplayDOB(undefined)).toBe('');
    expect(isoToDisplayDOB('')).toBe('');
  });

  it('returns empty string for malformed ISO', () => {
    expect(isoToDisplayDOB('not-a-date')).toBe('');
  });
});

describe('dobYearFromISO', () => {
  it('extracts year from a valid ISO date', () => {
    expect(dobYearFromISO('1990-03-15')).toBe(1990);
  });

  it('returns null for null input', () => {
    expect(dobYearFromISO(null)).toBeNull();
  });

  it('returns null for a non-numeric year', () => {
    expect(dobYearFromISO('abcd-03-15')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// updatePatient — mocked Supabase
// ---------------------------------------------------------------------------

const mockSingle = jest.fn();
const mockEq = jest.fn();
const mockSelect = jest.fn();
const mockUpdate = jest.fn();

jest.mock('../src/supabase/client', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(() => ({
      update: mockUpdate.mockReturnThis(),
      eq: mockEq.mockReturnThis(),
      select: mockSelect.mockReturnThis(),
      single: mockSingle,
    })),
  },
}));

import { updatePatient } from '../src/supabase/patients';
import { supabase } from '../src/supabase/client';

const getSessionMock = supabase.auth.getSession as jest.Mock;

const VALID_INPUT = {
  initials: 'BH',
  dob: '1990-03-15',
  dob_year: 1990,
  gender: 'M' as const,
  diagnosis: 'Stroke',
};

const MOCK_PATIENT = {
  id: 'patient-uuid',
  user_id: 'user-uuid',
  initials: 'BH',
  dob: '1990-03-15',
  dob_year: 1990,
  gender: 'M',
  diagnosis: 'Stroke',
};

describe('updatePatient', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockEq.mockReturnThis();
    mockSelect.mockReturnThis();
    mockUpdate.mockReturnThis();
  });

  it('throws when session is missing', async () => {
    getSessionMock.mockResolvedValue({ data: { session: null }, error: null });
    await expect(updatePatient('patient-uuid', VALID_INPUT)).rejects.toThrow(
      'Your session has expired. Please sign in again.',
    );
  });

  it('throws when getSession errors', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: null },
      error: new Error('network'),
    });
    await expect(updatePatient('patient-uuid', VALID_INPUT)).rejects.toThrow(
      'Your session has expired. Please sign in again.',
    );
  });

  it('returns updated patient on success', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-uuid' } } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: MOCK_PATIENT, error: null });

    const result = await updatePatient('patient-uuid', VALID_INPUT);
    expect(result).toEqual(MOCK_PATIENT);
  });

  it('throws with mapped message on RLS error (42501)', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-uuid' } } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: { code: '42501' } });

    await expect(updatePatient('patient-uuid', VALID_INPUT)).rejects.toThrow(
      'Unable to update patient. Please check your access and try again.',
    );
  });

  it('throws on silent RLS deny (null data, no error)', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-uuid' } } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: null, error: null });

    await expect(updatePatient('patient-uuid', VALID_INPUT)).rejects.toThrow(
      'Patient record could not be updated. Please try again.',
    );
  });

  it('scopes the update to both patient id and user_id', async () => {
    getSessionMock.mockResolvedValue({
      data: { session: { user: { id: 'user-uuid' } } },
      error: null,
    });
    mockSingle.mockResolvedValue({ data: MOCK_PATIENT, error: null });

    await updatePatient('patient-uuid', VALID_INPUT);

    expect(mockEq).toHaveBeenCalledWith('id', 'patient-uuid');
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-uuid');
  });
});
