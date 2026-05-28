const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getValidPatientId(value: string | string[] | undefined): string | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const patientId = candidate?.trim();
  if (!patientId || !UUID_PATTERN.test(patientId)) return null;
  return patientId;
}

export function isValidUUID(value: string | null | undefined): value is string {
  return !!value && UUID_PATTERN.test(value);
}
