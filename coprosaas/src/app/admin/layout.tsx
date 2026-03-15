// ============================================================
// Layout Administration — accessible uniquement pour tpn.fabien@gmail.com
// Complètement séparé du dashboard utilisateur
// ============================================================
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import SiteLogo from '@/components/ui/SiteLogo';
import AdminLogout from './AdminLogout';

const ADMIN_EMAIL = 'tpn.fabien@gmail.com';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || user.email !== ADMIN_EMAIL) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Barre de navigation admin */}
      <header className="bg-gray-900 text-white sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SiteLogo size={28} />
            <div>
              <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-red-500 text-white uppercase tracking-wide">
                Administration
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-xs text-gray-300 hover:text-white transition-colors"
            >
              ← Mon espace
            </Link>
            <span className="text-gray-600 text-xs">|</span>
            <span className="text-xs text-gray-400">{ADMIN_EMAIL}</span>
            <AdminLogout />
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-screen-xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
