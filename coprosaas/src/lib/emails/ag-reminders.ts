import { wrapEmail, h, formatDateFR, ctaButton, COLOR } from './base';

type ReminderKind = 'j14' | 'j7' | 'unopened';

export function buildAGReminderSubject(params: {
  coproprieteNom: string;
  dateAg: string;
  kind: ReminderKind;
}): string {
  const prefix = params.kind === 'j14'
    ? '[J-14] Rappel AG'
    : params.kind === 'j7'
      ? '[J-7] Rappel AG'
      : '[Action requise] Convocation AG non ouverte';

  return `${prefix} - ${params.coproprieteNom} - ${formatDateFR(params.dateAg)}`;
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
  const title = isUnopened ? 'Convocation AG en attente de lecture' : 'Rappel d’assemblée générale';
  const intro = isUnopened
    ? 'Nous vous relançons car votre convocation d’assemblée générale n’a pas encore été ouverte.'
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

${ctaButton("Voir le détail de l'AG", params.agUrl ?? `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr'}/assemblees`, COLOR.blue)}
`;

  return wrapEmail(content, isUnopened ? COLOR.amber : COLOR.blue);
}
