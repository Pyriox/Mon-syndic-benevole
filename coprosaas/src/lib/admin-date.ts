const ADMIN_TIME_ZONE = 'Europe/Paris';

function getZonedDayNumber(value: Date): number {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: ADMIN_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(value);

  const year = Number(parts.find((part) => part.type === 'year')?.value ?? '0');
  const month = Number(parts.find((part) => part.type === 'month')?.value ?? '1');
  const day = Number(parts.find((part) => part.type === 'day')?.value ?? '1');

  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

export function formatRelativeDayLabel(value: string | null | undefined, now: Date = new Date()): string {
  if (!value) return '—';

  const diff = getZonedDayNumber(now) - getZonedDayNumber(new Date(value));

  if (diff <= 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff < 30) return `Il y a ${diff} j`;
  if (diff < 365) return `Il y a ${Math.floor(diff / 30)} mois`;

  const years = Math.floor(diff / 365);
  return `Il y a ${years} an${years > 1 ? 's' : ''}`;
}
