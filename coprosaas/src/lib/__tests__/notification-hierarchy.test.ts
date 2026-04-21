import { describe, expect, it } from 'vitest';
import { buildSyndicBellNotifications, resolveNotificationCategory, sortNotificationsByPriority } from '../notification-hierarchy';
import type { AppNotification } from '@/types';

describe('notification hierarchy', () => {
  it('classe les AG proches en urgent a J-7 et en a traiter au-dela', () => {
    const urgent = buildSyndicBellNotifications({
      totalMontantImpaye: 0,
      nbImpayes: 0,
      nbLignesImpayees: 0,
      incidentsAnciens: [],
      nbAppelsBrouillon: 0,
      appelsSansEmail: [],
      agEnCours: null,
      agTermineeSansPV: null,
      agUrgente: true,
      prochaineAG: { id: 'ag-1', titre: 'AGO', date_ag: '2026-04-25T10:00:00.000Z', statut: 'planifiee' },
      joursAvantAG: 4,
    }, new Date('2026-04-21T10:00:00.000Z'));

    const action = buildSyndicBellNotifications({
      totalMontantImpaye: 0,
      nbImpayes: 0,
      nbLignesImpayees: 0,
      incidentsAnciens: [],
      nbAppelsBrouillon: 0,
      appelsSansEmail: [],
      agEnCours: null,
      agTermineeSansPV: null,
      agUrgente: true,
      prochaineAG: { id: 'ag-2', titre: 'AGO', date_ag: '2026-05-05T10:00:00.000Z', statut: 'planifiee' },
      joursAvantAG: 14,
    }, new Date('2026-04-21T10:00:00.000Z'));

    expect(urgent[0]?.category).toBe('urgent');
    expect(action[0]?.category).toBe('action');
  });

  it('fait passer un PV non envoye en urgent apres 30 jours', () => {
    const notifications = buildSyndicBellNotifications({
      totalMontantImpaye: 0,
      nbImpayes: 0,
      nbLignesImpayees: 0,
      incidentsAnciens: [],
      nbAppelsBrouillon: 0,
      appelsSansEmail: [],
      agEnCours: null,
      agTermineeSansPV: { id: 'ag-1', titre: 'AGO 2026', date_ag: '2026-03-01T10:00:00.000Z' },
      agUrgente: false,
      prochaineAG: null,
      joursAvantAG: null,
    }, new Date('2026-04-21T10:00:00.000Z'));

    expect(notifications[0]?.category).toBe('urgent');
    expect(notifications[0]?.severity).toBe('danger');
  });

  it('fait passer un appel publie sans email en urgent si l echeance est proche', () => {
    const notifications = buildSyndicBellNotifications({
      totalMontantImpaye: 0,
      nbImpayes: 0,
      nbLignesImpayees: 0,
      incidentsAnciens: [],
      nbAppelsBrouillon: 0,
      appelsSansEmail: [{ id: 'appel-1', titre: 'T2 2026', date_echeance: '2026-04-24' }],
      agEnCours: null,
      agTermineeSansPV: null,
      agUrgente: false,
      prochaineAG: null,
      joursAvantAG: null,
    }, new Date('2026-04-21T10:00:00.000Z'));

    expect(notifications[0]?.category).toBe('urgent');
  });

  it('trie selon la categorie puis le rang metier', () => {
    const notifications: AppNotification[] = [
      { id: 'info', type: 'ag', title: 'Info', href: '/a', severity: 'info', category: 'info' },
      { id: 'action', type: 'ag', title: 'Action', href: '/b', severity: 'warning', category: 'action', priorityRank: 50 },
      { id: 'urgent', type: 'ag', title: 'Urgent', href: '/c', severity: 'danger', category: 'urgent', priorityRank: 60 },
      { id: 'urgent-early', type: 'ag', title: 'Urgent 1', href: '/d', severity: 'danger', category: 'urgent', priorityRank: 10 },
    ];

    const sorted = [...notifications].sort(sortNotificationsByPriority);

    expect(sorted.map((notification) => notification.id)).toEqual(['urgent-early', 'urgent', 'action', 'info']);
    expect(resolveNotificationCategory(sorted[0])).toBe('urgent');
  });
});