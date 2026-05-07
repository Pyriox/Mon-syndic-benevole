// ============================================================
// Templates e-mail — Confirmations d'abonnement
//
//  1. trial_started        : essai gratuit démarré (14 jours)
//  2. subscription_created : abonnement payant souscrit directement
//  3. trial_to_paid        : essai terminé, passage en payant
//  4. renewal              : renouvellement mensuel ou annuel
//  5. payment_failed       : paiement échoué
//  6. cancelled            : abonnement résilié
//  7. trial_ending_j3      : rappel 3 jours avant fin d'essai
//  8. trial_ending_j1      : dernier rappel veille de fin d'essai
// ============================================================

import { wrapEmail, h, formatDateFR, ctaButton, COLOR, CONTACT_EMAIL } from './base';

export interface SubscriptionEmailParams {
  prenom: string | null;
  coproprieteNom: string;
  planLabel: string;
  periodEnd: string | null; // ISO date
  dashboardUrl: string;
}

// ── Essai gratuit démarré ─────────────────────────────────────────────────────

export function buildTrialStartedSubject(coproprieteNom: string): string {
  return `Votre essai gratuit a commencé — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialStartedEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const deadlineStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai gratuit a commencé&nbsp;!</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre copropriété <strong>${h(coproprieteNom)}</strong> bénéficie de <strong>14 jours d'accès gratuit</strong> au plan <strong>${h(planLabel)}</strong>.
</p>
${deadlineStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Fin de l'essai</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${deadlineStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Aucun paiement ne sera prélevé avant la fin de l'essai. À l'issue des 14 jours, votre abonnement <strong>${h(planLabel)}</strong> démarrera automatiquement.
</p>`;

  return wrapEmail(content, COLOR.green, `14 jours d'accès gratuit — aucun prélèvement avant le ${deadlineStr || "terme de l'essai"}`);
}

// ── Abonnement souscrit directement (sans essai) ──────────────────────────────

export function buildSubscriptionCreatedSubject(coproprieteNom: string): string {
  return `Votre abonnement est activé — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildSubscriptionCreatedEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const renewStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Abonnement activé</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre abonnement <strong>${h(planLabel)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> est maintenant actif.
</p>
${renewStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Prochaine échéance d’abonnement</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.blue)}`;

  return wrapEmail(content, COLOR.blue, `Votre abonnement ${planLabel} est actif${renewStr ? ` — prochaine échéance le ${renewStr}` : ''}`);
}

// ── Essai terminé → abonnement payant ─────────────────────────────────────────

export function buildTrialToPaidSubject(coproprieteNom: string): string {
  return `Votre abonnement commence — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialToPaidEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const renewStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre abonnement commence</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre période d'essai est terminée. Votre abonnement <strong>${h(planLabel)}</strong> pour <strong>${h(coproprieteNom)}</strong> est maintenant actif et votre premier prélèvement a été effectué.
</p>
${renewStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Prochaine échéance d’abonnement</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.blue)}`;

  return wrapEmail(content, COLOR.blue, `Votre abonnement ${planLabel} est actif${renewStr ? ` — prochaine échéance le ${renewStr}` : ''}`);
}

// ── Renouvellement ────────────────────────────────────────────────────────────

