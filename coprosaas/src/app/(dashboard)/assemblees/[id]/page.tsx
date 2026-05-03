// ============================================================
// Page : Détail d'une Assemblée Générale
// Gestion des résolutions, présences, votes et génération du PV
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import ResolutionActions from './ResolutionActions';
import ResolutionList from './ResolutionList';
import AGStatusActions from './AGStatusActions';
import { AGDelete, AGAnnuler, AGEnvoyerPV, AGEnvoyerConvocation, AGEditInfos } from './AGStatusActions';
import PresencePanel from './PresencePanel';
import { formatDate, formatTime, LABELS_STATUT_AG } from '@/lib/utils';
import { ArrowLeft, MapPin, CalendarDays, CheckCircle, XCircle, Clock, Video } from 'lucide-react';
import { hasChargesSpecialesAddon, isSubscribed } from '@/lib/subscription';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import { PVPDF, ConvocationPDF } from './PDFButtons';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AGDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { selectedCoproId, role, copro, trialUsed } = await requireCoproAccess();
  const isSyndic = role === 'syndic';
  const canWrite = isSubscribed(copro?.plan);
  const db = supabase; // Les RLS policies autorisent la lecture pour les deux rôles

  const { data: ag } = await db
    .from('assemblees_generales')
    .select('id, copropriete_id, titre, date_ag, lieu, notes, statut, quorum_atteint, convocation_envoyee_le, pv_envoye_le, coproprietes(id, nom, adresse, ville, code_postal, syndic_id)')
    .eq('id', id)
    .single();

  if (!ag || ag.copropriete_id !== selectedCoproId) notFound();

  const copropriete = Array.isArray(ag.coproprietes)
    ? (ag.coproprietes[0] ?? null)
    : (ag.coproprietes ?? null);
  const agWithCopropriete = { ...ag, coproprietes: copropriete };

  // Toutes les données liées chargées en parallèle
  const [
    { data: resolutions },
    { data: coproprietaires },
    { data: lotsData },
    { data: presences },
    { data: coproAddons },
  ] = await Promise.all([
    db
      .from('resolutions')
      .select('id, ag_id, numero, titre, description, statut, majorite, voix_pour, voix_contre, voix_abstention, type_resolution, budget_postes, fonds_travaux_montant, designation_resultats, date_fin_mandat')
      .eq('ag_id', id)
      .order('numero', { ascending: true }),
    // Copropriétaires de la copropriété (pour présences, votes et PV)
    db
      .from('coproprietaires')
      .select('id, nom, prenom, email')
      .eq('copropriete_id', ag.copropriete_id)
      .order('nom'),
    // Lots et tantièmes de la copropriété (pour le calcul légal des votes)
    db
      .from('lots')
      .select('tantiemes, coproprietaire_id')
      .eq('copropriete_id', ag.copropriete_id),
    // Feuille de présence pour cette AG
    db
      .from('ag_presences')
      .select('coproprietaire_id, statut, represente_par_id, represente_par_nom')
      .eq('ag_id', id),
    db
      .from('copro_addons')
      .select('addon_key, status, current_period_end, cancel_at_period_end')
      .eq('copropriete_id', ag.copropriete_id),
  ]);

  // Calcul des tantièmes (utilisé pour quorum et votes)
  const totalTantiemes = (lotsData ?? []).reduce((s, l) => s + (l.tantiemes ?? 0), 0);
  const tantiemesMap: Record<string, number> = {};
  for (const lot of lotsData ?? []) {
    if (lot.coproprietaire_id) {
      tantiemesMap[lot.coproprietaire_id] = (tantiemesMap[lot.coproprietaire_id] ?? 0) + (lot.tantiemes ?? 0);
    }
  }

  // Votes individuels — chargés après les résolutions (dépend de leurs IDs)
  const resolutionIds = (resolutions ?? []).map((r) => r.id);
  let votesCopro: { resolution_id: string; coproprietaire_id: string; vote: string }[] = [];
  if (resolutionIds.length > 0) {
    const { data } = await db
      .from('votes_coproprietaires')
      .select('resolution_id, coproprietaire_id, vote')
      .in('resolution_id', resolutionIds);
    votesCopro = data ?? [];
  }

  const isVisio = ag.lieu === 'Visioconférence';
  const specialChargesEnabled = hasChargesSpecialesAddon(coproAddons ?? []);

  // Statuts e-mail par destinataire pour convocation et PV
  type AgEmailStatut = 'ouvert' | 'envoyé' | 'erreur';
  const EMAIL_PRIORITY: Record<AgEmailStatut, number> = { ouvert: 3, envoyé: 2, erreur: 1 };
  const convocationStatusByEmail: Record<string, AgEmailStatut> = {};
  const pvStatusByEmail: Record<string, AgEmailStatut> = {};
  if (isSyndic) {
    const CONVOCATION_KEYS = ['ag_convocation', 'ag_convocation_reminder_j14', 'ag_convocation_reminder_j7', 'ag_convocation_unopened_relance'];
    const { data: deliveries } = await db
      .from('email_deliveries')
      .select('recipient_email, status, template_key')
      .eq('ag_id', id);
    for (const d of deliveries ?? []) {
      if (!d.recipient_email || !d.template_key) continue;
      const email = d.recipient_email.toLowerCase();
      let statut: AgEmailStatut;
      if (d.status === 'opened' || d.status === 'clicked') statut = 'ouvert';
      else if (d.status === 'failed' || d.status === 'bounced' || d.status === 'complained') statut = 'erreur';
      else statut = 'envoyé';
      const isConvoc = (CONVOCATION_KEYS as string[]).includes(d.template_key);
      const isPv = d.template_key === 'ag_pv';
      if (isConvoc) {
        const ex = convocationStatusByEmail[email] as AgEmailStatut | undefined;
        if (!ex || EMAIL_PRIORITY[statut] > EMAIL_PRIORITY[ex]) convocationStatusByEmail[email] = statut;
      }
      if (isPv) {
        const ex = pvStatusByEmail[email] as AgEmailStatut | undefined;
        if (!ex || EMAIL_PRIORITY[statut] > EMAIL_PRIORITY[ex]) pvStatusByEmail[email] = statut;
      }
    }
  }

  type AgRecipient = { id: string; nom: string; prenom: string; email: string };
  const agRecipients: AgRecipient[] = (coproprietaires ?? [])
    .filter((c) => !!c.email)
    .map((c) => ({ id: c.id, nom: c.nom, prenom: c.prenom, email: c.email! }));

  const isLaunched = ag.statut === 'en_cours' || ag.statut === 'terminee' || Boolean(ag.convocation_envoyee_le);
  const canVote = isSyndic && canWrite && (ag.statut === 'en_cours' || ag.statut === 'terminee');
  const canEdit = isSyndic && canWrite && (ag.statut === 'creation' || ag.statut === 'planifiee') && !isLaunched;
  const needsConvocation = ag.statut === 'planifiee' && !ag.convocation_envoyee_le;
  const hasPresences = (presences ?? []).length > 0;
  const toutesResolutionsVotees =
    (resolutions ?? []).length > 0 &&
    (resolutions ?? []).every((r) => r.statut === 'approuvee' || r.statut === 'refusee' || r.statut === 'reportee');
  const workflowSteps = [
    { label: 'Brouillon créé', done: true },
    { label: 'Planification validée', done: ['planifiee', 'en_cours', 'terminee'].includes(ag.statut) },
    { label: 'Convocation envoyée', done: Boolean(ag.convocation_envoyee_le) },
    { label: 'AG démarrée', done: ['en_cours', 'terminee'].includes(ag.statut), current: ag.statut === 'en_cours' },
    { label: 'PV envoyé', done: Boolean(ag.pv_envoye_le) },
  ];
  const nextActionLabel = ag.statut === 'annulee'
    ? 'Cette AG est annulée.'
    : ag.statut === 'creation'
      ? 'Étape suivante : finaliser et planifier l’AG.'
      : ag.statut === 'planifiee' && !ag.convocation_envoyee_le
        ? 'Action requise : envoyer la convocation avant de démarrer l’AG.'
        : ag.statut === 'planifiee'
          ? "Étape suivante : démarrer l'AG le jour J."
          : ag.statut === 'en_cours'
            ? "Étape suivante : clôturer l'AG après les votes."
            : ag.statut === 'terminee' && !ag.pv_envoye_le
              ? 'Étape suivante : envoyer le PV.'
              : 'Parcours AG complété.';

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

      {/* ── Bandeau lecture seule ── */}
      {isSyndic && !canWrite && <ReadOnlyBanner trialUsed={trialUsed} />}

      {/* En-tête */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1 flex-wrap">
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
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span>{agWithCopropriete.coproprietes?.nom}</span>
            <span className="flex items-center gap-1">
              <CalendarDays size={13} />
              {formatDate(ag.date_ag, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              {' à '}
              {formatTime(ag.date_ag)}
            </span>
            {ag.lieu && (
              <span className="flex items-center gap-1">
                {isVisio ? <Video size={13} className="text-blue-500" /> : <MapPin size={13} />}
                {ag.lieu}
              </span>
            )}
          </div>
        </div>

        {/* Actions selon le statut — syndic uniquement */}
        {isSyndic && canWrite && (
        <div className="flex flex-col items-start sm:items-end gap-3 shrink-0">

          {/* Bouton principal de progression */}
          <AGStatusActions
            agId={id}
            coproprieteId={ag.copropriete_id}
            currentStatut={ag.statut}
            quorumAtteint={quorumAtteintCalcule}
            toutesResolutionsVotees={toutesResolutionsVotees}
            convocationEnvoyeeLe={ag.convocation_envoyee_le ?? null}
          />

          {/* Actions secondaires : e-mails */}
          {ag.statut === 'planifiee' && !needsConvocation && (
            <AGEnvoyerConvocation
              agId={id}
              coproprieteId={ag.copropriete_id}
              ag={agWithCopropriete}
              resolutions={resolutions ?? []}
              convocationEnvoyeeLe={ag.convocation_envoyee_le ?? null}
              emailStatusByEmail={convocationStatusByEmail}
              recipients={agRecipients}
            />
          )}
          {ag.statut === 'terminee' && (
            <AGEnvoyerPV
              agId={id}
              coproprieteId={ag.copropriete_id}
              pvEnvoyeLe={ag.pv_envoye_le ?? null}
              emailStatusByEmail={pvStatusByEmail}
              recipients={agRecipients}
            />
          )}

          {/* Documents PDF */}
          {((ag.statut === 'planifiee' && !needsConvocation) || ag.statut === 'terminee') && (
            <div className="flex items-center gap-2">
              {ag.statut === 'planifiee' && (
                <ConvocationPDF ag={agWithCopropriete} resolutions={resolutions ?? []} />
              )}
              {ag.statut === 'terminee' && (
                <PVPDF
                  ag={agWithCopropriete}
                  coproprieteId={ag.copropriete_id}
                  resolutions={resolutions ?? []}
                  presences={presences ?? []}
                  votesCopro={votesCopro}
                  coproprietaires={coproprietaires ?? []}
                  tantiemesParCopro={tantiemesMap}
                />
              )}
            </div>
          )}

          {/* Actions de gestion (modification / suppression) */}
          {(ag.statut === 'creation' || ag.statut === 'planifiee' || ag.statut === 'en_cours') && (
            <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
              {canEdit && <AGEditInfos agId={id} dateAg={ag.date_ag} lieu={ag.lieu} coproprieteId={ag.copropriete_id} />}
              {ag.statut === 'creation' && <AGDelete agId={id} />}
              {(ag.statut === 'planifiee' || ag.statut === 'en_cours') && <AGAnnuler agId={id} />}
            </div>
          )}

        </div>
        )}
      </div>

      {needsConvocation && isSyndic && canWrite && (
        <Card className="border-amber-200 bg-amber-50/70">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <Badge variant="warning">Action requise</Badge>
              <div>
                <p className="text-sm font-semibold text-amber-900">Envoyer la convocation</p>
                <p className="text-sm text-amber-800">
                  La planification est validée, mais la convocation n&apos;a pas encore été envoyée depuis Mon Syndic Bénévole.
                  Faites-le maintenant pour garder une trace d&apos;envoi et éviter un oubli avant le jour J.
                </p>
              </div>
              <p className="text-xs text-amber-700">
                Rappel : prévoyez le délai légal de 21 jours avant la tenue de l&apos;assemblée.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <AGEnvoyerConvocation
                agId={id}
                coproprieteId={ag.copropriete_id}
                ag={agWithCopropriete}
                resolutions={resolutions ?? []}
                convocationEnvoyeeLe={ag.convocation_envoyee_le ?? null}
                emailStatusByEmail={convocationStatusByEmail}
                recipients={agRecipients}
              />
              <ConvocationPDF ag={agWithCopropriete} resolutions={resolutions ?? []} />
            </div>
          </div>
        </Card>
      )}

      {ag.notes && (
        <Card>
          <p className="text-sm text-gray-600 whitespace-pre-wrap">{ag.notes}</p>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-900">Suivi du parcours AG</p>
            <p className="text-xs text-gray-500 mt-1">{nextActionLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {workflowSteps.map((step) => {
              const done = step.done;
              const current = 'current' in step && step.current;
              return (
                <span
                  key={step.label}
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    done
                      ? 'bg-green-100 text-green-700'
                      : current
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {done ? <CheckCircle size={12} /> : <Clock size={12} />}
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>
      </Card>

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
          canEdit={isSyndic && canWrite && ag.statut === 'en_cours'}
        />
      )}

      {/* Résolutions */}
      <Card>
        <CardHeader
          title="Résolutions"
          description={`${resolutions?.length ?? 0} résolution(s)${canVote && hasPresences ? ' — sélectionnez le vote de chaque copropriétaire' : ''}`}
          actions={canEdit ? <ResolutionActions agId={id} nextNumero={(resolutions ?? []).length + 1} specialChargesEnabled={specialChargesEnabled} /> : undefined}
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
          <ResolutionList
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resolutions={resolutions as any[]}
            agStatut={ag.statut}
            agId={id}
            canEdit={canEdit}
            canVote={canVote}
            hasPresences={hasPresences}
            voteurs={voteurs}
            votesCopro={votesCopro}
            coproprietaires={coproprietaires ?? []}
            tantiemesMap={tantiemesMap}
            totalTantiemes={totalTantiemes}
            specialChargesEnabled={specialChargesEnabled}
          />
        ) : (
          <EmptyState
            title="Aucune résolution"
            description="Ajoutez les points à l'ordre du jour."
            action={canEdit ? <ResolutionActions agId={id} showLabel specialChargesEnabled={specialChargesEnabled} /> : undefined}
          />
        )}
      </Card>
    </div>
  );
}