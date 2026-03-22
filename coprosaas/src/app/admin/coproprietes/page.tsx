// ============================================================
// Admin — Copropriétés (lecture seule + sync Stripe)
// Pas de modification directe des champs (risque d'incohérence).
// Pas de suppression (pas d'API admin dédiée, données en cascade).
// Actions disponibles : sync depuis Stripe, reset → essai.
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminCoproActions from '../AdminCoproActions';
import { Building2, DoorOpen, Users } from 'lucide-react';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'tpn.fabien@gmail.com';

function fmtDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function fmtEur(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

function PlanBadge({ plan, planId }: { plan: string | null; planId: string | null }) {
  if (plan === 'actif') {
    const cfg: Record<string, { label: string; cls: string }> = {
      essentiel: { label: 'Essentiel', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
      confort:   { label: 'Confort',   cls: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
      illimite:  { label: 'Illimité',  cls: 'bg-purple-50 text-purple-700 border-purple-200' },
    };
    const c = cfg[planId ?? ''] ?? { label: 'Actif', cls: 'bg-green-50 text-green-700 border-green-200' };
    return <span className={`inline-flex text-xs px-2 py-0.5 rounded-md font-medium border ${c.cls}`}>{c.label}</span>;
  }
  if (plan === 'passe_du') return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-red-50 text-red-600 border border-red-200">Impayé</span>;
  if (plan === 'inactif')  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-gray-100 text-gray-500 border border-gray-200">Inactif</span>;
  return <span className="inline-flex text-xs px-2 py-0.5 rounded-md font-medium bg-amber-50 text-amber-700 border border-amber-200">Essai</span>;
}

export default async function AdminCopropietesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email?.toLowerCase() !== ADMIN_EMAIL?.toLowerCase()) redirect('/dashboard');

  const admin = createAdminClient();
  const [
    { data: coproprietes },
    { data: lotsParCopro },
    { data: coproprietairesData },
    { data: agParCopro },
    { data: depParCopro },
    { data: incidentsParCopro },
  ] = await Promise.all([
    admin.from('coproprietes')
      .select('id, nom, adresse, ville, plan, plan_id, stripe_customer_id, stripe_subscription_id, plan_period_end, created_at, profiles!coproprietes_syndic_id_fkey(full_name, email)')
      .order('created_at', { ascending: false }),
    admin.from('lots').select('copropriete_id'),
    admin.from('coproprietaires').select('copropriete_id'),
    admin.from('assemblees_generales').select('copropriete_id'),
    admin.from('depenses').select('copropriete_id, montant'),
    admin.from('incidents').select('copropriete_id, statut'),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const coprosTyped = (coproprietes ?? []) as any[];
  const nbCoproprietes = coprosTyped.length;
  const nbActifs  = coprosTyped.filter((c) => c.plan === 'actif').length;
  const nbEssai   = coprosTyped.filter((c) => !c.plan || c.plan === 'essai').length;
  const nbInactif = coprosTyped.filter((c) => c.plan === 'inactif').length;
  const nbPasseDu = coprosTyped.filter((c) => c.plan === 'passe_du').length;

  const lotsCount: Record<string, number> = {};
  for (const l of lotsParCopro ?? []) lotsCount[l.copropriete_id] = (lotsCount[l.copropriete_id] ?? 0) + 1;
  const coproCount: Record<string, number> = {};
  for (const cp of coproprietairesData ?? []) coproCount[cp.copropriete_id] = (coproCount[cp.copropriete_id] ?? 0) + 1;
  const agCount: Record<string, number> = {};
  for (const a of agParCopro ?? []) agCount[a.copropriete_id] = (agCount[a.copropriete_id] ?? 0) + 1;
  const depCount: Record<string, number> = {};
  for (const d of depParCopro ?? []) {
    depCount[d.copropriete_id] = (depCount[d.copropriete_id] ?? 0) + d.montant;
  }
  const incidentCount: Record<string, number> = {};
  for (const i of incidentsParCopro ?? []) {
    if (i.statut !== 'resolu') incidentCount[i.copropriete_id] = (incidentCount[i.copropriete_id] ?? 0) + 1;
  }

  return (
    <div className="space-y-6 pb-16">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Copropriétés</h1>
        <p className="text-sm text-gray-500 mt-1">
          Consultation des données. Modifications métier à effectuer directement dans Supabase ou via les actions disponibles.
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total copropriétés', value: nbCoproprietes,                    icon: Building2, color: 'bg-blue-100 text-blue-600' },
          { label: 'Abonnées actives',   value: nbActifs,                          icon: Building2, color: 'bg-green-100 text-green-600' },
          { label: 'En essai',           value: nbEssai,                           icon: Building2, color: 'bg-amber-100 text-amber-600' },
          { label: 'Inactives / impayées', value: nbInactif + nbPasseDu,           icon: Building2, color: nbPasseDu > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filtres rapides ── */}
      <div className="flex gap-2 text-xs flex-wrap">
        <span className="bg-amber-50 text-amber-700 px-2 py-1 rounded-md font-medium border border-amber-200">{nbEssai} essai</span>
        <span className="bg-green-50 text-green-700 px-2 py-1 rounded-md font-medium border border-green-200">{nbActifs} actives</span>
        <span className="bg-gray-100 text-gray-500 px-2 py-1 rounded-md font-medium border border-gray-200">{nbInactif} inactives</span>
        {nbPasseDu > 0 && <span className="bg-red-50 text-red-600 px-2 py-1 rounded-md font-medium border border-red-200">{nbPasseDu} impayées</span>}
        <span className="text-gray-400 px-2 py-1">{lotsParCopro?.length ?? 0} lots au total · {coproprietairesData?.length ?? 0} copropriétaires</span>
      </div>

      {/* ── Table ── */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <DoorOpen size={11} className="inline mr-0.5" />Lots
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">
                <Users size={11} className="inline mr-0.5" />Copro.
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">AG</th>
              <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Inc.</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Dépenses</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Plan</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Créée</th>
              <th className="px-4 py-3 w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {coprosTyped.map((c) => {
              const profile = c.profiles as { full_name?: string; email?: string } | null;
              const openInc = incidentCount[c.id] ?? 0;
              return (
                <tr key={c.id} className={`hover:bg-gray-50 transition-colors ${c.plan === 'passe_du' ? 'bg-red-50/30' : ''}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800">{c.nom}</p>
                    <p className="text-xs text-gray-400">{c.ville}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <p className="text-xs text-gray-700 truncate max-w-[130px]">{profile?.full_name ?? '—'}</p>
                    <p className="text-xs text-gray-400 truncate max-w-[130px]">{profile?.email ?? ''}</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                      {lotsCount[c.id] ?? 0}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-xs text-gray-600 font-medium">{coproCount[c.id] ?? 0}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-xs text-gray-600 hidden lg:table-cell">{agCount[c.id] ?? 0}</td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    {openInc > 0
                      ? <span className="inline-flex items-center justify-center text-xs font-bold text-red-600 bg-red-50 rounded-full w-6 h-6">{openInc}</span>
                      : <span className="text-xs text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-medium text-gray-700 hidden xl:table-cell">
                    {depCount[c.id] ? fmtEur(depCount[c.id]) : '—'}
                  </td>
                  <td className="px-4 py-3"><PlanBadge plan={c.plan} planId={c.plan_id} /></td>
                  <td className="px-4 py-3 text-xs text-gray-400 hidden xl:table-cell">{fmtDate(c.created_at)}</td>
                  <td className="px-4 py-3">
                    <AdminCoproActions coproId={c.id} coproNom={c.nom} currentPlan={c.plan ?? 'essai'} currentPlanId={c.plan_id ?? null} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
