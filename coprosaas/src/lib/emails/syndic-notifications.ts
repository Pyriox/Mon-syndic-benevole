// ============================================================
// Templates e-mail — Notifications syndic & parties prenantes
//
//  1. ag_terminee        : rappel après clôture d'une AG pour créer les appels
//  2. brouillon_appel    : rappel si des appels restent en brouillon > 3 jours
//  3. incident_resolu    : notification au déclarant quand un incident est résolu
// ============================================================

import { wrapEmail, h, formatDateFR, formatEurosFR, ctaButton, infoRow, infoTable, alertBanner, COLOR } from './base';

// ─── AG Terminée ─────────────────────────────────────────────────────────────

export interface AGTermineeEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  dateAG: string;
  appelsDeGondsUrl: string;
  agUrl: string;
}

export function buildAGTermineeSubject(coproprieteNom: string): string {
  return `AG clôturée — créez vos appels de fonds — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildAGTermineeEmail(params: AGTermineeEmailParams): string {
  const { syndicPrenom, coproprieteNom, dateAG, appelsDeGondsUrl, agUrl } = params;
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

${ctaButton('Accéder aux appels de fonds →', appelsDeGondsUrl, COLOR.blue)}

<p style="margin:20px 0 8px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Pensez également à transmettre le <strong>procès-verbal</strong> de l'AG à l'ensemble des copropriétaires par e-mail. La loi impose la transmission du PV dans les délais légaux après la tenue de l'assemblée.
</p>
<p style="margin:0 0 24px;font-size:14px">
  <a href="${h(agUrl)}" style="color:${COLOR.blue};font-weight:600;text-decoration:underline">Envoyer le PV depuis la plateforme →</a>
</p>

<p style="margin:0;font-size:12px;color:${COLOR.muted}">
  Ce rappel est envoyé automatiquement à chaque clôture d'AG.
</p>`;

  return wrapEmail(content, COLOR.blue, 'Votre assemblée générale est clôturée');
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
  return `${n} appel${n > 1 ? 's' : ''} de fonds à publier — ${coproprieteNom} — Mon Syndic Bénévole`;
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

  return wrapEmail(content, COLOR.amber, 'Des appels de fonds attendent votre validation');
}

export function buildBrouillonEcheanceSubject(
  coproprieteNom: string,
  n: number,
  type: BrouillonEcheanceType,
): string {
  if (type === 'j14') return `[J-14] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} — ${coproprieteNom} — Mon Syndic Bénévole`;
  if (type === 'j7') return `[J-7] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} — ${coproprieteNom} — Mon Syndic Bénévole`;
  return `[Urgent] ${n} appel${n > 1 ? 's' : ''} non publié${n > 1 ? 's' : ''} (< 7 jours) — ${coproprieteNom} — Mon Syndic Bénévole`;
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

  return wrapEmail(content, color, 'Des appels de fonds restent à publier avant leur échéance');
}

// ── Récapitulatif syndic des impayés à J0 ────────────────────────────────────

export interface SyndicImpayesRecapEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  appelTitre: string;
  dateEcheance: string;
  appelsUrl: string;
  impayes: Array<{ nom: string; montantDu: number }>;
}

export function buildSyndicImpayesRecapSubject(coproprieteNom: string, appelTitre: string, nbImpayes: number): string {
  return `[J0] ${nbImpayes} impayé${nbImpayes > 1 ? 's' : ''} à vérifier — ${appelTitre} — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildSyndicImpayesRecapEmail(params: SyndicImpayesRecapEmailParams): string {
  const { syndicPrenom, coproprieteNom, appelTitre, dateEcheance, appelsUrl, impayes } = params;
  const total = impayes.reduce((sum, row) => sum + row.montantDu, 0);
  const rows = infoTable(
    impayes.map((row) => infoRow(h(row.nom), formatEurosFR(row.montantDu))).join('')
    + infoRow('Total à vérifier', formatEurosFR(total), `font-size:16px;color:${COLOR.red}`)
  );

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Impayés à vérifier aujourd'hui</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'appel de fonds <strong>${h(appelTitre)}</strong> arrive à échéance <strong>aujourd'hui (${formatDateFR(dateEcheance)})</strong>
  et ${impayes.length} copropriétaire${impayes.length > 1 ? 's restent' : ' reste'} encore indiqué${impayes.length > 1 ? 's' : ''} comme impayé${impayes.length > 1 ? 's' : ''}.
</p>
<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il peut s'agir d'un simple oubli de cocher un paiement déjà reçu. Vérifiez les encaissements du jour et mettez à jour les lignes concernées si besoin.
</p>

${alertBanner(
  'Ce rappel vous aide à confirmer les paiements reçus le jour même avant qu\'ils ne basculent en impayés suivis.',
  COLOR.amber,
  '#fffbeb'
)}

${rows}

${ctaButton('Vérifier les paiements →', appelsUrl, COLOR.amber)}
`;

  return wrapEmail(content, COLOR.amber, 'Vérifiez les paiements reçus aujourd\'hui');
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

export type SyndicOnboardingReminderKind = 'j2' | 'j7' | 'j21';

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
  if (params.kind === 'j21') {
    return 'On ne vous a pas oublié — reprenez la gestion de votre copropriété — Mon Syndic Bénévole';
  }
  const prefix = params.kind === 'j2'
    ? 'Votre espace syndic est prêt'
    : 'Poursuivez la configuration de votre copropriété';
  const state = params.coproCount === 0
    ? 'Créez votre première copropriété'
    : 'Ajoutez vos premiers copropriétaires';
  return `${prefix} — ${state} — Mon Syndic Bénévole`;
}

