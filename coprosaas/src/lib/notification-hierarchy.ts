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
    description: 'Actions prioritaires à traiter sans attendre.',
    headerClassName: 'bg-red-50/70 border-b border-red-100',
    titleClassName: 'text-red-800',
    descriptionClassName: 'text-red-700',
  },
  action: {
    title: 'À traiter',
    description: 'Actions à suivre ou vérifications en attente.',
    headerClassName: 'bg-amber-50/60 border-b border-amber-100',
    titleClassName: 'text-amber-800',
    descriptionClassName: 'text-amber-700',
  },
  info: {
    title: 'Info',
    description: 'Historique récent et confirmations de la plateforme.',
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

export interface CoproBellSnapshot {
  solde: number;
  chargesImpayees: Array<{
    id: string;
    montant_du: number;
    appel: { id: string; titre: string; date_echeance: string | null } | null;
  }>;
  prochaineAG: { id: string; titre: string; date_ag: string; statut: string } | null;
  joursAvantAG: number | null;
  incidentsActifs: Array<{ id: string; titre: string; statut: string; priorite: string }>;
  balanceEvents: Array<{
    id: string;
    event_date: string;
    source_type: string;
    account_type: 'principal' | 'fonds_travaux' | 'regularisation' | 'mixte';
    label: string;
    reason: string | null;
    amount: number;
    balance_after: number;
    created_at: string;
  }>;
}

export function buildSyndicBellNotifications(snapshot: SyndicBellSnapshot, now = new Date()): AppNotification[] {
  const notifications: AppNotification[] = [];
  const nowTs = now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (snapshot.totalMontantImpaye > 0 && snapshot.nbLignesImpayees > 0) {
    notifications.push({
      id: 'syndic-impayes',
      type: 'impaye',
      title: `${formatEuros(snapshot.totalMontantImpaye)} d'impayés à régulariser`,
      body: `${snapshot.nbImpayes} copropriétaire${snapshot.nbImpayes > 1 ? 's' : ''} concerné${snapshot.nbImpayes > 1 ? 's' : ''} — relancez-les ou enregistrez les paiements.`,
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
      body: 'Mettez à jour ces incidents urgents pour conserver une trace et accélérer le suivi.',
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
      body: 'Mettez à jour ces incidents pour garder une trace et informer les copropriétaires.',
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
      body: `Publiez-${snapshot.nbAppelsBrouillon > 1 ? 'les' : 'le'} pour que les copropriétaires reçoivent leur avis de paiement.`,
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
      title: `Appel de fonds publié sans avis envoyé${extra}`,
      body: `${appel.titre}${appel.date_echeance ? ` · échéance ${new Date(`${appel.date_echeance}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''} — les copropriétaires n'ont pas encore reçu leur avis.`,
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
      title: 'AG en cours — clôturez après les votes',
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
      title: 'PV d\'AG à envoyer aux copropriétaires',
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
      title: `AG dans J-${snapshot.joursAvantAG} — préparez l'ordre du jour`,
      body: `${snapshot.prochaineAG.titre} · ${new Date(snapshot.prochaineAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      href: `/assemblees/${snapshot.prochaineAG.id}`,
      severity: isUrgent ? 'danger' : 'warning',
      category: isUrgent ? 'urgent' : 'action',
      priorityRank: 70,
    });
  }

  return notifications;
}

export function buildCoproBellNotifications(snapshot: CoproBellSnapshot, now = new Date()): AppNotification[] {
  const notifications: AppNotification[] = [];
  const nowTs = now.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  const overdueCharges = snapshot.chargesImpayees.filter((ligne) => {
    if (!ligne.appel?.date_echeance) return false;
    return new Date(`${ligne.appel.date_echeance}T00:00:00`).getTime() < nowTs;
  });
  const overdueTotal = overdueCharges.reduce((sum, ligne) => sum + ligne.montant_du, 0);

  if (overdueCharges.length > 0) {
    const oldestOverdue = [...overdueCharges]
      .filter((ligne) => ligne.appel?.date_echeance)
      .sort((a, b) => {
        const aTs = new Date(`${a.appel?.date_echeance}T00:00:00`).getTime();
        const bTs = new Date(`${b.appel?.date_echeance}T00:00:00`).getTime();
        return aTs - bTs;
      })[0];

    notifications.push({
      id: 'copro-charges-echues',
      type: 'appel_fonds',
      title: `${formatEuros(overdueTotal)} d'échéances dépassées`,
      body: `${overdueCharges.length} appel${overdueCharges.length > 1 ? 's' : ''} de fonds en retard${oldestOverdue?.appel?.date_echeance ? ` depuis le ${new Date(`${oldestOverdue.appel.date_echeance}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}.`,
      href: '/appels-de-fonds',
      severity: 'danger',
      category: 'urgent',
      priorityRank: 10,
    });
  } else if (snapshot.solde > 0 || snapshot.chargesImpayees.length > 0) {
    const nextCharge = [...snapshot.chargesImpayees]
      .filter((ligne) => ligne.appel?.date_echeance)
      .sort((a, b) => {
        const aTs = new Date(`${a.appel?.date_echeance}T00:00:00`).getTime();
        const bTs = new Date(`${b.appel?.date_echeance}T00:00:00`).getTime();
        return aTs - bTs;
      })[0];

    notifications.push({
      id: 'copro-solde-a-regler',
      type: 'impaye',
      title: `${formatEuros(Math.max(snapshot.solde, 0))} à régler`,
      body: snapshot.chargesImpayees.length > 0
        ? `${snapshot.chargesImpayees.length} charge${snapshot.chargesImpayees.length > 1 ? 's' : ''} en attente${nextCharge?.appel?.date_echeance ? ` · prochaine échéance le ${new Date(`${nextCharge.appel.date_echeance}T00:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}` : ''}.`
        : 'Votre solde reste débiteur sur cette copropriété.',
      href: '/appels-de-fonds',
      severity: 'warning',
      category: 'action',
      priorityRank: 20,
    });
  }

  if (snapshot.prochaineAG && snapshot.joursAvantAG !== null && snapshot.joursAvantAG <= 30) {
    const isUrgent = snapshot.joursAvantAG <= 7;

    notifications.push({
      id: `copro-ag-${snapshot.prochaineAG.id}`,
      type: 'ag',
      title: `AG dans J-${snapshot.joursAvantAG}`,
      body: `${snapshot.prochaineAG.titre} · ${new Date(snapshot.prochaineAG.date_ag).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      href: `/assemblees/${snapshot.prochaineAG.id}`,
      severity: isUrgent ? 'danger' : 'warning',
      category: isUrgent ? 'urgent' : 'action',
      priorityRank: isUrgent ? 30 : 40,
    });
  }

  if (snapshot.incidentsActifs.length > 0) {
    const urgentIncidents = snapshot.incidentsActifs.filter((incident) => incident.priorite === 'urgente');
    const hasUrgentIncident = urgentIncidents.length > 0;

    notifications.push({
      id: hasUrgentIncident ? 'copro-incidents-urgents' : 'copro-incidents-actifs',
      type: 'incident',
      title: hasUrgentIncident
        ? `${urgentIncidents.length} incident${urgentIncidents.length > 1 ? 's' : ''} urgent${urgentIncidents.length > 1 ? 's' : ''} en cours`
        : `${snapshot.incidentsActifs.length} incident${snapshot.incidentsActifs.length > 1 ? 's' : ''} en cours de suivi`,
      body: 'Consultez l’avancement et les dernières mises à jour dans Incidents & travaux.',
      href: '/incidents',
      severity: hasUrgentIncident ? 'danger' : 'warning',
      category: hasUrgentIncident ? 'urgent' : 'action',
      priorityRank: hasUrgentIncident ? 50 : 60,
    });
  }

  if (snapshot.solde < 0) {
    notifications.push({
      id: 'copro-credit',
      type: 'impaye',
      title: `${formatEuros(Math.abs(snapshot.solde))} de crédit enregistré`,
      body: 'Une avance ou un trop-perçu est actuellement enregistré en votre faveur.',
      href: '/dashboard',
      severity: 'info',
      category: 'info',
      priorityRank: 80,
    });
  }

  const latestBalanceEvent = snapshot.balanceEvents[0];
  if (latestBalanceEvent) {
    notifications.push({
      id: `copro-balance-event-${latestBalanceEvent.id}`,
      type: latestBalanceEvent.amount < 0 ? 'appel_fonds' : 'impaye',
      title: latestBalanceEvent.label,
      body: `${formatEuros(latestBalanceEvent.balance_after)} de solde après écriture · ${new Date(latestBalanceEvent.event_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}`,
      href: '/dashboard',
      severity: 'info',
      category: 'info',
      priorityRank: 90,
      createdAt: latestBalanceEvent.created_at,
    });
  }

  return notifications;
}