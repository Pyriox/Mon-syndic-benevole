// ============================================================
// Page : Gestion des documents par dossiers
// - Vue principale : grille de dossiers
// - Vue dossier (?dossier=<id>) : liste des documents du dossier
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
import { FileText, Download, ExternalLink, Folder, ChevronRight } from 'lucide-react';
import { isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';

// Dossiers racine permanents — dans l'ordre d'affichage souhaité
const DEFAULT_DOSSIER_NAMES = [
  'Assemblées Générales',
  'Appels de fonds',
  'Dépenses',
  'Règlement copropriété',
];

// Ordre d'utilité des dossiers permanents (plus petit = en premier)
const DEFAULT_DOSSIER_ORDER: Record<string, number> = {
  'Assemblées Générales': 0,
  'Appels de fonds':      1,
  'Dépenses':             2,
  'Règlement copropriété': 3,
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

type Dossier = { id: string; nom: string; is_default: boolean; created_at: string; parent_id?: string | null; couleur?: string | null };

const FOLDER_COLOR_CLASS: Record<string, string> = {
  blue:   'text-blue-500',
  amber:  'text-amber-500',
  green:  'text-green-500',
  purple: 'text-purple-500',
  red:    'text-red-500',
  pink:   'text-pink-500',
  cyan:   'text-cyan-500',
  gray:   'text-gray-400',
};
const folderColorClass = (d: Dossier) =>
  (d.couleur && FOLDER_COLOR_CLASS[d.couleur]) ??
  (d.is_default ? 'text-blue-500' : 'text-amber-500');

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
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

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
    const admin = supabase; // Les RLS policies autorisent la lecture pour les deux rôles

    const { data: rawDossiers } = await admin
      .from('document_dossiers')
      .select('id, nom, is_default, created_at, parent_id, couleur' as 'id, nom, is_default, created_at')
      .eq('syndic_id', syndicId)
      .order('is_default', { ascending: false })
      .order('created_at');
    const dossiers: Dossier[] = (rawDossiers ?? []) as unknown as Dossier[];

    const { data: docCounts } = await admin
      .from('documents')
      .select('dossier_id')
      .eq('copropriete_id', selectedCoproId ?? 'none');
    const countByDossier = (docCounts ?? []).reduce<Record<string, number>>((acc, doc) => {
      if (doc.dossier_id) acc[doc.dossier_id] = (acc[doc.dossier_id] ?? 0) + 1;
      return acc;
    }, {});

    const subCountByParent = dossiers.reduce<Record<string, number>>((acc, d) => {
      if (d.parent_id) acc[d.parent_id] = (acc[d.parent_id] ?? 0) + 1;
      return acc;
    }, {});

    const rootDossiersCopro = sortRootDossiers(dossiers.filter((d) => !d.parent_id));

    // ── Vue dossier spécifique ──
    if (dossierId) {
      const currentDossier = dossiers.find((d) => d.id === dossierId);
      if (!currentDossier) redirect('/documents');

      const isYearClassified = ['Dépenses', 'Appels de fonds'].includes(currentDossier.nom);
      const subDossiers = isYearClassified
        ? dossiers.filter((d) => d.parent_id === dossierId).sort((a, b) => b.nom.localeCompare(a.nom))
        : dossiers.filter((d) => d.parent_id === dossierId);

      const { data: documents } = await admin
        .from('documents')
        .select('*, coproprietes(nom)')
        .eq('copropriete_id', selectedCoproId ?? 'none')
        .eq('dossier_id', dossierId)
        .order('created_at', { ascending: false });

      const breadcrumb = buildBreadcrumb(dossiers, dossierId);

      return (
        <div className="max-w-5xl mx-auto space-y-6">
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
            <h2 className="text-2xl font-bold text-gray-900">{currentDossier.nom}</h2>
            <p className="text-gray-500 mt-1">
              {subDossiers.length > 0
                ? `${subDossiers.length} sous-dossier${subDossiers.length !== 1 ? 's' : ''}`
                : `${documents?.length ?? 0} document${(documents?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          {/* Sous-dossiers */}
          {subDossiers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {subDossiers.map((sub) => {
                const sepIdx = sub.nom.indexOf(' — ');
                const hasDate = sepIdx !== -1;
                const titre = hasDate ? sub.nom.slice(0, sepIdx) : sub.nom;
                const date  = hasDate ? sub.nom.slice(sepIdx + 3) : null;
                const subCount = dossiers.filter((d) => d.parent_id === sub.id).length;
                const docCount = countByDossier[sub.id] ?? 0;
                return (
                  <Link key={sub.id} href={`/documents?dossier=${sub.id}`} className="block">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                      <Folder size={36} className="text-blue-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{titre}</p>
                        {date && <p className="text-xs font-medium text-blue-600 mt-0.5">{date}</p>}
                        <p className="text-xs text-gray-400 mt-1">
                          {subCount > 0 ? `${subCount} sous-dossier(s)` : `${docCount} document${docCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
          {/* Documents */}
          {subDossiers.length === 0 && documents && documents.length > 0 && (
            <Card padding="none">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Nom</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                      <th className="text-right px-5 py-3 font-medium text-gray-500">Taille</th>
                      <th className="text-center px-5 py-3 font-medium text-gray-500">Télécharger</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-gray-400 shrink-0" />
                            <span className="font-medium text-gray-900">{doc.nom}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <Badge variant={couleurType(doc.type)}>
                            {LABELS_TYPE_DOCUMENT[doc.type] ?? doc.type}
                          </Badge>
                        </td>
                        <td className="px-5 py-3 text-gray-500">{formatDate(doc.created_at)}</td>
                        <td className="px-5 py-3 text-right text-gray-500">{formatTaille(doc.taille)}</td>
                        <td className="px-5 py-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ouvrir">
                              <ExternalLink size={15} />
                            </a>
                            <a href={`/api/documents/${doc.id}/download`} download={doc.nom}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Télécharger">
                              <Download size={15} />
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
          {/* État vide */}
          {subDossiers.length === 0 && !documents?.length && (
            <EmptyState
              icon={<FileText size={48} strokeWidth={1.5} />}
              title="Dossier vide"
              description={`Aucun document dans « ${currentDossier.nom} » pour le moment.`}
            />
          )}
        </div>
      );
    }

    // ── Vue grille racine ──
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500 mt-1">{rootDossiersCopro.length} dossier(s)</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {rootDossiersCopro.map((dossier) => (
            <Link key={dossier.id} href={`/documents?dossier=${dossier.id}`} className="block">
              <div className={`bg-white rounded-xl border-2 p-5 flex items-center gap-4 hover:shadow-md transition-all ${
                dossier.is_default ? 'border-gray-200 hover:border-blue-300' : 'border-dashed border-gray-300 hover:border-amber-400'
              }`}>
                <Folder size={36} className={`${folderColorClass(dossier)} shrink-0`} />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{dossier.nom}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {subCountByParent[dossier.id]
                      ? `${subCountByParent[dossier.id]} sous-dossier${subCountByParent[dossier.id] !== 1 ? 's' : ''}`
                      : `${countByDossier[dossier.id] ?? 0} document${(countByDossier[dossier.id] ?? 0) !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
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
    .select('id, nom, is_default, created_at, parent_id, couleur' as 'id, nom, is_default, created_at')
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
  const rootByName = new Map<string, string>(); // nom → id du plus ancien
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

  // Création des dossiers racine manquants (vérifie uniquement les dossiers racine)
  const existingRootNames = dossiers.filter((d) => !d.parent_id).map((d) => d.nom);
  const missing = DEFAULT_DOSSIER_NAMES.filter((n) => !existingRootNames.includes(n));
  if (missing.length) {
    await supabase.from('document_dossiers').insert(
      missing.map((nom) => ({ nom, is_default: true, syndic_id: user.id }))
    );
    const { data: refreshed2 } = await supabase
      .from('document_dossiers')
      .select('id, nom, is_default, created_at, parent_id, couleur' as 'id, nom, is_default, created_at')
      .eq('syndic_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at');
    dossiers = (refreshed2 ?? []) as unknown as Dossier[];
  }

  // Migration : supprime le dossier "Convocations AG" devenu obsolète
  // (les convocations sont désormais rangées dans Assemblées Générales / Année / AG)
  const convDossiers = dossiers.filter((d) => d.nom === 'Convocations AG');
  if (convDossiers.length > 0) {
    const convIds = convDossiers.map((d) => d.id);
    // Supprime les documents contenus dans ces dossiers
    await supabase.from('documents').delete().in('dossier_id', convIds);
    // Supprime les sous-dossiers éventuels
    const subConvIds = dossiers.filter((d) => d.parent_id && convIds.includes(d.parent_id)).map((d) => d.id);
    if (subConvIds.length > 0) {
      await supabase.from('documents').delete().in('dossier_id', subConvIds);
      await supabase.from('document_dossiers').delete().in('id', subConvIds);
    }
    await supabase.from('document_dossiers').delete().in('id', convIds);
    dossiers = dossiers.filter((d) => !convIds.includes(d.id) && !(d.parent_id && convIds.includes(d.parent_id)));
  }

  // Migration : déplace les documents directement dans "Dépenses" vers son sous-dossier de l'année courante
  {
    const currentYear = new Date().getFullYear().toString();
    const depensesRoot = dossiers.find((d) => d.nom === 'Dépenses' && !d.parent_id);
    if (depensesRoot && selectedCoproId) {
      const yearSub = dossiers.find((d) => d.parent_id === depensesRoot.id && d.nom === currentYear);
      if (yearSub) {
        // Déplace les docs directement dans "Dépenses" (pas dans un sous-dossier) vers le sous-dossier année
        await supabase
          .from('documents')
          .update({ dossier_id: yearSub.id })
          .eq('dossier_id', depensesRoot.id)
          .eq('copropriete_id', selectedCoproId);
      }
    }
  }

  // Auto-création du sous-dossier "année courante" pour Dépenses et Appels de fonds
  {
    const currentYear = new Date().getFullYear().toString();
    const yearParentNames = ['Dépenses', 'Appels de fonds'];
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
        .select('id, nom, is_default, created_at, parent_id, couleur' as 'id, nom, is_default, created_at')
        .eq('syndic_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at');
      dossiers = (refreshedYears ?? []) as unknown as Dossier[];
    }
  }

  // ================================================================
  // Comptage documents par dossier (utilisé dans les deux vues)
  // ================================================================
  const { data: docCounts } = await supabase
    .from('documents')
    .select('dossier_id')
    .eq('copropriete_id', selectedCoproId ?? 'none');

  const countByDossier = (docCounts ?? []).reduce<Record<string, number>>((acc, doc) => {
    if (doc.dossier_id) acc[doc.dossier_id] = (acc[doc.dossier_id] ?? 0) + 1;
    return acc;
  }, {});

  // ================================================================
  // VUE DOSSIER SPÉCIFIQUE (sous-dossiers + documents)
  // ================================================================
  if (dossierId) {
    const currentDossier = dossiers.find((d) => d.id === dossierId);
    if (!currentDossier) redirect('/documents');

    // Sous-dossiers directs — triés par nom décroissant pour les dossiers classés par année
    const isYearClassified = ['Dépenses', 'Appels de fonds'].includes(currentDossier.nom);
    const subDossiers = isYearClassified
      ? dossiers.filter((d) => d.parent_id === dossierId).sort((a, b) => b.nom.localeCompare(a.nom))
      : dossiers.filter((d) => d.parent_id === dossierId);

    // Documents au niveau de ce dossier
    const { data: documents } = await supabase
      .from('documents')
      .select('*, coproprietes(nom)')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .eq('dossier_id', dossierId)
      .order('created_at', { ascending: false });

    // Fil d'Ariane
    const breadcrumb = buildBreadcrumb(dossiers, dossierId);

    const docTable = documents && documents.length > 0 ? (
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Nom</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Type</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Taille</th>
                <th className="text-center px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900">{doc.nom}</span>
                      {canWrite && <DocumentRename documentId={doc.id} nomActuel={doc.nom} />}
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <Badge variant={couleurType(doc.type)}>
                      {LABELS_TYPE_DOCUMENT[doc.type] ?? doc.type}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{formatDate(doc.created_at)}</td>
                  <td className="px-5 py-3 text-right text-gray-500">{formatTaille(doc.taille)}</td>
                  <td className="px-5 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <a href={`/api/documents/${doc.id}/download`} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ouvrir">
                        <ExternalLink size={15} />
                      </a>
                      <a href={`/api/documents/${doc.id}/download`} download={doc.nom}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="Télécharger">
                        <Download size={15} />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    ) : null;

    return (
      <div className="max-w-5xl mx-auto space-y-6">
        {/* ── Bandeau lecture seule ── */}
        {!canWrite && <ReadOnlyBanner />}

        {/* Fil d'Ariane */}
        <div className="flex items-center gap-1 text-sm flex-wrap">
          <Link href="/documents" className="text-gray-500 hover:text-gray-700 transition-colors">
            Documents
          </Link>
          {breadcrumb.map((b, i) => (
            <Fragment key={b.id}>
              <ChevronRight size={14} className="text-gray-400 shrink-0" />
              {i < breadcrumb.length - 1 ? (
                <Link href={`/documents?dossier=${b.id}`} className="text-gray-500 hover:text-gray-700 transition-colors">
                  {b.nom}
                </Link>
              ) : (
                <span className="font-semibold text-gray-900">{b.nom}</span>
              )}
            </Fragment>
          ))}
        </div>

        {/* En-tête */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{currentDossier.nom}</h2>
            <p className="text-gray-500 mt-1">
              {subDossiers.length > 0
                ? `${subDossiers.length} sous-dossier${subDossiers.length !== 1 ? 's' : ''}`
                : `${documents?.length ?? 0} document${(documents?.length ?? 0) !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div className="flex gap-2">
            {canWrite && subDossiers.length > 0 && (
              <SubDossierActions mode="create" parentId={dossierId} />
            )}
            {subDossiers.length === 0 && (
              canWrite ? (
                <DocumentActions
                  coproprietes={coproprietes ?? []}
                  dossiers={dossiers}
                  defaultDossierId={dossierId}
                />
              ) : (
                <UpgradeBanner compact />
              )
            )}
          </div>
        </div>

        {/* Sous-dossiers */}
        {subDossiers.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {subDossiers.map((sub) => {
              const sepIdx = sub.nom.indexOf(' — ');
              const hasDate = sepIdx !== -1;
              const titre = hasDate ? sub.nom.slice(0, sepIdx) : sub.nom;
              const date  = hasDate ? sub.nom.slice(sepIdx + 3) : null;
              const subCount = dossiers.filter((d) => d.parent_id === sub.id).length;
              const docCount = countByDossier[sub.id] ?? 0;
              return (
                <div key={sub.id} className="relative group">
                  <Link href={`/documents?dossier=${sub.id}`} className="block">
                    <div className="bg-white rounded-xl border-2 border-gray-200 p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                      <Folder size={36} className="text-blue-400 shrink-0" aria-hidden="true" />
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-900 text-sm leading-snug truncate">{titre}</p>
                        {date && (
                          <p className="text-xs font-medium text-blue-600 mt-0.5">{date}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {subCount > 0 ? `${subCount} sous-dossier(s)` : `${docCount} document${docCount !== 1 ? 's' : ''}`}
                        </p>
                      </div>
                    </div>
                  </Link>
                  {/* Boutons renommer / supprimer au survol */}
                  {canWrite && (
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <SubDossierActions
                        mode="rename"
                        parentId={dossierId}
                        dossier={{ id: sub.id, nom: sub.nom }}
                      />
                      <SubDossierActions
                        mode="delete"
                        parentId={dossierId}
                        dossier={{ id: sub.id, nom: sub.nom }}
                        hasDocuments={docCount > 0}
                        hasSubs={subCount > 0}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Documents */}
        {docTable}

        {/* État vide */}
        {subDossiers.length === 0 && !documents?.length && (
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title="Dossier vide"
            description={`Aucun document dans « ${currentDossier.nom} » pour le moment.`}
            action={
              canWrite ? (
                <DocumentActions
                  coproprietes={coproprietes ?? []}
                  dossiers={dossiers}
                  defaultDossierId={dossierId}
                  showLabel
                />
              ) : (
                <UpgradeBanner />
              )
            }
          />
        )}
      </div>
    );
  }

  // ================================================================
  // VUE PRINCIPALE : grille des dossiers racine
  // ================================================================
  const rootDossiers = sortRootDossiers(dossiers.filter((d) => !d.parent_id));

  const subCountByParent = dossiers.reduce<Record<string, number>>((acc, d) => {
    if (d.parent_id) acc[d.parent_id] = (acc[d.parent_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Bandeau lecture seule ── */}
      {!canWrite && <ReadOnlyBanner />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500 mt-1">{rootDossiers.length} dossier(s)</p>
        </div>
        <div className="flex gap-2">
          {canWrite && <DossierActions />}
          {canWrite ? (
            <DocumentActions coproprietes={coproprietes ?? []} dossiers={rootDossiers} />
          ) : (
            <UpgradeBanner compact />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {rootDossiers.map((dossier) => (
          <div key={dossier.id} className="relative group">
            <Link href={`/documents?dossier=${dossier.id}`} className="block">
              <div
                className={`bg-white rounded-xl border-2 p-5 flex items-center gap-4 hover:shadow-md transition-all ${
                  dossier.is_default
                    ? 'border-gray-200 hover:border-blue-300'
                    : 'border-dashed border-gray-300 hover:border-amber-400'
                }`}
              >
                <Folder
                  size={36}
                  className={`${folderColorClass(dossier)} shrink-0`}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{dossier.nom}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {subCountByParent[dossier.id]
                      ? `${subCountByParent[dossier.id]} sous-dossier${subCountByParent[dossier.id] !== 1 ? 's' : ''}`
                      : `${countByDossier[dossier.id] ?? 0} document${(countByDossier[dossier.id] ?? 0) !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            </Link>
            <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {canWrite && (
                <DossierRename
                  dossierId={dossier.id}
                  dossierNom={dossier.nom}
                  dossierCouleur={dossier.couleur}
                  colorOnly={dossier.is_default}
                />
              )}
              {canWrite && !dossier.is_default && (
                <DossierDelete dossierId={dossier.id} dossierNom={dossier.nom} />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
