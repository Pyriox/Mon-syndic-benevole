import { Loader2, Shield } from 'lucide-react';
import SiteLogo from '@/components/ui/SiteLogo';

export default function AuthLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white/95 shadow-2xl border border-white/60 p-6 sm:p-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-5">
          <SiteLogo size={34} />
          <span className="font-bold text-gray-900">Mon Syndic Bénévole</span>
        </div>

        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <Loader2 size={22} className="animate-spin" />
        </div>

        <h1 className="text-lg font-bold text-gray-900">Chargement sécurisé…</h1>
        <p className="mt-2 text-sm text-gray-600">
          Nous préparons votre espace de connexion.
        </p>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
          <Shield size={13} /> Données protégées et session vérifiée
        </div>
      </div>
    </div>
  );
}
