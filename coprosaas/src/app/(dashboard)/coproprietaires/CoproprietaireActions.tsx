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
import { Plus, Mail, Copy, Check, UserPlus, Pencil, Trash2 } from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState<'ajouter' | 'inviter'>('ajouter');

  // ---- Onglet "Ajouter directement" ----
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
  });

  useEffect(() => {
    if (!formData.copropriete_id) return;
    const fetchLots = async () => {
      setSelectedLotIds([]);
      const { data } = await supabase.from('lots').select('id, numero, coproprietaire_id').eq('copropriete_id', formData.copropriete_id).order('numero');
      setLots(data ?? []);
    };
    fetchLots();
  }, [formData.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

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

    // 1 — Créer la fiche copropriétaire
    const { data: cp, error: dbError } = await supabase
      .from('coproprietaires')
      .insert({
        copropriete_id: formData.copropriete_id,
        lot_id: selectedLotIds[0] ?? null, // lot principal (rétrocompat)
        nom: formData.nom.trim() || null,
        prenom: formData.prenom.trim() || null,
        raison_sociale: isSci ? formData.raison_sociale.trim() || null : null,
        email: formData.email.trim().toLowerCase(),
        telephone: formData.telephone.trim() || null,
        adresse: formData.adresse.trim() || null,
        code_postal: formData.code_postal.trim() || null,
        ville: formData.ville.trim() || null,
        solde: 0,
        user_id: null,
      })
      .select('id')
      .single();

    if (dbError || !cp) { setError('Erreur : ' + (dbError?.message ?? 'inconnue')); setLoading(false); return; }

    // 2 — Assigner les lots sélectionnés à ce copropriétaire
    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: cp.id }).in('id', selectedLotIds);
    }

    setIsOpen(false);
    setFormData({ copropriete_id: coproprietes[0]?.id ?? '', nom: '', prenom: '', email: '', telephone: '', adresse: '', code_postal: '', ville: '', raison_sociale: '' });
    setIsSci(false);
    setSelectedLotIds([]);
    router.refresh();
  };

  // ---- Onglet "Inviter par email" ----
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [inviteLots, setInviteLots] = useState<{ id: string; numero: string }[]>([]);
  const [invite, setInvite] = useState({
    email: '',
    copropriete_id: coproprietes[0]?.id ?? '',
    lot_id: '',
  });

  useEffect(() => {
    if (!invite.copropriete_id) return;
    supabase.from('lots').select('id, numero').eq('copropriete_id', invite.copropriete_id).order('numero')
      .then(({ data }) => setInviteLots(data ?? []));
  }, [invite.copropriete_id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInviteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setInvite((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setInviteLink('');
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteLoading(true);
    setInviteError('');
    setInviteLink('');

    const res = await fetch('/api/invitations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invite),
    });
    const data = await res.json();

    if (!res.ok) {
      setInviteError(data.error ?? "Erreur lors de la création de l'invitation");
      setInviteLoading(false);
      return;
    }

    setInviteLink(data.link);
    setInviteLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleClose = () => {
    setIsOpen(false);
    setInviteLink('');
    setInviteError('');
    setError('');
    setSelectedLotIds([]);
    setActiveTab('ajouter');
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} size={showLabel ? 'md' : 'sm'}>
        <UserPlus size={16} /> {showLabel ? 'Ajouter / Inviter' : 'Ajouter'}
      </Button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Copropriétaire" size="lg">
        {/* Onglets */}
        <div className="flex border-b border-gray-200 mb-5 -mt-1">
          <button
            onClick={() => setActiveTab('ajouter')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'ajouter'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Plus size={15} /> Ajouter directement
          </button>
          <button
            onClick={() => setActiveTab('inviter')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'inviter'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail size={15} /> Inviter par email
          </button>
        </div>

        {/* ---- Onglet : Ajouter directement ---- */}
        {activeTab === 'ajouter' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
              Crée une fiche copropriétaire sans compte. L&apos;accès à l&apos;application se fait via l&apos;onglet <strong>Inviter par email</strong>.
            </p>

            {/* Sélection multi-lots par cases à cocher */}
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
                        <span className="text-gray-700">Lot {lot.numero}{isTaken ? ' · attribué' : ''}</span>
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
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={loading}>Ajouter</Button>
              <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
            </div>
          </form>
        )}

        {/* ---- Onglet : Inviter par email ---- */}
        {activeTab === 'inviter' && (
          <div className="space-y-4">
            <p className="text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2 text-blue-700">
              Génère un lien unique à envoyer au copropriétaire. Il pourra créer son compte et accéder à la copropriété.
              Le lien est valable <strong>7 jours</strong>.
            </p>

            {!inviteLink ? (
              <form onSubmit={handleInvite} className="space-y-4">
                <Input
                  label="Email du copropriétaire"
                  name="email"
                  type="email"
                  value={invite.email}
                  onChange={handleInviteChange}
                  placeholder="jean.dupont@email.fr"
                  required
                />
                <Select
                  label="Lot principal (optionnel)"
                  name="lot_id"
                  value={invite.lot_id}
                  onChange={handleInviteChange}
                  options={inviteLots.map((l) => ({ value: l.id, label: `Lot ${l.numero}` }))}
                  placeholder="Sélectionner un lot"
                />
                {inviteError && <p className="text-sm text-red-600">{inviteError}</p>}
                <div className="flex gap-3 pt-1">
                  <Button type="submit" loading={inviteLoading}>
                    <Mail size={15} /> Générer le lien
                  </Button>
                  <Button type="button" variant="secondary" onClick={handleClose}>Annuler</Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-green-800 mb-1">✅ Lien d&apos;invitation créé !</p>
                  <p className="text-xs text-green-700">Envoyez ce lien à <strong>{invite.email}</strong></p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    readOnly
                    value={inviteLink}
                    className="flex-1 text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-gray-600 truncate"
                  />
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                  >
                    {copied ? <><Check size={14} /> Copié !</> : <><Copy size={14} /> Copier</>}
                  </button>
                </div>
                <a
                  href={`mailto:${invite.email}?subject=Invitation Mon Syndic Bénévole&body=Bonjour,%0A%0AVous avez été invité à rejoindre votre copropriété sur Mon Syndic Bénévole.%0A%0ACliquez sur ce lien pour créer votre compte :%0A${encodeURIComponent(inviteLink)}%0A%0ACe lien est valable 7 jours.`}
                  className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
                >
                  <Mail size={14} /> Ouvrir dans ma messagerie
                </a>
                <Button type="button" variant="secondary" onClick={handleClose} fullWidth>Fermer</Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
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
