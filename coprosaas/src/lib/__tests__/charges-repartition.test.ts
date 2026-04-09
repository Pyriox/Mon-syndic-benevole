import { describe, expect, it } from 'vitest';

import {
  collectAvailableRepartitionGroups,
  parseBudgetPostesFromDescription,
  repartitionParPostes,
  type RepartitionLotLike,
  type RepartitionPosteInput,
} from '../utils';

const lots: RepartitionLotLike[] = [
  {
    id: 'lot-a1',
    numero: 'A1',
    tantiemes: 100,
    coproprietaire_id: 'copro-a',
    batiment: 'Bâtiment A',
    groupes_repartition: ['Ascenseur A'],
  },
  {
    id: 'lot-a2',
    numero: 'A2',
    tantiemes: 100,
    coproprietaire_id: 'copro-a',
    batiment: 'Bâtiment A',
    groupes_repartition: ['Ascenseur A'],
  },
  {
    id: 'lot-b1',
    numero: 'B1',
    tantiemes: 200,
    coproprietaire_id: 'copro-b',
    batiment: 'Bâtiment B',
    groupes_repartition: ['Ascenseur B'],
  },
];

describe('repartition spéciale par groupes', () => {
  it('liste les groupes disponibles à partir des bâtiments et groupes spéciaux des lots', () => {
    expect(collectAvailableRepartitionGroups(lots)).toEqual([
      'Ascenseur A',
      'Ascenseur B',
      'Bâtiment A',
      'Bâtiment B',
    ]);
  });

  it('cumule correctement un budget général et une sous-ligne spéciale bâtiment', () => {
    const postes: RepartitionPosteInput[] = [
      { libelle: 'Charges communes', montant: 120, repartition_type: 'generale', repartition_cible: null },
      { libelle: 'Entretien bâtiment A', montant: 80, repartition_type: 'groupe', repartition_cible: 'Bâtiment A' },
    ];

    const repartition = repartitionParPostes(200, lots, postes);

    expect(repartition).toEqual([
      expect.objectContaining({ copId: 'copro-a', tantiemes: 200, montant: 140 }),
      expect.objectContaining({ copId: 'copro-b', tantiemes: 200, montant: 60 }),
    ]);
  });

  it('retombe sur une répartition générale si aucun groupe spécial ne correspond', () => {
    const postes: RepartitionPosteInput[] = [
      { libelle: 'Budget prévisionnel', montant: 90, repartition_type: 'groupe', repartition_cible: 'Bâtiment C' },
    ];

    const repartition = repartitionParPostes(90, lots, postes);

    expect(repartition).toEqual([
      expect.objectContaining({ copId: 'copro-a', montant: 45 }),
      expect.objectContaining({ copId: 'copro-b', montant: 45 }),
    ]);
  });

  it('parse les postes JSON stockés avec leur clé spéciale éventuelle', () => {
    const postes = parseBudgetPostesFromDescription(JSON.stringify([
      { libelle: 'Charges communes', montant: 120 },
      { libelle: 'Ascenseur A', montant: 80, repartition_type: 'groupe', repartition_cible: 'Ascenseur A' },
      { libelle: '', montant: 0 },
    ]));

    expect(postes).toEqual([
      expect.objectContaining({ libelle: 'Charges communes', montant: 120, repartition_type: 'generale' }),
      expect.objectContaining({ libelle: 'Ascenseur A', montant: 80, repartition_type: 'groupe', repartition_cible: 'Ascenseur A' }),
    ]);
  });
});
