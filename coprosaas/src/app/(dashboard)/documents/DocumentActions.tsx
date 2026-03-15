// ============================================================
// Client Component : Upload de document vers Supabase Storage
// ============================================================
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { LABELS_TYPE_DOCUMENT } from '@/lib/utils';
import { Upload, Pencil } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

interface Dossier {
  id: string;
  nom: string;
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

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    dossier_id: defaultDossierId ?? dossiers[0]?.id ?? '',
    nom: '',
    type: 'autre',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      // Pré-remplir le nom avec le nom du fichier (sans extension)
      if (!formData.nom) {
        setFormData((prev) => ({ ...prev, nom: file.name.replace(/\.[^.]+$/, '') }));
      }
    }
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

    setIsOpen(false);
    setSelectedFile(null);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', dossier_id: defaultDossierId ?? dossiers[0]?.id ?? '', nom: '', type: 'autre' });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Upload size={16} /> {showLabel ? 'Importer un document' : 'Importer'}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Importer un document">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Dossier"
            name="dossier_id"
            value={formData.dossier_id}
            onChange={handleChange}
            options={dossiers.map((d) => ({ value: d.id, label: d.nom }))}
          />

          {/* Zone de sélection de fichier */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Fichier <span className="text-red-500">*</span>
            </label>
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer
                         hover:border-blue-400 hover:bg-blue-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div>
                  <p className="text-sm font-medium text-gray-800">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400">
                    {(selectedFile.size / 1024).toFixed(1)} Ko
                  </p>
                </div>
              ) : (
                <div>
                  <Upload size={24} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-500">Cliquez pour sélectionner un fichier</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, images, Word... (max 10 Mo)</p>
                </div>
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

          <Select
            label="Type de document"
            name="type"
            value={formData.type}
            onChange={handleChange}
            options={Object.entries(LABELS_TYPE_DOCUMENT).map(([v, l]) => ({ value: v, label: l }))}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>
              <Upload size={14} /> Importer
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
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
