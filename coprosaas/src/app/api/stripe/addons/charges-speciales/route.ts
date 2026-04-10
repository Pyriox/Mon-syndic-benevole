import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { rateLimit } from '@/lib/rate-limit';
import { disableCoproAddonAtPeriodEnd, enableCoproAddon } from '@/lib/stripe-addon-management';

async function getAuthenticatedUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function readBody(req: NextRequest): Promise<{ coproprieteid?: string }> {
  return req.json().catch(() => ({}));
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    if (!await rateLimit(`addon-enable:${user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
    }

    const { coproprieteid } = await readBody(req);
    if (!coproprieteid) {
      return NextResponse.json({ error: 'Copropriété manquante.' }, { status: 400 });
    }

    const result = await enableCoproAddon(coproprieteid, user.id, 'charges_speciales');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      currentPeriodEnd: result.currentPeriodEnd,
      alreadyApplied: result.alreadyApplied ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[stripe/addons/charges-speciales][POST]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

    if (!await rateLimit(`addon-disable:${user.id}`, 20, 60_000)) {
      return NextResponse.json({ error: 'Trop de tentatives. Réessayez dans une minute.' }, { status: 429 });
    }

    const { coproprieteid } = await readBody(req);
    if (!coproprieteid) {
      return NextResponse.json({ error: 'Copropriété manquante.' }, { status: 400 });
    }

    const result = await disableCoproAddonAtPeriodEnd(coproprieteid, user.id, 'charges_speciales');
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json({
      ok: true,
      message: result.message,
      currentPeriodEnd: result.currentPeriodEnd,
      alreadyApplied: result.alreadyApplied ?? false,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur interne';
    console.error('[stripe/addons/charges-speciales][DELETE]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
