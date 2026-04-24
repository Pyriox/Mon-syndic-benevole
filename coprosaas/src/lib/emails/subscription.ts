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
