/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const email = process.argv[2] || 'tpn.fabien@gmail.com';

function dayStartIso(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())).toISOString();
}

function nextDayStartIso(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1)).toISOString();
}

(async () => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, full_name')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    console.log(JSON.stringify({ ok: false, reason: 'profile_not_found', email }, null, 2));
    return;
  }

  const { data: copros } = await supabase
    .from('coproprietes')
    .select('id, syndic_id, nom')
    .eq('syndic_id', profile.id);

  const coproIds = (copros || []).map((c) => c.id);

  let cpRows = [];
  if (coproIds.length) {
    const { data } = await supabase
      .from('coproprietaires')
      .select('id, copropriete_id')
      .in('copropriete_id', coproIds);
    cpRows = data || [];
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const d2 = new Date(today);
  d2.setDate(d2.getDate() - 2);
  const d7 = new Date(today);
  d7.setDate(d7.getDate() - 7);

  const [{ data: j2Conf }, { data: j7Conf }] = await Promise.all([
    supabase
      .from('user_events')
      .select('id, created_at')
      .eq('user_email', email)
      .eq('event_type', 'account_confirmed')
      .gte('created_at', dayStartIso(d2))
      .lt('created_at', nextDayStartIso(d2)),
    supabase
      .from('user_events')
      .select('id, created_at')
      .eq('user_email', email)
      .eq('event_type', 'account_confirmed')
      .gte('created_at', dayStartIso(d7))
      .lt('created_at', nextDayStartIso(d7)),
  ]);

  const [{ data: j2Sent }, { data: j7Sent }] = await Promise.all([
    supabase
      .from('user_events')
      .select('id, created_at')
      .eq('user_email', email)
      .eq('event_type', 'onboarding_copro_reminder_j2_sent'),
    supabase
      .from('user_events')
      .select('id, created_at')
      .eq('user_email', email)
      .eq('event_type', 'onboarding_copro_reminder_j7_sent'),
  ]);

  const coproCount = coproIds.length;
  const coproprietairesCount = cpRows.length;

  console.log(
    JSON.stringify(
      {
        ok: true,
        email,
        role: profile.role,
        coproCount,
        coproprietairesCount,
        qualifiesRule: coproCount === 0 || coproprietairesCount < 2,
        accountConfirmedAtJMinus2: (j2Conf || []).length > 0,
        accountConfirmedAtJMinus7: (j7Conf || []).length > 0,
        alreadySentJ2: (j2Sent || []).length > 0,
        alreadySentJ7: (j7Sent || []).length > 0,
      },
      null,
      2
    )
  );
})();
