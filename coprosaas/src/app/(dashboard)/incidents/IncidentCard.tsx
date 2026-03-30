// ============================================================
// Composant IncidentCard
// Fiche incident expandable avec transitions de statut & journal
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Modal from '@/components/ui/Modal';
import {
  ChevronDown, ChevronUp, Trash2, MapPin, User, Phone,
  Calendar, Euro, FileText, Plus, RotateCcw, Camera,
} from 'lucide-react';
import {
  formatDate, formatEuros,
  LABELS_STATUT_INCIDENT, LABELS_TYPE_INCIDENT, LABELS_PRIORITE,
  cn,
} from '@/lib/utils';
import type { Incident, StatutIncident } from '@/types';

// -----------------------------------------------------------
// Helpers
// -----------------------------------------------------------
type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

function variantStatut(statut: StatutIncident): BadgeVariant {
  const map: Record<StatutIncident, BadgeVariant> = {
    ouvert:        'danger',
    devis_demande: 'warning',
    devis_recu:    'purple',
    en_cours:      'info',
    resolu:        'success',
  };
  return map[statut];
}

function variantPriorite(p: string): BadgeVariant {
  if (p === 'faible')  return 'info';
  if (p === 'moyenne') return 'default';
  if (p === 'haute')   return 'warning';
  return 'danger'; // urgente
}

interface Note { date: string; texte: string; }

function parseNotes(raw: string | null): Note[] {
  if (!raw) return [];
  try { return JSON.parse(raw) as Note[]; } catch { return []; }
}

// -----------------------------------------------------------
// Sous-composant : panneau de transition de statut
// -----------------------------------------------------------
interface TransitionData {
  montant_devis: string;
  artisan_nom: string;
  artisan_contact: string;
  date_intervention_prevue: string;
  montant_final: string;
}

interface TransitionPanelProps {
  incident: Incident;
  data: TransitionData;
  setData: React.Dispatch<React.SetStateAction<TransitionData>>;
  onTransition: (statut: StatutIncident, extra?: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}

function TransitionPanel({ incident, data, setData, onTransition, loading }: TransitionPanelProps) {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) =>
    setData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  if (incident.statut === 'ouvert') {
    return (
      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Prochaines étapes</p>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" onClick={() => onTransition('devis_demande')} loading={loading}>
            Demander un devis
          </Button>
          <Button size="sm" variant="secondary" onClick={() => onTransition('resolu')} loading={loading}>
            Résoudre directement
          </Button>
        </div>
      </div>
    );
  }

