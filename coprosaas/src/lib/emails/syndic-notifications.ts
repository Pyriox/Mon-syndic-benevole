// ============================================================
// Templates e-mail — Notifications syndic & parties prenantes
//
//  1. ag_terminee        : rappel après clôture d'une AG pour créer les appels
//  2. brouillon_appel    : rappel si des appels restent en brouillon > 3 jours
//  3. incident_resolu    : notification au déclarant quand un incident est résolu
// ============================================================

import { wrapEmail, h, formatDateFR, ctaButton, COLOR } from './base';

// ─── AG Terminée ─────────────────────────────────────────────────────────────

export interface AGTermineeEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  dateAG: string;
  appelsDeGondsUrl: string;
}

export function buildAGTermineeSubject(coproprieteNom: string): string {
  return `Votre AG est clôturée — Pensez à créer les appels de fonds | ${coproprieteNom}`;
}

export function buildAGTermineeEmail(params: AGTermineeEmailParams): string {
  const { syndicPrenom, coproprieteNom, dateAG, appelsDeGondsUrl } = params;
  const dateStr = formatDateFR(dateAG);

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">AG clôturée</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'assemblée générale du <strong>${dateStr}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> vient d'être clôturée.
</p>
<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  Si des résolutions budgétaires ont été approuvées, pensez à créer les <strong>appels de fonds</strong> pour l'année à venir. Le budget voté et le calendrier d'appel sont importés automatiquement.
</p>

${ctaButton('Créer les appels de fonds →', appelsDeGondsUrl, COLOR.blue)}

<p style="margin:-8px 0 0;font-size:12px;color:${COLOR.muted}">
  Ce rappel est envoyé automatiquement à chaque clôture d'AG.
</p>`;

  return wrapEmail(content, COLOR.blue);
}

// ─── Brouillons non publiés ───────────────────────────────────────────────────

export interface BrouillonRappelEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  nombreBrouillons: number;
  appelsUrl: string;
}

export type BrouillonEcheanceType = 'j14' | 'j7' | 'j1_urgent';

export function buildBrouillonRappelSubject(coproprieteNom: string, n: number): string {
  return `${n} appel${n > 1 ? 's' : ''} de fonds en attente de publication — ${coproprieteNom}`;
}

export function buildBrouillonRappelEmail(params: BrouillonRappelEmailParams): string {
  const { syndicPrenom, coproprieteNom, nombreBrouillons, appelsUrl } = params;
  const n = nombreBrouillons;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">
  ${n} appel${n > 1 ? 's' : ''} de fonds en attente
</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">
  <strong>${n} appel${n > 1 ? 's' : ''} de fonds</strong> créé${n > 1 ? 's' : ''} pour la copropriété <strong>${h(coproprieteNom)}</strong>
  ${n > 1 ? 'sont restés' : 'est resté'} en brouillon depuis plus de 3 jours.
</p>
<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  Les copropriétaires ne recevront leur avis de paiement qu'après publication. Vérifiez les montants et publiez-les dès que possible.
</p>

${ctaButton('Publier les appels de fonds →', appelsUrl, COLOR.amber)}

<p style="margin:-8px 0 0;font-size:12px;color:${COLOR.muted}">
  Ce rappel est envoyé une seule fois par lot de brouillons.
</p>`;

  return wrapEmail(content, COLOR.amber);
}

export function buildBrouillonEcheanceSubject(
  coproprieteNom: string,
  n: number,
  type: BrouillonEcheanceType,
): string {
  if (type === 'j14') return `[J-14] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} — ${coproprieteNom}`;
  if (type === 'j7') return `[J-7] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} — ${coproprieteNom}`;
  return `[Urgent] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} (< 7 jours) — ${coproprieteNom}`;
}

