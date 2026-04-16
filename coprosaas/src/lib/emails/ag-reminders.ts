import { wrapEmail, h, formatDateFR, ctaButton, COLOR, SITE_URL } from './base';

type ReminderKind = 'j14' | 'j7' | 'unopened';

export function buildAGReminderSubject(params: {
  coproprieteNom: string;
  dateAg: string;
  kind: ReminderKind;
}): string {
  const prefix = params.kind === 'j14'
    ? '[J-14] Assemblée générale'
    : params.kind === 'j7'
      ? '[J-7] Assemblée générale'
      : '[Action requise] Consultez votre convocation AG';

  return `${prefix} — ${params.coproprieteNom} — ${formatDateFR(params.dateAg)} — Mon Syndic Bénévole`;
}

export function buildAGReminderEmail(params: {
  prenom: string;
  nom: string;
  coproprieteNom: string;
  agTitre: string;
  dateAg: string;
  lieu?: string | null;
  kind: ReminderKind;
  agUrl?: string;
}): string {
  const isUnopened = params.kind === 'unopened';
  const title = isUnopened ? 'Votre convocation AG attend votre lecture' : 'Rappel d’assemblée générale';
  const intro = isUnopened
    ? 'Nous vous relançons car votre convocation d’assemblée générale n’a pas encore été consultée.'
    : 'Votre assemblée générale approche. Voici un rappel des informations utiles.';

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">${h(title)}</h1>
<p style="margin:0 0 20px;font-size:13px;color:${COLOR.muted}">${h(params.coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Bonjour <strong>${h(params.prenom)} ${h(params.nom)}</strong>,
</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  ${h(intro)}
</p>
<p style="margin:0 0 8px;font-size:14px;color:${COLOR.text};line-height:1.6">
  <strong>${h(params.agTitre)}</strong>
</p>
<p style="margin:0 0 16px;font-size:14px;color:${COLOR.text};line-height:1.6">
  Date : <strong>${formatDateFR(params.dateAg)}</strong><br/>
  ${params.lieu ? `Lieu : <strong>${h(params.lieu)}</strong>` : ''}
</p>

${ctaButton("Consulter l'assemblée générale →", params.agUrl ?? `${SITE_URL}/assemblees`, COLOR.blue)}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};line-height:1.6">
  Si vous avez déjà consulté cette convocation, vous pouvez ignorer ce message.
</p>
`;

  return wrapEmail(content, isUnopened ? COLOR.amber : COLOR.blue, isUnopened
    ? 'Votre convocation AG attend votre lecture'
    : 'Rappel des informations utiles pour votre assemblée générale');
}
