// ============================================================
// Layout Administration — accessible uniquement pour tpn.fabien@gmail.com
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-config';
import { createAdminClient } from '@/lib/supabase/admin';
import { getSupportAttentionSummary } from '@/lib/admin-support';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import SiteLogo from '@/components/ui/SiteLogo';
import AdminLogout from './AdminLogout';
import AdminSidebar from './AdminSidebar';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !(await isAdminUser(user.id, supabase))) {
    redirect('/login');
  }

  const admin = createAdminClient();
  const {
    pendingCount: pendingSupportCount,
    openCount: nbTicketsOuverts,
    inProgressCount: nbTicketsEnCours,
  } = await getSupportAttentionSummary(admin);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barre de navigation admin */}
      <header className="bg-gray-900 text-white sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <SiteLogo size={26} />
            <div>
              <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500 text-white uppercase tracking-wide">
                Admin
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="hidden sm:block text-xs text-gray-400 hover:text-white transition-colors">
              ← Mon espace
            </Link>
            <span className="hidden sm:block text-gray-700 text-xs">|</span>
            <span className="text-xs text-gray-400 hidden sm:block">{user.email}</span>
            <AdminLogout />
          </div>
        </div>
        {pendingSupportCount > 0 && (
          <div className="border-t border-white/10 bg-gradient-to-r from-red-500/15 via-amber-500/10 to-transparent">
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-2.5">
              <Link
                href={`/admin/support?status=${(nbTicketsOuverts ?? 0) > 0 ? 'ouvert' : 'en_cours'}`}
                className="inline-flex flex-wrap items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-50 hover:bg-red-500/15"
              >
                <AlertCircle size={14} className="text-red-200" />
                {pendingSupportCount} ticket{pendingSupportCount > 1 ? 's' : ''} support à traiter
                {(nbTicketsOuverts ?? 0) > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-red-100">
                    {nbTicketsOuverts} ouvert{(nbTicketsOuverts ?? 0) > 1 ? 's' : ''}
                  </span>
                )}
                {(nbTicketsEnCours ?? 0) > 0 && (
                  <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] font-medium text-red-100">
                    {nbTicketsEnCours} en cours
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Corps : sidebar + contenu */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        <AdminSidebar badges={{ '/admin/support': pendingSupportCount }} />
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
