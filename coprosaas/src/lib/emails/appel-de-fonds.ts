// ============================================================
// Templates e-mail — Appels de fonds
// Utilisé par /api/appels-de-fonds/[id]/publier et /api/cron/rappels-appels
// ============================================================

import { wrapEmail, h, formatDateFR, formatEurosFR, infoTable, infoRow, alertBanner, ctaButton, COLOR, SITE_URL } from './base';

// `mise_en_demeure` est conservé comme clé interne legacy pour compatibilité,
// mais l'e-mail envoyé au copropriétaire est un simple rappel d'impayé.
export type AppelEmailType = 'avis' | 'rappel' | 'rappel_j1' | 'mise_en_demeure';

export interface AppelEmailParams {
  type: AppelEmailType;
  prenom: string;
  nom: string;
  coproprieteNom: string;
  titre: string;
  montantDu: number;
  regularisationAjustement?: number;
  dateEcheance: string;
  espaceUrl?: string;
}

const ACCENT: Record<AppelEmailType, string> = {
  avis:            COLOR.blue,
  rappel:          COLOR.amber,
  rappel_j1:       COLOR.amber,
  mise_en_demeure: COLOR.red,
};

const SUBJECTS: Record<AppelEmailType, string> = {
  avis:            'Avis d\'appel de fonds',
  rappel:          'Rappel de paiement',
  rappel_j1:       'Relance de paiement',
  mise_en_demeure: 'Rappel d\'impayé',
};

export function buildAppelEmailSubject(params: {
  type: AppelEmailType;
  coproprieteNom: string;
  dateEcheance: string;
}): string {
  const prefixes: Record<AppelEmailType, string> = {
    avis:            `Avis d'appel de fonds — ${params.coproprieteNom}`,
    rappel:          `Rappel de paiement — ${params.coproprieteNom}`,
    rappel_j1:       `Relance de paiement — ${params.coproprieteNom}`,
    mise_en_demeure: `Rappel d'impayé — ${params.coproprieteNom}`,
  };
  return `${prefixes[params.type]} — Échéance ${formatDateFR(params.dateEcheance)} — Mon Syndic Bénévole`;
}

export function buildAppelEmail(params: AppelEmailParams): string {
  const { type, prenom, nom, coproprieteNom, titre, montantDu, regularisationAjustement = 0, dateEcheance } = params;
  const color   = ACCENT[type];
  const dateStr = formatDateFR(dateEcheance);
  const montant = formatEurosFR(montantDu);
  const espaceUrl = params.espaceUrl ?? `${SITE_URL}/login`;
  const hasRegularisation = Math.abs(regularisationAjustement) > 0.0001;
  const regularisationLabel = regularisationAjustement > 0
    ? 'Report de solde débiteur régularisé dans cet appel'
    : 'Report de solde créditeur régularisé dans cet appel';

  const intro: Record<AppelEmailType, string> = {
    avis: `Un avis d'appel de fonds est disponible pour la copropriété <strong>${h(coproprieteNom)}</strong>.`,
    rappel: `Cet appel de fonds pour la copropriété <strong>${h(coproprieteNom)}</strong> arrive à échéance dans <strong>7 jours</strong>.`,
    rappel_j1: `Nous n'avons pas encore enregistré votre règlement pour la copropriété <strong>${h(coproprieteNom)}</strong>. L'échéance de cet appel de fonds est <strong>dépassée depuis 1 jour</strong>.`,
    mise_en_demeure: `À ce jour, nous n'avons pas encore enregistré votre règlement pour la copropriété <strong>${h(coproprieteNom)}</strong>. Il peut s'agir d'un paiement en cours de traitement ou non encore pointé par votre syndic.`,
  };

  const closing: Record<AppelEmailType, string> = {
    avis: `<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Merci d'effectuer votre règlement avant la date d'échéance.</p><p style="margin:10px 0 0;font-size:13px;color:${COLOR.muted}">Vous pouvez retrouver cet avis dans votre espace copropriétaire.</p>`,
    rappel: `<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Merci de régulariser votre situation avant l'échéance.</p><p style="margin:10px 0 0;font-size:13px;color:${COLOR.muted}">Si vous avez déjà réglé cet appel, vous pouvez ignorer ce message ou contacter votre syndic afin que votre situation soit mise à jour.</p>`,
    rappel_j1: `${alertBanner(
      'L\'échéance est désormais dépassée. Merci de vérifier votre virement ou de contacter votre syndic si le paiement a déjà été effectué.',
      COLOR.amber, '#fffbeb'
    )}<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Si vous avez déjà payé, vous pouvez ignorer ce message : votre syndic mettra votre situation à jour dès l'encaissement confirmé.</p>`,
    mise_en_demeure: `${alertBanner(
      'Si vous avez déjà réglé cet appel, vous pouvez ignorer ce message ou contacter votre syndic afin que votre situation soit vérifiée et mise à jour.',
      COLOR.red, '#fff5f5'
    )}<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Si le solde vous semble incorrect, il peut simplement s'agir d'un paiement non encore enregistré.</p>`,
  };

  const preheader: Record<AppelEmailType, string> = {
    avis: 'Un nouvel appel de fonds est disponible dans votre espace copropriétaire',
    rappel: 'Un appel de fonds arrive bientôt à échéance',
    rappel_j1: 'Un appel de fonds reste impayé après son échéance',
    mise_en_demeure: 'Un appel de fonds reste signalé comme impayé',
  };

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">${SUBJECTS[type]}</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(prenom)} ${h(nom)}</strong>,</p>
<p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.6">${intro[type]}</p>

${infoTable(
  infoRow('Objet', h(titre)) +
  (hasRegularisation ? infoRow('Régularisation', `${regularisationLabel} (${formatEurosFR(regularisationAjustement)})`) : '') +
  infoRow('Montant dû', montant, `font-size:18px;color:${color}`) +
  infoRow('Date d\'échéance', dateStr)
)}

${hasRegularisation ? `<p style="margin:10px 0 0;font-size:12px;color:${COLOR.muted}">Ce report est imputé dans le montant dû de cet appel de fonds.</p>` : ''}

${ctaButton(type === 'avis' ? 'Accéder à mon espace copropriétaire →' : 'Consulter mon espace copropriétaire →', espaceUrl, type === 'mise_en_demeure' ? COLOR.red : COLOR.blue)}

${closing[type]}`;

  return wrapEmail(content, color, preheader[type]);
}

