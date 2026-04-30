// ============================================================
// Template e-mail — Bienvenue après confirmation d'inscription
// ============================================================

import { wrapEmail, h, ctaButton, COLOR, SITE_URL, CONTACT_EMAIL } from './base';

export interface WelcomeEmailParams {
  prenom: string | null;
  dashboardUrl: string;
}

export function buildWelcomeSubject(): string {
  return 'Votre compte est prêt — Mon Syndic Bénévole';
}

export function buildWelcomeEmail(params: WelcomeEmailParams): string {
  const { prenom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bienvenue';
  const coproUrl = `${SITE_URL}/coproprietes`;
  const coproprietairesUrl = `${SITE_URL}/coproprietaires`;
  const documentsUrl = `${SITE_URL}/documents`;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Bienvenue sur Mon Syndic Bénévole</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">Votre compte est activé</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre compte est prêt. Pour démarrer dans de bonnes conditions, suivez ce parcours&nbsp;:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 18px">
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.green};background:#f0fdf4;border-radius:0 6px 6px 0;margin-bottom:8px">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">1. Créer votre copropriété</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Renseignez le nom et l'adresse de l'immeuble.</p>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.blue};background:#eff6ff;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">2. Ajouter vos lots</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Créez chaque lot avec son numéro, son libellé et les informations utiles.</p>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.amber};background:#fffbeb;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">3. Ouvrir « Paramétrage » → « Répartition des charges »</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Renseignez ici les tantièmes généraux et, si besoin, vos clés spéciales (ascenseur, bâtiment, parking…).</p>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="padding:12px 16px;border-left:3px solid #8b5cf6;background:#f5f3ff;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">4. Ajouter vos copropriétaires et déposer vos documents</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Associez chaque copropriétaire à ses lots. Déposez ensuite dans l'espace « Documents » les pièces essentielles de votre copropriété&nbsp;: règlement de copropriété, état descriptif de division, contrats en cours (assurance multirisque…).</p>
    </td>
  </tr>
</table>

${ctaButton('Accéder à mon espace syndic →', dashboardUrl, COLOR.green)}

<p style="margin:16px 0 0;font-size:13px;color:${COLOR.text};line-height:1.6">
  Accès rapides&nbsp;:
  <a href="${coproUrl}" style="color:${COLOR.blue};font-weight:600">Mes copropriétés</a>
  &nbsp;·&nbsp;
  <a href="${coproprietairesUrl}" style="color:${COLOR.blue};font-weight:600">Copropriétaires</a>
  &nbsp;·&nbsp;
  <a href="${documentsUrl}" style="color:${COLOR.blue};font-weight:600">Documents</a>
</p>

<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e">Besoin d'un coup de main&nbsp;?</p>
  <p style="margin:0 0 8px;font-size:13px;color:#78350f;line-height:1.5">Consultez notre guide de prise en main pour configurer vos lots, vos tantièmes et vos copropriétaires.</p>
  <a href="${SITE_URL}/blog/migrer-vers-mon-syndic-benevole" style="font-size:13px;font-weight:600;color:#92400e">Lire le guide →</a>
</div>

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Une question ? Consultez notre <a href="${SITE_URL}/aide" style="color:${COLOR.blue}">aide en ligne</a> ou écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:${COLOR.blue}">${CONTACT_EMAIL}</a>.
</p>`;

  return wrapEmail(content, COLOR.green, 'Votre compte est prêt — configurez votre copropriété pas à pas');
}
