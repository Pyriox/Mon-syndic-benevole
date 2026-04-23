// @vitest-environment jsdom

import { render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const pathnameState = { value: '/dashboard' };

vi.mock('next/navigation', () => ({
  usePathname: () => pathnameState.value,
}));

describe('ActivityHeartbeat', () => {
  const fetchMock = vi.fn();
  let nowMs = Date.parse('2026-04-23T12:00:00.000Z');

  beforeEach(() => {
    vi.resetModules();
    sessionStorage.clear();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(Date, 'now').mockImplementation(() => nowMs);
    pathnameState.value = '/dashboard';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('rafraîchit l’activité sur interaction même sans navigation', async () => {
    const { default: ActivityHeartbeat } = await import('./ActivityHeartbeat');
    render(<ActivityHeartbeat />);

    expect(fetchMock).toHaveBeenCalledTimes(1);

    nowMs += 6 * 60 * 1000;
    window.dispatchEvent(new Event('pointerdown'));

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});