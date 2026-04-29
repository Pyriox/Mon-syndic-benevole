// ============================================================
// Client Components : Ajouter, Modifier, Supprimer un copropriétaire
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { logCurrentUserEvent } from '@/lib/actions/log-user-event';
import { revalidateCoproFinance } from '@/lib/actions/revalidate-copro-finance';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Textarea from '@/components/ui/Textarea';
import { setCoproprietaireBalanceManually } from '@/lib/coproprietaire-balance';
import { Plus, Mail, UserPlus, Pencil, Trash2 } from 'lucide-react';

interface Copropriete {
  id: string;
  nom: string;
}

export interface CoproprietaireListItem {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  solde: number;
  user_id: string | null;
}

interface CoproprietaireActionsProps {
  coproprietes: Copropriete[];
  showLabel?: boolean;
  onAdded?: (coproprietaire: CoproprietaireListItem, selectedLotIds: string[]) => void;
}

export default function CoproprietaireActions({ coproprietes, showLabel, onAdded }: CoproprietaireActionsProps) {
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
    complement_adresse: '',
    code_postal: '',
    ville: '',
    raison_sociale: '',
    solde_reprise: '',
    solde_reason: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const initialBalance = parseFloat(formData.solde_reprise) || 0;
    if (Math.abs(initialBalance) > 0.004 && !formData.solde_reason.trim()) {
      setError('Indiquez un motif pour enregistrer un solde de reprise non nul.');
      setLoading(false);
      return;
    }

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
        complement_adresse: formData.complement_adresse.trim() || null,
        code_postal: formData.code_postal.trim() || null,
        ville: formData.ville.trim() || null,
        solde: 0,
        user_id: null,
      })
      .select('id')
      .single();

    if (dbError || !cp) { setError('Erreur : ' + (dbError?.message ?? 'inconnue')); setLoading(false); return; }

    if (Math.abs(initialBalance) > 0.004) {
      const { error: balanceError } = await setCoproprietaireBalanceManually(supabase, {
        coproprietaireId: cp.id,
        newBalance: initialBalance,
        reason: formData.solde_reason,
        label: 'Solde de reprise à l’ouverture',
        sourceType: 'solde_initial',
        metadata: { createdFrom: 'coproprietaire_add' },
      });

      if (balanceError) {
        await supabase.from('coproprietaires').delete().eq('id', cp.id);
        setError(balanceError.message);
        setLoading(false);
        return;
      }
    }

    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: cp.id }).in('id', selectedLotIds);
    }
    await revalidateCoproFinance(formData.copropriete_id);
    // Log événement (fire-and-forget via action serveur)
    const nom = [formData.prenom?.trim(), formData.nom?.trim()].filter(Boolean).join(' ') || formData.raison_sociale?.trim() || formData.email;
    void logCurrentUserEvent({
      eventType: 'coproprietaire_added',
      label: `Copropriétaire ajouté — ${nom}`,
      metadata: {
        coproId: formData.copropriete_id,
        coproprietaireId: cp.id,
        selectedLotIds,
        coproprietaire: {
          nom: formData.nom.trim() || null,
          prenom: formData.prenom.trim() || null,
          raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
          email: formData.email.trim().toLowerCase(),
          telephone: formData.telephone.trim() || null,
          adresse: formData.adresse.trim() || null,
          complement_adresse: formData.complement_adresse.trim() || null,
          code_postal: formData.code_postal.trim() || null,
          ville: formData.ville.trim() || null,
          solde_reprise: initialBalance,
        },
      },
    }).catch(() => undefined);
    const nextCoproprietaire: CoproprietaireListItem = {
      id: cp.id,
      nom: formData.nom.trim() || null,
      prenom: formData.prenom.trim() || null,
      raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
      email: formData.email.trim().toLowerCase(),
      telephone: formData.telephone.trim() || null,
      adresse: formData.adresse.trim() || null,
      code_postal: formData.code_postal.trim() || null,
      ville: formData.ville.trim() || null,
      solde: initialBalance,
      user_id: null,
    };

    setIsOpen(false);
    setLoading(false);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', nom: '', prenom: '', email: '', telephone: '', adresse: '', complement_adresse: '', code_postal: '', ville: '', raison_sociale: '', solde_reprise: '', solde_reason: '' });
    setIsSci(false);
    setSelectedLotIds([]);
    if (onAdded) {
      onAdded(nextCoproprietaire, selectedLotIds);
    } else {
      router.refresh();
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setError('');
    setSelectedLotIds([]);
    setIsSci(false);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', nom: '', prenom: '', email: '', telephone: '', adresse: '', complement_adresse: '', code_postal: '', ville: '', raison_sociale: '', solde_reprise: '', solde_reason: '' });
  };

  return (
    <>
      <Button onClick={() => { handleClose(); setIsOpen(true); }} size={showLabel ? 'md' : 'sm'}>
        <UserPlus size={16} /> {showLabel ? 'Ajouter un copropriétaire' : 'Ajouter'}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Ajouter un copropriétaire" size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          {lots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Lots associés <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1.5">
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} placeholder="06 12 34 56 78" />
          </div>
          <Input label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} required placeholder="12 rue de la Paix" />
          <Input label="Complément d'adresse" name="complement_adresse" value={formData.complement_adresse} onChange={handleChange} placeholder="Apt, bât., étage…" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" name="code_postal" value={formData.code_postal} onChange={handleChange} required placeholder="75001" />
            <Input label="Ville" name="ville" value={formData.ville} onChange={handleChange} required />
          </div>
          <Input label="Solde à la reprise (€)" name="solde_reprise" type="number" step="0.01" value={formData.solde_reprise} onChange={handleChange} placeholder="0.00 — facultatif" />
          {Math.abs(parseFloat(formData.solde_reprise) || 0) > 0.004 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Traçabilité du solde de reprise</p>
              <p className="text-xs text-slate-600">
                Ce montant sera enregistré dans l&apos;historique financier du copropriétaire avec son motif, horodaté automatiquement à la date du jour.
              </p>
              <Textarea label="Motif" name="solde_reason" value={formData.solde_reason} onChange={handleChange} required placeholder="Ex. reprise de comptabilité, report de l’ancien syndic, correction d’ouverture…" />
            </div>
          )}
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
  const [warningMsg, setWarningMsg] = useState('');
  const [fallbackLink, setFallbackLink] = useState('');

  const handleInvite = async () => {
    setState('loading');
    setErrorMsg('');
    setWarningMsg('');
    setFallbackLink('');
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
      setWarningMsg(data.emailWarning ?? '');
      setFallbackLink(data.link ?? '');
      setState('sent');
    }
  };

  if (state === 'sent') {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium px-2 py-1">
          ✓ {warningMsg ? 'Lien généré' : 'Invitation envoyée'}
        </span>
        {warningMsg && <p className="text-[10px] text-amber-600 leading-tight max-w-[170px]">{warningMsg}</p>}
        {fallbackLink && (
          <a
            href={fallbackLink}
            target="_blank"
            rel="noreferrer"
            className="text-[10px] text-blue-600 hover:text-blue-700 underline break-all max-w-[170px]"
          >
            Ouvrir le lien d&apos;invitation
          </a>
        )}
      </div>
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
  coproprieteId?: string;
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
    user_id?: string | null;
  };
  lots: { id: string; numero: string; coproprietaire_id?: string | null }[];
  assignedLotIds: string[];
  onSaved?: (coproprietaire: CoproprietaireListItem, selectedLotIds: string[]) => void;
}

