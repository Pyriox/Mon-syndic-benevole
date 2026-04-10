import { describe, expect, it } from 'vitest';

import { computeSupportAttentionSummary, computeSupportTicketStates } from '../admin-support';

describe('computeSupportTicketStates', () => {
  it('déduit le statut de lecture client et la clôture automatique après 7 jours', () => {
    const states = computeSupportTicketStates(
      [
        { id: 't1', status: 'en_cours' },
        { id: 't2', status: 'en_cours' },
        { id: 't3', status: 'ouvert' },
      ],
      [
        { ticket_id: 't1', author: 'admin', created_at: '2026-04-01T09:00:00.000Z', client_read: false },
        { ticket_id: 't2', author: 'admin', created_at: '2026-04-01T09:00:00.000Z', client_read: true },
        { ticket_id: 't3', author: 'client', created_at: '2026-04-09T09:00:00.000Z', client_read: true },
      ],
      new Date('2026-04-10T12:00:00.000Z'),
    );

    expect(states.get('t1')).toMatchObject({
      readState: 'client_unread',
      autoCloseEligible: true,
      lastMessageAuthor: 'admin',
    });
    expect(states.get('t2')).toMatchObject({
      readState: 'client_read',
      autoCloseEligible: true,
      lastMessageAuthor: 'admin',
    });
    expect(states.get('t3')).toMatchObject({
      readState: 'waiting_support',
      autoCloseEligible: false,
      lastMessageAuthor: 'client',
    });
  });
});

describe('computeSupportAttentionSummary', () => {
  it('ne garde que les tickets non résolus dont le dernier message vient du client', () => {
    const summary = computeSupportAttentionSummary(
      [
        { id: 't1', status: 'ouvert' },
        { id: 't2', status: 'en_cours' },
        { id: 't3', status: 'resolu' },
      ],
      [
        { ticket_id: 't2', author: 'client', created_at: '2026-04-09T09:00:00.000Z' },
        { ticket_id: 't1', author: 'client', created_at: '2026-04-09T09:30:00.000Z' },
        { ticket_id: 't3', author: 'client', created_at: '2026-04-09T11:00:00.000Z' },
        { ticket_id: 't2', author: 'admin', created_at: '2026-04-09T10:00:00.000Z' },
      ],
    );

    expect(summary).toEqual({
      pendingCount: 1,
      openCount: 1,
      inProgressCount: 0,
      pendingTicketIds: ['t1'],
    });
  });

  it('considère un ticket sans message comme à traiter tant qu’il n’est pas clôturé', () => {
    const summary = computeSupportAttentionSummary(
      [
        { id: 't1', status: 'ouvert' },
        { id: 't2', status: 'en_cours' },
      ],
      [
        { ticket_id: 't2', author: 'admin', created_at: '2026-04-09T10:00:00.000Z' },
      ],
    );

    expect(summary).toEqual({
      pendingCount: 1,
      openCount: 1,
      inProgressCount: 0,
      pendingTicketIds: ['t1'],
    });
  });
});
