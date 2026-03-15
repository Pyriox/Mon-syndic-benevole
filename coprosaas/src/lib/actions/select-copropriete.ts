'use server';

import { cookies } from 'next/headers';

export async function selectCopropriete(coproId: string) {
  const cookieStore = await cookies();
  cookieStore.set('selected_copro_id', coproId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 an
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}
