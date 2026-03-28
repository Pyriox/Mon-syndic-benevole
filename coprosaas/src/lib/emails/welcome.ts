// ============================================================
// Template e-mail — Bienvenue après confirmation d'inscription
// ============================================================

import { wrapEmail, h, ctaButton, COLOR, SITE_URL } from './base';

export interface WelcomeEmailParams {
  prenom: string | null;
  dashboardUrl: string;
}

export function buildWelcomeSubject(): string {
  return 'Bienvenue sur Mon Syndic Bénévole 🎉';
}

export function buildWelcomeEmail(params: WelcomeEmailParams): string {
  const { prenom, dashboardUrl } = params;
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bienvenue';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Bienvenue sur Mon Syndic Bénévole&nbsp;!</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">Votre compte est confirmé</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Votre compte est actif. Voici comment démarrer en 3 étapes&nbsp;:
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px">
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.green};background:#f0fdf4;border-radius:0 6px 6px 0;margin-bottom:8px">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">1. Créer votre copropriété</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Renseignez le nom, l'adresse et le nombre de lots.</p>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.blue};background:#eff6ff;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">2. Ajouter vos lots et copropriétaires</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Importez vos lots et invitez les copropriétaires à rejoindre l'espace.</p>
    </td>
  </tr>
  <tr><td style="height:8px"></td></tr>
  <tr>
    <td style="padding:12px 16px;border-left:3px solid ${COLOR.amber};background:#fffbeb;border-radius:0 6px 6px 0">
      <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:${COLOR.text}">3. Émettre votre premier appel de fonds</p>
      <p style="margin:0;font-size:13px;color:${COLOR.muted}">Créez un appel, publiez-le — les copropriétaires sont notifiés automatiquement.</p>
    </td>
  </tr>
</table>

${ctaButton('Démarrer →', dashboardUrl, COLOR.green)}

<div style="margin:20px 0;padding:14px 16px;background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0">
  <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e">Nouveau syndic bénévole&nbsp;?</p>
  <p style="margin:0 0 8px;font-size:13px;color:#78350f;line-height:1.5">Consultez notre guide de migration pour être opérationnel en une demi-journée&nbsp;: lots, copropriétaires, premier appel de fonds.</p>
  <a href="${SITE_URL}/blog/migrer-vers-mon-syndic-benevole" style="font-size:13px;font-weight:600;color:#92400e">Lire le guide →</a>
</div>

<p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Une question ? Consultez notre <a href="${SITE_URL}/aide" style="color:${COLOR.blue}">aide en ligne</a> ou écrivez-nous à <a href="mailto:contact@mon-syndic-benevole.fr" style="color:${COLOR.blue}">contact@mon-syndic-benevole.fr</a>.
</p>`;

  return wrapEmail(content, COLOR.green, 'Votre compte est confirmé — créez votre copropriété en 2 minutes');
}