export function buildBrouillonEcheanceEmail(
  params: BrouillonRappelEmailParams & { type: BrouillonEcheanceType },
): string {
  const { syndicPrenom, coproprieteNom, nombreBrouillons, appelsUrl, type } = params;
  const n = nombreBrouillons;

  const timingText = type === 'j14'
    ? "arrivent à échéance dans 14 jours"
    : type === 'j7'
      ? "arrivent à échéance dans 7 jours"
      : "arrivent à échéance dans moins de 7 jours et n'ont pas été émis le lendemain de leur création";

  const urgencyText = type === 'j1_urgent'
    ? 'Ce rappel est prioritaire : sans publication, les copropriétaires ne pourront pas être notifiés à temps.'
    : 'Publiez ces appels pour déclencher l\'envoi des avis aux copropriétaires.';

  const color = type === 'j1_urgent' ? COLOR.red : COLOR.amber;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">
  ${n} appel${n > 1 ? 's' : ''} proche${n > 1 ? 's' : ''} de l'échéance
</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">
  <strong>${n} appel${n > 1 ? 's' : ''} de fonds</strong> en brouillon ${n > 1 ? 'sont' : 'est'} toujours non publié${n > 1 ? 's' : ''}
  et ${timingText}.
</p>
<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  ${urgencyText}
</p>

${ctaButton('Publier les appels de fonds →', appelsUrl, color)}

<p style="margin:-8px 0 0;font-size:12px;color:${COLOR.muted}">
  Rappel automatique envoyé une seule fois pour cette échéance.
</p>`;

  return wrapEmail(content, color);
}

// ── Incident résolu (notification au déclarant) ─────────────────────────────────

export interface IncidentResoluEmailParams {
  prenomDeclarant: string | null;
  titreIncident: string;
  coproprieteNom: string;
  dateResolution: string; // ISO date
  montantFinal?: number | null;
  incidentsUrl: string;
}

// ── Onboarding syndic (J+2 / J+7) ───────────────────────────────────────────

export type SyndicOnboardingReminderKind = 'j2' | 'j7';

export interface SyndicOnboardingReminderEmailParams {
  syndicPrenom: string;
  kind: SyndicOnboardingReminderKind;
  coproCount: number;
  coproprietairesCount: number;
  actionUrl: string;
}

export function buildSyndicOnboardingReminderSubject(params: {
  kind: SyndicOnboardingReminderKind;
  coproCount: number;
}): string {
  const prefix = params.kind === 'j2'
    ? 'Votre copropriété vous attend'
    : 'Passez à l\'action sur votre copropriété';
  const state = params.coproCount === 0
    ? 'Créez votre première copropriété'
    : 'Ajoutez vos premiers copropriétaires';
  return `${prefix} — ${state}`;
}

export function buildSyndicOnboardingReminderEmail(params: SyndicOnboardingReminderEmailParams): string {
  const { syndicPrenom, kind, coproCount, coproprietairesCount, actionUrl } = params;
  const isJ7 = kind === 'j7';
  const hasNoCopro = coproCount === 0;

  const title = hasNoCopro
    ? 'Votre espace est prêt: lancez votre copropriété en quelques minutes'
    : 'Bravo, vous y êtes presque: finalisez votre copropriété';

  const subtitle = hasNoCopro
    ? 'Démarrage rapide'
    : 'Dernière étape clé';

  const body = hasNoCopro
    ? `Vous avez confirmé votre compte: excellente nouvelle. En créant votre copropriété maintenant, vous pourrez piloter vos obligations, centraliser vos documents et gagner un temps précieux dès cette semaine.`
    : `Votre copropriété est créée, c'est un très bon début. Vous avez actuellement <strong>${coproprietairesCount}</strong> copropriétaire${coproprietairesCount > 1 ? 's' : ''}; ajoutez-en au moins 2 pour débloquer un suivi plus fluide de vos actions et de votre communication.`;

  const stepsSummary = hasNoCopro
    ? `<div style="margin:16px 0 0;padding:14px 16px;border:1px solid ${COLOR.border};border-radius:10px;background:#f8fafc">
  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COLOR.text}">Résumé des étapes à effectuer</p>
  <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:${COLOR.text}">
    <li>Créer votre copropriété (nom, adresse, nombre de lots).</li>
    <li>Vérifier les informations principales.</li>
    <li>Accéder au tableau de bord pour continuer la configuration.</li>
  </ol>
</div>`
    : `<div style="margin:16px 0 0;padding:14px 16px;border:1px solid ${COLOR.border};border-radius:10px;background:#f8fafc">
  <p style="margin:0 0 8px;font-size:13px;font-weight:700;color:${COLOR.text}">Résumé des étapes à effectuer</p>
  <ol style="margin:0;padding-left:18px;font-size:14px;line-height:1.7;color:${COLOR.text}">
    <li>Ajouter au moins 2 copropriétaires (nom, e-mail, lots).</li>
    <li>Contrôler rapidement les données saisies.</li>
    <li>Poursuivre avec vos appels de fonds et documents.</li>
  </ol>
</div>`;

  const urgency = isJ7
    ? `<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  En finalisant cette étape aujourd'hui, vous prenez de l'avance et profitez pleinement de votre espace syndic sans perdre de temps.
</p>`
    : '';

  const ctaLabel = hasNoCopro ? 'Créer ma copropriété →' : 'Ajouter des copropriétaires →';
  const color = isJ7 ? COLOR.amber : COLOR.blue;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">${h(title)}</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(subtitle)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">
  ${body}
</p>

${stepsSummary}

${urgency}

${ctaButton(ctaLabel, actionUrl, color)}
`;

  return wrapEmail(content, color, hasNoCopro
    ? 'Démarrez votre copropriété maintenant'
    : 'Finalisez votre configuration en 2 minutes');
}

export function buildIncidentResoluSubject(titreIncident: string): string {
  return `Votre incident est résolu — ${titreIncident}`;
}

export function buildIncidentResoluEmail(params: IncidentResoluEmailParams): string {
  const { prenomDeclarant, titreIncident, coproprieteNom, dateResolution, montantFinal, incidentsUrl } = params;
  const prenomStr = prenomDeclarant ? `Bonjour <strong>${h(prenomDeclarant)}</strong>` : 'Bonjour';
  const dateStr = formatDateFR(dateResolution);

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.green}">✅ Incident résolu</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'incident <strong>« ${h(titreIncident)} »</strong> que vous avez déclaré a été marqué comme résolu par le syndic.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:8px;border:1px solid ${COLOR.border}">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted}">Date de résolution</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right">${dateStr}</td>
  </tr>
  ${montantFinal != null ? `<tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.muted};border-top:1px solid ${COLOR.border}">Coût final</td>
    <td style="padding:12px 16px;font-size:14px;font-weight:600;color:${COLOR.text};text-align:right;border-top:1px solid ${COLOR.border}">${montantFinal.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
  </tr>` : ''}
</table>

${ctaButton('Voir le détail →', incidentsUrl, COLOR.green)}`;

  return wrapEmail(content, COLOR.green, `L'incident « ${titreIncident} » est résolu`);
}
