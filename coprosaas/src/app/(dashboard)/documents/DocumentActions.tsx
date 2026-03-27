// ============================================================
// Client Component : Upload de document vers Supabase Storage
// ============================================================
'use client';

import { useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import { LABELS_TYPE_DOCUMENT } from '@/lib/utils';
import { Upload, Pencil } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

interface Dossier {
  id: string;
  nom: string;
  parent_id?: string | null;
}

interface DocumentActionsProps {
  coproprietes: Copropriete[];
  dossiers: Dossier[];
  defaultDossierId?: string;
  showLabel?: boolean;
}

export default function DocumentActions({ coproprietes, dossiers, defaultDossierId, showLabel }: DocumentActionsProps) {
  const router = useRouter();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Hiérarchie de dossiers ────────────────────────────────────
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

  // Calcule l'état initial (dossier racine sélectionné + dossier cible)
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

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedRootId, setSelectedRootId] = useState(initRootId);

  const [formData, setFormData] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    dossier_id: initDossierId,
    nom: '',
    type: 'autre',
  });

  // Sous-dossiers du dossier racine actuellement sélectionné
  const currentSubs = subsByParent.get(selectedRootId) ?? [];

  const handleRootChange = (rootId: string) => {
    setSelectedRootId(rootId);
    const subs = subsByParent.get(rootId) ?? [];
    setFormData((prev) => ({ ...prev, dossier_id: subs[0]?.id ?? rootId }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!formData.nom) {
        setFormData((prev) => ({ ...prev, nom: file.name.replace(/\.[^.]+$/, '') }));
      }
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setSelectedFile(null);
    setError('');
    setSelectedRootId(initRootId);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', dossier_id: initDossierId, nom: '', type: 'autre' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Veuillez sélectionner un fichier.');
      return;
    }

    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Génération d'un nom de fichier unique pour éviter les conflits
    const fileExt = selectedFile.name.split('.').pop();
    const fileName = `${formData.copropriete_id}/${Date.now()}-${formData.nom.replace(/\s+/g, '-')}.${fileExt}`;

    // Upload vers Supabase Storage (bucket "documents")
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, selectedFile, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      setError('Erreur d\'upload : ' + uploadError.message);
      setLoading(false);
      return;
    }

    // Récupération de l'URL publique du fichier
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(uploadData.path);

    // Enregistrement en base de données
    const { error: dbError } = await supabase.from('documents').insert({
      copropriete_id: formData.copropriete_id,
      dossier_id: formData.dossier_id || null,
      nom: formData.nom.trim(),
      type: formData.type,
      url: publicUrl,
      taille: selectedFile.size,
      uploaded_by: user.id,
    });

    if (dbError) {
      setError('Erreur d\'enregistrement : ' + dbError.message);
      setLoading(false);
      return;
    }

    handleClose();
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Upload size={16} /> {showLabel ? 'Importer un document' : 'Importer'}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Importer un document">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Zone de sélection de fichier */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Fichier <span className="text-red-500">*</span>
            </label>
            <div
              className="border border-dashed border-gray-300 rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={16} className="text-gray-400 shrink-0" />
              {selectedFile ? (
                <span className="text-sm text-gray-700">
                  {selectedFile.name}{' '}
                  <span className="text-gray-400">({(selectedFile.size / 1024).toFixed(1)} Ko)</span>
                </span>
              ) : (
                <span className="text-sm text-gray-400">PDF, images, Word… (max 10 Mo) — cliquez pour sélectionner</span>
              )}
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif"
              />
            </div>
          </div>

          <Input
            label="Nom du document"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="PV AG 2024"
            required
          />

          {/* Sélection du dossier — uniquement depuis la vue racine */}
          {!defaultDossierId && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Dossier</label>
              {/* Niveau 1 : dossiers racine */}
              <div className="flex flex-wrap gap-1.5">
                {rootDossiers.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => handleRootChange(d.id)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      selectedRootId === d.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {d.nom}
                  </button>
                ))}
              </div>
              {/* Niveau 2 : sous-dossiers du dossier racine sélectionné */}
              {currentSubs.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2 pl-2 border-l-2 border-blue-100">
                  {currentSubs.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, dossier_id: sub.id }))}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        formData.dossier_id === sub.id
                          ? 'bg-blue-100 text-blue-700 ring-1 ring-blue-300'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {sub.nom}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Type de document — pill buttons */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">Type de document</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(LABELS_TYPE_DOCUMENT).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: v }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    formData.type === v
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>
              <Upload size={14} /> Importer
            </Button>
            <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
          </div>
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
