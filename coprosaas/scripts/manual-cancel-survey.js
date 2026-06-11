/* eslint-disable @typescript-eslint/no-require-imports */
// Envoi manuel du sondage "demande d'avis suite à résiliation" à une ou plusieurs adresses.
// Usage : node scripts/manual-cancel-survey.js <email1> [<email2> ...]
// Exemple : node scripts/manual-cancel-survey.js sarah.frisquet@gmail.com jennybirota@live.fr

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// ── Chargement .env.local ────────────────────────────────────────────────────
const envPath = path.join(process.cwd(), '.env.local');
const envRaw = fs.readFileSync(envPath, 'utf8');
for (const line of envRaw.split(/\r?\n/)) {
  if (!line || line.trim().startsWith('#')) continue;
  const i = line.indexOf('=');
  if (i < 0) continue;
  const k = line.slice(0, i).trim();
  let v = line.slice(i + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  process.env[k] = v;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mon-syndic-benevole.fr';
const FROM = `Mon Syndic Bénévole <${process.env.EMAIL_FROM ?? 'contact@mon-syndic-benevole.fr'}>`;
const CONTACT_EMAIL = 'contact@mon-syndic-benevole.fr';

// ── Helpers ──────────────────────────────────────────────────────────────────
const h = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const ctaButton = (label, url, color) => `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
  <tr><td align="center">
    <a href="${url}" style="display:inline-block;padding:13px 28px;background:${color};color:#fff;font-size:15px;font-weight:700;border-radius:8px;text-decoration:none">${label}</a>
  </td></tr>
</table>`;

const wrapEmail = (content, preview) => `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${h(preview)}</title></head>
<body style="font-family:Arial,Helvetica,sans-serif;background:#f3f4f6;margin:0;padding:24px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;border:1px solid #e5e7eb;padding:32px 40px">
${content}
</div>
<p style="text-align:center;font-size:11px;color:#9ca3af;margin:16px 0">${h(preview)}</p>
</body></html>`;

function buildEmail(prenom, coproprieteNom) {
  const prenomStr = prenom ? `Bonjour <strong>${h(prenom)}</strong>` : 'Bonjour';
  const encName = encodeURIComponent(`${coproprieteNom} — Mon Syndic Bénévole`);
  const COLOR = { text: '#111827', muted: '#6b7280', blue: '#2563eb', green: '#16a34a' };

  const reasons = [
    { label: '⏳ Pas encore prêt(e), je reviendrai',  body: "Je ne suis pas encore prêt(e) à souscrire, mais j'envisage de revenir." },
    { label: '💸 Le tarif est trop élevé',             body: 'Je trouve le tarif trop élevé pour mes besoins actuels.' },
    { label: '🔧 Il manque une fonctionnalité',        body: "Il manque une fonctionnalité dont j'aurais besoin : (préciser)" },
    { label: '📊 Je gère avec un autre outil',         body: 'Je continue à gérer ma copropriété avec un autre outil (Excel, autre logiciel…).' },
    { label: '✏️ Autre raison',                        body: 'Voici ma raison : (préciser)' },
  ];

  const reasonLinks = reasons.map(({ label, body }) =>
    `<tr><td style="padding:5px 0"><a href="mailto:${CONTACT_EMAIL}?subject=Retour%20essai%20%E2%80%94%20${encName}&body=${encodeURIComponent(body)}" style="display:inline-block;padding:10px 16px;font-size:14px;color:${COLOR.blue};background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;text-decoration:none;line-height:1.4;font-weight:500">${h(label)}</a></td></tr>`
  ).join('\n');

  const content = `
<h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:${COLOR.text}">Votre essai s&rsquo;est terminé hier</h1>
<p style="margin:0 0 24px;font-size:13px;color:${COLOR.muted}">${h(coproprieteNom)}</p>

<p style="margin:0 0 16px;font-size:15px;color:${COLOR.text}">${prenomStr},</p>
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

  return wrapEmail(content, "Qu'est-ce qui vous a retenu(e) de continuer ? Votre avis nous aide à nous améliorer.");
}

function sendEmail(to, subject, html) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ from: FROM, to, subject, html });
    const req = https.request(
      {
        hostname: 'api.resend.com',
        path: '/emails',
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
      },
      (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      },
    );
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  const emails = process.argv.slice(2);
  if (!emails.length) {
    console.error('Usage : node scripts/manual-cancel-survey.js <email1> [<email2> ...]');
    process.exit(1);
  }

  for (const rawEmail of emails) {
    const email = rawEmail.toLowerCase().trim();
    console.log(`\n─── Traitement : ${email} ───`);

    // 1. Récupérer le profil
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', email)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('  ✗ Profil introuvable pour', email, profileError?.message ?? '');
      continue;
    }

    const userId = profile.id;
    const prenom = (profile.full_name ?? '').split(' ')[0] || null;
    console.log(`  → Profil: ${profile.full_name} (${userId})`);

    // 2. Récupérer la copropriété la plus récente
    const { data: copros } = await supabase
      .from('coproprietes')
      .select('id, nom, plan')
      .eq('syndic_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!copros?.length) {
      console.error('  ✗ Aucune copropriété trouvée pour', email);
      continue;
    }

    const copro = copros[0];
    console.log(`  → Copropriété: ${copro.nom} (plan: ${copro.plan})`);

    // 3. Vérifier idempotence
    const { data: alreadySent } = await supabase
      .from('user_events')
      .select('id')
      .eq('event_type', 'trial_survey_j1_sent')
      .eq('user_email', email)
      .maybeSingle();

    if (alreadySent) {
      console.log('  ⚠ Sondage déjà envoyé pour cet utilisateur — ignoré (idempotence).');
      continue;
    }

    // 4. Envoyer
    const subject = `Une question sur votre essai — ${copro.nom} — Mon Syndic Bénévole`;
    const html = buildEmail(prenom, copro.nom);

    console.log('  → Envoi email...');
    const result = await sendEmail(email, subject, html);
    console.log(`  → Resend réponse: ${result.status}`, JSON.stringify(result.body));

    if (result.status !== 200 && result.status !== 201) {
      console.error('  ✗ Échec envoi email');
      continue;
    }

    // 5. Log user_event
    const { error: insertError } = await supabase.from('user_events').insert({
      user_email: email,
      user_id: userId,
      event_type: 'trial_survey_j1_sent',
      label: `Sondage résiliation envoyé [manuel] — ${copro.nom}`,
      copropriete_id: copro.id,
    });

    if (insertError) {
      console.error('  ⚠ Email envoyé mais erreur log user_event:', insertError.message);
    } else {
      console.log('  ✓ Email envoyé et événement logué.');
    }
  }

  console.log('\nTerminé.');
})();
