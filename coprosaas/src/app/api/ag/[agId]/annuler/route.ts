import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@/lib/supabase/server';
import { logEventForEmail } from '@/lib/actions/log-user-event';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ agId: string }> }
) {
  const { agId } = await params;

  const authClient = await createClient();
  const {
    data: { user },
  } = await authClient.auth.getUser();

  if (!user) return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
  );

  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('id, titre, statut, convocation_envoyee_le, coproprietes(syndic_id)')
    .eq('id', agId)
    .single();

  if (!ag) return NextResponse.json({ message: 'AG introuvable' }, { status: 404 });

  const copro = Array.isArray(ag.coproprietes) ? ag.coproprietes[0] : ag.coproprietes;
  if (!copro || copro.syndic_id !== user.id) {
    return NextResponse.json({ message: 'Accès refusé' }, { status: 403 });
  }

  if (ag.statut === 'annulee') {
    return NextResponse.json({ message: 'Cette AG est déjà annulée.' }, { status: 409 });
  }

  const isLaunched = ag.statut === 'en_cours' || ag.statut === 'terminee' || Boolean(ag.convocation_envoyee_le);
  if (!isLaunched && ag.statut !== 'planifiee') {
    return NextResponse.json({ message: 'Cette AG ne peut pas être annulée dans son état actuel.' }, { status: 409 });
  }

  const { error } = await supabase
    .from('assemblees_generales')
    .update({ statut: 'annulee' })
    .eq('id', agId);

  if (error) return NextResponse.json({ message: 'Erreur annulation : ' + error.message }, { status: 500 });

  if (user.email) {
    await logEventForEmail({
      email: user.email,
      eventType: 'ag_status_changed',
      label: `Statut AG modifié : ${ag.statut} → annulee (${ag.titre})`,
      severity: 'warning',
      metadata: { agId, oldStatus: ag.statut, newStatus: 'annulee' },
    });
  }

  return NextResponse.json({ message: 'AG annulée (historique conservé).' });
}
