// ============================================================
// Client Component : Upload de document — UX Drive
// Drag & drop, icône par type de fichier, progression
// ============================================================
'use client';

import { useState, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { LABELS_TYPE_DOCUMENT } from '@/lib/utils';
import {
  Upload, Pencil, File, FileText, FileSpreadsheet, Image as ImageIcon,
  X, CheckCircle2, CloudUpload,
} from 'lucide-react';

interface Copropriete { id: string; nom: string }
interface Dossier { id: string; nom: string; parent_id?: string | null }

interface DocumentActionsProps {
  coproprietes: Copropriete[];
  dossiers: Dossier[];
  defaultDossierId?: string;
  showLabel?: boolean;
}

// ── Icône + couleur selon l'extension ───────────────────────
function fileVisual(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  if (ext === 'pdf')
    return { Icon: FileText,        color: 'text-red-500',    bg: 'bg-red-50',    label: 'PDF' };
  if (['doc', 'docx'].includes(ext))
    return { Icon: FileText,        color: 'text-blue-600',   bg: 'bg-blue-50',   label: 'Word' };
  if (['xls', 'xlsx'].includes(ext))
    return { Icon: FileSpreadsheet, color: 'text-green-600',  bg: 'bg-green-50',  label: 'Excel' };
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext))
    return { Icon: ImageIcon,       color: 'text-purple-500', bg: 'bg-purple-50', label: 'Image' };
  return   { Icon: File,            color: 'text-gray-500',   bg: 'bg-gray-100',  label: 'Fichier' };
}

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / 1048576).toFixed(1)} Mo`;
};

export default function DocumentActions({ coproprietes, dossiers, defaultDossierId, showLabel }: DocumentActionsProps) {
  const router    = useRouter();
  const inputRef  = useRef<HTMLInputElement>(null);

  // ── Hiérarchie de dossiers ───────────────────────────────
  const rootDossiers = useMemo(() => dossiers.filter((d) => !d.parent_id), [dossiers]);
  const subsByParent = useMemo(() => {
    const map = new Map<string, Dossier[]>();
    for (const d of dossiers) {
      if (d.parent_id) {
        const arr = map.get(d.parent_id) ?? [];
        arr.push(d);
        map.set(d.parent_id, arr);
      }
    }
    return map;
  }, [dossiers]);

  const { initRootId, initDossierId } = useMemo(() => {
    if (defaultDossierId) {
      const d = dossiers.find((dd) => dd.id === defaultDossierId);
      if (d?.parent_id) return { initRootId: d.parent_id, initDossierId: defaultDossierId };
      if (d) {
        const subs = subsByParent.get(d.id) ?? [];
        return { initRootId: d.id, initDossierId: subs[0]?.id ?? d.id };
      }
    }
    const firstRoot = rootDossiers[0];
    const subs = firstRoot ? (subsByParent.get(firstRoot.id) ?? []) : [];
    return { initRootId: firstRoot?.id ?? '', initDossierId: subs[0]?.id ?? firstRoot?.id ?? '' };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── State ────────────────────────────────────────────────
  const [isOpen,       setIsOpen]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [done,         setDone]         = useState(false);
  const [error,        setError]        = useState('');
  const [isDragging,   setIsDragging]   = useState(false);
  const [file,         setFile]         = useState<File | null>(null);
  const [selectedRoot, setSelectedRoot] = useState(initRootId);
  const [form, setForm] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    dossier_id: initDossierId,
    nom: '',
    type: 'autre',
  });

  const currentSubs = subsByParent.get(selectedRoot) ?? [];

  // ── Handlers ─────────────────────────────────────────────
  const pickFile = useCallback((f: File) => {
    setFile(f);
    setForm((prev) => ({ ...prev, nom: prev.nom || f.name.replace(/\.[^.]+$/, '') }));
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) pickFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) pickFile(f);
  };

  const handleRootChange = (rootId: string) => {
    setSelectedRoot(rootId);
    const subs = subsByParent.get(rootId) ?? [];
    setForm((prev) => ({ ...prev, dossier_id: subs[0]?.id ?? rootId }));
  };

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setFile(null);
    setDone(false);
    setError('');
    setIsDragging(false);
    setSelectedRoot(initRootId);
    setForm({ copropriete_id: coproprietes[0]?.id ?? '', dossier_id: initDossierId, nom: '', type: 'autre' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError('');

    const fd = new FormData();
    fd.append('file', file);
    fd.append('copropriete_id', form.copropriete_id);
    fd.append('nom', form.nom.trim());
    fd.append('type', form.type);
    if (form.dossier_id) fd.append('dossier_id', form.dossier_id);

    const res = await fetch('/api/upload-document', { method: 'POST', body: fd });
    const json = await res.json();

    if (!res.ok) { setError(json.error ?? 'Erreur lors de l\'import'); setLoading(false); return; }

    setLoading(false);
    setDone(true);
    // Ferme après un bref flash de succès
    setTimeout(() => { handleClose(); router.refresh(); }, 900);
  };

  const visual = file ? fileVisual(file.name) : null;

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Upload size={16} /> {showLabel ? 'Importer un document' : 'Importer'}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Importer un document" size="lg">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">

          {/* ── Zone drag & drop / aperçu fichier ── */}
          {!file ? (
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3
                rounded-xl border-2 border-dashed cursor-pointer
                py-12 px-6 transition-all select-none
                ${isDragging
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40'}
              `}
            >
              <div className={`rounded-full p-4 transition-colors ${isDragging ? 'bg-blue-100' : 'bg-white shadow-sm border border-gray-100'}`}>
                <CloudUpload size={32} className={isDragging ? 'text-blue-500' : 'text-gray-400'} />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700">
                  {isDragging ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier'}
                </p>
                <p className="text-sm text-gray-400 mt-0.5">ou <span className="text-blue-600 underline underline-offset-2">cliquez pour parcourir</span></p>
                <p className="text-xs text-gray-400 mt-2">PDF, Word, Excel, images — max 10 Mo</p>
              </div>
              <input ref={inputRef} type="file" className="hidden" onChange={handleInput}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif" />
            </div>
          ) : (
            /* ── Carte fichier sélectionné ── */
            <div className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <div className={`shrink-0 rounded-xl p-3 ${visual?.bg}`}>
                {visual && <visual.Icon size={28} className={visual.color} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{file.name}</p>
                <p className="text-sm text-gray-400">{visual?.label} · {formatSize(file.size)}</p>
              </div>
              {!loading && !done && (
                <button type="button" onClick={() => { setFile(null); setForm((p) => ({ ...p, nom: '' })); }}
                  className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                  <X size={16} />
                </button>
              )}
              {done && <CheckCircle2 size={22} className="text-green-500 shrink-0" />}
            </div>
          )}

          {/* ── Champs de configuration (visibles dès qu'un fichier est choisi) ── */}
          {file && !done && (
            <>
              <Input
                label="Nom du document"
                name="nom"
                value={form.nom}
                onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))}
                placeholder="PV AG 2024"
                required
              />

              {/* Dossier — uniquement depuis la vue racine */}
              {!defaultDossierId && (
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1.5">Dossier</label>
                  <div className="flex flex-wrap gap-1.5">
                    {rootDossiers.map((d) => (
                      <button key={d.id} type="button" onClick={() => handleRootChange(d.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          selectedRoot === d.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}>
                        {d.nom}
                      </button>
                    ))}
                  </div>
                  {currentSubs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2 pl-3 border-l-2 border-blue-100">
                      {currentSubs.map((sub) => (
                        <button key={sub.id} type="button"
                          onClick={() => setForm((p) => ({ ...p, dossier_id: sub.id }))}
                          className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                            form.dossier_id === sub.id
                              ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                              : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                          }`}>
                          {sub.nom}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Type de document */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Catégorie</label>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(LABELS_TYPE_DOCUMENT).map(([v, l]) => (
                    <button key={v} type="button" onClick={() => setForm((p) => ({ ...p, type: v }))}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        form.type === v
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}>
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3">
                <Button type="submit" loading={loading}>
                  <Upload size={14} /> Importer
                </Button>
                <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
              </div>
            </>
          )}

        </form>
      </Modal>
    </>
  );
}

// ── Renommer un document ───────────────────────────────────────────────────────
export function DocumentRename({ documentId, nomActuel }: { documentId: string; nomActuel: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState(nomActuel);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setLoading(true);
    setError('');

    const { error: dbError } = await supabase
      .from('documents')
      .update({ nom: nom.trim() })
      .eq('id', documentId);

    if (dbError) {
      setError('Erreur : ' + dbError.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => { setNom(nomActuel); setIsOpen(true); }}
        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
        title="Renommer"
      >
        <Pencil size={15} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Renommer le document">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom du document"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
