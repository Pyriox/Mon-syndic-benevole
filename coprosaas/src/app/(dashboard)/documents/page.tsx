// ============================================================
// Page : Gestion des documents — vue gestionnaire de fichiers
// Table unifiée dossiers + fichiers, navigation par breadcrumb
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DocumentActions, { DocumentRename } from './DocumentActions';
import DossierActions, { DossierDelete, DossierRename, SubDossierActions } from './DossierActions';
import { formatDate, LABELS_TYPE_DOCUMENT } from '@/lib/utils';
import { FileText, Download, ExternalLink, Folder, ChevronRight, FolderOpen } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';

// Dossiers racine permanents — dans l'ordre d'affichage souhaité
const DEFAULT_DOSSIER_NAMES = [
  'Assemblées Générales',
  'Appels de fonds',
  'Dépenses',
  'Règlement copropriété',
  'Contrats',
];

// Ordre d'utilité des dossiers permanents (plus petit = en premier)
const DEFAULT_DOSSIER_ORDER: Record<string, number> = {
  'Assemblées Générales': 0,
  'Appels de fonds':      1,
  'Dépenses':             2,
  'Règlement copropriété': 3,
  'Contrats':             4,
};

function sortRootDossiers(dossiers: Dossier[]): Dossier[] {
  const defaults = dossiers
    .filter((d) => d.is_default)
    .sort((a, b) => (DEFAULT_DOSSIER_ORDER[a.nom] ?? 99) - (DEFAULT_DOSSIER_ORDER[b.nom] ?? 99));
  const customs = dossiers
    .filter((d) => !d.is_default)
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
  return [...defaults, ...customs];
}

type Dossier = { id: string; nom: string; is_default: boolean; created_at: string; parent_id?: string | null };

const folderColorClass = (d: Dossier) => d.is_default ? 'text-blue-500' : 'text-amber-600';

function buildBreadcrumb(dossiers: Dossier[], dossierId: string): { id: string; nom: string }[] {
  const map = new Map(dossiers.map((d) => [d.id, d]));
  const chain: { id: string; nom: string }[] = [];
  let current = map.get(dossierId);
  while (current) {
    chain.unshift({ id: current.id, nom: current.nom });
    current = current.parent_id ? map.get(current.parent_id) : undefined;
  }
  return chain;
}

function couleurType(type: string): 'default' | 'info' | 'success' | 'warning' | 'purple' {
  const map: Record<string, 'default' | 'info' | 'success' | 'warning' | 'purple'> = {
    pv_ag: 'purple',
    facture: 'warning',
    contrat: 'info',
    assurance: 'success',
    reglement: 'default',
    autre: 'default',
  };
  return map[type] ?? 'default';
}

const formatTaille = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

// ── Colonnes de la table partagée ──────────────────────────
//   col-span sur 4 colonnes : Nom | Type | Date | Taille | Actions

