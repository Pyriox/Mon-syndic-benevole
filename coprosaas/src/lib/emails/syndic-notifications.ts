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

// ── Incident résolu (notification au déclarant) ─────────────────────────────────

export interface IncidentResoluEmailParams {
  prenomDeclarant: string | null;
  titreIncident: string;
  coproprieteNom: string;
  dateResolution: string; // ISO date
  montantFinal?: number | null;
  incidentsUrl: string;
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
