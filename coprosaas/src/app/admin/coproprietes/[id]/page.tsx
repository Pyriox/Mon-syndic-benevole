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
import AdminPagination from '../../AdminPagination';
import AdminSearch from '../../AdminSearch';
import { resolveAdminBackHref } from '@/lib/admin-list-params';

export default async function AdminCoproDetail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string; q?: string; page?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !(await isAdminUser(user.id, supabase))) redirect('/dashboard');

  const { id } = await params;
  const { from, q, page } = await searchParams;
  const backHref = resolveAdminBackHref(from, '/admin/coproprietes');
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
  const query = q?.trim().toLowerCase() ?? '';
  const PAGE_SIZE = 20;

  function fmtEur(n: number | null) {
    if (n === null || n === undefined) return '—';
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
  }

  const filteredCps = cps.filter((cp) => {
    if (!query) return true;
    const haystack = [cp.nom, cp.prenom, cp.raison_sociale, cp.email, cp.telephone, cp.ville]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(query);
  });
  const totalPages = Math.max(1, Math.ceil(filteredCps.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(1, Number(page) || 1), totalPages);
  const pagedCps = filteredCps.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const contactsCount = cps.filter((cp) => Boolean(cp.email)).length;
  const alertCount = cps.filter((cp) => (cp.solde ?? 0) < 0).length;
  const totalSolde = cps.reduce((sum, cp) => sum + (cp.solde ?? 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* ── Header ── */}
      <div>
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-3 transition-colors"
        >
          <ArrowLeft size={13} />
          {from ? 'Retour au contexte précédent' : 'Retour aux copropriétés'}
        </Link>
        <h1 className="text-xl font-bold text-gray-900">{copro.nom}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {[copro.adresse, copro.code_postal, copro.ville].filter(Boolean).join(' · ')}
          {copro.nombre_lots ? ` · ${copro.nombre_lots} lot${copro.nombre_lots > 1 ? 's' : ''}` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-blue-800">
          <p className="text-lg font-bold">{cps.length}</p>
          <p className="text-xs font-semibold mt-0.5">Copropriétaires enregistrés</p>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-800">
          <p className="text-lg font-bold">{contactsCount}</p>
          <p className="text-xs font-semibold mt-0.5">Avec e-mail renseigné</p>
        </div>
        <div className={`rounded-xl border px-4 py-3 ${alertCount > 0 ? 'border-red-200 bg-red-50 text-red-800' : 'border-slate-200 bg-slate-50 text-slate-700'}`}>
          <p className="text-lg font-bold">{alertCount}</p>
          <p className="text-xs font-semibold mt-0.5">Solde débiteur</p>
        </div>
        <div className="rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-violet-800">
          <p className="text-lg font-bold">{fmtEur(totalSolde)}</p>
          <p className="text-xs font-semibold mt-0.5">Solde cumulé</p>
        </div>
      </div>

      {/* ── Copropriétaires ── */}
      <section>
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            <p className="text-sm font-semibold text-gray-900">
              Copropriétaires
              <span className="ml-2 text-xs font-normal text-gray-500">{filteredCps.length} affiché{filteredCps.length !== 1 ? 's' : ''} / {cps.length}</span>
            </p>
          </div>
          <AdminSearch placeholder="Rechercher un copropriétaire…" defaultValue={q ?? ''} />
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
                {pagedCps.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">
                      Aucun copropriétaire trouvé pour « {q} ».
                    </td>
                  </tr>
                )}
                {pagedCps.map((cp) => {
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

        {filteredCps.length > PAGE_SIZE && (
          <div className="mt-3">
            <AdminPagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredCps.length}
              pageSize={PAGE_SIZE}
              prevHref={`?${new URLSearchParams({ ...(from ? { from } : {}), ...(q ? { q } : {}), page: String(Math.max(1, currentPage - 1)) }).toString()}`}
              nextHref={`?${new URLSearchParams({ ...(from ? { from } : {}), ...(q ? { q } : {}), page: String(Math.min(totalPages, currentPage + 1)) }).toString()}`}
            />
          </div>
        )}
      </section>
    </div>
  );
}
