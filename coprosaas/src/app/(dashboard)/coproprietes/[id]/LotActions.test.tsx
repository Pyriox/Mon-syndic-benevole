// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
const pushMock = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
    push: pushMock,
  }),
}));

vi.mock('./actions', () => ({
  saveLot: vi.fn(),
  deleteLot: vi.fn(),
}));

describe('LotActions', () => {
  it('ne propose que l’identification du lot depuis la page copropriétés', async () => {
    const { default: LotActions } = await import('./LotActions');

    render(<LotActions coproprieteId="copro-1" showLabel />);

    fireEvent.click(screen.getByRole('button', { name: /Ajouter un lot/i }));

    expect(screen.getByLabelText(/Numéro \/ Nom du lot/i)).toBeTruthy();
    expect(screen.getByLabelText(/Type de lot/i)).toBeTruthy();
    expect(screen.getByText(/Les tantièmes généraux et les clés de répartition se règlent désormais dans la page/i)).toBeTruthy();
    expect(screen.queryByLabelText(/Bâtiment \/ entrée/i)).toBeNull();
    expect(screen.queryByLabelText(/Tantièmes généraux/i)).toBeNull();
  });
});
