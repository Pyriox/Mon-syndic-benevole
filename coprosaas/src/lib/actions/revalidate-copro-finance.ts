'use server';

import { revalidatePath } from 'next/cache';
import { invalidateCoproprietairesCache, invalidateDashboardCache } from '@/lib/cached-queries';

export async function revalidateCoproFinance(coproprieteId: string | null | undefined): Promise<void> {
  if (!coproprieteId || coproprieteId === 'none') return;

  invalidateDashboardCache(coproprieteId);
  invalidateCoproprietairesCache(coproprieteId);

  revalidatePath('/dashboard');
  revalidatePath('/coproprietaires');
  revalidatePath('/appels-de-fonds');
  revalidatePath('/depenses');
  revalidatePath('/regularisation');
  revalidatePath(`/coproprietes/${coproprieteId}`);
  revalidatePath(`/coproprietes/${coproprieteId}/parametrage`);
}
