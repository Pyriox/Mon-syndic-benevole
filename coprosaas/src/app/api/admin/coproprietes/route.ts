// ============================================================
// API Admin — gestion des abonnements des copropriétés
//
// POST /api/admin/coproprietes  { action, coproId }
//   → reset_subscription, stripe_sync, reassign_syndic
// PATCH /api/admin/coproprietes  { coproId, nom?, adresse?, code_postal?, ville?, nombre_lots? }
//   → modifier les informations générales d’une copropriété
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { stripe } from '@/lib/stripe';
import { isAdminUser } from '@/lib/admin-config';
import { logAdminAction } from '@/lib/actions/log-user-event';

async function checkAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const admin = createAdminClient();
  return (await isAdminUser(user.id, admin)) ? user : null;
}

export async function POST(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as { action: string; coproId?: string };
  const { action, coproId } = body;

  if (!coproId) {
    return NextResponse.json({ error: 'coproId requis' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (action === 'reset_subscription') {
    const { error } = await admin
      .from('coproprietes')
      .update({
        plan: 'inactif',
        plan_id: null,
        stripe_subscription_id: null,
        stripe_customer_id: null,
        plan_period_end: null,
      })
      .eq('id', coproId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_subscription_reset',
      label: `Abonnement réinitialisé — ${coproId}`,
      severity: 'warning',
      metadata: { coproId },
    });
    return NextResponse.json({ success: true });
  }

  if (action === 'stripe_sync') {
    const { data: copro, error: coproError } = await admin
      .from('coproprietes')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', coproId)
      .single();

    if (!copro || coproError) {
      return NextResponse.json({ error: 'Copropriété introuvable' }, { status: 404 });
    }
    if (!copro.stripe_customer_id && !copro.stripe_subscription_id) {
      return NextResponse.json({ error: 'Aucun identifiant Stripe sur cette copropriété' }, { status: 400 });
    }

    // 1. Récupérer l'abonnement directement par son ID si disponible
    let sub: Record<string, unknown> | null = null;
    if (copro.stripe_subscription_id) {
      try {
        sub = await stripe.subscriptions.retrieve(copro.stripe_subscription_id) as unknown as Record<string, unknown>;
      } catch { sub = null; }
    }
    // 2. Fallback : lister les abonnements du customer
    if (!sub && copro.stripe_customer_id) {
      try {
        const list = await stripe.subscriptions.list({ customer: copro.stripe_customer_id, limit: 5, status: 'all' });
        // Prefer active/trialing/past_due over canceled
        const best = list.data.find((s) => !['canceled', 'incomplete_expired'].includes(s.status))
          ?? list.data[0]
          ?? null;
        sub = best as unknown as Record<string, unknown> | null;
      } catch {
        // Customer deleted on Stripe → clear customer ID too
        await admin.from('coproprietes').update({
          plan: 'inactif', plan_id: null,
          stripe_subscription_id: null, stripe_customer_id: null, plan_period_end: null,
        }).eq('id', coproId);
        return NextResponse.json({ success: true, plan: 'inactif', note: 'customer_deleted' });
      }
    }

    if (!sub) {
      await admin.from('coproprietes').update({
        plan: 'inactif', plan_id: null, stripe_subscription_id: null, plan_period_end: null,
      }).eq('id', coproId);
      return NextResponse.json({ success: true, plan: 'inactif' });
    }

    const status = sub['status'] as string;
    const plan = status === 'active' ? 'actif'
      : status === 'past_due' ? 'passe_du'
      : status === 'trialing' ? 'essai'
      : 'inactif';
    const subMeta = (sub['metadata'] as Record<string, string>) ?? {};
    const planId = subMeta?.plan_id ?? null;
    const ts = sub['current_period_end'] as number | undefined;
    const periodEnd = ts && ts > 0 ? new Date(ts * 1000).toISOString() : null;

    const { error: syncError } = await admin.from('coproprietes').update({
      plan: plan as 'actif' | 'inactif' | 'passe_du' | 'essai',
      plan_id: planId,
      stripe_subscription_id: sub['id'] as string,
      stripe_customer_id: sub['customer'] as string,
      plan_period_end: periodEnd,
    }).eq('id', coproId);

    if (syncError) return NextResponse.json({ error: syncError.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_stripe_sync',
      label: `Synchronisation Stripe — ${coproId}`,
      metadata: { coproId, plan, planId },
    });
    return NextResponse.json({ success: true, plan, planId });
  }

  if (action === 'reassign_syndic') {
    const { newEmail } = body as { newEmail?: string };
    if (!newEmail?.trim()) {
      return NextResponse.json({ error: 'newEmail requis' }, { status: 400 });
    }

    // Trouver l'utilisateur par email
    const { data: { users }, error: listErr } = await admin.auth.admin.listUsers({ perPage: 1000 });
    if (listErr) return NextResponse.json({ error: listErr.message }, { status: 500 });

    const target = users.find((u) => u.email?.toLowerCase() === newEmail.trim().toLowerCase());
    if (!target) {
      return NextResponse.json({ error: `Aucun compte trouvé pour ${newEmail.trim()}` }, { status: 404 });
    }

    const { error: updErr } = await admin
      .from('coproprietes')
      .update({ syndic_id: target.id })
      .eq('id', coproId);

    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });
    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_syndic_reassigned',
      label: `Syndic réassigné — ${coproId}`,
      severity: 'warning',
      metadata: { coproId, newSyndicId: target.id, newSyndicEmail: newEmail.trim().toLowerCase() },
    });
    return NextResponse.json({ success: true, newSyndicId: target.id });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}

// ── PATCH : modifier les infos d’une copropriété ───────────────────────
export async function PATCH(request: NextRequest) {
  const requester = await checkAdmin();
  if (!requester) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const body = await request.json() as {
    coproId?: string;
    nom?: string;
    adresse?: string;
    code_postal?: string;
    ville?: string;
    nombre_lots?: number;
  };

  const { coproId, ...fields } = body;
  if (!coproId?.trim()) {
    return NextResponse.json({ error: 'coproId requis' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (fields.nom       !== undefined) updates.nom        = fields.nom.trim()       || null;
  if (fields.adresse   !== undefined) updates.adresse    = fields.adresse.trim()   || null;
  if (fields.code_postal !== undefined) updates.code_postal = fields.code_postal.trim() || null;
  if (fields.ville     !== undefined) updates.ville      = fields.ville.trim()     || null;
  if (fields.nombre_lots !== undefined) {
    const parsedLots = Number(fields.nombre_lots);
    if (!Number.isFinite(parsedLots) || parsedLots < 0) {
      return NextResponse.json({ error: 'nombre_lots invalide' }, { status: 422 });
    }
    updates.nombre_lots = Math.trunc(parsedLots);
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from('coproprietes').update(updates).eq('id', coproId.trim());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void logAdminAction({
    adminEmail: requester.email ?? '',
    eventType: 'admin_copro_updated',
    label: `Copropriété modifiée — ${coproId.trim()}`,
    metadata: { coproId: coproId.trim(), updatedFields: Object.keys(updates) },
  });
  return NextResponse.json({ success: true });
}
