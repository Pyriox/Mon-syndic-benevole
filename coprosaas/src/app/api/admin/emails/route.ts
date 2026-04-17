// ============================================================
// API Admin — gestion des emails
// POST /api/admin/emails { action: 'retry', deliveryId }
//   → Remet un email_delivery en statut 'queued' pour retry
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
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

  const body = await request.json() as { action?: string; deliveryId?: string };
  const { action, deliveryId } = body;

  if (action === 'retry') {
    if (!deliveryId) {
      return NextResponse.json({ error: 'deliveryId requis' }, { status: 400 });
    }

    const admin = createAdminClient();

    // Verify the delivery exists and is in a retryable state
    const { data: delivery, error: fetchError } = await admin
      .from('email_deliveries')
      .select('id, status, recipient_email, email_type')
      .eq('id', deliveryId)
      .maybeSingle();

    if (fetchError || !delivery) {
      return NextResponse.json({ error: 'Email introuvable' }, { status: 404 });
    }

    if (delivery.status !== 'failed') {
      return NextResponse.json({ error: `Statut non retryable : ${delivery.status}` }, { status: 400 });
    }

    const { error: updateError } = await admin
      .from('email_deliveries')
      .update({
        status: 'queued',
        failed_at: null,
        last_error: null,
        next_retry_at: null,
      })
      .eq('id', deliveryId)
      .eq('status', 'failed');

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    void logAdminAction({
      adminEmail: requester.email ?? '',
      eventType: 'admin_email_retry',
      label: `Retry email — ${delivery.email_type ?? ''} → ${delivery.recipient_email ?? ''}`,
      metadata: { deliveryId, emailType: delivery.email_type, recipient: delivery.recipient_email },
    });

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
}
