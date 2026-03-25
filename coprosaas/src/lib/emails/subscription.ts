// ============================================================
// Templates e-mail — Confirmations d'abonnement
//
//  1. trial_started        : essai gratuit démarré (14 jours)
//  2. subscription_created : abonnement payant souscrit directement
//  3. trial_to_paid        : essai terminé, passage en payant
//  4. renewal              : renouvellement mensuel ou annuel
// ============================================================

import { wrapEmail, h, formatDateFR, ctaButton, COLOR } from './base';

export interface SubscriptionEmailParams {
  prenom: string | null;
  coproprieteNom: string;
  planLabel: string;
  periodEnd: string | null; // ISO date
  dashboardUrl: string;
}

// ── Essai gratuit démarré ─────────────────────────────────────────────────────

export function buildTrialStartedSubject(coproprieteNom: string): string {
  return `Votre essai gratuit a commencé — ${coproprieteNom}`;
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

${ctaButton('Accéder à mon espace →', dashboardUrl, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Aucun paiement ne sera prélevé avant la fin de l'essai. À l'issue des 14 jours, votre abonnement <strong>${h(planLabel)}</strong> démarrera automatiquement.
</p>`;

  return wrapEmail(content, COLOR.green);
}

// ── Abonnement souscrit directement (sans essai) ──────────────────────────────

export function buildSubscriptionCreatedSubject(coproprieteNom: string): string {
  return `Votre abonnement est activé — ${coproprieteNom}`;
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
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Prochain renouvellement</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace →', dashboardUrl, COLOR.blue)}`;

  return wrapEmail(content, COLOR.blue);
}

// ── Essai terminé → abonnement payant ─────────────────────────────────────────

export function buildTrialToPaidSubject(coproprieteNom: string): string {
  return `Votre abonnement commence — ${coproprieteNom}`;
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
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Prochain renouvellement</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace →', dashboardUrl, COLOR.blue)}`;

  return wrapEmail(content, COLOR.blue);
}

// ── Renouvellement ────────────────────────────────────────────────────────────

export function buildRenewalSubject(coproprieteNom: string): string {
  return `Renouvellement de votre abonnement — ${coproprieteNom}`;
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
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Valable jusqu'au</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace →', dashboardUrl, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Pour gérer votre abonnement, rendez-vous dans votre espace membre.
</p>`;

  return wrapEmail(content, COLOR.blue);
}
