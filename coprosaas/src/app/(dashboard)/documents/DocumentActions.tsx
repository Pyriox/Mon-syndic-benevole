// ============================================================
// Client Component : Upload de document — UX Drive
// Drag & drop, icône par type de fichier, progression
// ============================================================
'use client';

import { useState, useRef, useCallback, Fragment } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';

import {
  Upload, Pencil, File, FileText, FileSpreadsheet, Image as ImageIcon,
  X, CheckCircle2, CloudUpload, MoreVertical, Eye, Download, FolderInput, Trash2, AlertTriangle,
  Folder, ChevronRight,
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

export default function DocumentActions({ coproprietes, defaultDossierId, showLabel }: Omit<DocumentActionsProps, 'dossiers'> & { dossiers?: Dossier[] }) {
  const router   = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // ── State ────────────────────────────────────────────────
  const [isOpen,     setIsOpen]     = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [done,       setDone]       = useState(false);
  const [error,      setError]      = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [file,       setFile]       = useState<File | null>(null);
  const [form, setForm] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    nom: '',
  });

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

  const handleClose = () => {
    if (loading) return;
    setIsOpen(false);
    setFile(null);
    setDone(false);
    setError('');
    setIsDragging(false);
    setForm({ copropriete_id: coproprietes[0]?.id ?? '', nom: '' });
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
    fd.append('type', 'autre');
    if (defaultDossierId) fd.append('dossier_id', defaultDossierId);

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

// ── Composant sélecteur de dossier style Drive ───────────────────
function FolderPicker({
  dossiers,
  value,
  onChange,
}: {
  dossiers: { id: string; nom: string; parent_id?: string | null }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [browserId, setBrowserId] = useState<string | null>(null);

  const childrenOf = (pid: string | null) =>
    dossiers.filter((d) => (d.parent_id ?? null) === pid);
  const hasChildren = (id: string) =>
    dossiers.some((d) => d.parent_id === id);

  const buildCrumbs = (id: string | null): { id: string; nom: string }[] => {
    if (!id) return [];
    const map = new Map(dossiers.map((d) => [d.id, d]));
    const chain: { id: string; nom: string }[] = [];
    let cur = map.get(id);
    while (cur) {
      chain.unshift({ id: cur.id, nom: cur.nom });
      cur = cur.parent_id ? map.get(cur.parent_id) : undefined;
    }
    return chain;
  };

  const crumbs = buildCrumbs(browserId);
  const current = childrenOf(browserId);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 text-xs flex-wrap min-h-[36px]">
        <button
          type="button"
          onClick={() => setBrowserId(null)}
          className={`font-medium transition-colors ${
            browserId === null ? 'text-blue-700' : 'text-gray-600 hover:text-blue-600'
          }`}
        >
          Tous les dossiers
        </button>
        {crumbs.map((c) => (
          <Fragment key={c.id}>
            <ChevronRight size={11} className="text-gray-400 shrink-0" />
            <button
              type="button"
              onClick={() => setBrowserId(c.id)}
              className={`font-medium transition-colors ${
                browserId === c.id ? 'text-blue-700' : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              {c.nom}
            </button>
          </Fragment>
        ))}
      </div>

      {/* Liste de dossiers */}
      <div className="max-h-52 overflow-y-auto divide-y divide-gray-50">
        {current.length === 0 ? (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">Aucun sous-dossier</p>
        ) : (
          current.map((d) => {
            const isLeaf = !hasChildren(d.id);
            const isSelected = value === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => {
                  if (isLeaf) {
                    onChange(d.id);
                  } else {
                    setBrowserId(d.id);
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-blue-50 text-blue-700'
                    : 'hover:bg-gray-50 text-gray-800'
                }`}
              >
                <Folder
                  size={16}
                  className={`shrink-0 ${
                    isSelected ? 'text-blue-500' : isLeaf ? 'text-amber-500' : 'text-blue-500'
                  }`}
                />
                <span className="flex-1 font-medium truncate">{d.nom}</span>
                {isSelected && <CheckCircle2 size={14} className="text-blue-500 shrink-0" />}
                {!isLeaf && !isSelected && <ChevronRight size={14} className="text-gray-400 shrink-0" />}
              </button>
            );
          })
        )}
      </div>

      {/* Destination sélectionnée */}
      {value && (
        <div className="px-4 py-2 bg-blue-50 border-t border-blue-100 text-xs text-blue-700 flex items-center gap-1.5">
          <CheckCircle2 size={12} className="shrink-0" />
          <span>Destination : <strong>{dossiers.find((d) => d.id === value)?.nom}</strong></span>
        </div>
      )}
    </div>
  );
}

