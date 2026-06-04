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
<h1 style="margin:0 0 4px;font-size:22px;font-weight:700;color:${COLOR.text}">Bienvenue parmi nos abonnés !</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre essai est terminé et votre abonnement <strong>${h(planLabel)}</strong> pour <strong>${h(coproprieteNom)}</strong> est maintenant actif. Merci de nous faire confiance pour la gestion de votre copropriété.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Tout ce que vous avez configuré pendant l&rsquo;essai continue sans interruption :
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f0fdf4">
    <td style="padding:11px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">&#10003;</span>&nbsp; <strong>Relances automatiques</strong> — impayés suivis à J−7, J+3 et J+15
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:11px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">&#10003;</span>&nbsp; <strong>Convocations AG</strong> — envoi en un clic + rappels J−14 et J−7
      </p>
    </td>
  </tr>
  <tr style="background:#f0fdf4">
    <td style="padding:11px 16px">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">&#10003;</span>&nbsp; <strong>Documents et espaces copropriétaires</strong> — accessibles 24h/24 sans vous solliciter
      </p>
    </td>
  </tr>
</table>

${renewStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Prochaine échéance d&rsquo;abonnement</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${renewStr}</td>
  </tr>
</table>` : ''}

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Des questions ? <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>
</p>`;

  return wrapEmail(content, COLOR.green, `Abonnement ${planLabel} actif — tout continue, rien à reconfigurer${renewStr ? ` — prochaine échéance le ${renewStr}` : ''}`);
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
  En cas de problème, contactez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.red, 'Action requise : votre paiement a échoué, mettez à jour votre moyen de paiement');
}

// ── Dunning J+3 — paiement toujours en échec ─────────────────────────────────
// Envoyé 3 jours après invoice.payment_failed si le plan est toujours 'passe_du'.
// Idempotence via user_events (event_type: dunning_j3_sent).

