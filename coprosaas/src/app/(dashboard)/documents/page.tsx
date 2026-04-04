// ============================================================
// Page : Gestion des documents — vue gestionnaire de fichiers
// Table unifiée dossiers + fichiers, navigation par breadcrumb
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Documents' };

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Fragment } from 'react';
import Card from '@/components/ui/Card';
import EmptyState from '@/components/ui/EmptyState';
import DocumentActions, { DocumentMenu } from './DocumentActions';
import DossierActions, { FolderMenu, SubDossierActions } from './DossierActions';
import { formatDate } from '@/lib/utils';
import { FileText, Download, ExternalLink, Folder, ChevronRight, FolderOpen, ArrowUp, ArrowDown } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';

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

const formatTaille = (bytes: number | null) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

// ── Colonnes de la table partagée ──────────────────────────
//   colonnes : Nom | Date | Taille | Actions

interface Props {
  searchParams: Promise<{ dossier?: string; sort?: string; dir?: string }>;
}

function buildSortUrl(dossierId: string | undefined, sort: string, currentSort: string, currentDir: string) {
  const params = new URLSearchParams();
  if (dossierId) params.set('dossier', dossierId);
  params.set('sort', sort);
  params.set('dir', currentSort === sort && currentDir === 'asc' ? 'desc' : 'asc');
  return `/documents?${params.toString()}`;
}

type Doc = { id: string; nom: string; type: string; taille: number | null; created_at: string };

function sortDocs(docs: Doc[], sort: string, dir: string): Doc[] {
  return [...docs].sort((a, b) => {
    const cmp = sort === 'nom'
      ? a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
      : a.created_at.localeCompare(b.created_at);
    return dir === 'asc' ? cmp : -cmp;
  });
}

