// ============================================================
// Page : Appels de fonds - Generation et suivi des paiements
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import AppelFondsActions from './AppelFondsActions';
import AppelFondsPDF from './AppelFondsPDF';
import AppelFondsPaiement from './AppelFondsPaiement';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';
import { Wallet, AlertTriangle, Link2 } from 'lucide-react';
import { cookies } from 'next/headers';

interface Poste { libelle: string; categorie: string; montant: number }

function parsePostes(description: string | null | undefined): Poste[] | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && 'libelle' in parsed[0]) return parsed;
  } catch { /* not JSON */ }
  return null;
}

const LABELS_TYPE_APPEL: Record<string, string> = {
  budget_previsionnel: 'Budget prévisionnel',
  revision_budget: 'Révision budgétaire',
  fonds_travaux: 'Fonds de travaux',
  exceptionnel: 'Appel exceptionnel',
};

export default async function AppelsDeFondsPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const { data: appels } = await supabase
    .from('appels_de_fonds')
    .select('*, coproprietes(nom), lignes_appels_de_fonds(id, montant_du, paye, date_paiement, coproprietaires(id, nom, prenom))')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .gte('created_at', `${annee}-01-01`)
    .lt('created_at', `${annee + 1}-01-01`)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appels de fonds</h2>
          <p className="text-gray-500 mt-1">{appels?.length ?? 0} appel(s) de fonds</p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          <AppelFondsActions coproprietes={coproprietes ?? []} />
        </div>
      </div>

      {appels && appels.length > 0 ? (
        <div className="space-y-4">
          {appels.map((appel) => {
            const lignes = appel.lignes_appels_de_fonds ?? [];
            const nbPayes = lignes.filter((l: { paye: boolean }) => l.paye).length;
            const nbimpayés = (() => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const echeance = new Date(appel.date_echeance);
              echeance.setHours(0, 0, 0, 0);
              if (today <= echeance) return 0;
              return lignes.filter((l: { paye: boolean }) => !l.paye).length;
            })();
            const pctPaye = lignes.length > 0 ? Math.round((nbPayes / lignes.length) * 100) : 0;
            const postes = parsePostes(appel.description);
            const typeAppel = (appel as { type_appel?: string | null }).type_appel;
            const agResolutionId = (appel as { ag_resolution_id?: string | null }).ag_resolution_id;

            return (
              <Card key={appel.id}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{appel.titre}</h3>

                      {/* Badge statut encaissément */}
                      <Badge variant={pctPaye === 100 ? 'success' : pctPaye > 50 ? 'warning' : 'danger'}>
                        {pctPaye}% encaissé
                      </Badge>

                      {/* Badge impayés */}
                      {nbimpayés > 0 && (
                        <Badge variant="danger">{nbimpayés} impayé{nbimpayés > 1 ? 's' : ''}</Badge>
                      )}

                      {/* Badge type d'appel */}
                      {typeAppel && (
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                          typeAppel === 'exceptionnel'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {typeAppel === 'exceptionnel'
                            ? <AlertTriangle size={10} />
                            : <Link2 size={10} />}
                          {LABELS_TYPE_APPEL[typeAppel] ?? typeAppel}
                        </span>
                      )}
                    </div>

                    <div className="text-sm text-gray-500 flex items-center gap-4 flex-wrap">
                      <span>{appel.coproprietes?.nom}</span>
                      <span>Échéance : {formatDate(appel.date_echeance)}</span>
                      <span>Total : <strong className="text-gray-900">{formatEuros(appel.montant_total)}</strong></span>
                    </div>

                    {/* Avertissement exceptionnel */}
                    {typeAppel === 'exceptionnel' && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-1.5 w-fit">
                        <AlertTriangle size={12} />
                        Appel non lie a une resolution d&apos;assemblee generale
                      </div>
                    )}

                    {/* Lien AG si present */}
                    {agResolutionId && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-1.5 w-fit">
                        <Link2 size={12} />
                        Lie a une resolution votee en AG
                      </div>
                    )}

                    {/* Barre de progression */}
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{nbPayes}/{lignes.length} copropriétaires ont payé</span>
                        <span>{pctPaye}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${pctPaye === 100 ? 'bg-green-500' : nbimpayés > 0 ? 'bg-red-500' : 'bg-blue-500'}`}
                          style={{ width: `${pctPaye}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <AppelFondsPDF appel={{ ...appel, copropriete_id: selectedCoproId ?? undefined }} />
                </div>

                {/* Détail des postes de charges */}
                {postes && postes.length > 0 && (
                  <div className="mt-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Détail des postes</p>
                    <div className="overflow-x-auto border border-gray-100 rounded-lg">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left px-3 py-2 text-gray-500">Libellé</th>
                            <th className="text-left px-3 py-2 text-gray-500">Catégorie</th>
                            <th className="text-right px-3 py-2 text-gray-500">Montant</th>
                          </tr>
                        </thead>
                        <tbody>
                          {postes.map((p, i) => (
                            <tr key={i} className="border-t border-gray-100">
                              <td className="px-3 py-2 font-medium text-gray-800">{p.libelle}</td>
                              <td className="px-3 py-2 text-gray-500">
                                {LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie}
                              </td>
                              <td className="px-3 py-2 text-right font-semibold text-gray-900">{formatEuros(p.montant)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-50">
                          <tr>
                            <td colSpan={2} className="px-3 py-2 font-semibold text-gray-700">Total</td>
                            <td className="px-3 py-2 text-right font-bold text-blue-700">{formatEuros(appel.montant_total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                )}

                {/* Suivi paiements (interactif) */}
                {lignes.length > 0 && (
                  <AppelFondsPaiement
                    appel={{ ...appel, copropriete_id: selectedCoproId ?? undefined }}
                    lignes={(lignes as any[]).map((l) => ({
                      ...l,
                      coproprietaires: Array.isArray(l.coproprietaires)
                        ? (l.coproprietaires[0] ?? null)
                        : l.coproprietaires,
                    }))}
                    isSyndic={copropriete?.syndic_id === user.id}
                  />
                )}
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet size={48} strokeWidth={1.5} />}
          title="Aucun appel de fonds"
          description="Créez un appel de fonds pour répartir les charges entre les copropriétaires."
          action={<AppelFondsActions coproprietes={coproprietes ?? []} showLabel />}
        />
      )}
    </div>
  );
}