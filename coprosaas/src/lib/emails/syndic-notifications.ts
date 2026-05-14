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
  if (type === 'j14') return `Vos appels de fonds arrivent à échéance dans 14 jours — ${coproprieteNom} — Mon Syndic Bénévole`;
  if (type === 'j7') return `Plus que 7 jours pour publier vos appels de fonds — ${coproprieteNom} — Mon Syndic Bénévole`;
  return `Vos appels de fonds doivent être publiés aujourd'hui — ${coproprieteNom} — Mon Syndic Bénévole`;
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

export type SyndicOnboardingReminderKind = 'j2' | 'j7' | 'j14' | 'j21' | 'j30';

// ─── Onboarding J+2 — Réassurance ────────────────────────────────────────────

export interface SyndicOnboardingJ2EmailParams {
  syndicPrenom: string;
  coproCount: number;
  actionUrl: string;
}

export function buildSyndicOnboardingJ2Subject(params: { coproCount: number }): string {
  return params.coproCount === 0
    ? 'Votre espace est prêt — voici la seule chose à faire'
    : 'Une étape et vos copropriétaires reçoivent tout automatiquement';
}

export function buildSyndicOnboardingJ2Email(params: SyndicOnboardingJ2EmailParams): string {
  const { syndicPrenom, coproCount, actionUrl } = params;
  const hasNoCopro = coproCount === 0;

  const ctaLabel = hasNoCopro ? 'Activer mes relances automatiques →' : 'Ajouter mes copropriétaires (3 min) →';

  const headline = hasNoCopro ? 'Vous avez fait le premier pas.' : 'Votre copropriété est créée.';
  const subline = hasNoCopro ? 'Une seule chose à faire pour activer votre espace' : 'Une étape et tout devient automatique';

  const intro = hasNoCopro
    ? `Vous venez de rejoindre les syndics bénévoles qui ont décidé d'arrêter de tout gérer seuls. Pour activer la plateforme, il n'y a qu'une seule chose à faire aujourd'hui&nbsp;: <strong>créer votre copropriété</strong>. C'est 2&nbsp;minutes chrono&nbsp;— nom, adresse, nombre de lots.`
    : `Vous venez de créer votre copropriété. Vos copropriétaires ne sont pas encore ajoutés. Une fois qu'ils le sont, plus besoin de leur envoyer quoi que ce soit manuellement. L'ajout prend moins de 3&nbsp;minutes&nbsp;— vous avez juste besoin de leur nom et email.`;

  const benefits = hasNoCopro
    ? `<ul style="margin:14px 0 0;padding:0 0 0 0;list-style:none">
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Appels de fonds envoyés automatiquement</li>
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Relances impayés sans intervention manuelle</li>
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Convocations d'AG en un clic</li>
</ul>`
    : `<ul style="margin:14px 0 0;padding:0 0 0 0;list-style:none">
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Avis de paiement envoyés automatiquement à chacun</li>
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Documents accessibles en ligne sans vous solliciter</li>
  <li style="padding:5px 0;font-size:14px;color:${COLOR.text};line-height:1.5"><span style="color:${COLOR.blue};font-weight:700;margin-right:8px">→</span>Convocations d'AG envoyées depuis la plateforme</li>
</ul>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">${headline}</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${subline}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  ${intro}
</p>

${benefits}

${ctaButton(ctaLabel, actionUrl, COLOR.blue)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Une question&nbsp;? <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue}">Répondez directement à cet email</a> — on vous répond sous 24h.<br>
  — L'équipe Mon Syndic Bénévole
</p>`;

  return wrapEmail(
    content,
    COLOR.blue,
    hasNoCopro
      ? 'Créez votre copropriété en 2 minutes pour activer les relances automatiques.'
      : 'Ajoutez vos copropriétaires en 3 minutes pour activer les notifications automatiques.',
  );
}

// ─── Onboarding J+7 — Urgence douce ──────────────────────────────────────────

export interface SyndicOnboardingJ7EmailParams {
  syndicPrenom: string;
  coproCount: number;
  actionUrl: string;
}

export function buildSyndicOnboardingJ7Subject(params: { coproCount: number }): string {
  return params.coproCount === 0
    ? 'Votre prochaine relance impayée — vous l\'écrirez encore à la main ?'
    : 'Vos copropriétaires ne reçoivent encore rien — plus qu\'une étape';
}

