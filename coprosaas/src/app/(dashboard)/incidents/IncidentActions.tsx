// ============================================================
// Client Component : création d'un incident ou de travaux planifiés
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import type { NatureIncident } from '@/types';

interface Copropriete { id: string; nom: string; }

interface IncidentActionsProps {
  coproprietes: Copropriete[];
  showLabel?: boolean;
}

const INITIAL_FORM = {
  nature: 'incident' as NatureIncident,
  titre: '',
  description: '',
  priorite: 'moyenne',
  type_incident: 'autre',
  localisation: '',
  date_intervention_prevue: '',
};

export default function IncidentActions({ coproprietes, showLabel }: IncidentActionsProps) {
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState(INITIAL_FORM);

  const isTravaux = form.nature === 'travaux';
  const modalTitle = isTravaux ? 'Ajouter des travaux planifiés' : 'Signaler un incident';
  const submitLabel = isTravaux ? 'Ajouter les travaux' : 'Signaler';

  const handle = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;

    setForm((previous) => {
      if (name === 'nature') {
        const nextNature = value as NatureIncident;
        return {
          ...previous,
          nature: nextNature,
          priorite: nextNature === 'travaux'
            ? 'faible'
            : previous.priorite === 'faible'
              ? 'moyenne'
              : previous.priorite,
        };
      }

      return { ...previous, [name]: value };
    });
  };

  const closeModal = () => {
    setIsOpen(false);
    setError('');
    setForm(INITIAL_FORM);
  };

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          copropriete_id: coproprietes[0]?.id ?? '',
          titre: form.titre.trim(),
          description: form.description.trim(),
          nature: form.nature,
          priorite: form.priorite,
          type_incident: form.type_incident,
          localisation: form.localisation.trim() || null,
          date_intervention_prevue: form.date_intervention_prevue || null,
        }),
      });

      const json = await res.json().catch(() => ({})) as { error?: string };
      if (!res.ok) {
        setError(json.error ?? 'Erreur lors de la création du suivi.');
        setLoading(false);
        return;
      }

      setLoading(false);
      closeModal();
      toast.success(isTravaux ? 'Travaux ajoutés.' : 'Incident signalé.');
      router.replace('/incidents');
    } catch {
      setError('Une erreur réseau est survenue. Réessayez.');
      setLoading(false);
    }
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <Plus size={16} /> {showLabel ? 'Ajouter un incident / travaux' : 'Ajouter'}
      </Button>

      <Modal isOpen={isOpen} onClose={closeModal} title={modalTitle} size="lg">
        <form onSubmit={handleCreate} className="space-y-3">
          <Select
            label="Nature"
            name="nature"
            value={form.nature}
            onChange={handle}
            options={[
              { value: 'incident', label: 'Incident imprévu / urgent' },
              { value: 'travaux', label: 'Travaux planifiés / votés en AG' },
            ]}
          />

          <div className={`rounded-xl border px-3 py-2 text-sm ${isTravaux ? 'border-blue-200 bg-blue-50 text-blue-800' : 'border-red-200 bg-red-50 text-red-800'}`}>
            {isTravaux
              ? 'Travaux = opération prévue à l’avance, souvent votée en AG, avec devis et date d’intervention planifiée.'
              : 'Incident = imprévu à traiter rapidement : dégât des eaux, panne, problème de sécurité, etc.'}
          </div>

          <Input
            label="Titre"
            name="titre"
            value={form.titre}
            onChange={handle}
            placeholder={isTravaux ? 'Réfection de la toiture' : "Fuite d'eau dans le couloir du 2ème"}
            required
          />

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Select
              label="Type"
              name="type_incident"
              value={form.type_incident}
              onChange={handle}
              options={[
                { value: 'plomberie', label: 'Plomberie' },
                { value: 'electricite', label: 'Électricité' },
                { value: 'parties_communes', label: 'Parties communes' },
                { value: 'ascenseur', label: 'Ascenseur' },
                { value: 'toiture', label: 'Toiture' },
                { value: 'securite', label: 'Sécurité' },
                { value: 'espaces_verts', label: 'Espaces verts' },
                { value: 'autre', label: 'Autre' },
              ]}
            />
            <Select
              label="Priorité"
              name="priorite"
              value={form.priorite}
              onChange={handle}
              options={[
                { value: 'faible', label: 'Faible' },
                { value: 'moyenne', label: 'Moyenne' },
                { value: 'haute', label: 'Haute' },
                { value: 'urgente', label: '🚨 Urgente' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Localisation (optionnel)"
              name="localisation"
              value={form.localisation}
              onChange={handle}
              placeholder={isTravaux ? 'Ex : Façade côté rue' : 'Ex : Cage A, 2ème étage'}
            />
            {isTravaux && (
              <Input
                label="Date d’intervention prévue (optionnel)"
                name="date_intervention_prevue"
                type="date"
                value={form.date_intervention_prevue}
                onChange={handle}
              />
            )}
          </div>

          <Textarea
            label="Description"
            name="description"
            value={form.description}
            onChange={handle}
            placeholder={isTravaux ? 'Décrivez les travaux, le contexte AG, les entreprises envisagées…' : "Décrivez l'incident, les dommages constatés..."}
            rows={3}
          />

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>{submitLabel}</Button>
            <Button type="button" variant="secondary" onClick={closeModal}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