export function buildPaymentFailedJ3Subject(coproprieteNom: string): string {
  return `Votre accès est suspendu — régularisez votre paiement — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildPaymentFailedJ3Email(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.red}">Votre accès est toujours suspendu</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a 3 jours, le prélèvement de votre abonnement pour <strong>${h(coproprieteNom)}</strong> a échoué. Votre accès est suspendu depuis lors.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Vos données sont intactes — copropriétaires, appels de fonds, documents. Mais tant que votre moyen de paiement n'est pas mis à jour, vous ne pouvez pas accéder à votre espace ni envoyer de notifications à vos copropriétaires.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca">
  <tr>
    <td style="padding:14px 16px;font-size:13px;color:${COLOR.red};line-height:1.6">
      Mettez à jour votre carte ou votre IBAN depuis votre espace syndic. Stripe retentera le prélèvement automatiquement après mise à jour.
    </td>
  </tr>
</table>

${ctaButton('Mettre à jour mon paiement →', `${dashboardUrl}?tab=billing`, COLOR.red)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Un problème&nbsp;? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.red, '3 jours sans accès — mettez à jour votre paiement pour réactiver votre espace');
}

// ── Dunning J+7 — dernière relance avant suspension définitive ────────────────
// Envoyé 7 jours après invoice.payment_failed si le plan est toujours 'passe_du'.
// Idempotence via user_events (event_type: dunning_j7_sent).

export function buildPaymentFailedJ7Subject(coproprieteNom: string): string {
  return `Dernier rappel — votre abonnement va être annulé — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildPaymentFailedJ7Email(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.red}">Votre abonnement va être annulé</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Cela fait <strong>7 jours</strong> que le prélèvement de votre abonnement pour <strong>${h(coproprieteNom)}</strong> a échoué. Si aucune action n'est entreprise dans les prochaines heures, votre abonnement sera définitivement annulé.
</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca">
  <tr>
    <td style="padding:14px 16px">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:${COLOR.red}">Ce qui se passe si vous n'agissez pas</p>
      <p style="margin:0;font-size:13px;color:${COLOR.red};line-height:1.6">
        Votre abonnement sera résilié. Vos données seront conservées temporairement, mais vous ne pourrez plus envoyer d'appels de fonds, de convocations ni de rappels à vos copropriétaires.
      </p>
    </td>
  </tr>
</table>

${ctaButton('Régulariser mon paiement maintenant →', `${dashboardUrl}?tab=billing`, COLOR.red)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Si vous rencontrez des difficultés, écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>. On vous aide.
</p>`;

  return wrapEmail(content, COLOR.red, 'Dernière chance — régularisez votre paiement pour éviter la résiliation');
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
  Vos données (copropriétés, appels de fonds, documents) sont conservées pendant 30 jours.
</p>

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
  /** 'j7' = relance douce ; 'j14' = urgence médium ; 'j30' = dernière chance avant suppression probable */
  kind: 'j7' | 'j14' | 'j30';
  unsubscribeUrl?: string;
}

export function buildChurnReactivationSubject(coproprieteNom: string, kind: 'j7' | 'j14' | 'j30'): string {
  if (kind === 'j30') return `Vos données sont toujours là — revenez gérer ${coproprieteNom} — Mon Syndic Bénévole`;
  if (kind === 'j14') return `Revenez avant que votre copropriété ne décroche — ${coproprieteNom} — Mon Syndic Bénévole`;
  return `Reprenez là où vous en étiez — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildChurnReactivationEmail(params: ChurnReactivationEmailParams): string {
  const { prenom, coproprieteNom, planLabel, dashboardUrl, kind, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const isJ30 = kind === 'j30';
  const isJ14 = kind === 'j14';

  const intro = isJ30
    ? `Il y a un mois, votre abonnement pour la copropriété <strong>${h(coproprieteNom)}</strong> a pris fin. Vos données (appels de fonds, documents, copropriétaires) sont toujours conservées sur la plateforme.`
    : isJ14
      ? `Il y a deux semaines, votre abonnement pour la copropriété <strong>${h(coproprieteNom)}</strong> a pris fin. Votre espace est toujours intact — copropriétaires, historique et documents sont là où vous les avez laissés.`
      : `La semaine dernière, votre abonnement pour la copropriété <strong>${h(coproprieteNom)}</strong> a pris fin. Nous espérons que votre départ était temporaire.`;

  const body = isJ30
    ? `Si vous gérez encore cette copropriété, il suffit de quelques secondes pour réactiver votre accès et retrouver exactement où vous en étiez.`
    : isJ14
      ? `Reprendre prend moins de 30 secondes. Tout ce que vous avez configuré est encore présent — aucune reconfiguration nécessaire. Pendant votre absence, les relances automatiques et les notifications ne partent plus. Plus longtemps vous attendez, plus vos copropriétaires gèrent dans l’incertitude.`
      : `La gestion de la copropriété continue — les appels de fonds, les convocations d'AG et les relances d'impayés n'attendent pas. Reprenez dès maintenant sans rien reconfigurer.`;

  const reassurance = `
<div style="margin:20px 0;padding:14px 16px;background:#f0fdf4;border-left:3px solid ${COLOR.green};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534">Vos données sont intactes</p>
  <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5">Copropriétaires, appels de fonds, documents et historique sont conservés. Aucune reconfiguration nécessaire.</p>
</div>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">
  ${isJ30 ? 'Vos données vous attendent' : isJ14 ? 'Votre copropriété a besoin de vous' : 'Reprenez là où vous en étiez'}
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
      : isJ14
        ? 'Reprenez en 30 secondes — vos données et votre configuration sont intactes'
        : 'Retrouvez vos copropriétaires, appels et documents exactement où vous les avez laissés',
    unsubscribeUrl,
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
  Votre essai pour <strong>${h(coproprieteNom)}</strong> se termine${deadlineStr ? ` le <strong>${deadlineStr}</strong>` : ' dans 7 jours'}.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Dans 7 jours, votre abonnement <strong>${h(planLabel)}</strong> démarre automatiquement${deadlineStr ? ` (le <strong>${deadlineStr}</strong>)` : ''}. Vous n'avez rien à faire pour continuer.
</p>

${ctaButton('Vérifier mon abonnement →', dashboardUrl, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Vous pouvez modifier votre plan ou annuler à tout moment depuis votre espace syndic avant la fin de l'essai.
</p>`;

  return wrapEmail(content, COLOR.blue, `Votre essai se termine le ${deadlineStr || 'dans 7 jours'} — tout ce que vous avez configuré continue sans interruption`);
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
  return `Votre accès reste actif — résiliation confirmée — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildCancelScheduledEmail(params: SubscriptionEmailParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Résiliation confirmée</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Nous avons bien pris en compte votre demande. Votre abonnement <strong>${h(planLabel)}</strong> pour <strong>${h(coproprieteNom)}</strong> reste entièrement actif jusqu&rsquo;au ${endDateStr ? `<strong>${endDateStr}</strong>` : 'la fin de la période en cours'}.
</p>

${endDateStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fff7ed;border:1px solid #fed7aa">
  <tr>
    <td style="padding:14px 16px;text-align:center">
      <p style="margin:0 0 2px;font-size:12px;color:#9a3412;text-transform:uppercase;letter-spacing:0.05em">Fin d&rsquo;accès prévue</p>
      <p style="margin:0;font-size:20px;font-weight:700;color:#c2410c">${endDateStr}</p>
    </td>
  </tr>
</table>` : ''}

<p style="margin:0 0 8px;font-size:13px;font-weight:600;color:${COLOR.text}">Jusqu&rsquo;à cette date, vous continuez à bénéficier de&nbsp;:</p>
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f8fafc">
    <td style="padding:10px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">✓</span>&nbsp; Relances automatiques des impayés
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:10px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">✓</span>&nbsp; Convocations AG + rappels automatiques J&minus;14 et J&minus;7
      </p>
    </td>
  </tr>
  <tr style="background:#f8fafc">
    <td style="padding:10px 16px">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.green};font-weight:700">✓</span>&nbsp; Espace documents accessible à vos copropriétaires
      </p>
    </td>
  </tr>
</table>

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Des questions ? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.amber, `Votre accès est actif jusqu'au ${endDateStr || 'fin de période'}`);
}

