const ADMIN_TIME_ZONE = 'Europe/Paris';

export function formatAdminDate(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: ADMIN_TIME_ZONE,
  });
}

export function formatAdminDateTime(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: ADMIN_TIME_ZONE,
  });
}

export function formatAdminPreciseDateTime(value: string | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: ADMIN_TIME_ZONE,
    timeZoneName: 'short',
  });
}

export function formatAdminCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}
