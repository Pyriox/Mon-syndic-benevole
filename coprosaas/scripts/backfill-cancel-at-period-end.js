/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Backfill plan_cancel_at_period_end depuis Stripe pour toutes les
 * copropriétés avec plan = 'actif' et un stripe_subscription_id.
 *
 * Usage : node scripts/backfill-cancel-at-period-end.js [--dry-run]
 */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const Stripe = require('stripe');

// ── Charger .env.local ──────────────────────────────────────────────────────
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

const dryRun = process.argv.includes('--dry-run');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2025-01-27.acacia' });

(async () => {
  console.log(dryRun ? '[DRY RUN] Aucune écriture en base.' : '[LIVE] Les mises à jour seront écrites en base.');

  const { data: copros, error } = await supabase
    .from('coproprietes')
    .select('id, nom, stripe_subscription_id, plan_cancel_at_period_end')
    .eq('plan', 'actif')
    .not('stripe_subscription_id', 'is', null);

  if (error) {
    console.error('Erreur Supabase :', error.message);
    process.exit(1);
  }

  console.log(`${copros.length} copropriété(s) actives avec un abonnement Stripe à vérifier.`);

  let updated = 0;
  let alreadyOk = 0;
  let errors = 0;

  for (const copro of copros) {
    try {
      const sub = await stripe.subscriptions.retrieve(copro.stripe_subscription_id);
      const stripeValue = sub.cancel_at_period_end;
      const dbValue = copro.plan_cancel_at_period_end ?? false;

      if (stripeValue === dbValue) {
        alreadyOk++;
        continue;
      }

      console.log(
        `→ ${copro.nom} (${copro.id}) : DB=${dbValue} → Stripe=${stripeValue}` +
        (dryRun ? ' [skip dry-run]' : ' [mise à jour]'),
      );

      if (!dryRun) {
        const { error: updateError } = await supabase
          .from('coproprietes')
          .update({ plan_cancel_at_period_end: stripeValue })
          .eq('id', copro.id);

        if (updateError) {
          console.error(`  ✗ Erreur update ${copro.id} :`, updateError.message);
          errors++;
        } else {
          updated++;
        }
      } else {
        updated++;
      }
    } catch (err) {
      console.error(`  ✗ Stripe error pour ${copro.nom} (${copro.stripe_subscription_id}) :`, err.message);
      errors++;
    }
  }

  console.log(`\nRésultat : ${updated} mis à jour, ${alreadyOk} déjà corrects, ${errors} erreur(s).`);
})();
