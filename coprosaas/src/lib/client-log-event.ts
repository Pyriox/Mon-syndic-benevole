/**
 * Log un événement d'activité depuis un composant client.
 *
 * Utilise fetch() avec keepalive: true pour que la requête survive
 * aux navigations immédiates (ex: router.push() juste après).
 * Contrairement aux server actions appelées avec void, les requêtes
 * keepalive ne sont PAS annulées par le navigateur lors d'une navigation.
 */
export function logClientEvent(params: {
  eventType: string;
  label?: string;
  severity?: 'info' | 'warning' | 'error';
  metadata?: Record<string, unknown>;
  coproprieteId?: string | null;
}): void {
  void fetch('/api/log-activity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
    keepalive: true,
  });
}
