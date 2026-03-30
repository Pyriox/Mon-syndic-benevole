// ============================================================
// Layout Administration — accessible uniquement pour tpn.fabien@gmail.com
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminUser } from '@/lib/admin-config';
import { createAdminClient } from '@/lib/supabase/admin';
import Link from 'next/link';
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
  const { count: nbTicketsOuverts } = await admin
    .from('support_tickets')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'ouvert');

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
      </header>

      {/* Corps : sidebar + contenu */}
      <div className="max-w-screen-2xl mx-auto px-3 sm:px-6 py-4 sm:py-6 flex flex-col md:flex-row gap-4 md:gap-6 items-start">
        <AdminSidebar badges={{ '/admin/support': nbTicketsOuverts ?? 0 }} />
        <main className="flex-1 min-w-0 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