export function buildSyndicOnboardingJ7Email(params: SyndicOnboardingJ7EmailParams): string {
  const { syndicPrenom, coproCount, actionUrl } = params;
  const hasNoCopro = coproCount === 0;

  const ctaLabel = hasNoCopro ? 'Configurer en 2 minutes →' : 'Ajouter mes copropriétaires →';

  const body = hasNoCopro
    ? `Il y a 7 jours, vous avez créé votre compte. Votre espace est prêt — mais sans copropriété configurée, aucune automatisation ne peut démarrer. Chaque appel de fonds, chaque relance, chaque convocation reste entièrement manuel.`
    : `Votre copropriété est créée, mais vos copropriétaires ne sont pas encore ajoutés. Ils ne reçoivent aucun avis de paiement, aucune convocation d'AG, aucune notification.`;

  const impact = hasNoCopro
    ? `Tant que cette étape n'est pas faite, vous continuez à gérer tout à la main — exactement comme avant de vous inscrire.`
    : `Tant que cette étape n'est pas faite, tout passe encore par vos emails personnels.`;

  const banner = alertBanner(`✅ Plus qu'une étape pour activer votre espace`, COLOR.blue, '#eff6ff');

  const content = `
${banner}

<p style="margin:16px 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  ${body}
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.amber};font-weight:600;line-height:1.6">
  ${impact}
</p>

${ctaButton(ctaLabel, actionUrl, COLOR.amber)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Une question avant de commencer&nbsp;? <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue}">Répondez à cet email</a> — on vous répond sous 24h.
</p>`;

  return wrapEmail(
    content,
    COLOR.amber,
    hasNoCopro
      ? 'Votre espace est prêt — configurez votre copropriété en 2 minutes pour activer les relances automatiques.'
      : 'Vos copropriétaires ne reçoivent encore rien — ajoutez-les pour activer les notifications automatiques.',
  );
}

// ─── Onboarding J+14 — Preuve sociale ───────────────────────────────────────────────────

export interface SyndicOnboardingJ14EmailParams {
  syndicPrenom: string;
  actionUrl: string;
}

export function buildSyndicOnboardingJ14Subject(): string {
  return '« J’ai configuré en 10 minutes » — et maintenant les relances partent seules';
}

export function buildSyndicOnboardingJ14Email(params: SyndicOnboardingJ14EmailParams): string {
  const { syndicPrenom, actionUrl } = params;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">D&rsquo;autres syndics bénévoles l&rsquo;ont fait.</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">2 semaines après votre inscription</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>

<div style="margin:0 0 20px;padding:16px;background:#f0f9ff;border-left:4px solid ${COLOR.blue};border-radius:0 8px 8px 0">
  <p style="margin:0 0 6px;font-size:14px;font-style:italic;color:${COLOR.text};line-height:1.6">
    &ldquo;J&rsquo;avais peur que ce soit compliqué à mettre en place. En fait ça m’a pris 10 minutes. Maintenant les relances impayés partent sans que j&rsquo;y pense.&rdquo;
  </p>
  <p style="margin:6px 0 0;font-size:13px;color:${COLOR.muted};font-weight:600">— Marie, syndic bénévole, copropriété de 12 lots</p>
</div>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Si quelque chose vous a empêché de configurer votre espace, <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue};font-weight:600">répondez directement à cet email</a> — on vous aide personnellement.
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Sinon, votre espace vous attend exactement là où vous l&rsquo;avez laissé&nbsp;:
</p>

