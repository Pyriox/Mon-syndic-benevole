// ============================================================
// Client Components : Ajouter, Modifier, Supprimer un copropriétaire
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { Plus, Mail, UserPlus, Pencil, Trash2 } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

interface CoproprietaireActionsProps {
  coproprietes: Copropriete[];
  showLabel?: boolean;
}

export default function CoproprietaireActions({ coproprietes, showLabel }: CoproprietaireActionsProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);

  // ---- Formulaire «Ajouter» ----
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lots, setLots] = useState<{ id: string; numero: string; coproprietaire_id: string | null }[]>([]);
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);
  const [isSci, setIsSci] = useState(false);
  const [formData, setFormData] = useState({
    copropriete_id: coproprietes[0]?.id ?? '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    code_postal: '',
    ville: '',
    raison_sociale: '',
    solde_reprise: '',
  });

  useEffect(() => {
    if (!formData.copropriete_id || !isOpen) return;
    const fetchLots = async () => {
      setSelectedLotIds([]);
      const { data } = await supabase.from('lots').select('id, numero, coproprietaire_id').eq('copropriete_id', formData.copropriete_id).order('numero');
      setLots(data ?? []);
    };
    fetchLots();
  }, [formData.copropriete_id, isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toggleLot = (lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: cp, error: dbError } = await supabase
      .from('coproprietaires')
      .insert({
        copropriete_id: formData.copropriete_id,
        lot_id: selectedLotIds[0] ?? null,
        nom: formData.nom.trim() || null,
        prenom: formData.prenom.trim() || null,
        raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim() || null,
        adresse: formData.adresse.trim() || null,
        code_postal: formData.code_postal.trim() || null,
        ville: formData.ville.trim() || null,
        solde: parseFloat(formData.solde_reprise) || 0,
        user_id: null,
      })
      .select('id')
      .single();

    if (dbError || !cp) { setError('Erreur : ' + (dbError?.message ?? 'inconnue')); setLoading(false); return; }

    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: cp.id }).in('id', selectedLotIds);
    }

    setIsOpen(false);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', nom: '', prenom: '', email: '', telephone: '', adresse: '', code_postal: '', ville: '', raison_sociale: '', solde_reprise: '' });
    setIsSci(false);
    setSelectedLotIds([]);
    router.refresh();
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSelectedLotIds([]);
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <UserPlus size={16} /> {showLabel ? 'Ajouter un copropriétaire' : 'Ajouter'}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un copropriétaire" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {lots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">
                Lots associés <span className="text-gray-400 font-normal">(optionnel — plusieurs possibles)</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {lots.map((lot) => {
                  const isTaken = !!lot.coproprietaire_id;
                  return (
                    <label
                      key={lot.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                        isTaken ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLotIds.includes(lot.id)}
                        onChange={() => !isTaken && toggleLot(lot.id)}
                        disabled={isTaken}
                        className="rounded text-blue-600"
                      />
                      <span className="text-gray-700">Lot {lot.numero}{isTaken ? ' · attribué' : ''}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isSci} onChange={(e) => setIsSci(e.target.checked)} className="rounded text-blue-600" />
            Personne morale / SCI
          </label>
          {isSci ? (
            <>
              <Input label="Raison sociale" name="raison_sociale" value={formData.raison_sociale} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom du représentant" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Jean" />
                <Input label="Nom du représentant" name="nom" value={formData.nom} onChange={handleChange} placeholder="Dupont" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} required={!isSci} />
              <Input label="Nom" name="nom" value={formData.nom} onChange={handleChange} required={!isSci} />
            </div>
          )}
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} placeholder="06 12 34 56 78" />
          <Input label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} required placeholder="12 rue de la Paix" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" name="code_postal" value={formData.code_postal} onChange={handleChange} required placeholder="75001" />
            <Input label="Ville" name="ville" value={formData.ville} onChange={handleChange} required />
          </div>
          <div>
            <Input label="Solde à la reprise (€)" name="solde_reprise" type="number" step="0.01" value={formData.solde_reprise} onChange={handleChange} placeholder="0.00" />
            <p className="text-xs text-gray-400 mt-1">
              Facultatif — si vous rejoignez la plateforme en cours d'année, indiquez le solde actuel de ce copropriétaire sur votre ancien outil (positif = créditeur, négatif = débiteur).
            </p>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading}>Ajouter</Button>
            <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ============================================================
// Inviter un copropriétaire non inscrit par email
// ============================================================
interface CoproprietaireInviteProps {
  coproprietaireId: string;
  displayName: string;
}

export function CoproprietaireInvite({ coproprietaireId, displayName }: CoproprietaireInviteProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleInvite = async () => {
    setState('loading');
    setErrorMsg('');
    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coproprietaire_id: coproprietaireId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error ?? "Erreur d'envoi");
      setState('error');
    } else {
      setState('sent');
    }
  };

  if (state === 'sent') {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium px-2 py-1">
        ✓ Invitation envoyée
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-0.5">
      <button
        onClick={handleInvite}
        disabled={state === 'loading'}
        title={`Inviter ${displayName} par email`}
        className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-60"
      >
        <Mail size={12} />
        {state === 'loading' ? 'Envoi…' : 'Inviter'}
      </button>
      {state === 'error' && <p className="text-[10px] text-red-500 leading-tight max-w-[130px]">{errorMsg}</p>}
    </div>
  );
}

