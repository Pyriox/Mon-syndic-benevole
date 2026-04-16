import { describe, expect, it } from 'vitest';

import { buildAppelEmail, buildAppelEmailSubject } from '../emails/appel-de-fonds';
import { buildSyndicImpayesRecapEmail, buildSyndicImpayesRecapSubject } from '../emails/syndic-notifications';

describe('appel email reminders', () => {
  it('construit un objet et un contenu adaptés pour la relance J+1', () => {
    const subject = buildAppelEmailSubject({
      type: 'rappel_j1',
      coproprieteNom: '23 Abbé Léon Spariat',
      dateEcheance: '2026-04-10',
    });

    const html = buildAppelEmail({
      type: 'rappel_j1',
      prenom: 'Fabien',
      nom: 'Turpin',
      coproprieteNom: '23 Abbé Léon Spariat',
      titre: 'Appel T2',
      montantDu: 242.1,
      dateEcheance: '2026-04-10',
    });

    expect(subject).toMatch(/Relance/i);
    expect(subject).toMatch(/Échéance 10 avril 2026/i);
    expect(html).toMatch(/échéance.*dépassée/i);
    expect(html).toMatch(/242,10\s?€/i);
  });

  it('construit un récapitulatif syndic des impayés à J0', () => {
    const subject = buildSyndicImpayesRecapSubject('23 Abbé Léon Spariat', 'Appel test', 2);
    const html = buildSyndicImpayesRecapEmail({
      syndicPrenom: 'Fabien',
      coproprieteNom: '23 Abbé Léon Spariat',
      appelTitre: 'Appel test',
      dateEcheance: '2026-04-11',
      appelsUrl: 'https://www.mon-syndic-benevole.fr/appels-de-fonds',
      impayes: [
        { nom: 'Fabien Turpin', montantDu: 242.1 },
        { nom: 'Catherine Belloc', montantDu: 88.45 },
      ],
    });

    expect(subject).toMatch(/impayés/i);
    expect(subject).toMatch(/Appel test/i);
    expect(html).toMatch(/Fabien Turpin/i);
    expect(html).toMatch(/Catherine Belloc/i);
    expect(html).toMatch(/oubli de cocher|vérifiez/i);
  });

  it('remplace la mise en demeure par un rappel d’impayé non juridique', () => {
    const subject = buildAppelEmailSubject({
      type: 'mise_en_demeure',
      coproprieteNom: 'Résidence du Parc',
      dateEcheance: '2026-04-10',
    });

    const html = buildAppelEmail({
      type: 'mise_en_demeure',
      prenom: 'Camille',
      nom: 'Martin',
      coproprieteNom: 'Résidence du Parc',
      titre: 'Appel T2',
      montantDu: 120,
      dateEcheance: '2026-04-10',
    });

    expect(subject).toMatch(/Rappel d'impayé/i);
    expect(subject).not.toMatch(/Mise en demeure/i);
    expect(html).toMatch(/paiement non encore enregistré|ignorez ce message/i);
    expect(html).not.toMatch(/ordre du jour/i);
  });
});
