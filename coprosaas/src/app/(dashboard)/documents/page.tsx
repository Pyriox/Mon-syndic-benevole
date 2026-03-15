// ============================================================
// Page : Gestion des documents par dossiers
// - Vue principale : grille de dossiers
// - Vue dossier (?dossier=<id>) : liste des documents du dossier
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import DocumentActions, { DocumentRename } from './DocumentActions';
import DossierActions, { DossierDelete } from './DossierActions';
import { formatDate, LABELS_TYPE_DOCUMENT } from '@/lib/utils';
import { FileText, Download, ExternalLink, Folder, ArrowLeft } from 'lucide-react';

// Les 4 dossiers créés automatiquement pour chaque syndic
const DEFAULT_DOSSIER_NAMES = [
  'PV Assemblées Générales',
  'Appels de fonds',
  'Dépenses',
  'Règlement copropriété',
];

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
  searchParams: Promise<{ dossier?: string; annee?: string }>;
}

export default async function DocumentsPage({ searchParams }: Props) {
  const { dossier: dossierId, annee } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  // ---- Initialisation des dossiers par défaut si absents ----
  let { data: dossiers } = await supabase
    .from('document_dossiers')
    .select('id, nom, is_default, created_at')
    .eq('syndic_id', user.id)
    .order('is_default', { ascending: false })
    .order('created_at');

  const existingNames = dossiers?.map((d) => d.nom) ?? [];
  const missing = DEFAULT_DOSSIER_NAMES.filter((n) => !existingNames.includes(n));
  if (missing.length) {
    await supabase.from('document_dossiers').insert(
      missing.map((nom) => ({ nom, is_default: true, syndic_id: user.id }))
    );
    const { data: refreshed } = await supabase
      .from('document_dossiers')
      .select('id, nom, is_default, created_at')
      .eq('syndic_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at');
    dossiers = refreshed;
  }

  const { data: coproprietes2 } = await supabase
    .from('coproprietes')
    .select('id, nom')
    .eq('syndic_id', user.id);
  // Unused — replaced by cookie-based selection above (kept for dossier logic)
  void coproprietes2;

  // ================================================================
  // VUE DOSSIER SPÉCIFIQUE  (par années, puis par documents)
  // ================================================================
  if (dossierId) {
    const currentDossier = dossiers?.find((d) => d.id === dossierId);
    if (!currentDossier) redirect('/documents');

    // ---- Vue documents d'une année précise ----
    if (annee) {
      const anneeNum = parseInt(annee);
      const { data: documents } = await supabase
        .from('documents')
        .select('*, coproprietes(nom)')
        .eq('copropriete_id', selectedCoproId ?? 'none')
        .eq('dossier_id', dossierId)
        .gte('created_at', `${anneeNum}-01-01`)
        .lt('created_at', `${anneeNum + 1}-01-01`)
        .order('created_at', { ascending: false });

      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href={`/documents?dossier=${dossierId}`}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
                title="Retour au dossier"
              >
                <ArrowLeft size={18} />
              </Link>
              <div>
                <p className="text-sm text-gray-400 mb-0.5">{currentDossier.nom}</p>
                <h2 className="text-2xl font-bold text-gray-900">{annee}</h2>
                <p className="text-gray-500 mt-1">{documents?.length ?? 0} document(s)</p>
              </div>
            </div>
            <DocumentActions
              coproprietes={coproprietes ?? []}
              dossiers={dossiers ?? []}
              defaultDossierId={dossierId}
            />
          </div>

          {documents && documents.length > 0 ? (
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
                            <DocumentRename documentId={doc.id} nomActuel={doc.nom} />
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
                            <a href={doc.url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ouvrir">
                              <ExternalLink size={15} />
                            </a>
                            <a href={doc.url} download={doc.nom}
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
          ) : (
            <EmptyState
              icon={<FileText size={48} strokeWidth={1.5} />}
              title={`Aucun document en ${annee}`}
              description={`Aucun document ajouté en ${annee} dans « ${currentDossier.nom} ».`}
              action={
                <DocumentActions
                  coproprietes={coproprietes ?? []}
                  dossiers={dossiers ?? []}
                  defaultDossierId={dossierId}
                  showLabel
                />
              }
            />
          )}
        </div>
      );
    }

    // ---- Vue sous-dossiers par année ----
    const { data: allDocs } = await supabase
      .from('documents')
      .select('id, created_at')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .eq('dossier_id', dossierId);

    const yearCounts = (allDocs ?? []).reduce<Record<string, number>>((acc, doc) => {
      const y = new Date(doc.created_at).getFullYear().toString();
      acc[y] = (acc[y] ?? 0) + 1;
      return acc;
    }, {});
    const years = Object.keys(yearCounts).sort((a, b) => parseInt(b) - parseInt(a));

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/documents"
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
              title="Retour aux dossiers"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{currentDossier.nom}</h2>
              <p className="text-gray-500 mt-1">{allDocs?.length ?? 0} document(s) — {years.length} année(s)</p>
            </div>
          </div>
          <DocumentActions
            coproprietes={coproprietes ?? []}
            dossiers={dossiers ?? []}
            defaultDossierId={dossierId}
          />
        </div>

        {years.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {years.map((year) => (
              <Link key={year} href={`/documents?dossier=${dossierId}&annee=${year}`}>
                <div className="bg-white rounded-xl border-2 border-gray-200 p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
                  <Folder size={36} className="text-blue-400 shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">{year}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {yearCounts[year]} document{yearCounts[year] !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<FileText size={48} strokeWidth={1.5} />}
            title="Dossier vide"
            description={`Aucun document dans « ${currentDossier.nom} » pour le moment.`}
            action={
              <DocumentActions
                coproprietes={coproprietes ?? []}
                dossiers={dossiers ?? []}
                defaultDossierId={dossierId}
                showLabel
              />
            }
          />
        )}
      </div>
    );
  }

  // ================================================================
  // VUE PRINCIPALE : grille de dossiers
  // ================================================================
  const { data: docCounts } = await supabase
    .from('documents')
    .select('dossier_id')
    .eq('copropriete_id', selectedCoproId ?? 'none');

  const countByDossier = (docCounts ?? []).reduce<Record<string, number>>((acc, doc) => {
    if (doc.dossier_id) acc[doc.dossier_id] = (acc[doc.dossier_id] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documents</h2>
          <p className="text-gray-500 mt-1">{dossiers?.length ?? 0} dossier(s)</p>
        </div>
        <div className="flex gap-2">
          <DossierActions />
          <DocumentActions coproprietes={coproprietes ?? []} dossiers={dossiers ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {(dossiers ?? []).map((dossier) => (
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
                  className={dossier.is_default ? 'text-blue-500 shrink-0' : 'text-amber-500 shrink-0'}
                />
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm leading-snug">{dossier.nom}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {countByDossier[dossier.id] ?? 0} document{(countByDossier[dossier.id] ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </Link>
            {!dossier.is_default && (
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <DossierDelete dossierId={dossier.id} dossierNom={dossier.nom} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