export function buildSyndicOnboardingReminderEmail(params: SyndicOnboardingReminderEmailParams): string {
  const { syndicPrenom, kind, coproCount, coproprietairesCount, actionUrl } = params;
  const isJ7 = kind === 'j7';
  const hasNoCopro = coproCount === 0;

  const title = hasNoCopro
    ? 'Votre espace syndic est prêt'
    : 'Votre copropriété est créée';

  const subtitle = hasNoCopro
    ? 'Première étape'
    : 'Étape suivante';

  const body = hasNoCopro
    ? `Pour commencer, créez votre copropriété. Vous pourrez ensuite paramétrer vos lots, vos copropriétaires et vos appels de fonds.`
    : `Votre copropriété est déjà créée. Vous avez actuellement <strong>${coproprietairesCount}</strong> copropriétaire${coproprietairesCount > 1 ? 's' : ''}. Commencez par créer vos lots et paramétrer leurs tantièmes, puis attribuez-les à chaque copropriétaire pour finaliser la configuration.`;

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
    <li>Créer les lots et paramétrer leurs tantièmes.</li>
    <li>Ajouter les copropriétaires et leur attribuer leurs lots.</li>
    <li>Poursuivre avec vos appels de fonds et documents.</li>
  </ol>
</div>`;

  const urgency = isJ7
    ? `<p style="margin:16px 0 0;font-size:14px;color:${COLOR.text};line-height:1.6">
  Cette étape reste nécessaire pour utiliser pleinement votre espace syndic et vos outils de communication.
</p>`
    : '';

  const ctaLabel = hasNoCopro ? 'Créer ma copropriété →' : 'Configurer mes lots →';
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
    ? 'Créez votre première copropriété'
    : 'Configurez vos lots et copropriétaires pour poursuivre');
}

// ── Réactivation syndic (J+21) ───────────────────────────────────────────────

export interface SyndicReactivationEmailParams {
  syndicPrenom: string;
  coproCount: number;
  coproprietairesCount: number;
  dashboardUrl: string;
}

export function buildSyndicReactivationSubject(): string {
  return 'On ne vous a pas oublié — reprenez la gestion de votre copropriété — Mon Syndic Bénévole';
}

export function buildSyndicReactivationEmail(params: SyndicReactivationEmailParams): string {
  const { syndicPrenom, coproCount, coproprietairesCount, dashboardUrl } = params;

  const hasNoCopro = coproCount === 0;

  const stateText = hasNoCopro
    ? `Vous n'avez pas encore créé de copropriété dans votre espace.`
    : coproprietairesCount < 2
      ? `Votre copropriété est créée, mais vous n'avez pas encore ajouté vos copropriétaires.`
      : `Votre espace est configuré — vous pouvez pleinement gérer votre copropriété.`;

  const ctaLabel = hasNoCopro
    ? 'Créer ma copropriété →'
    : coproprietairesCount < 2
      ? 'Ajouter mes copropriétaires →'
      : 'Accéder à mon tableau de bord →';

  const features = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">📋 Appels de fonds</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        Créez et envoyez vos avis de paiement en quelques clics. Les relances aux copropriétaires impayés sont automatiques.
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">📄 Documents</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        Centralisez PV d'AG, contrats et règlements. Vos copropriétaires y accèdent directement.
      </p>
    </td>
  </tr>
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">🔔 Incidents & communication</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        Suivez les incidents déclarés par les copropriétaires et communiquez sans passer par les e-mails personnels.
      </p>
    </td>
  </tr>
</table>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.green}">Votre espace vous attend</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">Mon Syndic Bénévole</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a 3 semaines, vous avez rejoint Mon Syndic Bénévole. ${h(stateText)}
</p>
<p style="margin:0 0 4px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Gérer une copropriété en bénévole, c'est chronophage — on le sait. La plateforme est là pour vous faire gagner du temps sur les tâches répétitives :
</p>

${features}

${ctaButton(ctaLabel, dashboardUrl, COLOR.green)}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};line-height:1.6">
  Cet e-mail vous est envoyé car votre compte Mon Syndic Bénévole est actif. Si vous souhaitez ne plus recevoir ces messages, contactez-nous à <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.muted}">contact@mon-syndic-benevole.fr</a>.
</p>`;

  return wrapEmail(content, COLOR.green, 'Votre espace Mon Syndic Bénévole vous attend — 3 min pour reprendre en main');
}

export function buildIncidentResoluSubject(titreIncident: string): string {
  return `Incident résolu — ${titreIncident} — Mon Syndic Bénévole`;
}

export function buildIncidentResoluEmail(params: IncidentResoluEmailParams): string {
  const { prenomDeclarant, titreIncident, coproprieteNom, dateResolution, montantFinal, incidentsUrl } = params;
  const prenomStr = prenomDeclarant ? `Bonjour <strong>${h(prenomDeclarant)}</strong>` : 'Bonjour';
  const dateStr = formatDateFR(dateResolution);

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.green}">Incident résolu</h1>
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

${ctaButton('Consulter l\'incident →', incidentsUrl, COLOR.green)}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};line-height:1.6">
  Si vous avez une question sur cette resolution, rapprochez-vous de votre syndic.
</p>`;

  return wrapEmail(content, COLOR.green, `L'incident ${titreIncident} est résolu`);
}