// ── Menu actions document (inline buttons) ────────────────────────
export function DocumentMenu({
  doc,
  dossiers,
}: {
  doc: { id: string; nom: string };
  dossiers: { id: string; nom: string; parent_id?: string | null }[];
}) {
  const router   = useRouter();
  const supabase = createClient();

  const [action,   setAction]   = useState<'rename' | 'move' | 'delete' | null>(null);
  const [nom,      setNom]      = useState(doc.nom);
  const [targetId, setTargetId] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  const open  = (a: typeof action) => { setAction(a); setError(''); };
  const close = () => { setAction(null); setError(''); setLoading(false); setNom(doc.nom); };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;
    setLoading(true);
    const { error: err } = await supabase.from('documents').update({ nom: nom.trim() }).eq('id', doc.id);
    if (err) { setError(err.message); setLoading(false); return; }
    close(); router.refresh();
  };

  const handleMove = async () => {
    if (!targetId) return;
    setLoading(true);
    const { error: err } = await supabase.from('documents').update({ dossier_id: targetId }).eq('id', doc.id);
    if (err) { setError(err.message); setLoading(false); return; }
    close(); router.refresh();
  };

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from('documents').delete().eq('id', doc.id);
    close(); router.refresh();
  };

  const btnCls = 'p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors';

  return (
    <>
      <div className="flex items-center gap-0.5">
        <a
          href={`/api/documents/${doc.id}/download`}
          target="_blank"
          rel="noopener noreferrer"
          className={`${btnCls} hover:text-blue-600`}
          title="Voir"
        >
          <Eye size={14} />
        </a>
        <a
          href={`/api/documents/${doc.id}/download`}
          download={doc.nom}
          className={`${btnCls} hover:text-green-600`}
          title="Télécharger"
        >
          <Download size={14} />
        </a>
        <button type="button" onClick={() => open('rename')} className={`${btnCls} hover:text-blue-600`} title="Renommer">
          <Pencil size={14} />
        </button>
        <button type="button" onClick={() => open('move')} className={`${btnCls} hover:text-amber-600`} title="Déplacer">
          <FolderInput size={14} />
        </button>
        <button type="button" onClick={() => open('delete')} className={`${btnCls} hover:text-red-600`} title="Supprimer">
          <Trash2 size={14} />
        </button>
      </div>

      {/* Modal Renommer */}
      <Modal isOpen={action === 'rename'} onClose={close} title="Renommer le document">
        <form onSubmit={handleRename} className="space-y-4">
          <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required autoFocus />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
          </div>
        </form>
      </Modal>

      {/* Modal Déplacer */}
      <Modal isOpen={action === 'move'} onClose={close} title="Déplacer le document">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Choisissez le dossier de destination pour{' '}
            <strong>&ldquo;{doc.nom}&rdquo;</strong>.
          </p>
          <FolderPicker dossiers={dossiers} value={targetId} onChange={setTargetId} />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button onClick={handleMove} loading={loading} disabled={!targetId}>Déplacer ici</Button>
            <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
          </div>
        </div>
      </Modal>

      {/* Modal Supprimer */}
      <Modal isOpen={action === 'delete'} onClose={close} title="Supprimer le document">
        <div className="space-y-4">
          <div className="flex gap-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <p className="text-sm">La suppression est <strong>définitive</strong>. Le fichier sera retiré de la GED.</p>
          </div>
          <p className="text-sm text-gray-700">Supprimer <strong>&ldquo;{doc.nom}&rdquo;</strong> ?</p>
          <div className="flex gap-3 pt-1">
            <Button onClick={handleDelete} loading={loading} className="bg-red-600 hover:bg-red-700 text-white border-red-600">Supprimer</Button>
            <Button type="button" variant="secondary" onClick={close}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
