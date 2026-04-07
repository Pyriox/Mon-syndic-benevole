// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const eqMock = vi.fn();
const deleteMock = vi.fn(() => ({ eq: eqMock }));
const fromMock = vi.fn(() => ({ delete: deleteMock }));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: vi.fn(),
  }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: fromMock,
  }),
}));

describe('ResolutionDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    eqMock.mockResolvedValue({ error: null });
  });

  it('affiche une modale de confirmation avant de supprimer une résolution', async () => {
    const onDeleted = vi.fn();
    const { ResolutionDelete } = await import('./ResolutionActions');

    render(<ResolutionDelete resolutionId="resolution-1" onDeleted={onDeleted} />);

    fireEvent.click(screen.getByTitle('Supprimer'));

    expect(screen.getByText(/Voulez-vous vraiment supprimer cette résolution/i)).not.toBeNull();
    expect(eqMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Supprimer définitivement/i }));

    await waitFor(() => {
      expect(eqMock).toHaveBeenCalledWith('id', 'resolution-1');
    });
    expect(onDeleted).toHaveBeenCalledWith('resolution-1');
  });
});
