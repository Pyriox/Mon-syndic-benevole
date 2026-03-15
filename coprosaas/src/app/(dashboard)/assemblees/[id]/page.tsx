// ============================================================
// Page : Détail d'une Assemblée Générale
// Gestion des résolutions, présences, votes et génération du PV
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ResolutionActions, { ResolutionEdit, ResolutionDelete } from './ResolutionActions';
import AGStatusActions from './AGStatusActions';
import { AGDelete, AGAnnuler, AGEnvoyerPV } from './AGStatusActions';
import PVPDF from './PVPDF';
import ConvocationPDF from './ConvocationPDF';
import VoteActions from './VoteActions';
import VoteParCopro from './VoteParCopro';
import PresencePanel from './PresencePanel';
import MajoriteTooltip from './MajoriteTooltip';
import { LABELS_STATUT_AG, TYPES_RESOLUTION } from '@/lib/utils';
import { ArrowLeft, MapPin, CalendarDays, CheckCircle, XCircle, Clock, Video } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AGDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: ag } = await supabase
    .from('assemblees_generales')
    .select('*, coproprietes(id, nom, adresse, ville, code_postal, syndic_id)')
    .eq('id', id)
    .single();

  if (!ag || ag.coproprietes?.syndic_id !== user.id) notFound();

  const { data: resolutions } = await supabase
    .from('resolutions')
    .select('*')
    .eq('ag_id', id)
    .order('numero', { ascending: true });

  // Copropriétaires de la copropriété (pour présences, votes et PV)
  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id, nom, prenom')
    .eq('copropriete_id', ag.copropriete_id)
    .order('nom');

  // Lots et tantièmes de la copropriété (pour le calcul légal des votes)
  const { data: lotsData } = await supabase
    .from('lots')
    .select('tantiemes, coproprietaire_id')
    .eq('copropriete_id', ag.copropriete_id);

  const totalTantiemes = (lotsData ?? []).reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const tantiemesMap: Record<string, number> = {};
  for (const lot of lotsData ?? []) {
    if (lot.coproprietaire_id) {
      tantiemesMap[lot.coproprietaire_id] = (tantiemesMap[lot.coproprietaire_id] ?? 0) + (lot.tantiemes ?? 0);
    }
  }

  // Feuille de présence pour cette AG
  const { data: presences } = await supabase
    .from('ag_presences')
    .select('*')
    .eq('ag_id', id);

  // Votes individuels par copropriétaire pour toutes les résolutions
  const resolutionIds = (resolutions ?? []).map((r) => r.id);
  let votesCopro: { resolution_id: string; coproprietaire_id: string; vote: string }[] = [];
  if (resolutionIds.length > 0) {
    const { data } = await supabase
      .from('votes_coproprietaires')
      .select('*')
      .in('resolution_id', resolutionIds);
    votesCopro = data ?? [];
  }

  const badgeVariantStatutResolution = (statut: string) => {
    const map: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
      approuvee: 'success',
      refusee: 'danger',
      reportee: 'warning',
      en_attente: 'default',
    };
    return map[statut] ?? 'default';
  };

  const labelStatutResolution: Record<string, string> = {
    approuvee: 'Approuvée',
    refusee: 'Refusée',
    reportee: 'Reportée',
    en_attente: 'En attente',
  };

  const isVisio = ag.lieu === 'Visioconférence';
  const canVote = ag.statut === 'en_cours' || ag.statut === 'terminee';
  const canEdit = ag.statut === 'creation' || ag.statut === 'planifiee' || ag.statut === 'en_cours';
  const hasPresences = (presences ?? []).length > 0;

  // Présents + représentés (sans absents) pour VoteParCopro
  const voteurs = (presences ?? []).filter((p) => p.statut !== 'absent');

  // Calcul dynamique du quorum à partir des présences et des tantièmes
  // Seuil légal : 1/4 des tantièmes (25%) pour la 1re convocation (art. 15 décret 1967)
  const tantièmesPresents = voteurs.reduce(
    (sum, p) => sum + (tantiemesMap[p.coproprietaire_id] ?? 0),
    0
  );
  const pctQuorum = totalTantiemes > 0 ? (tantièmesPresents / totalTantiemes) * 100 : 0;
  const quorumAtteintCalcule = totalTantiemes > 0 ? pctQuorum >= 25 : false;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <Link href="/assemblees" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Retour aux assemblées
      </Link>

      {/* En-tête */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{ag.titre}</h2>
            <Badge variant={
              ag.statut === 'terminee' ? 'success'
              : ag.statut === 'en_cours' ? 'warning'
              : ag.statut === 'annulee' ? 'danger'
              : ag.statut === 'creation' ? 'default'
              : 'info'
            }>
              {LABELS_STATUT_AG[ag.statut] ?? ag.statut}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{ag.coproprietes?.nom}</span>
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {new Date(ag.date_ag).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' à '}
              {new Date(ag.date_ag).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
            </span>
            {ag.lieu && (
              <span className="flex items-center gap-1">
                {isVisio ? <Video size={13} className="text-blue-500" /> : <MapPin size={13} />}
                {ag.lieu}
              </span>
            )}
          </div>
        </div>

        {/* Actions selon le statut */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {ag.statut === 'terminee' && (
              <PVPDF
                ag={ag}
                resolutions={resolutions ?? []}
                presences={presences ?? []}
                votesCopro={votesCopro}
                coproprietaires={coproprietaires ?? []}
                tantiemesParCopro={tantiemesMap}
              />
            )}
            <AGStatusActions agId={id} coproprieteId={ag.copropriete_id} currentStatut={ag.statut} quorumAtteint={quorumAtteintCalcule} />
          </div>
          {ag.statut === 'planifiee' && (
            <ConvocationPDF ag={ag} resolutions={resolutions ?? []} />
          )}
          {ag.statut === 'planifiee' && (
            <AGDelete agId={id} />
          )}
        </div>
      </div>

      {ag.notes && (
        <Card>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ag.notes}</p>
        </Card>
      )}

      {/* Quorum — calculé dynamiquement depuis la feuille de présence */}
      {(ag.statut === 'en_cours' || ag.statut === 'terminee') && (
        <Card className="flex items-center gap-4">
          <div className={`p-2 rounded-full shrink-0 ${
            !hasPresences ? 'bg-gray-100' : quorumAtteintCalcule ? 'bg-green-100' : 'bg-red-100'
          }`}>
            {!hasPresences
              ? <Clock size={20} className="text-gray-400" />
              : quorumAtteintCalcule
                ? <CheckCircle size={20} className="text-green-600" />
                : <XCircle size={20} className="text-red-500" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-semibold ${
              !hasPresences ? 'text-gray-500' : quorumAtteintCalcule ? 'text-green-700' : 'text-red-600'
            }`}>
              Quorum : {!hasPresences ? 'En attente de la feuille de présence' : quorumAtteintCalcule ? 'Atteint' : 'Non atteint'}
            </p>
            {hasPresences && totalTantiemes > 0 ? (
              <div className="mt-1 flex items-center gap-3">
                <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${quorumAtteintCalcule ? 'bg-green-500' : 'bg-red-400'}`}
                    style={{ width: `${Math.min(pctQuorum, 100).toFixed(1)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-600 shrink-0">
                  {tantièmesPresents.toLocaleString('fr-FR')}&thinsp;/&thinsp;{totalTantiemes.toLocaleString('fr-FR')} tantièmes
                  ({pctQuorum.toFixed(1)} % &mdash; seuil : 25 %)
                </span>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-0.5">
                {totalTantiemes === 0
                  ? 'Renseignez les tantièmes des lots pour un calcul automatique.'
                  : 'Renseignez les présences pour calculer le quorum.'}
              </p>
            )}
          </div>
        </Card>
      )}

      {/* Feuille de présence — visible quand l'AG est en cours ou terminée */}
      {(ag.statut === 'en_cours' || ag.statut === 'terminee') && (
        <PresencePanel
          agId={id}
          coproprieteId={ag.copropriete_id}
          presences={presences ?? []}
          coproprietaires={coproprietaires ?? []}
          canEdit={ag.statut === 'en_cours'}
        />
      )}

      {/* Résolutions */}
      <Card>
        <CardHeader
          title="Résolutions"
          description={`${resolutions?.length ?? 0} résolution(s)${canVote && hasPresences ? ' — sélectionnez le vote de chaque copropriétaire' : ''}`}
          actions={canEdit ? <ResolutionActions agId={id} /> : undefined}
        />

        {/* Barre de progression des résolutions */}
        {resolutions && resolutions.length > 0 && (() => {
          const total    = resolutions.length;
          const approved = resolutions.filter((r) => r.statut === 'approuvee').length;
          const refused  = resolutions.filter((r) => r.statut === 'refusee').length;
          const reported = resolutions.filter((r) => r.statut === 'reportee').length;
          const treated  = approved + refused + reported;
          return (
            <div className="mb-3 space-y-1.5">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div style={{ width: `${(approved / total) * 100}%` }} className="bg-green-400 h-full transition-all" />
                <div style={{ width: `${(refused  / total) * 100}%` }} className="bg-red-400 h-full transition-all" />
                <div style={{ width: `${(reported / total) * 100}%` }} className="bg-amber-400 h-full transition-all" />
              </div>
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <span className="text-gray-500 font-medium">{treated}/{total} traitée{treated > 1 ? 's' : ''}</span>
                {approved > 0 && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700">{approved} approuvée{approved > 1 ? 's' : ''}</span>}
                {refused  > 0 && <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600">{refused} refusée{refused > 1 ? 's' : ''}</span>}
                {reported > 0 && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{reported} reportée{reported > 1 ? 's' : ''}</span>}
                {(total - treated) > 0 && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">{total - treated} en attente</span>}
              </div>
            </div>
          );
        })()}

        {resolutions && resolutions.length > 0 ? (
          <div className="space-y-3">
            {resolutions.map((res) => (
              <div key={res.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold text-gray-400">#{res.numero}</span>
                      <h4 className="font-medium text-gray-900">{res.titre}</h4>
                      <Badge variant={badgeVariantStatutResolution(res.statut)}>
                        {labelStatutResolution[res.statut] ?? res.statut}
                      </Badge>
                      <MajoriteTooltip majorite={res.majorite ?? null} />
                    </div>
                    {res.description && (
                      <p className="text-sm text-gray-500 mt-1">{res.description}</p>
                    )}

                    {/* Zone de vote */}
                    {canVote ? (
                      hasPresences && voteurs.length > 0 ? (
                        <VoteParCopro
                          resolutionId={res.id}
                          resolutionStatut={res.statut}
                          majorite={(res as any).majorite ?? null}
                          typeResolution={(res as any).type_resolution ?? null}
                          tantiemesMap={tantiemesMap}
                          totalTantiemes={totalTantiemes}
                          initialVotes={votesCopro
                            .filter((v) => v.resolution_id === res.id)
                            .map((v) => ({ coproprietaire_id: v.coproprietaire_id, vote: v.vote as 'pour' | 'contre' | 'abstention' }))}
                          presences={voteurs}
                          coproprietaires={coproprietaires ?? []}
                          canEdit={ag.statut === 'en_cours'}
                          designationResultats={(res as any).designation_resultats ?? null}
                          initialBudgetPostes={(res as any).budget_postes ?? null}
                          initialFondsTravaux={(res as any).fonds_travaux_montant ?? null}
                        />
                      ) : (
                        <VoteActions
                          resolutionId={res.id}
                          voixPour={res.voix_pour ?? 0}
                          voixContre={res.voix_contre ?? 0}
                          voixAbstention={res.voix_abstention ?? 0}
                          statut={res.statut}
                          budgetPostes={(res as any).budget_postes ?? []}
                        />
                      )
                    ) : (
                      <div>
                        {/* Résultat désignation */}
                        {(() => {
                          const tr = (res as any).type_resolution as string | null;
                          const cfg = tr ? TYPES_RESOLUTION[tr] : null;
                          const desig = (res as any).designation_resultats as { id: string; nom: string; prenom: string }[] | null;
                          if (cfg?.designation && desig && desig.length > 0) {
                            return (
                              <div className="mt-2 text-xs text-indigo-700 bg-indigo-50 rounded-lg px-3 py-2">
                                <span className="font-medium">Désigné{desig.length > 1 ? 's' : ''} : </span>
                                {desig.map((d) => `${d.prenom} ${d.nom}`).join(', ')}
                              </div>
                            );
                          }
                          return null;
                        })()}
                        {/* Montant fonds travaux */}
                        {(res as any).fonds_travaux_montant != null && (
                          <div className="mt-2 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                            <span className="font-medium">Cotisation fonds de travaux : </span>
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format((res as any).fonds_travaux_montant)}
                          </div>
                        )}
                        {/* Votes (masqués pour les désignations) */}
                        {!TYPES_RESOLUTION[(res as any).type_resolution as string ?? '']?.designation && (
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1 text-green-600">
                              <CheckCircle size={12} /> Pour : {res.voix_pour ?? 0} tant.
                            </span>
                            <span className="flex items-center gap-1 text-red-500">
                              <XCircle size={12} /> Contre : {res.voix_contre ?? 0} tant.
                            </span>
                            <span className="flex items-center gap-1">
                              ○ Abst. : {res.voix_abstention ?? 0} tant.
                            </span>
                          </div>
                        )}
                        {((res as any).budget_postes as { libelle: string; montant: number }[] | null)?.length ? (
                          <div className="mt-2 border border-indigo-100 rounded-lg overflow-hidden text-xs">
                            <div className="bg-indigo-50 px-3 py-1.5 text-[11px] font-semibold text-indigo-700 uppercase tracking-wide">
                              Budget voté —{ }
                              {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
                                ((res as any).budget_postes as { libelle: string; montant: number }[]).reduce((s: number, p: { montant: number }) => s + p.montant, 0)
                              )}
                            </div>
                            <table className="w-full">
                              <tbody>
                                {((res as any).budget_postes as { libelle: string; montant: number }[]).map(
                                  (p: { libelle: string; montant: number }, i: number) => (
                                    <tr key={i} className="border-t border-gray-100">
                                      <td className="px-3 py-1.5 text-gray-700">{p.libelle}</td>
                                      <td className="px-3 py-1.5 text-right font-semibold text-gray-900">
                                        {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.montant)}
                                      </td>
                                    </tr>
                                  )
                                )}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {canEdit && <ResolutionEdit resolution={res} />}
                    {canEdit && <ResolutionDelete resolutionId={res.id} />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Aucune résolution"
            description="Ajoutez les points à l'ordre du jour."
            action={<ResolutionActions agId={id} showLabel />}
          />
        )}
      </Card>
    </div>
  );
}