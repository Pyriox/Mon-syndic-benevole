// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '@/types';
import Header from './Header';

const refreshMock = vi.fn();
const setDashboardViewModeMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

vi.mock('next/link', () => ({
  default: ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => <a {...props}>{children}</a>,
}));

vi.mock('@/lib/actions/set-dashboard-view-mode', () => ({
  setDashboardViewMode: (...args: unknown[]) => setDashboardViewModeMock(...args),
}));

describe('Header view switch', () => {
  beforeEach(() => {
    refreshMock.mockReset();
    setDashboardViewModeMock.mockReset();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('affiche un chargement pendant le switch de vue puis relance le refresh', async () => {
    let resolveSwitch: (() => void) | null = null;
    setDashboardViewModeMock.mockImplementation(
      () => new Promise<void>((resolve) => {
        resolveSwitch = resolve;
      })
    );

    const notifications: AppNotification[] = [];
    const user = userEvent.setup();

    const { rerender } = render(
      <Header
        title="Tableau de bord"
        userRole="syndic"
        availableViewRoles={['syndic', 'copropriétaire']}
        notifications={notifications}
      />
    );

    await user.click(screen.getByRole('button', { name: /copropriétaire/i }));

    expect(setDashboardViewModeMock).toHaveBeenCalledWith('coproprietaire');
    expect(screen.getByText(/chargement de la vue copropriétaire/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /syndic/i }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: /copropriétaire/i }).hasAttribute('disabled')).toBe(true);

    resolveSwitch?.();

    await waitFor(() => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    rerender(
      <Header
        title="Tableau de bord"
        userRole="copropriétaire"
        availableViewRoles={['syndic', 'copropriétaire']}
        notifications={notifications}
      />
    );

    await waitFor(() => {
      expect(screen.queryByText(/chargement de la vue copropriétaire/i)).toBeNull();
    });
  });

  it('classe les notifications dans urgent, a traiter et info', async () => {
    const user = userEvent.setup();
    const notifications: AppNotification[] = [
      {
        id: 'dynamic-incident',
        type: 'incident',
        label: 'Fuite urgente',
        sublabel: 'Intervention immediate necessaire',
        href: '/incidents',
        severity: 'danger',
        source: 'dynamic',
        canMarkRead: false,
      },
      {
        id: 'dynamic-ag',
        type: 'ag',
        label: 'PV a envoyer',
        sublabel: 'AG du 12 avril',
        href: '/assemblees',
        severity: 'warning',
        source: 'dynamic',
        canMarkRead: false,
      },
      {
        id: 'persisted-1',
        type: 'appel_fonds',
        title: 'Avis envoyes',
        body: '12 avis envoyes',
        href: '/appels-de-fonds',
        severity: 'info',
        source: 'persistent',
        canMarkRead: true,
        isRead: false,
        createdAt: '2026-04-21T10:00:00.000Z',
      },
    ];

    render(
      <Header
        title="Tableau de bord"
        userRole="syndic"
        availableViewRoles={['syndic']}
        notifications={notifications}
      />
    );

    await user.click(screen.getByRole('button', { name: /notifications : 3 non lues/i }));

    expect(screen.getByText(/^urgent$/i)).toBeTruthy();
    expect(screen.getByText(/^à traiter$/i)).toBeTruthy();
    expect(screen.getByText(/^info$/i)).toBeTruthy();
    expect(screen.getByText(/actions prioritaires/i)).toBeTruthy();
    expect(screen.getByText(/actions à suivre/i)).toBeTruthy();
    expect(screen.getByText(/historique récent/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /tout marquer lu/i })).toBeTruthy();
  });

  it('ne marque pas en lu une alerte dynamique lors du clic', async () => {
    const user = userEvent.setup();
    const notifications: AppNotification[] = [
      {
        id: 'dynamic-ag',
        type: 'ag',
        label: 'PV a envoyer',
        sublabel: 'AG du 12 avril',
        href: '/assemblees',
        severity: 'warning',
        source: 'dynamic',
        canMarkRead: false,
      },
    ];

    render(
      <Header
        title="Tableau de bord"
        userRole="syndic"
        availableViewRoles={['syndic']}
        notifications={notifications}
      />
    );

    await user.click(screen.getByRole('button', { name: /notifications : 1 non lue/i }));
    await user.click(screen.getByRole('link', { name: /pv a envoyer/i }));

    expect(fetchMock).not.toHaveBeenCalled();
  });
});