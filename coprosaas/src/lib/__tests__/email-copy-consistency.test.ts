import { describe, expect, it } from 'vitest';

import { buildTrialToPaidEmail } from '../emails/subscription';
import { buildAGReminderEmail } from '../emails/ag-reminders';

describe('email copy consistency', () => {
  it('utilise un libellé d’échéance d’abonnement cohérent et masque les dates invalides', () => {
    const withDate = buildTrialToPaidEmail({
      prenom: 'Fabien',
      coproprieteNom: '23 Abbé Léon Spariat',
      planLabel: 'Essentiel',
      periodEnd: '2026-05-11',
      dashboardUrl: 'https://www.mon-syndic-benevole.fr/abonnement',
    });

    const withoutValidDate = buildTrialToPaidEmail({
      prenom: 'Fabien',
      coproprieteNom: '23 Abbé Léon Spariat',
      planLabel: 'Essentiel',
      periodEnd: 'invalid-date',
      dashboardUrl: 'https://www.mon-syndic-benevole.fr/abonnement',
    });

    expect(withDate).toContain('Prochaine échéance d’abonnement');
    expect(withDate).not.toContain('Renouvellement de la chaîne de production');
    expect(withoutValidDate).not.toContain('Date invalide');
  });

  it('garde un français naturel et accentué dans les rappels AG', () => {
    const html = buildAGReminderEmail({
      prenom: 'Jean',
      nom: 'Dupont',
      coproprieteNom: 'Résidence du Parc',
      agTitre: 'AG ordinaire 2026',
      dateAg: '2026-05-12',
      lieu: 'Hall A',
      kind: 'unopened',
      agUrl: 'https://www.mon-syndic-benevole.fr/assemblees',
    });

    expect(html).toContain('Convocation AG en attente de lecture');
    expect(html).toContain('Nous vous relançons');
    expect(html).toContain('assemblée générale');
    expect(html).toContain("Voir le détail de l'AG");
  });
});
