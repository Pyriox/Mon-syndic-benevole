// ============================================================
// Template e-mail — Invitation copropriétaire
// Envoyé automatiquement lors de la création d'une invitation
// ============================================================

import { wrapEmail, ctaButton, h, COLOR } from './base';

export interface InvitationEmailParams {
  coproprieteNom: string;
  syndicPrenom: string;
  inviteLink: string;
}

export function buildInvitationEmailSubject(coproprieteNom: string): string {
  return `Vous êtes invité à rejoindre ${coproprieteNom} — Mon Syndic Bénévole`;
}

export function buildInvitationEmail(params: InvitationEmailParams): string {
  const { coproprieteNom, syndicPrenom, inviteLink } = params;

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre espace copropriétaire vous attend</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text};line-height:1.6">
  Bonjour,
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.6">
  <strong>${h(syndicPrenom)}</strong>, le syndic de la copropriété <strong>${h(coproprieteNom)}</strong>,
  vous invite à créer votre compte sur <strong>Mon Syndic Bénévole</strong>.
</p>

<p style="margin:0 0 4px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Grâce à votre espace personnel, vous pourrez&nbsp;:
</p>
<ul style="margin:0 0 20px;padding-left:20px;font-size:14px;color:${COLOR.text};line-height:2">
  <li>Consulter vos charges et appels de fonds</li>
  <li>Accéder aux documents de la copropriété</li>
  <li>Suivre les assemblées générales et voter</li>
  <li>Visualiser vos lots et tantièmes</li>
</ul>

${ctaButton('Créer mon compte →', inviteLink, COLOR.blue)}

<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:4px;border-top:1px solid ${COLOR.border}">
  <tr>
    <td style="padding-top:16px">
      <p style="margin:0 0 6px;font-size:13px;color:${COLOR.muted}">
        Ce lien est valable <strong>7 jours</strong>. Passé ce délai, demandez un nouveau lien au syndic.
      </p>
      <p style="margin:0;font-size:12px;color:${COLOR.muted};line-height:1.5">
        Bouton ne fonctionnant pas ? Copiez ce lien dans votre navigateur :<br/>
        <a href="${inviteLink}" style="color:${COLOR.blue};word-break:break-all;font-size:11px">${inviteLink}</a>
      </p>
    </td>
  </tr>
</table>

<p style="margin:20px 0 0;font-size:12px;color:${COLOR.muted}">
  Si vous n'attendiez pas cette invitation, ignorez cet e-mail.
</p>`;

  return wrapEmail(content, COLOR.blue);
}
