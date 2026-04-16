// ============================================================
// Template e-mail — Réinitialisation de mot de passe
// Envoyé via l'API route /api/auth/reset-password (Resend)
// Le lien est généré côté serveur avec le client admin Supabase,
// ce qui contourne la validation de l'allowlist redirectTo.
// ============================================================

import { wrapEmail, ctaButton, COLOR } from './base';

export const RESET_PASSWORD_SUBJECT = 'Réinitialisez votre mot de passe — Mon Syndic Bénévole';

export function buildResetPasswordEmail(resetLink: string): string {
  const content = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${COLOR.text}">Réinitialisez votre mot de passe</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">Une demande de réinitialisation vient d’être effectuée</p>

<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe pour votre compte
  <strong>Mon Syndic Bénévole</strong>.
</p>

${ctaButton('Réinitialiser mon mot de passe →', resetLink)}

<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted};line-height:1.5">
  Ce lien est valable <strong>1 heure</strong>. Passé ce délai, vous devrez faire une nouvelle demande.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="background:#fff5f5;border-left:3px solid ${COLOR.red};border-radius:0 6px 6px 0;margin-bottom:20px">
  <tr>
    <td style="padding:12px 16px;font-size:13px;color:${COLOR.red};line-height:1.5">
      Si vous n'avez pas demandé cette réinitialisation, ignorez cet e-mail — votre mot de passe reste inchangé.
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid ${COLOR.border}">
  <tr>
    <td style="padding-top:16px">
      <p style="margin:0;font-size:12px;color:${COLOR.muted};line-height:1.5">
        Bouton ne fonctionnant pas ? Copiez ce lien dans votre navigateur :<br/>
        <a href="${resetLink}" style="color:${COLOR.blue};word-break:break-all;font-size:11px">
          ${resetLink}
        </a>
      </p>
    </td>
  </tr>
</table>`;

  return wrapEmail(content, COLOR.blue, 'Choisissez un nouveau mot de passe pour votre compte');
}
