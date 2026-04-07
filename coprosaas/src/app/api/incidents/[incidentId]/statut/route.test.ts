import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { NextRequest } from 'next/server';

const createClientMock = vi.fn();
const createAdminClientMock = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: createAdminClientMock,
}));

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: vi.fn() };
  },
}));

vi.mock('@/lib/emails/syndic-notifications', () => ({
  buildIncidentResoluEmail: vi.fn(() => '<p>ok</p>'),
  buildIncidentResoluSubject: vi.fn(() => 'Incident résolu'),
}));

vi.mock('@/lib/email-delivery', () => ({
  trackResendSendResult: vi.fn().mockResolvedValue({ ok: true, errorMessage: null }),
}));

vi.mock('@/lib/site-url', () => ({
  getCanonicalSiteUrl: () => 'https://www.mon-syndic-benevole.fr',
}));

describe('PATCH /api/incidents/[incidentId]/statut', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('ignore les champs non autorises dans le payload de mise a jour', async () => {
    createClientMock.mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'syndic_1' } } }),
      },
    });

    const update = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    createAdminClientMock.mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => {
        if (table === 'incidents') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: 'incident_1',
                    copropriete_id: 'copro_1',
                    titre: 'Fuite',
                    declare_par: null,
                    montant_final: null,
                  },
                }),
              }),
            }),
            update,
          };
        }

        if (table === 'coproprietes') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'copro_1', nom: 'Résidence' } }),
                }),
              }),
            }),
          };
        }

        return {};
      }),
      auth: {
        admin: {
          getUserById: vi.fn(),
        },
      },
    });

    const { PATCH } = await import('./route');
    const res = await PATCH(
      new Request('http://localhost/api/incidents/incident_1/statut', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statut: 'en_cours',
          notes_internes: 'artisan relancé',
          montant_final: 350,
          declare_par: 'hacker',
          copropriete_id: 'autre-copro',
        }),
      }) as unknown as NextRequest,
      { params: Promise.resolve({ incidentId: 'incident_1' }) },
    );

    expect(res.status).toBe(200);

    const payload = update.mock.calls[0][0] as Record<string, unknown>;
    expect(payload).toMatchObject({
      statut: 'en_cours',
      notes_internes: 'artisan relancé',
      montant_final: 350,
    });
    expect(payload).not.toHaveProperty('declare_par');
    expect(payload).not.toHaveProperty('copropriete_id');
  });
});
