// @vitest-environment jsdom

import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AppNotification } from '@/types';
import Header from './Header';

const refreshMock = vi.fn();
const setDashboardViewModeMock = vi.fn();

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
  });

  afterEach(() => {
    cleanup();
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
});