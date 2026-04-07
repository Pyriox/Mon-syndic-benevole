// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('@/lib/cached-queries', () => ({
  getCoproprietaireDashboardSnapshot: vi.fn(async () => ({
    fiche: { id: 'cp-1', nom: 'Dupont', prenom: 'Jean-Pierre', raison_sociale: null, solde: 205.6 },
    assembleesUpcoming: [],
    chargesImpayees: [],
    prochaineAG: null,
    joursAvantAG: null,
    solde: 205.6,
    displayFirstName: 'Jean-Pierre',
  })),
  getSyndicDashboardSnapshot: vi.fn(),
}));

describe('CoproDashboardMain', () => {
  it('affiche un solde débiteur en rouge avec la mention charges à régler', async () => {
    const { CoproDashboardMain } = await import('./DashboardSections');

    render(await CoproDashboardMain({ userId: 'user-1', coproId: 'copro-1' }));

    expect(screen.getByText(/Charges à régler/i)).not.toBeNull();
    expect(screen.getByText(/-205,60\s?€/i)).not.toBeNull();
  });
});
