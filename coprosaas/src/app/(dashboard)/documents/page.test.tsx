// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a {...props}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
}));

vi.mock('@/lib/supabase/require-copro-access', () => ({
  requireCoproAccess: vi.fn(async () => ({
    user: { id: 'user-1' },
    selectedCoproId: 'copro-1',
    role: 'copropriétaire',
    copro: {
      id: 'copro-1',
      nom: '23 Abbé Léon Spairat',
      syndic_id: 'syndic-1',
      plan: 'pro',
    },
  })),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      update: vi.fn(),
      delete: vi.fn(),
    })),
  })),
}));

type Row = Record<string, unknown>;

class MockQuery {
  private rows: Row[];

  constructor(rows: Row[]) {
    this.rows = [...rows];
  }

  select() {
    return this;
  }

  eq(column: string, value: unknown) {
    this.rows = this.rows.filter((row) => row[column] === value);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const ascending = options?.ascending ?? true;
    this.rows = [...this.rows].sort((a, b) => {
      const left = String(a[column] ?? '');
      const right = String(b[column] ?? '');
      return ascending ? left.localeCompare(right) : right.localeCompare(left);
    });
    return this;
  }

  or(expression: string) {
    const allowedIds = expression
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part.startsWith('coproprietaire_id.eq.'))
      .map((part) => part.replace('coproprietaire_id.eq.', ''));

    this.rows = this.rows.filter((row) => row.coproprietaire_id == null || allowedIds.includes(String(row.coproprietaire_id)));
    return this;
  }

  async maybeSingle() {
    return { data: this.rows[0] ?? null, error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    from: (table: string) => {
      if (table === 'document_dossiers') {
        return new MockQuery([
          { id: 'root-appels', nom: 'Appels de fonds', is_default: true, created_at: '2026-04-01T00:00:00Z', parent_id: null, syndic_id: 'syndic-1' },
          { id: 'folder-2026', nom: '2026', is_default: false, created_at: '2026-04-01T00:00:00Z', parent_id: 'root-appels', syndic_id: 'syndic-1' },
        ]);
      }

      if (table === 'documents') {
        return new MockQuery([
          {
            id: 'doc-me',
            nom: 'Avis — Jean-Pierre VERNAET — Appel de fonds 2026 — 2/2',
            type: 'avis_appel_fonds',
            taille: 10500,
            created_at: '2026-04-01T00:00:00Z',
            dossier_id: 'folder-2026',
            copropriete_id: 'copro-1',
            coproprietaire_id: 'cp-me',
          },
          {
            id: 'doc-other',
            nom: 'Avis — Fabien TURPIN — Appel de fonds 2026 — 2/2',
            type: 'avis_appel_fonds',
            taille: 10500,
            created_at: '2026-04-01T00:00:00Z',
            dossier_id: 'folder-2026',
            copropriete_id: 'copro-1',
            coproprietaire_id: 'cp-other',
          },
        ]);
      }

      if (table === 'coproprietaires') {
        return new MockQuery([
          { id: 'cp-me', copropriete_id: 'copro-1', user_id: 'user-1' },
        ]);
      }

      return new MockQuery([]);
    },
  })),
}));

describe('DocumentsPage (vue copropriétaire)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('n’affiche que les documents accessibles et masque les actions syndic', async () => {
    const { default: DocumentsPage } = await import('./page');

    render(await DocumentsPage({ searchParams: Promise.resolve({ dossier: 'folder-2026' }) }));

    expect(screen.getAllByText(/Jean-Pierre VERNAET/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Fabien TURPIN/i)).toBeNull();
    expect(screen.queryByTitle('Renommer')).toBeNull();
    expect(screen.queryByTitle('Déplacer')).toBeNull();
    expect(screen.queryByTitle('Supprimer')).toBeNull();
  });
});
