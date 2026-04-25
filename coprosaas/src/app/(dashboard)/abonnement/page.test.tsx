// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

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
    selectedCoproId: 'copro-2',
    role: 'syndic',
    copro: {
      id: 'copro-2',
      nom: 'Résidence Beta',
      syndic_id: 'user-1',
      plan: 'inactif',
      plan_id: null,
    },
  })),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({ data: { user: { id: 'user-1' } } }),
    },
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

  in(column: string, values: unknown[]) {
    this.rows = this.rows.filter((row) => values.includes(row[column]));
    return this;
  }

  order(column: string) {
    this.rows = [...this.rows].sort((a, b) => String(a[column] ?? '').localeCompare(String(b[column] ?? '')));
    return this;
  }

  limit(count: number) {
    this.rows = this.rows.slice(0, count);
    return this;
  }

  async maybeSingle() {
    return { data: this.rows[0] ?? null, error: null };
  }

  async single() {
    return { data: this.rows[0] ?? null, error: null };
  }

  then(resolve: (value: { data: Row[]; error: null }) => unknown) {
    return Promise.resolve(resolve({ data: this.rows, error: null }));
  }
}

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      if (table === 'coproprietes') {
        return new MockQuery([
          {
            id: 'copro-1',
            nom: 'Résidence Alpha',
            syndic_id: 'user-1',
            stripe_customer_id: 'cus_alpha',
            stripe_subscription_id: 'sub_alpha',
            plan: 'actif',
            plan_id: 'essentiel',
            plan_period_end: '2026-12-31',
          },
          {
            id: 'copro-2',
            nom: 'Résidence Beta',
            syndic_id: 'user-1',
            stripe_customer_id: null,
            stripe_subscription_id: null,
            plan: 'inactif',
            plan_id: null,
            plan_period_end: null,
          },
        ]);
      }

      if (table === 'lots') {
        return new MockQuery([
          { copropriete_id: 'copro-1' },
          { copropriete_id: 'copro-1' },
          { copropriete_id: 'copro-2' },
        ]);
      }

      if (table === 'copro_addons') {
        return new MockQuery([]);
      }

      return new MockQuery([]);
    },
  })),
}));

vi.mock('@/lib/stripe', () => ({
  STRIPE_ADDON_PRICES: { charges_speciales: null },
  stripe: {
    prices: {
      retrieve: vi.fn(),
    },
  },
  extractStripeSubscriptionSnapshot: vi.fn(),
  mapStripeSubscriptionStatus: vi.fn(),
}));

vi.mock('@/lib/stripe-addon-management', () => ({
  syncCoproAddonsFromSnapshot: vi.fn(),
}));

vi.mock('@/lib/subscription', () => ({
  hasChargesSpecialesAddon: vi.fn(() => false),
}));

vi.mock('./CheckoutButton', () => ({
  default: () => <button type="button">Choisir</button>,
}));

vi.mock('./AddonBillingButton', () => ({
  default: () => <button type="button">Gérer l’option</button>,
}));


describe('AbonnementPage', () => {
  it('n’affiche que la copropriété sélectionnée quand le syndic en gère plusieurs', async () => {
    const { default: AbonnementPage } = await import('./page');

    render(await AbonnementPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole('heading', { name: /Résidence Beta/i })).not.toBeNull();
    expect(screen.queryByRole('heading', { name: /Résidence Alpha/i })).toBeNull();
  });
});
