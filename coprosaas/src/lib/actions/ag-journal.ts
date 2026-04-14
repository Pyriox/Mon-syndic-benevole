import { logCurrentUserEvent } from './log-user-event';

/**
 * Journalise le changement de statut d'une AG.
 */
export async function logAGStatusChange({
  agId,
  coproId,
  oldStatus,
  newStatus,
  label,
}: {
  agId: string;
  coproId: string;
  oldStatus: string;
  newStatus: string;
  label?: string;
}) {
  await logCurrentUserEvent({
    eventType: 'ag_status_changed',
    label: label || `Statut AG modifié : ${oldStatus} → ${newStatus}`,
    metadata: { agId, coproId, oldStatus, newStatus },
  });
}
