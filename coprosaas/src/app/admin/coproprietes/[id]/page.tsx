// ============================================================
// Admin — Détail d'une copropriété : liste des copropriétaires
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import { isAdminUser } from '@/lib/admin-config';
import { ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';
import AdminCoproprietaireActions from '../../AdminCoproprietaireActions';

export default async function AdminCoproDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const { id } = await params;
  const admin = createAdminClient();

  const [{ data: copro }, { data: coproprietaires }] = await Promise.all([
    admin
      .from('coproprietes')
      .select('id, nom, adresse, code_postal, ville, nombre_lots')
      .eq('id', id)
      .single(),
    admin
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, telephone, email, adresse, complement_adresse, code_postal, ville, solde, lot_id')
      .eq('copropriete_id', id)
      .order('nom', { ascending: true }),
  ]);

  if (!copro) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cps = (coproprietaires ?? []) as any[];

  function fmtEur(n: number | null) {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <div>
        <Link
          href="/admin/coproprietes"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          Retour aux copropriétés
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{copro.nom}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {[copro.adresse, copro.code_postal, copro.ville].filter(Boolean).join(' · ')}
          {copro.nombre_lots ? ` · ${copro.nombre_lots} lot${copro.nombre_lots > 1 ? 's' : ''}` : ''}
        </p>
      </div>

      {/* ── Copropriétaires ── */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users size={16} className="text-gray-400" />
          <p className="text-sm font-semibold text-gray-900">
            Copropriétaires
            <span className="ml-2 text-xs font-normal text-gray-500">{cps.length} enregistré{cps.length !== 1 ? 's' : ''}</span>
          </p>
        </div>

        {cps.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-10 text-center text-sm text-gray-400">
            Aucun copropriétaire enregistré pour cette copropriété.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom / Raison sociale</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Contact</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Adresse</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Solde</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cps.map((cp) => {
                  const displayName = cp.raison_sociale
                    ? cp.raison_sociale
                    : [cp.prenom, cp.nom].filter(Boolean).join(' ') || '—';
                  const addr = [cp.adresse, cp.code_postal, cp.ville].filter(Boolean).join(', ');
                  return (
                    <tr key={cp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{displayName}</p>
                        {cp.raison_sociale && (cp.prenom || cp.nom) && (
                          <p className="text-xs text-gray-400">{[cp.prenom, cp.nom].filter(Boolean).join(' ')}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        {cp.email && <p className="text-xs text-gray-600">{cp.email}</p>}
                        {cp.telephone && <p className="text-xs text-gray-400">{cp.telephone}</p>}
                        {!cp.email && !cp.telephone && <span className="text-xs text-gray-400">—</span>}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                        {addr || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${(cp.solde ?? 0) < 0 ? 'text-red-600' : 'text-gray-700'}`}>
                          {fmtEur(cp.solde)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <AdminCoproprietaireActions cp={cp} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