${ctaButton('Reprendre ma configuration →', actionUrl, COLOR.blue)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  — L&rsquo;équipe Mon Syndic Bénévole
</p>`;

  return wrapEmail(content, COLOR.blue, 'D’autres syndics bénévoles ont configuré leur espace en 10 minutes — votre tour.');
}

// ─── Compat : buildSyndicOnboardingReminderSubject / Email ───────────────────
// Conservé pour éviter de casser d'éventuels appels externes.

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
  if (params.kind === 'j7') return buildSyndicOnboardingJ7Subject({ coproCount: params.coproCount });
  if (params.kind === 'j14') return buildSyndicOnboardingJ14Subject();
  if (params.kind === 'j21') return buildSyndicReactivationSubject();
  if (params.kind === 'j30') return buildSyndicOnboardingJ30Subject();
  return buildSyndicOnboardingJ2Subject({ coproCount: params.coproCount });
}

export function buildSyndicOnboardingReminderEmail(params: SyndicOnboardingReminderEmailParams): string {
  if (params.kind === 'j7') {
    return buildSyndicOnboardingJ7Email({ syndicPrenom: params.syndicPrenom, coproCount: params.coproCount, actionUrl: params.actionUrl });
  }
  if (params.kind === 'j14') {
    return buildSyndicOnboardingJ14Email({ syndicPrenom: params.syndicPrenom, actionUrl: params.actionUrl });
  }
  if (params.kind === 'j30') {
    return buildSyndicOnboardingJ30Email({ syndicPrenom: params.syndicPrenom, dashboardUrl: params.actionUrl });
  }
  return buildSyndicOnboardingJ2Email({ syndicPrenom: params.syndicPrenom, coproCount: params.coproCount, actionUrl: params.actionUrl });
}

// ── Réactivation syndic (J+21) — Loss aversion ───────────────────────────────

export interface SyndicReactivationEmailParams {
  syndicPrenom: string;
  coproCount: number;
  coproprietairesCount: number;
  dashboardUrl: string;
}

export function buildSyndicReactivationSubject(): string {
  return 'Votre espace vous attend — et ça ne prend vraiment que 3 minutes';
}

export function buildSyndicReactivationEmail(params: SyndicReactivationEmailParams): string {
  const { syndicPrenom, coproCount, coproprietairesCount, dashboardUrl } = params;

  const hasNoCopro = coproCount === 0;
  const hasNoCopropriétaires = !hasNoCopro && coproprietairesCount < 2;

  const stateBlock = hasNoCopro
    ? `<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a 3 semaines, vous avez créé votre compte. Votre espace est prêt — mais aucune copropriété n'a encore été configurée. Chaque appel de fonds, chaque relance, chaque convocation continue de se faire à la main.
</p>`
    : hasNoCopropriétaires
      ? `<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a 3 semaines, vous avez créé votre compte et votre copropriété. Vos copropriétaires ne sont pas encore ajoutés : ils ne reçoivent aucun avis de paiement, aucune convocation, aucune notification d'incident.
</p>`
      : `<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Il y a 3 semaines, vous avez rejoint Mon Syndic Bénévole. Votre espace est configuré — n'hésitez pas à créer vos premiers appels de fonds pour activer les relances automatiques.
</p>`;

  const ctaLabel = hasNoCopro
    ? 'Créer ma copropriété maintenant →'
    : coproprietairesCount < 2
      ? 'Ajouter mes copropriétaires →'
      : 'Créer mon premier appel de fonds →';

  const features = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">📋 Relances impayés — zéro effort</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        Les copropriétaires en retard reçoivent des rappels automatiques à J-7, J+1 et J+15. Vous n'avez plus à y penser.
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:12px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">📄 Documents centralisés</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        PV d'AG, contrats, règlements : vos copropriétaires y accèdent directement, sans vous solliciter.
      </p>
    </td>
  </tr>
  <tr style="background:#f8fafc">
    <td style="padding:12px 16px">
      <p style="margin:0;font-size:14px;font-weight:700;color:${COLOR.text}">📩 Convocations d'AG en un clic</p>
      <p style="margin:4px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.5">
        Envoyez vos convocations à tous les copropriétaires depuis la plateforme, avec rappels automatiques à J-14 et J-7.
      </p>
    </td>
  </tr>
</table>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.green}">Votre espace vous attend toujours</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">3 semaines après votre inscription</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>

${stateBlock}

<p style="margin:0 0 4px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Ce que vous continuez à faire manuellement, la plateforme peut le prendre en charge :
</p>

${features}

${ctaButton(ctaLabel, dashboardUrl, COLOR.green)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Besoin d&rsquo;aide pour démarrer&nbsp;? <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue}">Contactez-nous</a> — on vous accompagne personnellement sous 24h.
</p>`;

  return wrapEmail(content, COLOR.green, 'Vos relances, vos convocations et vos documents — tout peut être automatisé depuis votre espace.');
}

// ── Réactivation J+30 — Objection handling / Dernier rappel ──────────────────

export interface SyndicOnboardingJ30EmailParams {
  syndicPrenom: string;
  dashboardUrl: string;
}

export function buildSyndicOnboardingJ30Subject(): string {
  return "Vous n\u2019avez pas eu le temps\u00a0? Normal. On a simplifié.";
}

