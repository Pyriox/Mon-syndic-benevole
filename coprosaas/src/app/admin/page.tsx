// ============================================================
// Page Administration — statistiques globales & gestion du site
// Accessible uniquement pour tpn.fabien@gmail.com
// ============================================================
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import {
  Users,
  Building2,
  DoorOpen,
  Receipt,
  CalendarDays,
  AlertTriangle,
  Wallet,
  TrendingUp,
  UserCheck,
  Clock,
  Mail,
  ExternalLink,
  ShieldCheck,
  Database,
  Activity,
} from 'lucide-react';

const ADMIN_EMAIL = 'tpn.fabien@gmail.com';

function formatEuros(n: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function formatDate(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}
function formatDateTime(s: string | null | undefined) {
  if (!s) return '—';
  return new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ── Composant KPI card ────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color} shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ── Composant section titre ───────────────────────────────────
function SectionTitle({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
        <Icon size={16} className="text-gray-600" />
      </div>
      <div>
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default async function AdminPage() {
  // Double vérification serveur
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== ADMIN_EMAIL) redirect('/dashboard');

  const admin = createAdminClient();

  // ── Requêtes en parallèle ─────────
  const today = new Date();
  const startOfYear = `${today.getFullYear()}-01-01`;
  const startOf30Days = new Date(Date.now() - 30 * 86400000).toISOString();

  const [
    { count: nbCoproprietes },
    { count: nbLots },
    { count: nbCoproprietaires },
    { count: nbAG },
    { count: nbIncidentsOuverts },
    { count: nbAppels },
    { data: depensesTotales },
    { data: depensesAnnee },
    { data: coproprietes },
    { data: recentCopros },
    authResult,
  ] = await Promise.all([
    admin.from('coproprietes').select('id', { count: 'exact', head: true }),
    admin.from('lots').select('id', { count: 'exact', head: true }),
    admin.from('coproprietaires').select('id', { count: 'exact', head: true }),
    admin.from('assemblees_generales').select('id', { count: 'exact', head: true }),
    admin.from('incidents').select('id', { count: 'exact', head: true }).in('statut', ['ouvert', 'en_cours']),
    admin.from('appels_de_fonds').select('id', { count: 'exact', head: true }),
    admin.from('depenses').select('montant'),
    admin.from('depenses').select('montant').gte('date_depense', startOfYear),
    admin
      .from('coproprietes')
      .select('id, nom, adresse, ville, created_at, syndic_id, profiles!coproprietes_syndic_id_fkey(full_name, id)')
      .order('created_at', { ascending: false })
      .limit(20),
    admin
      .from('coproprietes')
      .select('id, nom, ville, created_at')
      .gte('created_at', startOf30Days)
      .order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 200 }),
  ]);

  // ── Calculs ───────────────────────
  const totalDepenses = depensesTotales?.reduce((s, d) => s + d.montant, 0) ?? 0;
  const totalDepensesAnnee = depensesAnnee?.reduce((s, d) => s + d.montant, 0) ?? 0;

  const authUsers = authResult.data?.users ?? [];
  const nbUsers = authUsers.length;
  const newUsersThisMonth = authUsers.filter((u) => u.created_at && new Date(u.created_at) >= new Date(startOf30Days)).length;

  // Trier par date d'inscription desc pour l'affichage
  const recentUsers = [...authUsers]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 15);

  // Stats copropriétés : nb lots par coproprieté
  const { data: lotsParCopro } = await admin.from('lots').select('copropriete_id');
  const lotsCount: Record<string, number> = {};
  for (const l of lotsParCopro ?? []) {
    lotsCount[l.copropriete_id] = (lotsCount[l.copropriete_id] ?? 0) + 1;
  }

  // Stats AG et dépenses par copropriété
  const { data: agParCopro } = await admin.from('assemblees_generales').select('copropriete_id');
  const agCount: Record<string, number> = {};
  for (const a of agParCopro ?? []) agCount[a.copropriete_id] = (agCount[a.copropriete_id] ?? 0) + 1;

  const { data: depParCopro } = await admin.from('depenses').select('copropriete_id, montant');
  const depCount: Record<string, { nb: number; total: number }> = {};
  for (const d of depParCopro ?? []) {
    if (!depCount[d.copropriete_id]) depCount[d.copropriete_id] = { nb: 0, total: 0 };
    depCount[d.copropriete_id].nb++;
    depCount[d.copropriete_id].total += d.montant;
  }

  return (
    <div className="space-y-10 pb-12">

      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord administrateur</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Vue globale de la plateforme Mon Syndic Bénévole — données en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
          <ShieldCheck size={15} className="text-green-600" />
          <span className="text-xs text-green-700 font-medium">Accès administrateur</span>
        </div>
      </div>

      {/* ── KPIs principaux ── */}
      <section>
        <SectionTitle icon={Activity} title="Statistiques globales" sub="Toutes copropriétés confondues" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <KpiCard label="Utilisateurs" value={nbUsers} sub={`+${newUsersThisMonth} ce mois`} icon={Users} color="bg-blue-100 text-blue-600" />
          <KpiCard label="Copropriétés" value={nbCoproprietes ?? 0} sub={`${recentCopros?.length ?? 0} créées ce mois`} icon={Building2} color="bg-indigo-100 text-indigo-600" />
          <KpiCard label="Lots gérés" value={nbLots ?? 0} icon={DoorOpen} color="bg-violet-100 text-violet-600" />
          <KpiCard label="Copropriétaires" value={nbCoproprietaires ?? 0} icon={UserCheck} color="bg-green-100 text-green-600" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard label={`Dépenses ${today.getFullYear()}`} value={formatEuros(totalDepensesAnnee)} sub={`Total : ${formatEuros(totalDepenses)}`} icon={Receipt} color="bg-orange-100 text-orange-600" />
          <KpiCard label="Appels de fonds" value={nbAppels ?? 0} icon={Wallet} color="bg-amber-100 text-amber-600" />
          <KpiCard label="Assemblées" value={nbAG ?? 0} icon={CalendarDays} color="bg-pink-100 text-pink-600" />
          <KpiCard label="Incidents ouverts" value={nbIncidentsOuverts ?? 0} icon={AlertTriangle} color={`${(nbIncidentsOuverts ?? 0) > 0 ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`} />
        </div>
      </section>

      {/* ── Utilisateurs récents ── */}
      <section>
        <SectionTitle icon={Users} title="Utilisateurs inscrits" sub={`${nbUsers} comptes au total`} />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Nom</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Inscription</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dernière connexion</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentUsers.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-blue-600">
                          {(u.email ?? '?')[0].toUpperCase()}
                        </span>
                      </div>
                      <span className={`text-sm truncate max-w-[200px] ${u.email === ADMIN_EMAIL ? 'font-bold text-blue-700' : 'text-gray-800'}`}>
                        {u.email}
                        {u.email === ADMIN_EMAIL && <span className="ml-1.5 text-xs bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-semibold">Vous</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                    {(u.user_metadata as Record<string, string> | null)?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDate(u.created_at)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden lg:table-cell text-xs">{formatDateTime(u.last_sign_in_at)}</td>
                  <td className="px-4 py-3">
                    {u.email_confirmed_at ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />Vérifié
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />En attente
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {nbUsers > 15 && (
            <p className="text-xs text-gray-400 text-center py-3 border-t border-gray-100">
              Affichage des 15 derniers sur {nbUsers} utilisateurs
            </p>
          )}
        </div>
      </section>

      {/* ── Copropriétés ── */}
      <section>
        <SectionTitle icon={Building2} title="Copropriétés gérées" sub={`${nbCoproprietes ?? 0} copropriétés au total`} />
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Copropriété</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Syndic</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Lots</th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">AG</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden lg:table-cell">Dépenses</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden xl:table-cell">Créée le</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(coproprietes ?? []).map((c) => {
                const syndicProfile = c.profiles as { full_name?: string } | null;
                const dep = depCount[c.id];
                return (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{c.nom}</p>
                      <p className="text-xs text-gray-400">{c.ville}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 hidden md:table-cell text-xs">
                      {syndicProfile?.full_name ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold">
                        {lotsCount[c.id] ?? 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-600 hidden lg:table-cell text-xs">
                      {agCount[c.id] ?? 0}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700 hidden lg:table-cell text-xs font-medium">
                      {dep ? formatEuros(dep.total) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden xl:table-cell text-xs">
                      {formatDate(c.created_at)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Outils de gestion ── */}
      <section>
        <SectionTitle icon={Database} title="Outils de gestion" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Invitations */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <Mail size={15} className="text-blue-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Invitations copropriétaires</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Les invitations sont envoyées depuis chaque fiche copropriété, dans l'onglet copropriétaires.
              L'API <code className="bg-gray-100 px-1 rounded text-gray-600">POST /api/invitations</code> est utilisée en arrière-plan.
            </p>
            <Link
              href="/coproprietes"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              Aller aux copropriétés <ExternalLink size={11} />
            </Link>
          </div>

          {/* Supabase Dashboard */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Database size={15} className="text-green-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Base de données</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Accédez à la console Supabase pour gérer les tables, les politiques RLS et les migrations.
            </p>
            <a
              href="https://supabase.com/dashboard/project/ybhqvpnafwertoricfce"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-green-600 hover:text-green-800 font-medium"
            >
              Ouvrir Supabase <ExternalLink size={11} />
            </a>
          </div>

          {/* Resend */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center">
                <Mail size={15} className="text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Emails transactionnels</h3>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Consultez les envois d'emails (convocations, PV, contacts) via le dashboard Resend.
            </p>
            <a
              href="https://resend.com/emails"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-purple-600 hover:text-purple-800 font-medium"
            >
              Ouvrir Resend <ExternalLink size={11} />
            </a>
          </div>

          {/* Monitoring activité */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 md:col-span-3">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center">
                <TrendingUp size={15} className="text-amber-600" />
              </div>
              <h3 className="font-semibold text-gray-800 text-sm">Activité récente — 30 derniers jours</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-700">{newUsersThisMonth}</p>
                <p className="text-xs text-blue-600 mt-0.5">Nouveaux utilisateurs</p>
              </div>
              <div className="text-center p-3 bg-indigo-50 rounded-lg">
                <p className="text-2xl font-bold text-indigo-700">{recentCopros?.length ?? 0}</p>
                <p className="text-xs text-indigo-600 mt-0.5">Copropriétés créées</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{nbCoproprietes ?? 0}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total copropriétés</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-gray-700">{nbUsers}</p>
                <p className="text-xs text-gray-500 mt-0.5">Total utilisateurs</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-gray-400 pt-4 border-t border-gray-200">
        <Clock size={12} />
        <span>Données en temps réel — {new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
      </div>

    </div>
  );
}
