// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

const refreshMock = vi.fn();
const saveMock = vi.fn().mockResolvedValue({});

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: refreshMock,
  }),
}));

vi.mock('./actions', () => ({
  saveCoproprieteSettings: (...args: unknown[]) => saveMock(...args),
}));

describe('CoproSettingsPanel', () => {
  afterEach(() => {
    cleanup();
  });

  const copropriete = {
    id: 'copro-1',
    nom: 'Résidence des Lilas',
    adresse: '12 rue des Fleurs',
    code_postal: '83000',
    ville: 'Toulon',
  };

  const initialLots = [
    {
      id: 'lot-1',
      numero: '01-RDC',
      type: 'appartement',
      tantiemes: 150,
      coproprietaire_id: 'cp-1',
      batiment: 'Bâtiment A',
      groupes_repartition: ['Ascenseur'],
      tantiemes_groupes: { Ascenseur: 150 } as Record<string, number>,
    },
    {
      id: 'lot-2',
      numero: '03-1ER',
      type: 'appartement',
      tantiemes: 120,
      coproprietaire_id: 'cp-2',
      batiment: 'Bâtiment A',
      groupes_repartition: [],
      tantiemes_groupes: {} as Record<string, number>,
    },
  ];

  const coproMap = {
    'cp-1': { prenom: 'Jean', nom: 'Martin', raison_sociale: null },
    'cp-2': { prenom: 'Claire', nom: 'Durand', raison_sociale: null },
  };

  it('affiche un état de brouillon quand des modifications ne sont pas enregistrées', async () => {
    const { default: CoproSettingsPanel } = await import('./CoproSettingsPanel');

    render(
      <CoproSettingsPanel
        copropriete={copropriete}
        initialLots={initialLots}
        coproMap={coproMap}
      />,
    );

    expect(screen.getByText(/Aucun changement en attente/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Fiche copropriété/i }));

    fireEvent.change(screen.getByLabelText(/Nom de la copropriété/i), {
      target: { value: 'Résidence des Lilas — B' },
    });

    expect(screen.getByText(/Modifications non enregistrées/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Enregistrer les modifications/i })).toBeTruthy();
    expect(screen.getByText(/Enregistrez avant de quitter cette page/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Annuler mes modifications/i })).toBeTruthy();
  });

  it('ouvre une modale in-app avant de quitter la page avec des changements non enregistrés', async () => {
    const { default: CoproSettingsPanel } = await import('./CoproSettingsPanel');

    render(
      <CoproSettingsPanel
        copropriete={copropriete}
        initialLots={initialLots}
        coproMap={coproMap}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /Fiche copropriété/i }));
    fireEvent.change(screen.getByLabelText(/Nom de la copropriété/i), {
      target: { value: 'Résidence des Lilas — B' },
    });

    const link = document.createElement('a');
    link.href = '/dashboard';
    link.textContent = 'Retour au tableau de bord';
    document.body.appendChild(link);

    fireEvent.click(link);

    expect(screen.getByText(/Vous avez des modifications non enregistrées/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /Rester sur la page/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Quitter sans enregistrer/i })).toBeTruthy();
  });

  it('permet de filtrer les lots et d’ajouter manuellement une clé spéciale', async () => {
    const { default: CoproSettingsPanel } = await import('./CoproSettingsPanel');

    render(
      <CoproSettingsPanel
        copropriete={copropriete}
        initialLots={initialLots}
        coproMap={coproMap}
      />,
    );

    fireEvent.change(screen.getByPlaceholderText(/Rechercher un lot/i), {
      target: { value: '03-1ER' },
    });

    expect(screen.getByText('03-1ER')).toBeTruthy();
    expect(screen.queryByText('01-RDC')).toBeNull();
    expect(screen.queryByRole('button', { name: /^Ascenseur$/i })).toBeNull();

    fireEvent.change(screen.getByLabelText(/Ajouter une clé spéciale/i), {
      target: { value: 'Local vélos' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Ajouter la clé/i }));

    expect(screen.getByText(/Local vélos · base 0/i)).toBeTruthy();
  });

  it('bascule réellement entre la répartition et la fiche copropriété', async () => {
    const { default: CoproSettingsPanel } = await import('./CoproSettingsPanel');

    render(
      <CoproSettingsPanel
        copropriete={copropriete}
        initialLots={initialLots}
        coproMap={coproMap}
      />,
    );

    expect(screen.getByPlaceholderText(/Rechercher un lot/i)).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Fiche copropriété/i }));

    expect(screen.queryByPlaceholderText(/Rechercher un lot/i)).toBeNull();
    expect(screen.getByLabelText(/Nom de la copropriété/i)).toBeTruthy();
  });
});
