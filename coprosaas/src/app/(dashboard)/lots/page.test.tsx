// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/supabase/require-copro-access', () => ({
  requireCoproAccess: vi.fn(async () => ({
    selectedCoproId: 'copro-1',
    role: 'coproprietaire',
    copro: { id: 'copro-1' },
    user: { id: 'user-1' },
  })),
}));

vi.mock('@/lib/cached-queries', () => ({
  getLots: vi.fn(async () => ([
    { id: 'lot-1', numero: '02-RDC', type: 'appartement', tantiemes: 160, coproprietaire_id: 'cp-1' },
    { id: 'lot-2', numero: '04-1ER', type: 'appartement', tantiemes: 162, coproprietaire_id: 'cp-2' },
  ])),
  getCoproprietaires: vi.fn(async () => ([
    { id: 'cp-1', nom: 'VERNAET', prenom: 'Jean-Pierre', raison_sociale: null, user_id: 'user-1', email: 'jp@example.com' },
    { id: 'cp-2', nom: 'TURPIN', prenom: 'Fabien', raison_sociale: null, user_id: 'user-2', email: 'fabien@example.com' },
  ])),
}));

describe('LotsPage', () => {
  it('affiche aussi le badge inscrit sur la ligne du copropriétaire connecté', async () => {
    const { default: LotsPage } = await import('./page');

    render(await LotsPage());

    const badges = screen.getAllByText(/Inscrit/i);
    expect(badges).toHaveLength(4);
  });
});