// ── Relance J-30 avant fin d'abonnement annuel (cancel_at_period_end) ─────────
// Cible : plan='actif', plan_cancel_at_period_end=true, plan_period_end dans 30j.
// Idempotence via user_events (event_type: cancel_renewal_j30_sent).

export interface CancelRenewalParams extends SubscriptionEmailParams {
  isLongTimeUser?: boolean; // ancienneté > 6 mois — J-3 uniquement
  unsubscribeUrl?: string;
}

export function buildCancelRenewalJ30Subject(coproprieteNom: string): string {
  return `Il vous reste 1 mois — votre abonnement ${coproprieteNom} expire bientôt — Mon Syndic Bénévole`;
}

export function buildCancelRenewalJ30Email(params: CancelRenewalParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Il vous reste 1 mois</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre abonnement <strong>${h(planLabel)}</strong> pour <strong>${h(coproprieteNom)}</strong> se termine${endDateStr ? ` le <strong>${endDateStr}</strong>` : ' dans 30 jours'}. Après cette date, ces automatisations s&rsquo;arrêtent&nbsp;:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#fef2f2">
    <td style="padding:10px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; Relances automatiques impayés (J&minus;7, J+3, J+15)
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:10px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; Rappels automatiques AG à J&minus;14 et J&minus;7
      </p>
    </td>
  </tr>
  <tr style="background:#fef2f2">
    <td style="padding:10px 16px">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.5">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; Espace documents copropriétaires
      </p>
    </td>
  </tr>
</table>

<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Réactivez le renouvellement automatique maintenant — cela prend 10 secondes depuis votre espace.
</p>

${ctaButton('Réactiver le renouvellement automatique →', `${dashboardUrl}/abonnement`, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Vous pouvez annuler de nouveau à tout moment, sans engagement.
</p>`;

  return wrapEmail(content, COLOR.amber, `Dans 30 jours, les relances et convocations automatiques s'arrêtent — réactivez en 10 secondes`, unsubscribeUrl);
}

// ── Relance J-7 avant fin d'abonnement annuel ─────────────────────────────────
// Idempotence via user_events (event_type: cancel_renewal_j7_sent).

export function buildCancelRenewalJ7Subject(coproprieteNom: string): string {
  return `Dans 7 jours, ${coproprieteNom} perd ses relances automatiques — Mon Syndic Bénévole`;
}

export function buildCancelRenewalJ7Email(params: CancelRenewalParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">7 jours avant la fin de votre abonnement</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Le ${endDateStr ? `<strong>${endDateStr}</strong>` : 'dans 7 jours'}, voici ce qui s&rsquo;arrête pour <strong>${h(coproprieteNom)}</strong>&nbsp;:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;border-radius:10px;border:1px solid #fecaca;overflow:hidden">
  <tr style="background:#fef2f2">
    <td style="padding:12px 16px;border-bottom:1px solid #fecaca">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.6">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; <strong>Relances automatiques impayés</strong><br>
        <span style="color:${COLOR.muted};font-size:12px;padding-left:16px">→ Vous devrez relancer chaque copropriétaire manuellement</span>
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:12px 16px;border-bottom:1px solid #fecaca">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.6">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; <strong>Rappels AG automatiques (J&minus;14 et J&minus;7)</strong><br>
        <span style="color:${COLOR.muted};font-size:12px;padding-left:16px">→ Les convocations envoyées ne seront plus suivies de rappels</span>
      </p>
    </td>
  </tr>
  <tr style="background:#fef2f2">
    <td style="padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${COLOR.text};line-height:1.6">
        <span style="color:${COLOR.red};font-weight:700">✗</span>&nbsp; <strong>Espace documents copropriétaires</strong><br>
        <span style="color:${COLOR.muted};font-size:12px;padding-left:16px">→ Vos copropriétaires perdent l&rsquo;accès à leurs documents</span>
      </p>
    </td>
  </tr>
</table>

<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted};line-height:1.5">
  Ces processus ne reprennent pas automatiquement. Réactivez maintenant pour assurer la continuité.
</p>

${ctaButton('Réactiver le renouvellement →', `${dashboardUrl}/abonnement`, COLOR.blue)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Annulation possible à tout moment. Plan <strong>${h(planLabel)}</strong>.
</p>`;

  return wrapEmail(content, COLOR.red, `Le ${endDateStr || 'dans 7 jours'}, les relances et rappels AG s'arrêtent — réactivez pour continuer`, unsubscribeUrl);
}

// ── Relance J-3 avant fin d'abonnement annuel ─────────────────────────────────
// Idempotence via user_events (event_type: cancel_renewal_j3_sent).
// isLongTimeUser (ancienneté > 6 mois) : message de fidélité + offre contact.

export function buildCancelRenewalJ3Subject(coproprieteNom: string): string {
  return `3 jours restants — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildCancelRenewalJ3Email(params: CancelRenewalParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl, isLongTimeUser, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const loyaltyBlock = isLongTimeUser ? `
<div style="margin:0 0 20px;padding:14px 16px;background:#eff6ff;border-left:3px solid ${COLOR.blue};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e3a8a">Un geste pour nos abonnés fidèles</p>
  <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.5">
    Vous utilisez Mon Syndic Bénévole depuis plus de 6 mois. Si un blocage vous a conduit à résilier, écrivez-nous — on trouvera une solution ensemble.
    <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue};font-weight:600">${CONTACT_EMAIL}</a>
  </p>
</div>` : '';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.red}">Plus que 3 jours</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre abonnement <strong>${h(planLabel)}</strong> pour <strong>${h(coproprieteNom)}</strong> expire ${endDateStr ? `le <strong>${endDateStr}</strong>` : 'dans 3 jours'}.
</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Si vous avez des appels de fonds en cours de relance ou une AG planifiée, ces processus s&rsquo;interrompront à la date d&rsquo;expiration. Réactivez maintenant pour ne pas perdre la continuité.
</p>

${endDateStr ? `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;background:#fef2f2;border:1px solid #fecaca">
  <tr>
    <td style="padding:12px 16px;text-align:center">
      <p style="margin:0 0 2px;font-size:11px;color:#9a3412;text-transform:uppercase;letter-spacing:0.05em">Fin d&rsquo;accès</p>
      <p style="margin:0;font-size:18px;font-weight:700;color:${COLOR.red}">${endDateStr}</p>
    </td>
  </tr>
</table>` : ''}

${loyaltyBlock}

${ctaButton('Réactiver mon abonnement maintenant →', `${dashboardUrl}/abonnement`, COLOR.red)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Réactivation en 10 secondes — sans engagement — annulation à tout moment.
</p>`;

  return wrapEmail(content, COLOR.red, `Dans 3 jours, vos relances et convocations automatiques s'arrêtent`, unsubscribeUrl);
}

// ── Relance J-1 avant fin d'abonnement annuel ─────────────────────────────────
// Idempotence via user_events (event_type: cancel_renewal_j1_sent).

export function buildCancelRenewalJ1Subject(coproprieteNom: string): string {
  return `Demain, votre accès à ${coproprieteNom} se coupe — réactivez avant minuit`;
}

export function buildCancelRenewalJ1Email(params: CancelRenewalParams): string {
  const { prenom, coproprieteNom, planLabel, periodEnd, dashboardUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const endDateStr = periodEnd ? formatDateFR(periodEnd) : '';

  const content = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;border-radius:8px;background:#fef2f2;border:2px solid ${COLOR.red}">
  <tr>
    <td style="padding:16px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;color:#9a3412;text-transform:uppercase;font-weight:700;letter-spacing:0.08em">DERNIER JOUR</p>
      <p style="margin:0;font-size:14px;color:${COLOR.red};font-weight:600">
        Votre accès à <strong>${h(coproprieteNom)}</strong> se coupe demain${endDateStr ? ` — ${endDateStr}` : ''}
      </p>
    </td>
  </tr>
</table>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Demain, l&rsquo;abonnement <strong>${h(planLabel)}</strong> de <strong>${h(coproprieteNom)}</strong> arrive à expiration. Toutes les automatisations (relances, rappels AG, espace documents) s&rsquo;arrêtent.
</p>

${ctaButton('Réactiver maintenant — 10 secondes →', `${dashboardUrl}/abonnement`, COLOR.red)}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};text-align:center;line-height:1.6">
  Si vous changez d&rsquo;avis après demain, vos données sont conservées 30 jours.<br>
  Des questions ? <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>
</p>`;

  return wrapEmail(content, COLOR.red, `Dernière chance — votre accès à ${coproprieteNom} se coupe demain. Réactivez en 10 secondes.`, unsubscribeUrl);
}

// ── J+1 post-expiration abonnement annuel (filet "oubli") ─────────────────────
// Cible : plan='resilie', plan_period_end hier (±1j), avant les churn J+7/J+14/J+30.
// Idempotence via user_events (event_type: cancel_expired_j1_sent).

export function buildCancelExpiredJ1Subject(coproprieteNom: string): string {
  return `Votre accès à ${coproprieteNom} a expiré hier — réactivez maintenant`;
}

export function buildCancelExpiredJ1Email(params: CancelRenewalParams): string {
  const { prenom, coproprieteNom, planLabel, dashboardUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre abonnement a expiré hier</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  L&rsquo;abonnement <strong>${h(planLabel)}</strong> de <strong>${h(coproprieteNom)}</strong> a expiré hier. Si c&rsquo;était un oubli, vous pouvez reprendre exactement où vous en étiez — vos données sont intactes.
</p>

<div style="margin:0 0 20px;padding:14px 16px;background:#f0fdf4;border-left:3px solid ${COLOR.green};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534">Vos données sont conservées 30 jours</p>
  <p style="margin:0;font-size:13px;color:#15803d;line-height:1.5">Copropriétaires, appels de fonds, historique, documents — tout est là. Aucune reconfiguration nécessaire.</p>
</div>

${ctaButton('Réactiver mon abonnement en 30 secondes →', `${dashboardUrl}/abonnement`, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Plan <strong>${h(planLabel)}</strong> — sans engagement, annulation à tout moment.<br>
  Des questions ? <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>
</p>`;

  return wrapEmail(content, COLOR.green, `Vos données sont intactes — reprenez la gestion de ${coproprieteNom} en 30 secondes`, unsubscribeUrl);
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
  unsubscribeUrl?: string;
}

export function buildCheckoutAbandonSubject(): string {
  return 'Votre souscription est restée incomplète — Mon Syndic Bénévole';
}

export function buildCheckoutAbandonEmail(params: CheckoutAbandonEmailParams): string {
  const { prenom, coproprieteNom, abonnementUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre souscription est restée incomplète</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Vous avez commencé à souscrire un abonnement pour <strong>${h(coproprieteNom)}</strong>, mais la session de paiement n&rsquo;a pas pu être finalisée.
</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Cela arrive parfois&nbsp;: authentification 3D Secure expirée, fenêtre fermée au mauvais moment, connexion interrompue. Votre compte est intact et votre copropriété est toujours configurée.
</p>

<div style="margin:0 0 20px;padding:14px 16px;background:#eff6ff;border-left:3px solid ${COLOR.blue};border-radius:0 8px 8px 0">
  <p style="margin:0 0 6px;font-size:13px;font-weight:700;color:#1e3a8a">Les syndics bénévoles qui utilisent Mon Syndic Bénévole déclarent&nbsp;:</p>
  <p style="margin:0 0 4px;font-size:13px;color:#1d4ed8;line-height:1.5">
    <span style="font-weight:700">— "Plus de relances manuelles à faire"</span> — les impayés se gèrent seuls à J-7, J+3 et J+15
  </p>
  <p style="margin:0 0 4px;font-size:13px;color:#1d4ed8;line-height:1.5">
    <span style="font-weight:700">— "L'AG est convoquée en 5 minutes"</span> — convocation + rappels automatiques en un clic
  </p>
  <p style="margin:0;font-size:13px;color:#1d4ed8;line-height:1.5">
    <span style="font-weight:700">— "Mes copropriétaires ne m'appellent plus pour les documents"</span> — tout est dans leur espace
  </p>
</div>

<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted};line-height:1.5">
  Essai 14 jours inclus — aucun paiement avant la fin. Sans engagement.
</p>

${ctaButton('Finaliser ma souscription →', abonnementUrl, COLOR.blue)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Un problème&nbsp;? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>. On vous aide.
</p>`;

  return wrapEmail(content, COLOR.blue, 'Rejoignez les syndics bénévoles qui ne font plus de relances manuelles — essai 14 jours inclus.', unsubscribeUrl);
}

// ── Relance checkout abandonné (J+3) ─────────────────────────────────────────
// Dernier rappel avant d'arrêter les relances.
// Idempotence via user_events (event_type: checkout_abandon_j3_reminder_sent).

export function buildCheckoutAbandonJ3Subject(): string {
  return 'Dernier rappel — votre essai 14 jours est encore disponible — Mon Syndic Bénévole';
}

export function buildCheckoutAbandonJ3Email(params: CheckoutAbandonEmailParams): string {
  const { prenom, coproprieteNom, abonnementUrl, unsubscribeUrl } = params;
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
  Une question sur la souscription&nbsp;? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.muted}">${CONTACT_EMAIL}</a>, on vous répond personnellement.<br>
  Si vous ne souhaitez pas continuer, aucun problème — votre compte reste accessible.
</p>`;

  return wrapEmail(content, COLOR.blue, 'Dernier rappel — votre essai 14 jours est toujours disponible, sans engagement.', unsubscribeUrl);
}

// ── Sondage J+1 après essai non converti ──────────────────────────────────────
// Cible : essai terminé sans souscription (event_type: trial_cancelled).
// Idempotence via user_events (event_type: trial_survey_j1_sent).

export interface TrialSurveyParams {
  prenom: string | null;
  coproprieteNom: string;
  abonnementUrl: string;
  unsubscribeUrl?: string;
}

export function buildTrialSurveyJ1Subject(coproprieteNom: string): string {
  return `Une question sur votre essai — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildTrialSurveyJ1Email(params: TrialSurveyParams): string {
  const { prenom, coproprieteNom, abonnementUrl, unsubscribeUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const encName = encodeURIComponent(`${coproprieteNom} — Mon Syndic Bénévole`);

  const reasons: Array<{ label: string; body: string }> = [
    { label: '⏳ Pas encore prêt(e), je reviendrai', body: "Je ne suis pas encore prêt(e) à souscrire, mais j'envisage de revenir." },
    { label: '💸 Le tarif est trop élevé', body: 'Je trouve le tarif trop élevé pour mes besoins actuels.' },
    { label: '🔧 Il manque une fonctionnalité', body: "Il manque une fonctionnalité dont j'aurais besoin : (préciser)" },
    { label: '📊 Je gère avec un autre outil', body: 'Je continue à gérer ma copropriété avec un autre outil (Excel, autre logiciel…).' },
    { label: '✏️ Autre raison', body: 'Voici ma raison : (préciser)' },
  ];

  const reasonLinks = reasons.map(({ label, body }) =>
    `<tr><td style="padding:5px 0"><a href="mailto:${CONTACT_EMAIL}?subject=Retour%20essai%20—%20${encName}&body=${encodeURIComponent(body)}" style="display:inline-block;padding:10px 16px;font-size:14px;color:${COLOR.blue};background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-decoration:none;line-height:1.4;font-weight:500">${h(label)}</a></td></tr>`,
  ).join('\n');

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai s&rsquo;est terminé hier</h1>
<p style="margin:0 0 24px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 8px;font-size:15px;color:${COLOR.text};line-height:1.7;font-weight:600">
  Je voulais juste vous poser une question directe&nbsp;: qu&rsquo;est-ce qui vous a retenu(e) de continuer&nbsp;?
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.7">
  Votre retour — même en quelques mots — m&rsquo;aide vraiment à améliorer l&rsquo;application. <strong>Répondez simplement à cet e-mail</strong> ou cliquez sur la raison qui vous correspond&nbsp;:
</p>

<table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
${reasonLinks}
</table>

<p style="margin:0 0 6px;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Vous préférez répondre librement&nbsp;? <a href="mailto:${CONTACT_EMAIL}?subject=Retour%20essai%20—%20${encName}" style="color:${COLOR.blue};font-weight:500">Répondez directement à cet e-mail</a> — je lis chaque message personnellement.
</p>

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Merci d&rsquo;avance pour votre réponse — elle compte vraiment.<br>
  Fabien — fondateur de Mon Syndic Bénévole
</p>`;

  return wrapEmail(content, COLOR.blue, `Qu'est-ce qui vous a retenu(e) de continuer ? Votre avis nous aide à nous améliorer.`, unsubscribeUrl);
}
