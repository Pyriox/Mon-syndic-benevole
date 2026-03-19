// ============================================================
// Template : E-mail de confirmation d'inscription
//
// À coller dans Supabase Dashboard :
//   Authentication → Email Templates → Confirm signup
//
// Variables Supabase :
//   {{ .ConfirmationURL }}  — URL de confirmation
//   {{ .Email }}            — email du nouvel utilisateur
// ============================================================

import { wrapEmail, ctaButton, COLOR } from './base';

export const CONFIRMATION_INSCRIPTION_SUBJECT =
  'Confirmez votre adresse e-mail — Mon Syndic Bénévole';

export function confirmationInscriptionHtml(): string {
  const content = `
<h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${COLOR.text}">Confirmez votre adresse e-mail</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">Dernière étape avant d'accéder à votre espace</p>

<p style="margin:0 0 4px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Merci de vous être inscrit sur <strong>Mon Syndic Bénévole</strong>.<br/>
  Cliquez sur le bouton ci-dessous pour valider votre adresse et activer votre compte.
</p>

${ctaButton('Confirmer mon adresse e-mail', '{{ .ConfirmationURL }}')}

<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted};line-height:1.5">
  Ce lien est valable <strong>24 heures</strong>. Passé ce délai, vous pourrez en demander un nouveau depuis la page de connexion.
</p>

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid ${COLOR.border}">
  <tr>
    <td style="padding-top:16px">
      <p style="margin:0;font-size:12px;color:${COLOR.muted};line-height:1.5">
        Bouton ne fonctionnant pas ? Copiez ce lien dans votre navigateur :<br/>
        <a href="{{ .ConfirmationURL }}" style="color:${COLOR.blue};word-break:break-all;font-size:11px">
          {{ .ConfirmationURL }}
        </a>
      </p>
    </td>
  </tr>
</table>

<p style="margin:20px 0 0;font-size:12px;color:${COLOR.muted}">
  Si vous n'êtes pas à l'origine de cette inscription, ignorez cet e-mail.
</p>`;

  return wrapEmail(content, COLOR.blue);
}
