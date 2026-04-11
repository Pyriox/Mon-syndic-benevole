// ============================================================
// Template e-mail — Réponse admin à un ticket support
// Envoyé automatiquement lorsqu'un admin répond à un ticket
// ============================================================

import { wrapEmail, ctaButton, h, COLOR } from './base';

export interface SupportReplyEmailParams {
  userName: string;
  subject: string;
  adminMessage: string;
  ticketUrl: string;
}

export function buildSupportReplyEmailSubject(subject: string): string {
  return `Réponse à votre ticket — ${subject}`;
}

export function buildSupportReplyEmail(params: SupportReplyEmailParams): string {
  const { userName, subject, adminMessage, ticketUrl } = params;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Réponse à votre demande de support</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(subject)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text};line-height:1.6">
  Bonjour ${h(userName)},
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Notre équipe support a répondu à votre demande. Voici son message&nbsp;:
</p>

<div style="background:#f0f7ff;border-left:3px solid ${COLOR.blue};border-radius:0 6px 6px 0;padding:16px 20px;margin:0 0 24px">
  <p style="margin:0;font-size:14px;color:${COLOR.text};line-height:1.7;white-space:pre-wrap">${h(adminMessage)}</p>
</div>

${ctaButton('Voir mon ticket →', ticketUrl, COLOR.blue)}

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;border-top:1px solid ${COLOR.border}">
  <tr>
    <td style="padding-top:16px">
      <p style="margin:0;font-size:13px;color:${COLOR.muted};line-height:1.6">
        Vous pouvez répondre directement depuis votre espace en cliquant sur le bouton ci-dessus.
      </p>
      <p style="margin:8px 0 0;font-size:12px;color:${COLOR.muted}">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur&nbsp;:<br/>
        <a href="${ticketUrl}" style="color:${COLOR.blue};word-break:break-all;font-size:11px">${ticketUrl}</a>
      </p>
    </td>
  </tr>
</table>
`;

  return wrapEmail(content, COLOR.blue);
}