// ============================================================
// Modifier un copropriétaire existant
// ============================================================
interface CoproprietaireEditProps {
  coproprietaire: {
    id: string;
    nom: string | null;
    prenom: string | null;
    email: string;
    telephone: string | null;
    adresse: string | null;
    code_postal: string | null;
    ville: string | null;
    raison_sociale?: string | null;
    solde: number;
  };
  lots: { id: string; numero: string; coproprietaire_id?: string | null }[];
  assignedLotIds: string[];
}

export function CoproprietaireEdit({ coproprietaire, lots, assignedLotIds }: CoproprietaireEditProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSci, setIsSci] = useState(!!coproprietaire.raison_sociale);

  const [formData, setFormData] = useState({
    nom: coproprietaire.nom ?? '',
    prenom: coproprietaire.prenom ?? '',
    raison_sociale: coproprietaire.raison_sociale ?? '',
    email: coproprietaire.email,
    telephone: coproprietaire.telephone ?? '',
    adresse: coproprietaire.adresse ?? '',
    code_postal: coproprietaire.code_postal ?? '',
    ville: coproprietaire.ville ?? '',
    solde: coproprietaire.solde,
  });
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(assignedLotIds);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = e.target.name === 'solde' ? parseFloat(e.target.value) || 0 : e.target.value;
    setFormData((prev) => ({ ...prev, [e.target.name]: value }));
  };

  const toggleLot = (lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: dbError } = await supabase
      .from('coproprietaires')
      .update({
        nom: formData.nom.trim() || null,
        prenom: formData.prenom.trim() || null,
        raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim() || null,
        adresse: formData.adresse.trim() || null,
        code_postal: formData.code_postal.trim() || null,
        ville: formData.ville.trim() || null,
        solde: formData.solde,
      })
      .eq('id', coproprietaire.id);

    if (dbError) { setError(dbError.message); setLoading(false); return; }

    // Désassigner les anciens lots, réassigner les nouveaux
    await supabase.from('lots').update({ coproprietaire_id: null }).eq('coproprietaire_id', coproprietaire.id);
    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: coproprietaire.id }).in('id', selectedLotIds);
    }

    setLoading(false);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Modifier"
      >
        <Pencil size={15} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier le copropriétaire" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" checked={isSci} onChange={(e) => setIsSci(e.target.checked)} className="rounded text-blue-600" />
            Personne morale / SCI
          </label>
          {isSci ? (
            <>
              <Input label="Raison sociale" name="raison_sociale" value={formData.raison_sociale} onChange={handleChange} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom du représentant" name="prenom" value={formData.prenom} onChange={handleChange} placeholder="Jean" />
                <Input label="Nom du représentant" name="nom" value={formData.nom} onChange={handleChange} placeholder="Dupont" />
              </div>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <Input label="Prénom" name="prenom" value={formData.prenom} onChange={handleChange} required />
              <Input label="Nom" name="nom" value={formData.nom} onChange={handleChange} required />
            </div>
          )}
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
          <Input label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} />
          <Input label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="12 rue de la Paix" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" name="code_postal" value={formData.code_postal} onChange={handleChange} placeholder="75001" />
            <Input label="Ville" name="ville" value={formData.ville} onChange={handleChange} />
          </div>
          <Input label="Solde (€)" name="solde" type="number" step="0.01" value={String(formData.solde)} onChange={handleChange} />

          {lots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Lots associés</label>
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-gray-200 rounded-lg p-2">
                {lots.map((lot) => {
                  const takenByOther = lot.coproprietaire_id && lot.coproprietaire_id !== coproprietaire.id;
                  return (
                    <label
                      key={lot.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm ${
                        takenByOther ? 'opacity-40 cursor-not-allowed' : 'hover:bg-gray-50 cursor-pointer'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedLotIds.includes(lot.id)}
                        onChange={() => !takenByOther && toggleLot(lot.id)}
                        disabled={!!takenByOther}
                        className="rounded text-blue-600"
                      />
                      <span className="text-gray-700">Lot {lot.numero}{takenByOther ? ' · attribué' : ''}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

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

// ============================================================
// Supprimer un copropriétaire
// ============================================================
export function CoproprietaireDelete({ id, nom }: { id: string; nom: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from('lots').update({ coproprietaire_id: null }).eq('coproprietaire_id', id);
    await supabase.from('coproprietaires').delete().eq('id', id);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        title="Supprimer"
      >
        <Trash2 size={15} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Supprimer le copropriétaire">
        <p className="text-gray-700 mb-1">Supprimer <strong>{nom}</strong> ?</p>
        <p className="text-sm text-gray-500 mb-5">Ses lots seront libérés. Cette action est irréversible.</p>
        <div className="flex gap-3">
          <Button variant="danger" loading={loading} onClick={handleDelete}>Supprimer</Button>
          <Button variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
        </div>
      </Modal>
    </>
  );
}
