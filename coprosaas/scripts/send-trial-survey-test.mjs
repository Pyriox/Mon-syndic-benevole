// Script de test : envoie le sondage "essai non converti J+1" à une adresse de test
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? 're_D1H81aYF_6ydmErbKVFr9mT44LHvM2c61';
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'contact@mon-syndic-benevole.fr'}>`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';
const CONTACT_EMAIL = 'contact@mon-syndic-benevole.fr';

const TO = process.argv[2] ?? 'tpn.fabien@gmail.com';
const prenom = process.argv[3] ?? 'Fabien';
const coproprieteNom = process.argv[4] ?? 'Résidence Les Pins (test)';

// ── Helpers ────────────────────────────────────────────────────────────────────
const COLOR = {
  text: '#111827', muted: '#6b7280', blue: '#2563eb',
  green: '#16a34a', border: '#e5e7eb',
};
const h = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ctaButton = (label, url, color) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;padding:13px 28px;background:${color};color:#fff;font-size:15px;font-weight:700;border-radius:8px;text-decoration:none">${label}</a>
  </td></tr>
</table>`;

const wrapEmail = (content, _accent, preview) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(preview)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid ${COLOR.border};padding:32px 40px">
${content}
</div>
<p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0">${h(preview)}</p>
</body></html>`;

// ── Template ────────────────────────────────────────────────────────────────────
const encName = encodeURIComponent(`${coproprieteNom} — Mon Syndic Bénévole`);

const reasons = [
  { label: '⏳ Pas encore prêt(e), je reviendrai',     body: "Je ne suis pas encore prêt(e) à souscrire, mais j'envisage de revenir." },
  { label: '💸 Le tarif est trop élevé',                body: 'Je trouve le tarif trop élevé pour mes besoins actuels.' },
  { label: '🔧 Il manque une fonctionnalité',           body: "Il manque une fonctionnalité dont j'aurais besoin : (préciser)" },
  { label: '📊 Je gère avec un autre outil',            body: 'Je continue à gérer ma copropriété avec un autre outil (Excel, autre logiciel…).' },
  { label: '✏️ Autre raison',                           body: 'Voici ma raison : (préciser)' },
];

const reasonLinks = reasons.map(({ label, body }) =>
  `<tr><td style="padding:5px 0"><a href="mailto:${CONTACT_EMAIL}?subject=Retour%20essai%20%E2%80%94%20${encName}&body=${encodeURIComponent(body)}" style="display:inline-block;padding:10px 16px;font-size:14px;color:${COLOR.blue};background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-decoration:none;line-height:1.4;font-weight:500">${h(label)}</a></td></tr>`
).join('\n');

const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai s&rsquo;est terminé hier</h1>
<p style="margin:0 0 24px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">Bonjour <strong>${h(prenom)}</strong>,</p>
<p style="margin:0 0 8px;font-size:15px;color:${COLOR.text};line-height:1.7;font-weight:600">
  Je voulais juste vous poser une question directe&nbsp;: qu&rsquo;est-ce qui vous a retenu(e) de continuer&nbsp;?
</p>
<p style="margin:0 0 20px;font-size:14px;color:${COLOR.text};line-height:1.7">
  Votre retour — même en quelques mots — m&rsquo;aide vraiment à améliorer l&rsquo;application. <strong>Répondez simplement à cet e-mail</strong> ou cliquez sur la raison qui vous correspond&nbsp;:
</p>

<table cellpadding="0" cellspacing="0" style="margin:0 0 28px">
${reasonLinks}
</table>

<p style="margin:0 0 6px;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Vous préférez répondre librement&nbsp;? <a href="mailto:${CONTACT_EMAIL}?subject=Retour%20essai%20%E2%80%94%20${encName}" style="color:${COLOR.blue};font-weight:500">Répondez directement à cet e-mail</a> — je lis chaque message personnellement.
</p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">

<p style="margin:0 0 16px;font-size:13px;color:${COLOR.muted};line-height:1.6">
  Si c&rsquo;était simplement un oubli, vos données sont conservées 30&nbsp;jours. Vous pouvez reprendre exactement là où vous en étiez.
</p>

${ctaButton('Reprendre mon abonnement →', `${SITE_URL}/abonnement`, COLOR.green)}

<p style="margin:16px 0 0;font-size:12px;color:${COLOR.muted};text-align:center">
  Merci d&rsquo;avance pour votre réponse — elle compte vraiment.<br>
  Fabien — fondateur de Mon Syndic Bénévole
</p>`;

const html = wrapEmail(content, COLOR.blue, "Qu'est-ce qui vous a retenu(e) de continuer ? Votre avis nous aide à nous améliorer.");
const subject = `Une question sur votre essai — ${coproprieteNom} — Mon Syndic Bénévole`;

// ── Envoi ───────────────────────────────────────────────────────────────────────
const resend = new Resend(RESEND_API_KEY);
const { data, error } = await resend.emails.send({ from: FROM, to: TO, subject, html });
if (error) {
  console.error('[ERREUR]', error);
  process.exit(1);
}
console.log(`[OK] Email envoyé à ${TO} — id: ${data?.id}`);
