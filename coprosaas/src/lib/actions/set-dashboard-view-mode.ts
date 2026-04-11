'use server';

import { cookies } from 'next/headers';
import { normalizeDashboardViewMode, type DashboardViewMode } from '@/lib/dashboard-view-mode';

export async function setDashboardViewMode(mode: DashboardViewMode) {
  const normalizedMode = normalizeDashboardViewMode(mode);
  if (!normalizedMode) return;

  const cookieStore = await cookies();
  cookieStore.set('dashboard_view_mode', normalizedMode, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
  });
}
