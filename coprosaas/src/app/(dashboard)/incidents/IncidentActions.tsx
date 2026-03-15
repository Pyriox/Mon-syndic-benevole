// ============================================================
// Client Component : Formulaire d'ajout/mise à jour d'incident
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { Plus, RefreshCw } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

interface Incident {
  id: string;
  statut: string;
  titre?: string;
}

interface IncidentActionsProps {
  coproprietes: Copropriete[];
  showLabel?: boolean;
  mode?: 'create' | 'update';  // "create" = formulaire complet, "update" = juste le statut
  incident?: Incident;
}

export default function IncidentActions({
  coproprietes,
  showLabel,
  mode = 'create',
  incident,
}: IncidentActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    titre: '',
    description: '',
    priorite: 'moyenne',
    statut: incident?.statut ?? 'ouvert',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // ---- Création d'un nouvel incident ----
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: dbError } = await supabase.from('incidents').insert({
      copropriete_id: formData.copropriete_id,
      titre: formData.titre.trim(),
      description: formData.description.trim(),
      priorite: formData.priorite,
      statut: 'ouvert',
      declare_par: user.id,
      date_declaration: new Date().toISOString(),
    });

    if (dbError) {
      setError('Erreur : ' + dbError.message);
      setLoading(false);
      return;
    }

    setIsOpen(false);
    router.refresh();
  };

  // ---- Mise à jour du statut d'un incident existant ----
  const handleUpdateStatut = async (newStatut: string) => {
    if (!incident) return;
    setLoading(true);

    const updates: Record<string, unknown> = { statut: newStatut };
    if (newStatut === 'resolu') {
      updates.date_resolution = new Date().toISOString();
    }

    await supabase.from('incidents').update(updates).eq('id', incident.id);

    router.refresh();
    setLoading(false);
  };

  // ---- Mode de mise à jour du statut (boutons rapides) ----
  if (mode === 'update' && incident) {
    return (
      <div className="flex items-center gap-1 ml-3 shrink-0">
        {incident.statut === 'ouvert' && (
          <Button
            size="sm"
            variant="secondary"
            loading={loading}
            onClick={() => handleUpdateStatut('en_cours')}
          >
            <RefreshCw size={12} /> En cours
          </Button>
        )}
        {incident.statut !== 'resolu' && (
          <Button
            size="sm"
            variant="success"
            loading={loading}
            onClick={() => handleUpdateStatut('resolu')}
          >
            Résolu
          </Button>
        )}
      </div>
    );
  }

  // ---- Mode de création ----
  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Signaler un incident' : 'Signaler'}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Signaler un incident" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Titre de l'incident"
            name="titre"
            value={formData.titre}
            onChange={handleChange}
            placeholder="Fuite d'eau dans le couloir du 2ème"
            required
          />

          <Textarea
            label="Description détaillée"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Décrivez l'incident, sa localisation précise, les dommages constatés..."
            required
            rows={4}
          />

          <Select
            label="Priorité"
            name="priorite"
            value={formData.priorite}
            onChange={handleChange}
            options={[
              { value: 'faible', label: 'Faible — Peut attendre' },
              { value: 'moyenne', label: 'Moyenne — À traiter prochainement' },
              { value: 'haute', label: 'Haute — Traiter rapidement' },
              { value: 'urgente', label: '🚨 Urgente — Traiter immédiatement' },
            ]}
            required
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Signaler</Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