export function CoproprietaireEdit({ coproprieteId, coproprietaire, lots, assignedLotIds, onSaved }: CoproprietaireEditProps) {
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
    solde_reason: '',
  });
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(assignedLotIds);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

    const soldeChanged = Math.abs(formData.solde - coproprietaire.solde) > 0.004;
    if (soldeChanged && !formData.solde_reason.trim()) {
      setError('Indiquez un motif pour toute modification manuelle du solde.');
      setLoading(false);
      return;
    }

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
      })
      .eq('id', coproprietaire.id);

    if (dbError) { setError(dbError.message); setLoading(false); return; }

    if (soldeChanged) {
      const { error: balanceError } = await setCoproprietaireBalanceManually(supabase, {
        coproprietaireId: coproprietaire.id,
        newBalance: formData.solde,
        reason: formData.solde_reason,
        label: 'Ajustement manuel du solde',
        sourceType: 'manual_adjustment',
        metadata: { previousBalance: coproprietaire.solde },
      });

      if (balanceError) {
        setError(balanceError.message);
        setLoading(false);
        return;
      }
    }

    // Désassigner les anciens lots, réassigner les nouveaux
    await supabase.from('lots').update({ coproprietaire_id: null }).eq('coproprietaire_id', coproprietaire.id);
    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: coproprietaire.id }).in('id', selectedLotIds);
    }

    await revalidateCoproFinance(coproprieteId);

    const nextNom = [formData.prenom.trim(), formData.nom.trim()].filter(Boolean).join(' ') || formData.raison_sociale.trim() || formData.email.trim().toLowerCase();
    void logCurrentUserEvent({
      eventType: 'coproprietaire_updated',
      label: `Copropriétaire modifié — ${nextNom}`,
      metadata: {
        coproId: coproprieteId,
        coproprietaireId: coproprietaire.id,
        before: {
          nom: coproprietaire.nom,
          prenom: coproprietaire.prenom,
          raison_sociale: coproprietaire.raison_sociale,
          email: coproprietaire.email,
          telephone: coproprietaire.telephone,
          adresse: coproprietaire.adresse,
          code_postal: coproprietaire.code_postal,
          ville: coproprietaire.ville,
          solde: coproprietaire.solde,
          lotIds: assignedLotIds,
        },
        after: {
          nom: formData.nom.trim() || null,
          prenom: formData.prenom.trim() || null,
          raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
          email: formData.email.trim().toLowerCase(),
          telephone: formData.telephone.trim() || null,
          adresse: formData.adresse.trim() || null,
          code_postal: formData.code_postal.trim() || null,
          ville: formData.ville.trim() || null,
          solde: formData.solde,
          lotIds: selectedLotIds,
        },
      },
    }).catch(() => undefined);

    const nextCoproprietaire: CoproprietaireListItem = {
      id: coproprietaire.id,
      nom: formData.nom.trim() || null,
      prenom: formData.prenom.trim() || null,
      raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
      email: formData.email.trim().toLowerCase(),
      telephone: formData.telephone.trim() || null,
      adresse: formData.adresse.trim() || null,
      code_postal: formData.code_postal.trim() || null,
      ville: formData.ville.trim() || null,
      solde: formData.solde,
      user_id: coproprietaire.user_id ?? null,
    };

    setLoading(false);
    setIsOpen(false);
    if (onSaved) {
      onSaved(nextCoproprietaire, selectedLotIds);
    } else {
      router.refresh();
    }
  };

  return (
    <>
      <button
        onClick={() => {
          setError('');
          setIsSci(!!coproprietaire.raison_sociale);
          setSelectedLotIds(assignedLotIds);
          setFormData({
            nom: coproprietaire.nom ?? '',
            prenom: coproprietaire.prenom ?? '',
            raison_sociale: coproprietaire.raison_sociale ?? '',
            email: coproprietaire.email,
            telephone: coproprietaire.telephone ?? '',
            adresse: coproprietaire.adresse ?? '',
            code_postal: coproprietaire.code_postal ?? '',
            ville: coproprietaire.ville ?? '',
            solde: coproprietaire.solde,
            solde_reason: '',
          });
          setIsOpen(true);
        }}
        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        title="Modifier"
      >
        <Pencil size={15} />
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier le copropriétaire" size="lg">
        <form onSubmit={handleSubmit} className="space-y-3">
          {lots.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">
                Lots associés <span className="text-gray-400 font-normal">(optionnel)</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto border border-gray-200 rounded-lg p-1.5">
                {lots.map((lot) => {
                  const takenByOther = lot.coproprietaire_id && lot.coproprietaire_id !== coproprietaire.id;
                  return (
                    <label
                      key={lot.id}
                      className={`flex items-center gap-2 px-2 py-1 rounded-lg text-sm ${
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
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} required />
            <Input label="Téléphone" name="telephone" type="tel" value={formData.telephone} onChange={handleChange} />
          </div>
          <Input label="Adresse" name="adresse" value={formData.adresse} onChange={handleChange} placeholder="12 rue de la Paix" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" name="code_postal" value={formData.code_postal} onChange={handleChange} placeholder="75001" />
            <Input label="Ville" name="ville" value={formData.ville} onChange={handleChange} />
          </div>
          <Input label="Solde (€)" name="solde" type="number" step="0.01" value={String(formData.solde)} onChange={handleChange} />
          {Math.abs(formData.solde - coproprietaire.solde) > 0.004 && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 space-y-3">
              <p className="text-sm font-semibold text-slate-900">Justifier la modification du solde</p>
              <p className="text-xs text-slate-600">
                Toute modification manuelle du solde est conservée dans l&apos;historique financier du copropriétaire et datée automatiquement du jour.
              </p>
              <Textarea label="Motif" name="solde_reason" value={formData.solde_reason} onChange={handleChange} required placeholder="Ex. correction suite au relevé bancaire, régularisation manuelle, reprise de l’ancien syndic…" />
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
export function CoproprietaireDelete({
  id,
  nom,
  assignedLotIds = [],
  onDeleted,
}: {
  id: string;
  nom: string;
  assignedLotIds?: string[];
  onDeleted?: (id: string, freedLotIds: string[]) => void;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await supabase.from('lots').update({ coproprietaire_id: null }).eq('coproprietaire_id', id);
    await supabase.from('coproprietaires').delete().eq('id', id);
    void logCurrentUserEvent({
      eventType: 'coproprietaire_deleted',
      label: `Copropriétaire supprimé — ${nom}`,
      metadata: {
        coproprietaireId: id,
        freedLotIds: assignedLotIds,
      },
      severity: 'warning',
    }).catch(() => undefined);
    setIsOpen(false);
    setLoading(false);
    if (onDeleted) {
      onDeleted(id, assignedLotIds);
    } else {
      router.refresh();
    }
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
