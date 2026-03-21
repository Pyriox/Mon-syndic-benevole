// ============================================================
// Layout Administration — accessible uniquement pour tpn.fabien@gmail.com
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import AdminLogout from './AdminLogout';
import AdminSidebar from './AdminSidebar';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barre de navigation admin */}
      <header className="bg-gray-900 text-white sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 py-3 flex items-center justify-between">
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
            <Link href="/dashboard" className="text-xs text-gray-400 hover:text-white transition-colors">
              ← Mon espace
            </Link>
            <span className="text-gray-700 text-xs">|</span>
            <span className="text-xs text-gray-400 hidden sm:block">{ADMIN_EMAIL}</span>
            <AdminLogout />
          </div>
        </div>
      </header>

      {/* Corps : sidebar + contenu */}
      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-6 flex gap-6 items-start">
        <AdminSidebar />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