interface Props {
  searchParams: Promise<{ dossier?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const { dossier: dossierId } = await searchParams;
  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  // ================================================================
  // VUE LECTURE SEULE — Copropriétaires
  // ================================================================
  if (userRole === 'copropriétaire') {
    const syndicId = copropriete?.syndic_id ?? 'none';

    const { data: rawDossiers } = await supabase
      .from('document_dossiers')
      .select('id, nom, is_default, created_at, parent_id' as 'id, nom, is_default, created_at')
      .eq('syndic_id', syndicId)
      .order('is_default', { ascending: false })
      .order('created_at');
    const dossiers: Dossier[] = (rawDossiers ?? []) as unknown as Dossier[];

    const { data: docCounts } = await supabase
      .from('documents')
      .select('dossier_id')
      .eq('copropriete_id', selectedCoproId ?? 'none');
    const countByDossier = (docCounts ?? []).reduce<Record<string, number>>((acc, doc) => {
      if (doc.dossier_id) acc[doc.dossier_id] = (acc[doc.dossier_id] ?? 0) + 1;
      return acc;
    }, {});

    // Dossiers visibles dans la vue courante
    const parentId = dossierId ?? null;
    const visibleDossiers = parentId
      ? dossiers.filter((d) => d.parent_id === parentId)
      : sortRootDossiers(dossiers.filter((d) => !d.parent_id));

    // Documents du dossier courant (uniquement si on est dans un dossier terminal)
    const hasSubs = dossierId
      ? dossiers.some((d) => d.parent_id === dossierId)
      : false;

    const { data: documents } = dossierId && !hasSubs
      ? await supabase
          .from('documents')
          .select('id, nom, type, taille, created_at')
          .eq('copropriete_id', selectedCoproId ?? 'none')
          .eq('dossier_id', dossierId)
          .order('created_at', { ascending: false })
      : { data: null };

    const breadcrumb = dossierId ? buildBreadcrumb(dossiers, dossierId) : [];
    const currentDossier = dossierId ? dossiers.find((d) => d.id === dossierId) : null;
    if (dossierId && !currentDossier) redirect('/documents');

    const totalItems = visibleDossiers.length + (documents?.length ?? 0);

    return (
      <div className="max-w-5xl mx-auto space-y-4">
        {/* Fil d'Ariane */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <Link href="/documents" className="text-gray-500 hover:text-gray-700 transition-colors">Documents</Link>
          {breadcrumb.map((b, i) => (
            <Fragment key={b.id}>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {i < breadcrumb.length - 1 ? (
                <Link href={`/documents?dossier=${b.id}`} className="text-gray-500 hover:text-gray-700 transition-colors">{b.nom}</Link>
              ) : (
                <span className="font-semibold text-gray-900">{b.nom}</span>
              )}
            </Fragment>
          ))}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentDossier?.nom ?? 'Documents'}</h2>
          <p className="text-gray-500 mt-1">{totalItems} élément{totalItems !== 1 ? 's' : ''}</p>
        </div>

        {totalItems === 0 ? (
          <EmptyState
            icon={<FolderOpen size={48} strokeWidth={1.5} />}
            title="Dossier vide"
            description="Aucun document partagé pour le moment."
          />
        ) : (
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Type</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Taille</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 w-20"></th>
                  </tr>
                </thead>
                <tbody>
                  {/* Dossiers en premier */}
                  {visibleDossiers.map((d) => {
                    const subCount = dossiers.filter((x) => x.parent_id === d.id).length;
                    const docCount = countByDossier[d.id] ?? 0;
                    const count = subCount > 0 ? subCount : docCount;
                    const countLabel = subCount > 0
                      ? `${count} dossier${count !== 1 ? 's' : ''}`
                      : `${count} document${count !== 1 ? 's' : ''}`;
                    return (
                      <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <Link href={`/documents?dossier=${d.id}`} className="flex items-center gap-3 group/row">
                            <Folder size={18} className={`${folderColorClass(d)} shrink-0`} />
                            <span className="font-medium text-gray-900 group-hover/row:text-blue-600 transition-colors">{d.nom}</span>
                            <span className="text-xs text-gray-400 ml-1">({countLabel})</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">Dossier</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">—</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">—</td>
                        <td className="px-4 py-3"></td>
                      </tr>
                    );
                  })}
                  {/* Fichiers ensuite */}
                  {documents?.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900">{doc.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <Badge variant={couleurType(doc.type)}>{LABELS_TYPE_DOCUMENT[doc.type] ?? doc.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{formatTaille(doc.taille)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ouvrir">
                            <ExternalLink size={14} />
                          </a>
                          <a href={`/api/documents/${doc.id}/download`} download={doc.nom}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Télécharger">
                            <Download size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    );
  }

  // ================================================================
  // VUE SYNDIC — logique complète (création, migrations, actions)
  // ================================================================
  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const canWrite = isSubscribed(copropriete?.plan);

  // ---- Initialisation des dossiers par défaut si absents ----
  const { data: rawDossiers } = await supabase
    .from('document_dossiers')
    .select('id, nom, is_default, created_at, parent_id' as 'id, nom, is_default, created_at')
    .eq('syndic_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at');

  let dossiers: Dossier[] = (rawDossiers ?? []) as unknown as Dossier[];

  // Migration : renomme "PV Assemblées Générales" → "Assemblées Générales"
  const pvDossier = dossiers.find((d) => d.nom === 'PV Assemblées Générales' && !d.parent_id);
  if (pvDossier) {
    await supabase.from('document_dossiers').update({ nom: 'Assemblées Générales' }).eq('id', pvDossier.id);
    dossiers = dossiers.map((d) => d.id === pvDossier.id ? { ...d, nom: 'Assemblées Générales' } : d);
  }

  // Auto-nettoyage des doublons de dossiers racine (garde le plus ancien)
  const rootByName = new Map<string, string>();
  const toDelete: string[] = [];
  for (const d of dossiers.filter((x) => !x.parent_id).sort((a, b) => a.created_at.localeCompare(b.created_at))) {
    if (rootByName.has(d.nom)) {
      toDelete.push(d.id);
    } else {
      rootByName.set(d.nom, d.id);
    }
  }
  if (toDelete.length > 0) {
    await supabase.from('document_dossiers').delete().in('id', toDelete);
    dossiers = dossiers.filter((d) => !toDelete.includes(d.id));
  }

  // Création des dossiers racine manquants
  const existingRootNames = dossiers.filter((d) => !d.parent_id).map((d) => d.nom);
  const missing = DEFAULT_DOSSIER_NAMES.filter((n) => !existingRootNames.includes(n));
  if (missing.length) {
    await supabase.from('document_dossiers').insert(
      missing.map((nom) => ({ nom, is_default: true, syndic_id: user.id }))
    );
    const { data: refreshed2 } = await supabase
      .from('document_dossiers')
      .select('id, nom, is_default, created_at, parent_id' as 'id, nom, is_default, created_at')
      .eq('syndic_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at');
    dossiers = (refreshed2 ?? []) as unknown as Dossier[];
  }

  // Migration : supprime le dossier "Convocations AG" devenu obsolète
  const convDossiers = dossiers.filter((d) => d.nom === 'Convocations AG');
  if (convDossiers.length > 0) {
    const convIds = convDossiers.map((d) => d.id);
    await supabase.from('documents').delete().in('dossier_id', convIds);
    const subConvIds = dossiers.filter((d) => d.parent_id && convIds.includes(d.parent_id)).map((d) => d.id);
    if (subConvIds.length > 0) {
      await supabase.from('documents').delete().in('dossier_id', subConvIds);
      await supabase.from('document_dossiers').delete().in('id', subConvIds);
    }
    await supabase.from('document_dossiers').delete().in('id', convIds);
    dossiers = dossiers.filter((d) => !convIds.includes(d.id) && !(d.parent_id && convIds.includes(d.parent_id)));
  }

  // Migration : déplace les documents directement dans "Dépenses" vers le sous-dossier année courante
  {
    const currentYear = new Date().getFullYear().toString();
    const depensesRoot = dossiers.find((d) => d.nom === 'Dépenses' && !d.parent_id);
    if (depensesRoot && selectedCoproId) {
      const yearSub = dossiers.find((d) => d.parent_id === depensesRoot.id && d.nom === currentYear);
      if (yearSub) {
        await supabase
          .from('documents')
          .update({ dossier_id: yearSub.id })
          .eq('dossier_id', depensesRoot.id)
          .eq('copropriete_id', selectedCoproId);
      }
    }
  }

  // Auto-création du sous-dossier "année courante"
  {
    const currentYear = new Date().getFullYear().toString();
    const yearParentNames = ['Dépenses', 'Appels de fonds', 'Assemblées générales'];
    let yearFolderCreated = false;
    for (const nom of yearParentNames) {
      const parent = dossiers.find((d) => d.nom === nom && !d.parent_id);
      if (!parent) continue;
      const exists = dossiers.some((d) => d.parent_id === parent.id && d.nom === currentYear);
      if (!exists) {
        await supabase.from('document_dossiers').insert({
          nom: currentYear,
          is_default: true,
          syndic_id: user.id,
          parent_id: parent.id,
        });
        yearFolderCreated = true;
      }
    }
    if (yearFolderCreated) {
      const { data: refreshedYears } = await supabase
        .from('document_dossiers')
        .select('id, nom, is_default, created_at, parent_id' as 'id, nom, is_default, created_at')
        .eq('syndic_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at');
      dossiers = (refreshedYears ?? []) as unknown as Dossier[];
    }
  }

  // Comptage documents par dossier
  const { data: docCounts } = await supabase
    .from('documents')
    .select('dossier_id')
    .eq('copropriete_id', selectedCoproId ?? 'none');

  const countByDossier = (docCounts ?? []).reduce<Record<string, number>>((acc, doc) => {
    if (doc.dossier_id) acc[doc.dossier_id] = (acc[doc.dossier_id] ?? 0) + 1;
    return acc;
  }, {});

  // ================================================================
  // Données de la vue courante
  // ================================================================
  const currentDossier = dossierId ? dossiers.find((d) => d.id === dossierId) : null;
  if (dossierId && !currentDossier) redirect('/documents');

  const parentId = dossierId ?? null;
  const visibleDossiers = parentId
    ? (() => {
        const isYearClassified = currentDossier && ['Dépenses', 'Appels de fonds'].includes(currentDossier.nom);
        const subs = dossiers.filter((d) => d.parent_id === parentId);
        return isYearClassified
          ? subs.sort((a, b) => b.nom.localeCompare(a.nom))
          : subs;
      })()
    : sortRootDossiers(dossiers.filter((d) => !d.parent_id));

  const hasSubs = dossierId ? dossiers.some((d) => d.parent_id === dossierId) : false;

  const { data: documents } = dossierId && !hasSubs
    ? await supabase
        .from('documents')
        .select('*, coproprietes(nom)')
        .eq('copropriete_id', selectedCoproId ?? 'none')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false })
    : { data: null };

  const breadcrumb = dossierId ? buildBreadcrumb(dossiers, dossierId) : [];
  const totalItems = visibleDossiers.length + (documents?.length ?? 0);

  // ================================================================
  // RENDU — vue Drive unifiée
  // ================================================================
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Bandeau lecture seule */}
      {!canWrite && <ReadOnlyBanner />}

      {/* Fil d'Ariane */}
      <div className="flex items-center gap-1 text-sm flex-wrap">
        <Link href="/documents" className="text-gray-500 hover:text-gray-700 transition-colors">Documents</Link>
        {breadcrumb.map((b, i) => (
          <Fragment key={b.id}>
            <ChevronRight size={14} className="text-gray-400 shrink-0" />
            {i < breadcrumb.length - 1 ? (
              <Link href={`/documents?dossier=${b.id}`} className="text-gray-500 hover:text-gray-700 transition-colors">{b.nom}</Link>
            ) : (
              <span className="font-semibold text-gray-900">{b.nom}</span>
            )}
          </Fragment>
        ))}
      </div>

      {/* En-tête */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{currentDossier?.nom ?? 'Documents'}</h2>
          <p className="text-gray-500 mt-1">{totalItems} élément{totalItems !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          {/* Actions dossier (vue racine uniquement) */}
          {!dossierId && canWrite && <DossierActions />}
          {/* Créer sous-dossier (dans un dossier avec sous-dossiers) */}
          {dossierId && hasSubs && canWrite && (
            <SubDossierActions mode="create" parentId={dossierId} />
          )}
          {/* Importer un document */}
          {canWrite ? (
            <DocumentActions
              coproprietes={coproprietes}
              dossiers={dossiers}
              defaultDossierId={dossierId}
            />
          ) : (
            <UpgradeBanner compact />
          )}
        </div>
      </div>

      {/* Table Drive */}
      {totalItems === 0 ? (
        <EmptyState
          icon={<FolderOpen size={48} strokeWidth={1.5} />}
          title="Dossier vide"
          description={currentDossier
            ? `Aucun document dans « ${currentDossier.nom} » pour le moment.`
            : 'Aucun document pour le moment.'}
          action={
            canWrite ? (
              <DocumentActions
                coproprietes={coproprietes}
                dossiers={dossiers}
                defaultDossierId={dossierId}
                showLabel
              />
            ) : (
              <UpgradeBanner />
            )
          }
        />
      ) : (
        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Nom</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Date</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Taille</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-500 w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {/* ── Dossiers en premier ── */}
                {visibleDossiers.map((d) => {
                  const subCount = dossiers.filter((x) => x.parent_id === d.id).length;
                  const docCount = countByDossier[d.id] ?? 0;
                  const count = subCount > 0 ? subCount : docCount;
                  const countLabel = subCount > 0
                    ? `${count} dossier${count !== 1 ? 's' : ''}`
                    : `${count} document${count !== 1 ? 's' : ''}`;
                  return (
                    <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                      <td className="px-4 py-3">
                        <Link href={`/documents?dossier=${d.id}`} className="flex items-center gap-3 group/link">
                          <Folder size={18} className={`${folderColorClass(d)} shrink-0`} />
                          <span className="font-medium text-gray-900 group-hover/link:text-blue-600 transition-colors">{d.nom}</span>
                          <span className="text-xs text-gray-400">({countLabel})</span>
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs hidden sm:table-cell">Dossier</td>
                      <td className="px-4 py-3 text-gray-400 hidden md:table-cell">—</td>
                      <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">—</td>
                      <td className="px-4 py-3">
                        {canWrite && (
                          <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {!dossierId ? (
                              // Dossiers racine : renommer + supprimer (custom seulement)
                              <>
                                {!d.is_default && (
                                  <>
                                    <DossierRename
                                      dossierId={d.id}
                                      dossierNom={d.nom}
                                    />
                                    <DossierDelete dossierId={d.id} dossierNom={d.nom} />
                                  </>
                                )}
                              </>
                            ) : (
                              // Sous-dossiers : renommer + supprimer
                              <>
                                <SubDossierActions
                                  mode="rename"
                                  parentId={dossierId}
                                  dossier={{ id: d.id, nom: d.nom }}
                                />
                                <SubDossierActions
                                  mode="delete"
                                  parentId={dossierId}
                                  dossier={{ id: d.id, nom: d.nom }}
                                  hasDocuments={docCount > 0}
                                  hasSubs={subCount > 0}
                                />
                              </>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {/* ── Fichiers ensuite ── */}
                {documents?.map((doc) => (
                  <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileText size={18} className="text-gray-400 shrink-0" />
                        <span className="font-medium text-gray-900">{doc.nom}</span>
                        {canWrite && (
                          <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <DocumentRename documentId={doc.id} nomActuel={doc.nom} />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <Badge variant={couleurType(doc.type)}>{LABELS_TYPE_DOCUMENT[doc.type] ?? doc.type}</Badge>
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(doc.created_at)}</td>
                    <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{formatTaille(doc.taille)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ouvrir">
                          <ExternalLink size={14} />
                        </a>
                        <a href={`/api/documents/${doc.id}/download`} download={doc.nom}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Télécharger">
                          <Download size={14} />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
