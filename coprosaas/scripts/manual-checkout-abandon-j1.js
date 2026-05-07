/* eslint-disable @typescript-eslint/no-require-imports */
// Envoi manuel du mail "abandon checkout J+1" pour un user_id donné.
// Usage : node scripts/manual-checkout-abandon-j1.js <user_id>
// Exemple : node scripts/manual-checkout-abandon-j1.js 705da7d3-e41b-4428-a832-343f82dc9996

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
const FROM = 'Mon Syndic Bénévole <contact@mon-syndic-benevole.fr>';
const CONTACT_EMAIL = 'contact@mon-syndic-benevole.fr';

// ── Email HTML minimal (miroir du template subscription.ts) ─────────────────
function buildEmail(prenom, coproprieteNom, abonnementUrl) {
  const prenomStr = prenom ? `Bonjour <strong>${prenom}</strong>` : 'Bonjour';
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;max-width:600px">
<tr><td style="background:#2563eb;padding:20px 32px">
  <p style="margin:0;font-size:16px;font-weight:700;color:#ffffff">Mon Syndic Bénévole</p>
  <p style="margin:4px 0 0;font-size:12px;color:#bfdbfe">Votre essai de 14 jours vous attend — reprenez en 30 secondes.</p>
</td></tr>
<tr><td style="padding:32px">
  <h1 style="margin:0 0 6px;font-size:20px;font-weight:700;color:#1e293b">Votre souscription est restée incomplète</h1>
  <p style="margin:0 0 20px;font-size:13px;color:#64748b">${coproprieteNom}</p>
  <p style="margin:0 0 16px;font-size:15px;color:#1e293b">${prenomStr},</p>
  <p style="margin:0 0 14px;font-size:14px;color:#1e293b;line-height:1.6">
    Vous avez commencé à souscrire un abonnement pour <strong>${coproprieteNom}</strong>, mais la session de paiement n&rsquo;a pas pu être finalisée.
  </p>
  <p style="margin:0 0 20px;font-size:14px;color:#1e293b;line-height:1.6">
    Cela arrive parfois : authentification 3D Secure expirée, fenêtre fermée au mauvais moment, connexion interrompue. Votre compte est intact et votre copropriété est toujours configurée.
  </p>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;border-radius:10px;border:1px solid #e2e8f0;overflow:hidden">
    <tr style="background:#f8fafc"><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0">
      <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.5"><span style="color:#2563eb;font-weight:700">→</span> <strong>Essai 14 jours inclus</strong> — aucun paiement avant la fin de la période d&rsquo;essai</p>
    </td></tr>
    <tr><td style="padding:12px 16px;border-bottom:1px solid #e2e8f0">
      <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.5"><span style="color:#2563eb;font-weight:700">→</span> <strong>Résiliation libre</strong> — annulation possible à tout moment, sans engagement</p>
    </td></tr>
    <tr style="background:#f8fafc"><td style="padding:12px 16px">
      <p style="margin:0;font-size:13px;color:#1e293b;line-height:1.5"><span style="color:#2563eb;font-weight:700">→</span> <strong>Paiement sécurisé Stripe</strong> — carte, SEPA, Apple Pay, Google Pay</p>
    </td></tr>
  </table>
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 16px"><tr><td align="center">
    <a href="${abonnementUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#ffffff;font-size:15px;font-weight:700;text-decoration:none;border-radius:8px">Finaliser ma souscription →</a>
  </td></tr></table>
  <p style="margin:16px 0 0;font-size:13px;color:#64748b;line-height:1.6">
    Un problème&nbsp;? Écrivez-nous à <a href="mailto:${CONTACT_EMAIL}" style="color:#2563eb">${CONTACT_EMAIL}</a>. On vous aide.
  </p>
</td></tr>
<tr><td style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
  <p style="margin:0;font-size:11px;color:#94a3b8">Mon Syndic Bénévole — <a href="${SITE_URL}" style="color:#94a3b8">${SITE_URL}</a></p>
</td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ── Envoi via Resend API (REST direct, pas de package TS) ────────────────────
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
          try {
            resolve({ status: res.statusCode, body: JSON.parse(data) });
          } catch {
            resolve({ status: res.statusCode, body: data });
          }
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
  const userId = process.argv[2];
  if (!userId) {
    console.error('Usage : node scripts/manual-checkout-abandon-j1.js <user_id>');
    process.exit(1);
  }

  // 1. Récupérer le profil
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, full_name')
    .eq('id', userId)
    .maybeSingle();

  if (profileError || !profile) {
    console.error('Profil introuvable pour userId:', userId, profileError);
    process.exit(1);
  }

  const email = profile.email?.toLowerCase();
  const prenom = (profile.full_name ?? '').split(' ')[0] || null;
  console.log('→ Profil:', email, '/', profile.full_name);

  // 2. Récupérer la copropriété (sans abonnement actif)
  const { data: copros } = await supabase
    .from('coproprietes')
    .select('id, nom, plan')
    .eq('syndic_id', userId)
    .not('plan', 'in', '("actif","essai")');

  if (!copros?.length) {
    console.log('Aucune copropriété sans abonnement trouvée — vérifiez le plan actuel.');
    process.exit(0);
  }

  // Prendre la première (ou celle qui a un begin_checkout récent)
  const { data: lastCheckout } = await supabase
    .from('user_events')
    .select('copropriete_id')
    .eq('event_type', 'begin_checkout')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const targetCoproId = lastCheckout?.copropriete_id ?? copros[0].id;
  const copro = copros.find((c) => c.id === targetCoproId) ?? copros[0];
  console.log('→ Copropriété cible:', copro.nom, '(plan:', copro.plan, ')');

  // 3. Vérifier idempotence
  const { data: alreadySent } = await supabase
    .from('user_events')
    .select('id')
    .eq('event_type', 'checkout_abandon_j1_reminder_sent')
    .eq('user_email', email)
    .maybeSingle();

  if (alreadySent) {
    console.log('⚠ Email J+1 déjà envoyé pour cet utilisateur — arrêt (idempotence).');
    process.exit(0);
  }

  // 4. Envoyer
  const subject = 'Votre souscription est restée incomplète — Mon Syndic Bénévole';
  const html = buildEmail(prenom, copro.nom, `${SITE_URL}/abonnement`);

  console.log('→ Envoi email à', email, '...');
  const result = await sendEmail(email, subject, html);
  console.log('→ Resend réponse:', result.status, JSON.stringify(result.body));

  if (result.status !== 200 && result.status !== 201) {
    console.error('✗ Échec envoi email');
    process.exit(1);
  }

  // 5. Log user_event
  const { error: insertError } = await supabase.from('user_events').insert({
    user_email: email,
    user_id: userId,
    event_type: 'checkout_abandon_j1_reminder_sent',
    label: `Relance checkout abandonné envoyée (J+1) [manuel] — ${copro.nom}`,
    copropriete_id: copro.id,
  });

  if (insertError) {
    console.error('⚠ Email envoyé mais erreur log user_event:', insertError.message);
  } else {
    console.log('✓ Email envoyé et événement logué.');
  }
})();
