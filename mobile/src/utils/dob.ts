export function formatDOBInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function parseDOBInput(dob: string): string | null {
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

export function isoToDisplayDOB(iso: string | null | undefined): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!match) return '';
  return `${match[3]}/${match[2]}/${match[1]}`;
}

export function dobYearFromISO(iso: string | null): number | null {
  if (!iso) return null;
  const year = Number(iso.slice(0, 4));
  return isNaN(year) ? null : year;
}
