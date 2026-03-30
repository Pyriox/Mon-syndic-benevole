// ============================================================
// Templates e-mail — Appels de fonds
// Utilisé par /api/appels-de-fonds/[id]/publier et /api/cron/rappels-appels
// ============================================================

import { wrapEmail, h, formatDateFR, formatEurosFR, infoTable, infoRow, alertBanner, COLOR } from './base';

export type AppelEmailType = 'avis' | 'rappel' | 'mise_en_demeure';

export interface AppelEmailParams {
  type: AppelEmailType;
  prenom: string;
  nom: string;
  coproprieteNom: string;
  titre: string;
  montantDu: number;
  regularisationAjustement?: number;
  dateEcheance: string;
}

const ACCENT: Record<AppelEmailType, string> = {
  avis:            COLOR.blue,
  rappel:          COLOR.amber,
  mise_en_demeure: COLOR.red,
};

const SUBJECTS: Record<AppelEmailType, string> = {
  avis:            'Appel de fonds',
  rappel:          'Rappel de paiement',
  mise_en_demeure: 'Mise en demeure',
};

export function buildAppelEmailSubject(params: {
  type: AppelEmailType;
  coproprieteNom: string;
  dateEcheance: string;
}): string {
  const prefixes: Record<AppelEmailType, string> = {
    avis:            `Appel de fonds — ${params.coproprieteNom}`,
    rappel:          `Rappel : paiement en attente — ${params.coproprieteNom}`,
    mise_en_demeure: `Mise en demeure — ${params.coproprieteNom}`,
  };
  return `${prefixes[params.type]} — Échéance ${formatDateFR(params.dateEcheance)}`;
}

export function buildAppelEmail(params: AppelEmailParams): string {
  const { type, prenom, nom, coproprieteNom, titre, montantDu, regularisationAjustement = 0, dateEcheance } = params;
  const color   = ACCENT[type];
  const dateStr = formatDateFR(dateEcheance);
  const montant = formatEurosFR(montantDu);
  const hasRegularisation = Math.abs(regularisationAjustement) > 0.0001;
  const regularisationLabel = regularisationAjustement > 0
    ? 'Report de solde débiteur régularisé dans cet appel'
    : 'Report de solde créditeur régularisé dans cet appel';

  const intro: Record<AppelEmailType, string> = {
    avis: `Un appel de fonds a été émis pour la copropriété <strong>${h(coproprieteNom)}</strong>.`,
    rappel: `Un paiement reste en attente pour la copropriété <strong>${h(coproprieteNom)}</strong>. L'échéance est dans <strong>7 jours</strong>.`,
    mise_en_demeure: `Votre règlement pour la copropriété <strong>${h(coproprieteNom)}</strong> n'a pas été enregistré à ce jour. Votre compte présente un <strong>impayé</strong>.`,
  };

  const closing: Record<AppelEmailType, string> = {
    avis: `<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Merci d'effectuer votre règlement avant la date d'échéance.</p>`,
    rappel: `<p style="margin:20px 0 0;font-size:14px;color:${COLOR.muted}">Merci de régulariser votre situation avant l'échéance.</p>`,
    mise_en_demeure: alertBanner(
      'Sans régularisation sous 8 jours, cette situation sera portée à l\'ordre du jour de la prochaine assemblée générale.',
      COLOR.red, '#fff5f5'
    ),
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

${closing[type]}`;

  return wrapEmail(content, color);
}