export function buildSyndicOnboardingJ30Email(params: SyndicOnboardingJ30EmailParams): string {
  const { syndicPrenom, dashboardUrl } = params;

  const objectionBlock = `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-radius:10px;border:1px solid ${COLOR.border};overflow:hidden">
  <tr style="background:#f8fafc">
    <td style="padding:14px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${COLOR.text}">1. &ldquo;Je ne sais pas par où commencer&rdquo;</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted};line-height:1.6">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        Commencez juste par créer votre copropriété.<br>
        C&rsquo;est la seule étape nécessaire pour débloquer tout le reste.
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:14px 16px;border-bottom:1px solid ${COLOR.border}">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${COLOR.text}">2. &ldquo;Il faut que les autres s&rsquo;inscrivent&rdquo;</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted};line-height:1.6">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        Pas du tout.<br>
        Vous pouvez tout gérer seul, puis inviter les autres plus tard.
      </p>
    </td>
  </tr>
  <tr style="background:#f8fafc">
    <td style="padding:14px 16px">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${COLOR.text}">3. &ldquo;Je ne suis pas sûr que ça corresponde à mon cas&rdquo;</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted};line-height:1.6">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        Mon Syndic Bénévole est fait pour les syndics bénévoles de copropriétés de 4 à 100 lots.<br>
        Si c’est votre cas, écrivez-nous à <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue}">contact@mon-syndic-benevole.fr</a> — on vous répond personnellement sous 24h.
      </p>
    </td>
  </tr>
  <tr style="background:${COLOR.white}">
    <td style="padding:14px 16px;border-top:1px solid ${COLOR.border}">
      <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${COLOR.text}">4. &ldquo;Je ne suis pas sûr de savoir m’en servir&rdquo;</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted};line-height:1.6">
        <span style="color:${COLOR.blue};font-weight:700">→</span>
        Répondez à cet email en nous disant où vous êtes bloqué.<br>
        On vous accompagne pas à pas, sans jargon.
      </p>
    </td>
  </tr>
</table>`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Vous n&rsquo;avez pas eu le temps&nbsp;? Normal.</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">On vous fait reprendre en 3 minutes.</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Si vous n&rsquo;avez pas avancé depuis votre inscription, c&rsquo;est probablement pour une seule raison&nbsp;:
</p>
<p style="margin:0 0 20px;padding:12px 16px;background:#f0f9ff;border-left:3px solid ${COLOR.blue};border-radius:0 8px 8px 0;font-size:14px;font-weight:600;color:${COLOR.text}">
  👉 le bon moment n&rsquo;est jamais arrivé.
</p>
<p style="margin:0 0 4px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Du coup, on a simplifié au maximum.
</p>
<p style="margin:0 0 4px;font-size:14px;font-weight:600;color:${COLOR.text}">Voici comment reprendre en moins de 3 minutes&nbsp;👇</p>

${objectionBlock}

<p style="margin:0 0 16px;font-size:14px;font-weight:700;color:${COLOR.text}">👉 Le plus simple maintenant&nbsp;:</p>

${ctaButton('Reprendre là où je me suis arrêté →', dashboardUrl, COLOR.blue)}

<p style="margin:20px 0 0;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Si ce n&rsquo;est pas le bon moment, aucun problème — répondez à cet email et on prend de vos nouvelles.<br>
  Si vous souhaitez fermer votre compte, contactez-nous à <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.muted}">contact@mon-syndic-benevole.fr</a>.
</p>`;

  return wrapEmail(content, COLOR.blue, 'On vous fait reprendre en 3 minutes.');
}

// ── Alerte AG planifiée sans convocation envoyée ──────────────────────────────
// Cible : syndic dont une AG est planifiée dans ≤ 30 jours sans convocation envoyée
// Condition de déclenchement : AG créée depuis > 3 jours, convocation_envoyee_le IS NULL

export interface AGConvocationManquanteEmailParams {
  syndicPrenom: string | null;
  coproprieteNom: string;
  agTitre: string;
  dateAg: string; // human-readable, ex: "12 juin 2025"
  agUrl: string;
}

export function buildAGConvocationManquanteSubject(coproprieteNom: string, agTitre: string): string {
  return `Votre AG approche — la convocation n'a pas encore été envoyée — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildAGConvocationManquanteEmail(params: AGConvocationManquanteEmailParams): string {
  const { syndicPrenom, coproprieteNom, agTitre, dateAg, agUrl } = params;
  const prenomStr = syndicPrenom ? `Bonjour <strong>${h(syndicPrenom)}</strong>` : 'Bonjour';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Convocation AG non envoyée</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre assemblée générale <strong>« ${h(agTitre)} »</strong> est planifiée le <strong>${h(dateAg)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong>.
</p>

<div style="margin:0 0 20px;padding:14px 16px;background:#fff7ed;border-left:3px solid #f97316;border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#9a3412">⚠ Aucune convocation n'a encore été envoyée</p>
  <p style="margin:0;font-size:13px;color:#c2410c;line-height:1.5">La loi impose un délai minimum de notification avant la date de l'AG. Si vous attendez, vos copropriétaires pourraient ne pas être convoqués dans les délais légaux.</p>
</div>

<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Depuis votre espace, vous pouvez envoyer la convocation en quelques clics — Mon Syndic Bénévole prend en charge l'envoi à tous vos copropriétaires et programme automatiquement les rappels à J-14 et J-7.
</p>

${ctaButton('Envoyer la convocation maintenant →', agUrl, '#f97316')}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};line-height:1.5;text-align:center">
  Cet e-mail est envoyé automatiquement car votre AG approche sans qu'une convocation ait été transmise.