export function buildRenewalSubject(coproprieteNom: string): string {
  return `Renouvellement de votre abonnement — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildRenewalEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const renewStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Abonnement renouvelé</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre abonnement <strong>${h(planLabel)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> a été renouvelé avec succès.
</p>
${renewStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Abonnement valable jusqu’au</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Pour gérer votre abonnement, rendez-vous dans votre espace syndic.
</p>`;

  return wrapEmail(content, COLOR.blue, `Votre abonnement ${planLabel} est renouvelé${renewStr ? ` jusqu'au ${renewStr}` : ''}`);
}

// ── Paiement échoué ────────────────────────────────────────────────────────────────────────────

export function buildPaymentFailedSubject(coproprieteNom: string): string {
  return `Paiement échoué — action requise — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildPaymentFailedEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.red}">Paiement échoué</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Nous n'avons pas pu débiter votre moyen de paiement pour la copropriété <strong>${h(coproprieteNom)}</strong>. Votre accès a été <strong>temporairement suspendu</strong>.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca">
  <tr>
    <td style="padding:14px 16px;font-size:13px;color:${COLOR.red};line-height:1.6">
      Pour réactiver votre accès, mettez à jour votre moyen de paiement dans votre espace syndic. Stripe retentera automatiquement le prélèvement après mise à jour.
    </td>
  </tr>
</table>

${ctaButton('Mettre à jour mon paiement →', `${dashboardUrl}?tab=billing`, COLOR.red)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  En cas de probleme, contactez-nous a <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.red, 'Action requise : votre paiement a échoué, mettez à jour votre moyen de paiement');
}

// ── Abonnement résilié ────────────────────────────────────────────────────────────────────

export function buildCancelledSubject(coproprieteNom: string): string {
  return `Votre abonnement a pris fin — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildCancelledEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre abonnement a pris fin</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'abonnement de la copropriété <strong>${h(coproprieteNom)}</strong> a été résilié. Votre accès a été désactivé.
</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Vos données (copropriétés, appels de fonds, documents) sont conservées. Vous pouvez souscrire un nouvel abonnement à tout moment.
</p>

${ctaButton('Réactiver mon abonnement →', `${dashboardUrl}`, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Des questions ? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.muted, 'Vos données sont conservées — vous pouvez vous réabonner à tout moment');
}

// ── Réactivation post-churn J+7 ───────────────────────────────────────────────

export interface ChurnReactivationEmailParams {
  prenom: string | null;
  coproprieteNom: string;
  planLabel: string;
  dashboardUrl: string;
  /** 'j7' = relance douce ; 'j30' = dernière chance avant suppression probable */
  kind: 'j7' | 'j30';
}

export function buildChurnReactivationSubject(coproprieteNom: string, kind: 'j7' | 'j30'): string {
  return kind === 'j30'
    ? `Vos données sont toujours là — revenez gérer ${coproprieteNom} — Mon Syndic Bénévole`
    : `Reprenez là où vous en étiez — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildChurnReactivationEmail(params: ChurnReactivationEmailParams): string {
  const { prenom, coproprieteNom, planLabel, dashboardUrl, kind } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const isJ30 = kind === 'j30';

  const intro = isJ30
    ? `Il y a un mois, votre abonnement pour la copropriété <strong>${h(coproprieteNom)}</strong> a pris fin. Vos données (appels de fonds, documents, copropriétaires) sont toujours conservées sur la plateforme.`
    : `La semaine dernière, votre abonnement pour la copropriété <strong>${h(coproprieteNom)}</strong> a pris fin. Nous espérons que votre départ était temporaire.`;

  const body = isJ30
    ? `Si vous gérez encore cette copropriété, il suffit de quelques secondes pour réactiver votre accès et retrouver exactement où vous en étiez.`
    : `La gestion de la copropriété continue — les appels de fonds, les convocations d'AG et les relances d'impayés n'attendent pas. Reprenez dès maintenant sans rien reconfigurer.`;

  const reassurance = `
<div style="margin:20px 0;padding:14px 16px;background:#f0fdf4;border-left:3px solid ${COLOR.green};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534">Vos données sont intactes</p>
  <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5">Copropriétaires, appels de fonds, documents et historique sont conservés. Aucune reconfiguration nécessaire.</p>
</div>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">
  ${isJ30 ? 'Vos données vous attendent' : 'Reprenez là où vous en étiez'}
</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">${intro}</p>
<p style="margin:0 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">${body}</p>

${reassurance}

${ctaButton('Réactiver mon abonnement →', dashboardUrl, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Plan <strong>${h(planLabel)}</strong> — sans engagement. Annulation possible à tout moment.
  Des questions ? <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(
    content,
    COLOR.green,
    isJ30
      ? 'Vos données sont toujours là — réactivez votre abonnement en quelques secondes'
      : 'Retrouvez vos copropriétaires, appels et documents exactement où vous les avez laissés',
  );
}

// ── Rappel J-7 avant fin d'essai ─────────────────────────────────────────────

export function buildTrialEndingJ7Subject(coproprieteNom: string): string {
  return `Votre essai se termine dans 7 jours — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialEndingJ7Email(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const deadlineStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai se termine dans 7 jours</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre période d'essai pour la copropriété <strong>${h(coproprieteNom)}</strong> se termine${deadlineStr ? ` le <strong>${deadlineStr}</strong>` : ' dans 7 jours'}. À cette date, votre abonnement <strong>${h(planLabel)}</strong> démarrera automatiquement.
</p>

${deadlineStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Fin de l'essai</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${deadlineStr}</td>
  </tr>
</table>` : ''}

<div style="margin:0 0 20px;padding:14px 16px;background:#f0fdf4;border-left:3px solid ${COLOR.green};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534">Vous n'avez rien à faire</p>
  <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5">Si vous êtes satisfait, votre abonnement <strong>${h(planLabel)}</strong> continuera sans interruption. Aucune action n'est requise.</p>
</div>

${ctaButton('Gérer mon abonnement →', dashboardUrl, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Vous pouvez modifier votre plan ou annuler à tout moment depuis votre espace syndic avant la fin de l'essai.
</p>`;

  return wrapEmail(content, COLOR.blue, `Votre essai se termine le ${deadlineStr || 'dans 7 jours'} — le plan ${planLabel} continuera automatiquement`);
}

// ── Rappel J-3 avant fin d'essai ─────────────────────────────────────────────────────────

export function buildTrialEndingSubject(coproprieteNom: string): string {
  return `Votre essai se termine dans 3 jours — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialEndingEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const deadlineStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai se termine dans 3 jours</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre période d'essai pour la copropriété <strong>${h(coproprieteNom)}</strong> se termine${deadlineStr ? ` le <strong>${deadlineStr}</strong>` : ' dans 3 jours'}. À cette date, votre abonnement <strong>${h(planLabel)}</strong> démarrera et votre premier prélèvement sera effectué.
</p>
${deadlineStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Fin de l'essai</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${deadlineStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Vous pouvez gérer ou annuler votre abonnement à tout moment depuis votre espace syndic avant la fin de l'essai.
</p>`;

  return wrapEmail(content, COLOR.amber, `Votre essai se termine le ${deadlineStr || 'dans 3 jours'} — le plan ${planLabel} démarrera automatiquement`);
}

// ── Résiliation programmée (cancel_at_period_end) ────────────────────────────

export function buildCancelScheduledSubject(coproprieteNom: string): string {
  return `Résiliation programmée de votre abonnement — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildCancelScheduledEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Résiliation programmée</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Nous avons bien pris en compte votre demande de résiliation. Votre abonnement <strong>${h(planLabel)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> restera actif jusqu'au ${endDateStr ? `<strong>${endDateStr}</strong>` : 'la fin de la période en cours'}, puis sera automatiquement résilié.
</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Vous pouvez annuler cette résiliation et conserver votre abonnement à tout moment depuis votre espace.
</p>
${endDateStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Fin d'accès prévue</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${endDateStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Annuler la résiliation →', `${dashboardUrl}/abonnement`, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Des questions ? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.amber, `Votre accès reste actif jusqu'au ${endDateStr || 'fin de période'}`);
}

// ── Rappel J-1 (veille) avant fin d'essai ────────────────────────────────────

export function buildTrialEndingJ1Subject(coproprieteNom: string): string {
  return `Votre essai se termine demain — dernière chance — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialEndingJ1Email(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const deadlineStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.red}">Votre essai se termine demain</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  La période d'essai de votre copropriété <strong>${h(coproprieteNom)}</strong> se termine <strong>demain${deadlineStr ? ` (${deadlineStr})` : ''}</strong>. Votre abonnement <strong>${h(planLabel)}</strong> démarrera automatiquement et le premier prélèvement sera effectué.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca">
  <tr>
    <td style="padding:14px 16px;font-size:13px;color:${COLOR.red};line-height:1.6">
      Si vous souhaitez <strong>annuler avant d'être prélevé</strong>, rendez-vous dès maintenant dans votre espace syndic → Abonnement.
    </td>
  </tr>
</table>

${ctaButton('Gérer mon abonnement →', `${dashboardUrl}/abonnement`, COLOR.red)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Sans action de votre part, l'abonnement <strong>${h(planLabel)}</strong> démarrera demain. Des questions ? <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.red, `Dernier rappel — votre essai se termine demain${deadlineStr ? ` le ${deadlineStr}` : ''}`);
}

// ── Relance checkout abandonné (J+1) ─────────────────────────────────────────
// Cible : utilisateurs ayant déclenché begin_checkout sans finaliser
// (abandon, 3D Secure échoué, fenêtre fermée).
// Idempotence via user_events (event_type: checkout_abandon_j1_reminder_sent).

export interface CheckoutAbandonEmailParams {
  prenom: string | null;
  coproprieteNom: string;
  abonnementUrl: string;
}

export function buildCheckoutAbandonSubject(): string {
  return 'Votre souscription est restée incomplète — Mon Syndic Bénévole';
}

export function buildCheckoutAbandonEmail(params: CheckoutAbandonEmailParams): string {
  const { prenom, coproprieteNom, abonnementUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre souscription est restée incomplète</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Vous avez commencé à souscrire un abonnement pour <strong>${h(coproprieteNom)}</strong>, mais la session de paiement n&rsquo;a pas pu être finalisée.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Cela arrive parfois : authentification 3D Secure expirée, fenêtre fermée au mauvais moment, connexion interrompue. Votre compte est intact et votre copropriété est toujours configurée.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        <strong>Essai 14 jours inclus</strong> — aucun paiement avant la fin de la période d&rsquo;essai
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        <strong>Résiliation libre</strong> — annulation possible à tout moment, sans engagement
      </p>
    </td>
  </tr>
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        <strong>Paiement sécurisé Stripe</strong> — carte, SEPA, Apple Pay, Google Pay
      </p>
    </td>
  </tr>
</table>

${ctaButton('Finaliser ma souscription →', abonnementUrl, COLOR.blue)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Un problème&nbsp;? Répondez directement à cet e-mail ou écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>. On vous aide.
</p>`;

  return wrapEmail(content, COLOR.blue, 'Votre essai de 14 jours vous attend — reprenez en 30 secondes.');
}

// ── Relance checkout abandonné (J+3) ─────────────────────────────────────────
// Dernier rappel avant d'arrêter les relances.
// Idempotence via user_events (event_type: checkout_abandon_j3_reminder_sent).

export function buildCheckoutAbandonJ3Subject(): string {
  return 'Dernier rappel — votre essai 14 jours est encore disponible — Mon Syndic Bénévole';
}

export function buildCheckoutAbandonJ3Email(params: CheckoutAbandonEmailParams): string {
  const { prenom, coproprieteNom, abonnementUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai est encore disponible</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a quelques jours, vous avez commencé à souscrire un abonnement pour <strong>${h(coproprieteNom)}</strong>. La session s&rsquo;est interrompue avant la fin.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  C&rsquo;est notre dernier rappel. Votre copropriété est toujours là, et l&rsquo;essai 14 jours est toujours inclus — aucun paiement avant la fin de la période.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;background:#f0f9ff;border:1px solid #bae6fd">
  <tr>
    <td style="padding:16px;font-size:14px;color:${COLOR.text};line-height:1.6">
      <p style="margin:0 0 8px;font-weight:700;color:${COLOR.blue}">Votre espace syndic vous permet de&nbsp;:</p>
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr><td style="padding:3px 0;font-size:13px;color:${COLOR.text}"><span style="color:${COLOR.blue};font-weight:700;margin-right:6px">→</span>Envoyer les appels de fonds automatiquement à chaque copropriétaire</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:${COLOR.text}"><span style="color:${COLOR.blue};font-weight:700;margin-right:6px">→</span>Relancer les impayés sans intervention manuelle</td></tr>
        <tr><td style="padding:3px 0;font-size:13px;color:${COLOR.text}"><span style="color:${COLOR.blue};font-weight:700;margin-right:6px">→</span>Convoquer et envoyer les PV d&rsquo;AG en un clic</td></tr>
      </table>
    </td>
  </tr>
</table>

${ctaButton('Démarrer mon essai gratuit →', abonnementUrl, COLOR.blue)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Une question sur la souscription&nbsp;? Répondez à cet e-mail, on vous répond personnellement.<br>
  Si vous ne souhaitez pas continuer, aucun problème — votre compte reste accessible.
</p>`;

  return wrapEmail(content, COLOR.blue, 'Dernier rappel — votre essai 14 jours est toujours disponible, sans engagement.');
}