  if (incident.statut === 'devis_demande') {
    return (
      <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3 space-y-3">
        <p className="text-xs font-medium text-yellow-700 uppercase tracking-wide">Devis reçu ?</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Montant du devis (€)"
              name="montant_devis"
              type="number"
              min="0"
              step="0.01"
              value={data.montant_devis}
              onChange={handle}
              placeholder="Ex : 450"
            />
          </div>
          <div className="pb-0.5">
            <Button
              size="sm"
              onClick={() => onTransition('devis_recu', {
                montant_devis: data.montant_devis ? parseFloat(data.montant_devis) : null,
              })}
              loading={loading}
            >
              Marquer reçu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (incident.statut === 'devis_recu') {
    return (
      <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 space-y-3">
        <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Lancer les travaux</p>
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Artisan"
            name="artisan_nom"
            value={data.artisan_nom}
            onChange={handle}
            placeholder="Entreprise Dupont"
          />
          <Input
            label="Contact artisan"
            name="artisan_contact"
            value={data.artisan_contact}
            onChange={handle}
            placeholder="06 00 00 00 00"
          />
        </div>
        <Input
          label="Date d'intervention prévue"
          name="date_intervention_prevue"
          type="date"
          value={data.date_intervention_prevue}
          onChange={handle}
        />
        <Button
          size="sm"
          onClick={() => onTransition('en_cours', {
            artisan_nom:               data.artisan_nom.trim()  || null,
            artisan_contact:           data.artisan_contact.trim() || null,
            date_intervention_prevue:  data.date_intervention_prevue || null,
          })}
          loading={loading}
        >
          Démarrer les travaux
        </Button>
      </div>
    );
  }

  if (incident.statut === 'en_cours') {
    return (
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 space-y-3">
        <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Travaux terminés ?</p>
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              label="Montant final (€)"
              name="montant_final"
              type="number"
              min="0"
              step="0.01"
              value={data.montant_final}
              onChange={handle}
              placeholder={incident.montant_devis ? String(incident.montant_devis) : 'Ex : 430'}
            />
          </div>
          <div className="pb-0.5">
            <Button
              size="sm"
              variant="success"
              onClick={() => onTransition('resolu', {
                montant_final: data.montant_final ? parseFloat(data.montant_final) : null,
              })}
              loading={loading}
            >
              Marquer résolu
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// -----------------------------------------------------------
// Composant principal : IncidentCard
// -----------------------------------------------------------
export interface IncidentCardProps {
  incident: Incident;
  isSyndic: boolean;
  canWrite: boolean;
}

export default function IncidentCard({ incident, isSyndic, canWrite }: IncidentCardProps) {
  const router  = useRouter();
  const supabase = createClient();

  const [expanded,     setExpanded]     = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [deleteModal,  setDeleteModal]  = useState(false);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteText,     setNoteText]     = useState('');
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoUrl,     setPhotoUrl]     = useState<string | null>(incident.photo_url ?? null);
  const [notes,        setNotes]        = useState<Note[]>(() => parseNotes(incident.notes_internes));
  const [deleted,      setDeleted]      = useState(false);

  const [transitionData, setTransitionData] = useState<TransitionData>({
    montant_devis:           incident.montant_devis?.toString()           ?? '',
    artisan_nom:             incident.artisan_nom                         ?? '',
    artisan_contact:         incident.artisan_contact                     ?? '',
    date_intervention_prevue: incident.date_intervention_prevue           ?? '',
    montant_final:           incident.montant_final?.toString()           ?? '',
  });

  // ---- Helpers ----
  async function transition(newStatut: StatutIncident, extra?: Record<string, unknown>) {
    setLoading(true);
    // For 'resolu', use the server API route so an email is sent to the declarant.
    if (newStatut === 'resolu') {
      const res = await fetch(`/api/incidents/${incident.id}/statut`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statut: newStatut, ...extra }),
      });
      setLoading(false);
      if (res.ok) router.refresh();
      return;
    }

    const payload: Record<string, unknown> = { statut: newStatut, ...extra };
    if (newStatut === 'ouvert') payload.date_resolution = null;

    const { error } = await supabase.from('incidents').update(payload).eq('id', incident.id);
    setLoading(false);
    if (!error) router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim()) return;
    setLoading(true);
    const updated = [...notes, { date: new Date().toISOString(), texte: noteText.trim() }];
    const { error } = await supabase
      .from('incidents')
      .update({ notes_internes: JSON.stringify(updated) })
      .eq('id', incident.id);
    setLoading(false);
    if (!error) {
      setNotes(updated);
      setNoteText('');
      setShowNoteForm(false);
    }
  }

  async function handleDelete() {
    setLoading(true);
    const { error } = await supabase.from('incidents').delete().eq('id', incident.id);
    setLoading(false);
    if (!error) setDeleted(true);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`/api/incidents/${incident.id}/photo`, { method: 'POST', body: form });
    if (res.ok) {
      const data = await res.json();
      setPhotoUrl(data.url);
    }
    setPhotoLoading(false);
    e.target.value = '';
  }

  // Pre-fill params for "Créer une dépense"
  const depenseQuery = new URLSearchParams({
    titre:       `Travaux - ${incident.titre}`,
    montant:     (incident.montant_final ?? incident.montant_devis ?? '').toString(),
    categorie:   'travaux',
    description: `Suite à l'incident déclaré le ${formatDate(incident.date_declaration)}`,
  }).toString();

  // ---- Priority color bar ----
  const priorityColor =
    incident.priorite === 'urgente' ? 'bg-red-500' :
    incident.priorite === 'haute'   ? 'bg-orange-400' :
    incident.priorite === 'moyenne' ? 'bg-yellow-300' :
    'bg-gray-200';

  if (deleted) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">

      {/* ── Header row ── */}
      <div className="flex items-stretch gap-3 p-4">

        {/* Priority indicator bar */}
        <div className={cn('w-1 rounded-full flex-shrink-0', priorityColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <div className="flex-1 min-w-0">

              {/* Badges row */}
              <div className="flex items-center gap-1.5 flex-wrap mb-1">
                <Badge variant={variantStatut(incident.statut)}>
                  {LABELS_STATUT_INCIDENT[incident.statut] ?? incident.statut}
                </Badge>
                {incident.type_incident && (
                  <Badge variant="default">{LABELS_TYPE_INCIDENT[incident.type_incident]}</Badge>
                )}
                <Badge variant={variantPriorite(incident.priorite)}>
                  {LABELS_PRIORITE[incident.priorite] ?? incident.priorite}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-semibold text-gray-900 text-sm leading-snug">{incident.titre}</h3>

              {/* Meta row */}
              <div className="flex items-center gap-3 text-xs text-gray-400 mt-1 flex-wrap">
                {incident.localisation && (
                  <span className="flex items-center gap-1 shrink-0">
                    <MapPin size={11} /> {incident.localisation}
                  </span>
                )}
                <span className="shrink-0">Déclaré le {formatDate(incident.date_declaration)}</span>
                {incident.artisan_nom && (
                  <span className="flex items-center gap-1 shrink-0">
                    <User size={11} /> {incident.artisan_nom}
                  </span>
                )}
                {incident.montant_devis != null && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Euro size={11} /> Devis : {formatEuros(incident.montant_devis)}
                  </span>
                )}
                {incident.date_intervention_prevue && (
                  <span className="flex items-center gap-1 shrink-0">
                    <Calendar size={11} /> {formatDate(incident.date_intervention_prevue)}
                  </span>
                )}
                {incident.date_resolution && (
                  <span className="shrink-0">Résolu le {formatDate(incident.date_resolution)}</span>
                )}
              </div>
            </div>

            {/* Expand / collapse */}
            <button
              onClick={() => setExpanded(v => !v)}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 flex-shrink-0 mt-0.5"
              aria-label={expanded ? 'Réduire' : 'Développer'}
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* ── Expanded detail panel ── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 space-y-4 pt-3">

          {/* Description */}
          {incident.description && (
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{incident.description}</p>
          )}

          {/* Artisan & montants */}
          {(incident.artisan_nom || incident.artisan_contact || incident.montant_devis != null || incident.montant_final != null) && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {incident.artisan_nom && (
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Artisan / Prestataire</p>
                  <p className="font-medium text-gray-800">{incident.artisan_nom}</p>
                  {incident.artisan_contact && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {incident.artisan_contact}
                    </p>
                  )}
                </div>
              )}
              <div className="space-y-1.5">
                {incident.montant_devis != null && (
                  <div>
                    <p className="text-xs text-gray-400">Devis reçu</p>
                    <p className="font-medium text-gray-800">{formatEuros(incident.montant_devis)}</p>
                  </div>
                )}
                {incident.montant_final != null && (
                  <div>
                    <p className="text-xs text-gray-400">Montant final</p>
                    <p className="font-semibold text-gray-900">{formatEuros(incident.montant_final)}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Transition panel (syndic only, not resolved) */}
          {isSyndic && canWrite && incident.statut !== 'resolu' && (
            <TransitionPanel
              incident={incident}
              data={transitionData}
              setData={setTransitionData}
              onTransition={transition}
              loading={loading}
            />
          )}

          {/* Photo jointe */}
          {photoUrl && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <Camera size={12} /> Photo
              </p>
              <a href={photoUrl} target="_blank" rel="noopener noreferrer">
                <img
                  src={photoUrl}
                  alt="Photo incident"
                  className="max-h-48 rounded-lg border border-gray-200 object-cover hover:opacity-90 transition-opacity"
                />
              </a>
            </div>
          )}

          {/* Notes journal */}
          {notes.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                <FileText size={12} /> Journal de suivi
              </p>
              <div className="space-y-2">
                {notes.map((note, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
                    <p className="text-xs text-gray-400 mb-0.5">{formatDate(note.date)}</p>
                    <p className="text-sm text-gray-700">{note.texte}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add note form */}
          {showNoteForm && (
            <form onSubmit={handleAddNote} className="space-y-2">
              <Textarea
                label="Note de suivi"
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                placeholder="Mise à jour, remarque, contact artisan…"
                rows={2}
              />
              <div className="flex gap-2">
                <Button type="submit" size="sm" loading={loading}>Ajouter</Button>
                <Button type="button" size="sm" variant="secondary" onClick={() => setShowNoteForm(false)}>
                  Annuler
                </Button>
              </div>
            </form>
          )}

          {/* Bottom action row */}
          <div className="flex items-center gap-3 flex-wrap pt-1">
            {isSyndic && canWrite && !showNoteForm && (
              <button
                onClick={() => setShowNoteForm(true)}
                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={12} /> Ajouter une note
              </button>
            )}

            {isSyndic && canWrite && (
              <label className={`inline-flex items-center gap-1 text-xs font-medium cursor-pointer ${photoLoading ? 'text-gray-400' : 'text-violet-600 hover:text-violet-700'}`}>
                <Camera size={12} />
                {photoLoading ? 'Upload…' : photoUrl ? 'Changer la photo' : 'Joindre une photo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  disabled={photoLoading}
                  onChange={handlePhotoUpload}
                />
              </label>
            )}

            {canWrite && incident.statut === 'resolu' && (
              <a
                href={`/depenses?${depenseQuery}`}
                className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium"
              >
                <Euro size={12} /> Créer une dépense
              </a>
            )}

            {isSyndic && canWrite && incident.statut === 'resolu' && (
              <button
                onClick={() => transition('ouvert')}
                disabled={loading}
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 font-medium disabled:opacity-50"
              >
                <RotateCcw size={12} /> Rouvrir
              </button>
            )}

            {isSyndic && canWrite && (
              <button
                onClick={() => setDeleteModal(true)}
                className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 font-medium ml-auto"
              >
                <Trash2 size={12} /> Supprimer
              </button>
            )}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      <Modal isOpen={deleteModal} onClose={() => setDeleteModal(false)} title="Supprimer l'incident" size="sm">
        <p className="text-sm text-gray-600 mb-4">
          Êtes-vous sûr de vouloir supprimer <strong className="text-gray-900">{incident.titre}</strong> ?
          Cette action est irréversible.
        </p>
        <div className="flex gap-3">
          <Button variant="danger" onClick={handleDelete} loading={loading}>Supprimer</Button>
          <Button variant="secondary" onClick={() => setDeleteModal(false)}>Annuler</Button>
        </div>
      </Modal>
    </div>
  );
}