</p>`;

  return wrapEmail(content, '#f97316', `AG "${agTitre}" le ${dateAg} — envoyez la convocation avant qu'il ne soit trop tard.`);
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

// ── Milestones syndic ─────────────────────────────────────────────────────────
// Emails de célébration envoyés lors d'événements clés du parcours syndic.
// Idempotence via user_events (event_type: milestone_premier_appel_publie,
// milestone_premiere_ag_planifiee).

export interface MilestoneAppelPublieEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  appelTitre: string;
  dashboardUrl: string;
}

export function buildMilestoneAppelPublieSubject(coproprieteNom: string): string {
  return `Votre premier appel de fonds est publié — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildMilestoneAppelPublieEmail(params: MilestoneAppelPublieEmailParams): string {
  const { syndicPrenom, coproprieteNom, appelTitre, dashboardUrl } = params;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.green}">Premier appel de fonds publié !</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'appel de fonds <strong>${h(appelTitre)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> vient d'être publié. Vos copropriétaires vont recevoir automatiquement leur avis de paiement.
</p>

<div style="margin:0 0 20px;padding:14px 16px;background:#f0fdf4;border-left:3px solid ${COLOR.green};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#166534">Ce qui va se passer automatiquement</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0">
    <tr><td style="padding:3px 0;font-size:13px;color:#15803d">→ Avis de paiement envoyé à chaque copropriétaire</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#15803d">→ Rappel automatique J-7 avant l'échéance</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#15803d">→ Relance des impayés à J+1 et J+15</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#15803d">→ Récapitulatif des impayés le jour de l'échéance</td></tr>
  </table>
</div>

${ctaButton('Suivre les paiements →', dashboardUrl, COLOR.green)}

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted}">
  Vous recevrez un récapitulatif des impayés le jour de l'échéance.
</p>`;

  return wrapEmail(content, COLOR.green, 'Vos copropriétaires reçoivent leur avis — les relances sont automatiques');
}

export interface MilestoneAGPlanifieeEmailParams {
  syndicPrenom: string;
  coproprieteNom: string;
  agTitre: string;
  dateAg: string;
  agUrl: string;
}

export function buildMilestoneAGPlanifieeSubject(coproprieteNom: string): string {
  return `Votre première AG est planifiée — ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildMilestoneAGPlanifieeEmail(params: MilestoneAGPlanifieeEmailParams): string {
  const { syndicPrenom, coproprieteNom, agTitre, dateAg, agUrl } = params;
  const dateStr = formatDateFR(dateAg);

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.blue}">Première AG planifiée !</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(syndicPrenom)}</strong>,</p>
<p style="margin:0 0 14px;font-size:14px;color:${COLOR.text};line-height:1.6">
  L'assemblée générale <strong>${h(agTitre)}</strong> pour la copropriété <strong>${h(coproprieteNom)}</strong> est planifiée le <strong>${dateStr}</strong>.
</p>

<div style="margin:0 0 20px;padding:14px 16px;background:#eff6ff;border-left:3px solid ${COLOR.blue};border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1e40af">Prochaines étapes recommandées</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 0">
    <tr><td style="padding:3px 0;font-size:13px;color:#1d4ed8">→ Préparez l'ordre du jour et les résolutions</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#1d4ed8">→ Envoyez la convocation — les rappels J-14 et J-7 seront automatiques</td></tr>
    <tr><td style="padding:3px 0;font-size:13px;color:#1d4ed8">→ Après l'AG, le PV sera archivé automatiquement</td></tr>
  </table>
</div>

${ctaButton("Accéder à l'assemblée générale →", agUrl, COLOR.blue)}`;

  return wrapEmail(content, COLOR.blue, 'Convocation, rappels et PV — tout se gère depuis la plateforme');
}
