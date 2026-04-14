'use client';

// Explorateur Supabase Storage : liste et suppression des fichiers d'une copropriété
import { useState, useEffect, useCallback } from 'react';
import { Loader2, FileText, Trash2, Download, RefreshCw } from 'lucide-react';
import { AdminConfirmDialog } from '../AdminActionDialog';

interface StorageFile {
  name: string;
  path: string;
  size: number | null;
  created_at: string | null;
  publicUrl: string;
}

interface Props {
  coproId: string;
}

function fmtSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminStorageExplorer({ coproId }: Props) {
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<StorageFile | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadFiles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/storage?coproId=${encodeURIComponent(coproId)}`);
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
      const data = await res.json() as { files: StorageFile[] };
      setFiles(data.files);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, [coproId]);

  useEffect(() => { void loadFiles(); }, [loadFiles]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/storage?path=${encodeURIComponent(deleteTarget.path)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Erreur');
      setFiles((prev) => prev.filter((f) => f.path !== deleteTarget.path));
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-400 py-6">
        <Loader2 size={14} className="animate-spin" /> Chargement des fichiers…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-xs text-gray-500">{files.length} fichier{files.length !== 1 ? 's' : ''} · bucket <code className="font-mono">documents/{coproId}</code></p>
        <button
          onClick={() => void loadFiles()}
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 border border-gray-200 bg-white rounded-lg px-3 py-1.5"
        >
          <RefreshCw size={12} /> Rafraîchir
        </button>
      </div>

      {files.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-200 px-6 py-8 text-center text-sm text-gray-400">
          Aucun fichier dans le Storage pour cette copropriété.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Taille</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide hidden md:table-cell">Ajouté le</th>
                <th className="px-4 py-2.5 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {files.map((file) => (
                <tr key={file.path} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText size={14} className="text-gray-400 shrink-0" />
                      <span className="truncate text-gray-800 font-medium">{file.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{fmtSize(file.size)}</td>
                  <td className="px-4 py-3 text-xs text-gray-500 hidden md:table-cell">{fmtDate(file.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={file.publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600 hover:bg-gray-50 transition-colors"
                        title="Télécharger"
                      >
                        <Download size={11} />
                      </a>
                      <button
                        onClick={() => setDeleteTarget(file)}
                        className="inline-flex items-center rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <AdminConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Supprimer le fichier"
        tone="danger"
        description={<p>Supprimer définitivement <strong>{deleteTarget?.name}</strong> ? Cette action est irréversible.</p>}
        confirmLabel="Supprimer"
        onConfirm={handleDelete}
        isLoading={deleting}
      />
    </>
  );
}
