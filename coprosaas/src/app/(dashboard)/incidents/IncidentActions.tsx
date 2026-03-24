// ============================================================
// Client Component : CrÃ©ation + transitions de statut d'incident
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
import { Plus } from 'lucide-react';
import type { StatutIncident } from '@/types';

interface Copropriete { id: string; nom: string; }

interface IncidentActionsProps {
  coproprietes: Copropriete[];
  showLabel?: boolean;
}

export default function IncidentActions({ coproprietes, showLabel }: IncidentActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    titre: '',
    description: '',
    priorite: 'moyenne',
    type_incident: 'autre',
    localisation: '',
  });

  const handle = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: dbErr } = await supabase.from('incidents').insert({
      copropriete_id: coproprietes[0]?.id ?? '',
      titre: form.titre.trim(),
      description: form.description.trim(),
      priorite: form.priorite,
      type_incident: form.type_incident,
      localisation: form.localisation.trim() || null,
      statut: 'ouvert' as StatutIncident,
      declare_par: user.id,
      date_declaration: new Date().toISOString(),
    });

    if (dbErr) { setError('Erreur : ' + dbErr.message); setLoading(false); return; }
    setIsOpen(false);
    setForm({ titre: '', description: '', priorite: 'moyenne', type_incident: 'autre', localisation: '' });
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Signaler un incident' : 'Signaler'}
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Signaler un incident" size="lg">
        <form onSubmit={handleCreate} className="space-y-3">
          <Input
            label="Titre"
            name="titre"
            value={form.titre}
            onChange={handle}
            placeholder="Fuite d'eau dans le couloir du 2Ã¨me"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Type"
              name="type_incident"
              value={form.type_incident}
              onChange={handle}
              options={[
                { value: 'plomberie', label: 'Plomberie' },
                { value: 'electricite', label: 'Ã‰lectricitÃ©' },
                { value: 'parties_communes', label: 'Parties communes' },
                { value: 'ascenseur', label: 'Ascenseur' },
                { value: 'toiture', label: 'Toiture' },
                { value: 'securite', label: 'SÃ©curitÃ©' },
                { value: 'espaces_verts', label: 'Espaces verts' },
                { value: 'autre', label: 'Autre' },
              ]}
            />
            <Select
              label="PrioritÃ©"
              name="priorite"
              value={form.priorite}
              onChange={handle}
              options={[
                { value: 'faible', label: 'Faible' },
                { value: 'moyenne', label: 'Moyenne' },
                { value: 'haute', label: 'Haute' },
                { value: 'urgente', label: 'ðŸš¨ Urgente' },
              ]}
            />
          </div>

          <Input
            label="Localisation (optionnel)"
            name="localisation"
            value={form.localisation}
            onChange={handle}
            placeholder="Ex : Cage A, 2Ã¨me Ã©tage"
          />

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handle}
            placeholder="DÃ©crivez l'incident, les dommages constatÃ©s..."
            rows={2}
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
