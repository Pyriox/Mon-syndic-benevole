// ============================================================
// Admin — Emails (raccourcis vers Resend)
// La clé API configurée n'a que la permission "send" — la liste
// des emails n'est accessible que depuis le tableau de bord Resend.
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { Mail, ExternalLink, Send, BarChart2, Settings, AlertCircle } from 'lucide-react';

export default async function AdminEmailsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const links = [
    {
      href: 'https://resend.com/emails',
      label: 'Journal des emails',
      sub: 'Historique complet, statuts, aperçu',
      icon: Mail,
      color: 'bg-indigo-50 text-indigo-600',
    },
    {
      href: 'https://resend.com/analytics',
      label: 'Analytiques',
      sub: 'Taux de livraison, ouvertures, clics',
      icon: BarChart2,
      color: 'bg-emerald-50 text-emerald-600',
    },
    {
      href: 'https://resend.com/domains',
      label: 'Domaines',
      sub: 'Vérification DNS et réputation',
      icon: Send,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      href: 'https://resend.com/api-keys',
      label: 'Clés API',
      sub: 'Gérer les permissions',
      icon: Settings,
      color: 'bg-gray-100 text-gray-600',
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Emails</h1>
        <p className="text-sm text-gray-500 mt-1">Accès au journal et aux statistiques via Resend.</p>
      </div>

      {/* ── Notice ── */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <AlertCircle size={16} className="text-amber-600 mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-amber-800">Clé API en mode envoi uniquement</p>
          <p className="text-xs text-amber-700 mt-0.5">
            La clé <code className="bg-amber-100 px-1 rounded">RESEND_API_KEY</code> configurée n&apos;a que la permission <strong>send</strong>.
            Pour afficher le journal ici, créez une clé avec la permission <strong>full access</strong> (ou <strong>read emails</strong>) dans Resend et mettez à jour la variable d&apos;environnement.
          </p>
          <a
            href="https://resend.com/api-keys"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 mt-2 underline underline-offset-2"
          >
            Gérer les clés API Resend <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* ── Liens rapides ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {links.map(({ href, label, sub, icon: Icon, color }) => (
          <a
            key={href}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4 hover:border-gray-300 hover:shadow-md transition-all group"
          >
            <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-700 transition-colors">
                {label}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
            <ExternalLink size={14} className="text-gray-300 group-hover:text-indigo-400 transition-colors shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