export default async function DocumentsPage({ searchParams }: Props) {
  const { dossier: dossierId, sort: sortParam, dir: dirParam } = await searchParams;
  const sort = sortParam ?? 'date';
  const dir = dirParam ?? 'desc';
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
          <>
            <div className="space-y-2 md:hidden">
              {visibleDossiers.map((d) => {
                const subCount = dossiers.filter((x) => x.parent_id === d.id).length;
                const docCount = countByDossier[d.id] ?? 0;
                const count = subCount > 0 ? subCount : docCount;
                const countLabel = subCount > 0
                  ? `${count} dossier${count !== 1 ? 's' : ''}`
                  : `${count} document${count !== 1 ? 's' : ''}`;
                return (
                  <Card key={d.id}>
                    <Link href={`/documents?dossier=${d.id}`} className="flex items-start gap-3">
                      <Folder size={18} className={`${folderColorClass(d)} mt-0.5 shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900">{d.nom}</p>
                        <p className="text-xs text-gray-500 mt-1">{countLabel}</p>
                      </div>
                      <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    </Link>
                  </Card>
                );
              })}

              {sortDocs((documents ?? []) as Doc[], sort, dir).map((doc) => (
                <Card key={doc.id}>
                  <div className="flex items-start gap-3">
                    <FileText size={18} className="text-gray-400 mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 break-words">{doc.nom}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDate(doc.created_at)} · {formatTaille(doc.taille)}
                      </p>
                    </div>
                    <a
                      href={`/api/documents/${doc.id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-200 hover:text-blue-700 hover:bg-blue-50 transition-colors shrink-0"
                    >
                      <Download size={13} /> Ouvrir
                    </a>
                  </div>
                </Card>
              ))}
            </div>

            <Card padding="none" className="hidden md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-gray-500">
                        <Link href={buildSortUrl(dossierId, 'nom', sort, dir)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                          Nom
                          {sort === 'nom' ? (dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : null}
                        </Link>
                      </th>
                      <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                        <Link href={buildSortUrl(dossierId, 'date', sort, dir)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                          Date
                          {sort === 'date' ? (dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : null}
                        </Link>
                      </th>
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
                          <td className="px-4 py-3 text-gray-400 hidden md:table-cell">—</td>
                          <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">—</td>
                          <td className="px-4 py-3"></td>
                        </tr>
                      );
                    })}
                    {/* Fichiers ensuite */}
                    {sortDocs((documents ?? []) as Doc[], sort, dir).map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileText size={18} className="text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-900">{doc.nom}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(doc.created_at)}</td>
                        <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{formatTaille(doc.taille)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center">
                            <DocumentMenu doc={{ id: doc.id, nom: doc.nom }} dossiers={dossiers} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>
    );
  }

  // ================================================================
  // VUE SYNDIC — logique complète (création, migrations, actions)
  // ================================================================
  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const canWrite = isSubscribed(copropriete?.plan);

  // ---- Lecture des dossiers ----
  const { data: rawDossiers } = await supabase
    .from('document_dossiers')
    .select('id, nom, is_default, created_at, parent_id' as 'id, nom, is_default, created_at')
    .eq('syndic_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at');

  const dossiers: Dossier[] = (rawDossiers ?? []) as unknown as Dossier[];

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
        .select('id, nom, type, taille, created_at')
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
          {/* Créer sous-dossier (dans n'importe quel dossier) */}
          {dossierId && canWrite && (
            <SubDossierActions mode="create" parentId={dossierId} />
          )}
          {/* Importer un document — masqué si dossier vide (bouton centré suffit) */}
          {totalItems > 0 && (
            canWrite ? (
              <DocumentActions
                coproprietes={coproprietes}
                dossiers={dossiers}
                defaultDossierId={dossierId}
              />
            ) : (
              <UpgradeBanner compact />
            )
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
        <>
          <div className="space-y-2 md:hidden">
            {visibleDossiers.map((d) => {
              const subCount = dossiers.filter((x) => x.parent_id === d.id).length;
              const docCount = countByDossier[d.id] ?? 0;
              const count = subCount > 0 ? subCount : docCount;
              const countLabel = subCount > 0
                ? `${count} dossier${count !== 1 ? 's' : ''}`
                : `${count} document${count !== 1 ? 's' : ''}`;
              return (
                <Card key={d.id}>
                  <div className="flex items-start gap-3">
                    <Link href={`/documents?dossier=${d.id}`} className="flex items-start gap-3 min-w-0 flex-1 group/link">
                      <Folder size={18} className={`${folderColorClass(d)} mt-0.5 shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 group-hover/link:text-blue-700 transition-colors">{d.nom}</p>
                        <p className="text-xs text-gray-500 mt-1">{countLabel}</p>
                      </div>
                    </Link>
                    {canWrite && !d.is_default ? (
                      <FolderMenu
                        dossier={{ id: d.id, nom: d.nom, parent_id: d.parent_id }}
                        hasDocuments={docCount > 0}
                        hasSubs={subCount > 0}
                      />
                    ) : (
                      <ChevronRight size={16} className="text-gray-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                </Card>
              );
            })}

            {sortDocs((documents ?? []) as Doc[], sort, dir).map((doc) => (
              <Card key={doc.id}>
                <div className="flex items-start gap-3">
                  <FileText size={18} className="text-gray-400 mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900 break-words">{doc.nom}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(doc.created_at)} · {formatTaille(doc.taille)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {canWrite
                      ? <DocumentMenu doc={{ id: doc.id, nom: doc.nom }} dossiers={dossiers} />
                      : (
                        <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:border-blue-200 hover:text-blue-700 hover:bg-blue-50 transition-colors" title="Voir">
                          <ExternalLink size={13} /> Ouvrir
                        </a>
                      )
                    }
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <Card padding="none" className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">
                      <Link href={buildSortUrl(dossierId, 'nom', sort, dir)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                        Nom
                        {sort === 'nom' ? (dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : null}
                      </Link>
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 hidden md:table-cell">
                      <Link href={buildSortUrl(dossierId, 'date', sort, dir)} className="flex items-center gap-1 hover:text-gray-800 transition-colors">
                        Date
                        {sort === 'date' ? (dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />) : null}
                      </Link>
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500 hidden md:table-cell">Taille</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-500 w-32">Actions</th>
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
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">—</td>
                        <td className="px-4 py-3 text-right text-gray-400 hidden md:table-cell">—</td>
                        <td className="px-4 py-3">
                          {canWrite && !d.is_default && (
                            <div className="flex items-center justify-center">
                              <FolderMenu
                                dossier={{ id: d.id, nom: d.nom, parent_id: d.parent_id }}
                                hasDocuments={docCount > 0}
                                hasSubs={subCount > 0}
                              />
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {/* ── Fichiers ensuite ── */}
                  {sortDocs((documents ?? []) as Doc[], sort, dir).map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileText size={18} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900">{doc.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{formatDate(doc.created_at)}</td>
                      <td className="px-4 py-3 text-right text-gray-500 hidden md:table-cell">{formatTaille(doc.taille)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center">
                          {canWrite
                            ? <DocumentMenu doc={{ id: doc.id, nom: doc.nom }} dossiers={dossiers} />
                            : (
                              <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Voir">
                                <ExternalLink size={14} />
                              </a>
                            )
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
