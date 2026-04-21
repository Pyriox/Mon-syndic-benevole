import type { AppNotification, AppNotificationCategory } from '@/types';
import { formatEuros } from '@/lib/utils';

export const NOTIFICATION_CATEGORY_META: Record<AppNotificationCategory, {
  title: string;
  description: string;
  headerClassName: string;
  titleClassName: string;
  descriptionClassName: string;
}> = {
  urgent: {
    title: 'Urgent',
    description: 'Actions prioritaires a traiter sans attendre.',
    headerClassName: 'bg-red-50/70 border-b border-red-100',
    titleClassName: 'text-red-800',
    descriptionClassName: 'text-red-700',
  },
  action: {
    title: 'A traiter',
    description: 'Actions a suivre ou verifications en attente.',
    headerClassName: 'bg-amber-50/60 border-b border-amber-100',
    titleClassName: 'text-amber-800',
    descriptionClassName: 'text-amber-700',
  },
  info: {
    title: 'Info',
    description: 'Historique recent et confirmations de la plateforme.',
    headerClassName: 'bg-blue-50/70 border-b border-blue-100',
    titleClassName: 'text-blue-800',
    descriptionClassName: 'text-blue-700',
  },
};

const categoryWeight: Record<AppNotificationCategory, number> = {
  urgent: 0,
  action: 1,
  info: 2,
};

const severityWeight: Record<AppNotification['severity'], number> = {
  danger: 0,
  warning: 1,
  info: 2,
};

export function resolveNotificationCategory(notification: AppNotification): AppNotificationCategory {
  if (notification.category) return notification.category;
  if (notification.severity === 'danger') return 'urgent';
  if (notification.canMarkRead === false || notification.source === 'dynamic' || notification.source === 'support' || notification.severity === 'warning') {
    return 'action';
  }
  return 'info';
}

export function sortNotificationsByPriority(a: AppNotification, b: AppNotification): number {
  const categoryDelta = categoryWeight[resolveNotificationCategory(a)] - categoryWeight[resolveNotificationCategory(b)];
  if (categoryDelta !== 0) return categoryDelta;

  const rankDelta = (a.priorityRank ?? 999) - (b.priorityRank ?? 999);
  if (rankDelta !== 0) return rankDelta;

  const severityDelta = severityWeight[a.severity] - severityWeight[b.severity];
  if (severityDelta !== 0) return severityDelta;

  if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  if (a.createdAt) return -1;
  if (b.createdAt) return 1;
  return 0;
}

export interface SyndicBellSnapshot {
  totalMontantImpaye: number;
  nbImpayes: number;
  nbLignesImpayees: number;
  incidentsAnciens: Array<{ id: string; titre: string; priorite: string; date_declaration: string }>;
  nbAppelsBrouillon: number;
  appelsSansEmail: Array<{ id: string; titre: string; date_echeance: string | null }>;
  agEnCours: { id: string; titre: string; date_ag: string } | null;
  agTermineeSansPV: { id: string; titre: string; date_ag: string } | null;
  agUrgente: boolean;
  prochaineAG: { id: string; titre: string; date_ag: string; statut: string } | null;
  joursAvantAG: number | null;
}

