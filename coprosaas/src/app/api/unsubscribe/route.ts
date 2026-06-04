// Route GET /api/unsubscribe?uid=xxx&token=yyy
// Traite la demande de désabonnement des e-mails marketing.
// Accessible sans authentification — le token HMAC suffit à prouver l'identité.

import { NextRequest, NextResponse } from 'next/server';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe-token';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCanonicalSiteUrl } from '@/lib/site-url';

const SITE_URL = getCanonicalSiteUrl();

export async function GET(req: NextRequest): Promise<NextResponse> {
  const uid = req.nextUrl.searchParams.get('uid');
  const token = req.nextUrl.searchParams.get('token');

  if (!uid || !token) {
    return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=invalid`);
  }

  if (!verifyUnsubscribeToken(uid, token)) {
    return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=invalid`);
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('profiles')
    .update({ unsubscribe_marketing: true })
    .eq('id', uid);

  if (error) {
    console.error('[unsubscribe] DB error:', error);
    return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=error`);
  }

  return NextResponse.redirect(`${SITE_URL}/unsubscribe?status=success`);
}