export function buildSyndicBellNotifications(snapshot: SyndicBellSnapshot, now = new Date()): AppNotification[] {
  const notifications: AppNotification[] = [];
  const nowTs = now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (snapshot.totalMontantImpaye > 0 && snapshot.nbLignesImpayees > 0) {
    notifications.push({
      id: 'syndic-impayes',
      type: 'impaye',
      title: `${formatEuros(snapshot.totalMontantImpaye)} d'impayes a regulariser`,
      body: `${snapshot.nbImpayes} coproprietaire${snapshot.nbImpayes > 1 ? 's' : ''} concerne${snapshot.nbImpayes > 1 ? 's' : ''} — relancez-les ou enregistrez les paiements.`,
      href: '/appels-de-fonds',
      severity: 'danger',
      category: 'urgent',
      priorityRank: 10,
    });
  }

  const incidentsUrgents = snapshot.incidentsAnciens.filter((incident) => incident.priorite === 'urgente');
  if (incidentsUrgents.length > 0) {
    notifications.push({
      id: 'syndic-incidents-urgents',
      type: 'incident',
      title: `${incidentsUrgents.length} incident${incidentsUrgents.length > 1 ? 's' : ''} prioritaire${incidentsUrgents.length > 1 ? 's' : ''} sans suivi`,
      body: 'Mettez a jour ces incidents urgents pour conserver une trace et accelerer le suivi.',
      href: '/incidents',
      severity: 'danger',
      category: 'urgent',
      priorityRank: 20,
    });
  }

  const incidentsASuivre = snapshot.incidentsAnciens.filter((incident) => incident.priorite !== 'urgente');
  if (incidentsASuivre.length > 0) {
    notifications.push({
      id: 'syndic-incidents-a-suivre',
      type: 'incident',
      title: `${incidentsASuivre.length} incident${incidentsASuivre.length > 1 ? 's' : ''} sans suivi depuis 7+ jours`,
      body: 'Mettez a jour ces incidents pour garder une trace et informer les coproprietaires.',
      href: '/incidents',
      severity: 'warning',
      category: 'action',
      priorityRank: 25,
    });
  }

  if (snapshot.nbAppelsBrouillon > 0) {
    notifications.push({
      id: 'syndic-appels-brouillon',
      type: 'appel_fonds',
      title: `${snapshot.nbAppelsBrouillon} appel${snapshot.nbAppelsBrouillon > 1 ? 's' : ''} de fonds en brouillon`,
      body: `Publiez-${snapshot.nbAppelsBrouillon > 1 ? 'les' : 'le'} pour que les coproprietaires recoivent leur avis de paiement.`,
      href: '/appels-de-fonds',
      severity: 'warning',
      category: 'action',
      priorityRank: 30,
    });
  }

  if (snapshot.appelsSansEmail.length > 0) {
    const appel = snapshot.appelsSansEmail[0];
    const daysUntilEcheance = appel.date_echeance
      ? Math.ceil((new Date(`${appel.date_echeance}T00:00:00`).getTime() - nowTs) / oneDayMs)
      : null;
    const isUrgent = daysUntilEcheance !== null && daysUntilEcheance <= 7;
    const extra = snapshot.appelsSansEmail.length > 1
      ? ` (+ ${snapshot.appelsSansEmail.length - 1} autre${snapshot.appelsSansEmail.length > 2 ? 's' : ''})`
      : '';

    notifications.push({
      id: 'syndic-appels-sans-email',
      type: 'appel_fonds',
      title: `Appel de fonds publie sans avis envoye${extra}`,
      body: `${appel.titre}${appel.date_echeance ? ` · echeance ${new Date(`${appel.date_echeance}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''} — les coproprietaires n'ont pas encore recu leur avis.`,
      href: '/appels-de-fonds',
      severity: isUrgent ? 'danger' : 'warning',
      category: isUrgent ? 'urgent' : 'action',
      priorityRank: 40,
    });
  }

  if (snapshot.agEnCours) {
    notifications.push({
      id: `syndic-ag-en-cours-${snapshot.agEnCours.id}`,
      type: 'ag',
      title: 'AG en cours — cloturez apres les votes',
      body: `${snapshot.agEnCours.titre} · ${new Date(snapshot.agEnCours.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      href: `/assemblees/${snapshot.agEnCours.id}`,
      severity: 'info',
      category: 'action',
      priorityRank: 50,
    });
  }

  if (snapshot.agTermineeSansPV) {
    const daysSinceAg = Math.floor((nowTs - new Date(snapshot.agTermineeSansPV.date_ag).getTime()) / oneDayMs);
    const isUrgent = daysSinceAg > 30;

    notifications.push({
      id: `syndic-ag-pv-${snapshot.agTermineeSansPV.id}`,
      type: 'ag',
      title: 'PV d\'AG a envoyer aux coproprietaires',
      body: `${snapshot.agTermineeSansPV.titre} · ${new Date(snapshot.agTermineeSansPV.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — envoyez-le par e-mail depuis la page de l'AG.`,
      href: `/assemblees/${snapshot.agTermineeSansPV.id}`,
      severity: isUrgent ? 'danger' : 'warning',
      category: isUrgent ? 'urgent' : 'action',
      priorityRank: 60,
    });
  }

  if (snapshot.agUrgente && snapshot.prochaineAG && snapshot.joursAvantAG !== null) {
    const isUrgent = snapshot.joursAvantAG <= 7;
    notifications.push({
      id: `syndic-ag-prochaine-${snapshot.prochaineAG.id}`,
      type: 'ag',
      title: `AG dans J-${snapshot.joursAvantAG} — preparez l'ordre du jour`,
      body: `${snapshot.prochaineAG.titre} · ${new Date(snapshot.prochaineAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      href: `/assemblees/${snapshot.prochaineAG.id}`,
      severity: isUrgent ? 'danger' : 'warning',
      category: isUrgent ? 'urgent' : 'action',
      priorityRank: 70,
    });
  }

  return notifications;
}