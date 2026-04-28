// ============================================================
// Client Component : Modification du profil syndic
// - Édite l'identité par copropriété (fiche coproprietaire)
// - Changement d'email et de mot de passe
// - Liaison aux lots
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { Pencil, Home, Mail, Lock, Check, X, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react';

/** Normalise un numéro de téléphone français au format XX XX XX XX XX */
function normalizePhone(raw: string): string {
  // Convertir +33X... → 0X...
  let s = raw.trim().replace(/\s/g, '');
  if (s.startsWith('+33')) s = '0' + s.slice(3);
  // Ne garder que les chiffres
  const digits = s.replace(/\D/g, '');
  // Formater 10 chiffres en XX XX XX XX XX
  if (digits.length === 10) {
    return digits.replace(/(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  }
  return digits || raw.trim();
}

interface Lot {
  id: string;
  numero: string;
  tantiemes: number;
  coproprietaire_id: string | null;
}

interface Copropriete {
  id: string;
  nom: string;
  lots: Lot[];
}

interface FicheSyndic {
  id: string;
  copropriete_id: string;
  prenom: string | null;
  nom: string | null;
  telephone: string | null;
}

interface FicheSelectionnee {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  telephone: string | null;
  adresse: string | null;
  complement_adresse: string | null;
  code_postal: string | null;
  ville: string | null;
}

interface ProfilActionsProps {
  fullName: string;
  email: string;
  coproprietes: Copropriete[];
  fichesSyndic: FicheSyndic[];
}

// ============================================================
// Édition de l'identité liée à la copropriété sélectionnée
// ============================================================
export function ProfilEditActions({
  fiche,
  selectedCoproId,
  selectedCoproNom,
  userEmail,
  fullName,
  inline = false,
}: {
  fiche: FicheSelectionnee | null;
  selectedCoproId: string | null;
  selectedCoproNom: string;
  userEmail: string;
  fullName: string;
  inline?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isSci, setIsSci] = useState(!!fiche?.raison_sociale);
  const [nom, setNom] = useState(fiche?.nom ?? fullName.split(' ').slice(1).join(' ') ?? '');
  const [prenom, setPrenom] = useState(fiche?.prenom ?? fullName.split(' ')[0] ?? '');
  const [raisonSociale, setRaisonSociale] = useState(fiche?.raison_sociale ?? '');
  const [telephone, setTelephone] = useState(fiche?.telephone ?? '');
  const [adresse, setAdresse] = useState(fiche?.adresse ?? '');
  const [codePostal, setCodePostal] = useState(fiche?.code_postal ?? '');
  const [ville, setVille] = useState(fiche?.ville ?? '');
  const [complementAdresse, setComplementAdresse] = useState(fiche?.complement_adresse ?? '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !selectedCoproId) { setLoading(false); return; }

    // Mettre à jour les métadonnées Auth (nom global)
    const newFullName = isSci ? raisonSociale.trim() : `${prenom.trim()} ${nom.trim()}`.trim();
    await supabase.auth.updateUser({ data: { full_name: newFullName } });

    if (fiche) {
      await supabase.from('coproprietaires').update({
        nom: nom.trim() || null,
        prenom: prenom.trim() || null,
        raison_sociale: isSci ? raisonSociale.trim() || null : null,
        telephone: normalizePhone(telephone) || null,
        adresse: adresse.trim() || null,
        complement_adresse: complementAdresse.trim() || null,
        code_postal: codePostal.trim() || null,
        ville: ville.trim() || null,
      }).eq('id', fiche.id);
    } else {
      // Créer une fiche pour cette copropriété si elle n'existe pas
      await supabase.from('coproprietaires').insert({
        copropriete_id: selectedCoproId,
        user_id: user.id,
        email: userEmail,
        nom: nom.trim() || null,
        prenom: prenom.trim() || null,
        raison_sociale: isSci ? raisonSociale.trim() || null : null,
        telephone: normalizePhone(telephone) || null,
        adresse: adresse.trim() || null,
        complement_adresse: complementAdresse.trim() || null,
        code_postal: codePostal.trim() || null,
        ville: ville.trim() || null,
        solde: 0,
        lot_id: null,
      });
    }

    setIsOpen(false);
    router.replace('/profil');
  };

  const formContent = (inModal: boolean) => (
    <form onSubmit={handleSubmit} className="space-y-3">
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input type="checkbox" checked={isSci} onChange={(e) => setIsSci(e.target.checked)} className="rounded text-blue-600" />
        Personne morale / SCI
      </label>
      {isSci ? (
        <>
          <Input label="Raison sociale" value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)} required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom du représentant" value={prenom} onChange={(e) => setPrenom(e.target.value)} placeholder="Jean" />
            <Input label="Nom du représentant" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Dupont" />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required={!isSci} />
          <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required={!isSci} />
        </div>
      )}
      <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" type="tel" required />
      <div className="grid grid-cols-2 gap-3">
        <Input label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="12 rue de la Paix" required />
        <Input label="Complément" value={complementAdresse} onChange={(e) => setComplementAdresse(e.target.value)} placeholder="Bât. A, appt. 12" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Input label="Code postal" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="75001" required />
        <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} required />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3 pt-1">
        <Button type="submit" loading={loading}>Enregistrer</Button>
        {inModal && (
          <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
        )}
      </div>
    </form>
  );

  if (inline) {
    return formContent(false);
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
        <Pencil size={14} /> Modifier
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Mon identité — ${selectedCoproNom}`} size="lg">
        {formContent(true)}
      </Modal>
    </>
  );
}

// ============================================================
// Éditeur inline de l'identité copropriétaire (champ par champ)
// ============================================================
type EditableField =
  | 'prenom' | 'nom' | 'raison_sociale'
  | 'telephone' | 'adresse' | 'complement_adresse' | 'code_postal' | 'ville';

export function ProfilIdentiteEditor({
  fiche: initialFiche,
  selectedCoproId,
  selectedCoproNom,
  userEmail,
  fullName,
}: {
  fiche: FicheSelectionnee | null;
  selectedCoproId: string | null;
  selectedCoproNom: string;
  userEmail: string;
  fullName: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [fiche, setFiche] = useState<FicheSelectionnee | null>(initialFiche);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [saving, setSaving] = useState(false);
  const isSci = !!fiche?.raison_sociale;

  const startEdit = (field: EditableField) => {
    setTempValue(fiche?.[field] ?? '');
    setEditingField(field);
  };

  const saveField = async (field: EditableField) => {
    if (!fiche) return;
    const rawVal = tempValue.trim() || null;
    const val = (field === 'telephone' && rawVal) ? normalizePhone(rawVal) || rawVal : rawVal;
    // Champs obligatoires : empêcher de vider
    const requiredFields: EditableField[] = ['prenom', 'nom', 'raison_sociale', 'telephone', 'adresse', 'code_postal', 'ville'];
    if (requiredFields.includes(field) && !val) return;
    setSaving(true);
    await supabase.from('coproprietaires').update({ [field]: val }).eq('id', fiche.id);
    setFiche((prev) => (prev ? { ...prev, [field]: val } : prev));
    setEditingField(null);
    setSaving(false);
  };

  const toggleSci = async () => {
    if (!fiche) return;
    if (isSci) {
      setSaving(true);
      await supabase.from('coproprietaires').update({ raison_sociale: null }).eq('id', fiche.id);
      setFiche((prev) => (prev ? { ...prev, raison_sociale: null } : prev));
      setSaving(false);
    } else {
      setTempValue('');
      setEditingField('raison_sociale');
    }
  };

  const renderField = (
    label: string,
    field: EditableField,
    inputType = 'text',
    placeholder = '',
    required = false,
  ) => {
    const value = fiche?.[field] ?? '';
    const isEditing = editingField === field;
    const isRequiredEmpty = required && isEditing && !tempValue.trim();
    return (
      <div key={field}>
        <p className="text-xs text-gray-500 mb-1">
          {label}{required && <span className="text-red-600 ml-0.5">*</span>}
        </p>
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <input
              className={`flex-1 text-sm border rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 min-w-0 ${isRequiredEmpty ? 'border-red-300 focus:ring-red-300' : 'border-blue-300 focus:ring-blue-500'}`}
              type={inputType}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              autoFocus
              placeholder={placeholder}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isRequiredEmpty) { e.preventDefault(); saveField(field); }
                if (e.key === 'Escape') setEditingField(null);
              }}
            />
            <button
              type="button"
              onClick={() => saveField(field)}
              disabled={saving || isRequiredEmpty}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
              title="Enregistrer"
            >
              <Check size={14} />
            </button>
            <button
              type="button"
              onClick={() => setEditingField(null)}
              className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-500 hover:bg-gray-100 rounded-lg"
              title="Annuler"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fiche && startEdit(field)}
            className="w-full text-left group flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-white transition-colors"
            title={`Modifier ${label}`}
          >
            <span className="text-sm font-medium text-gray-900 truncate">
              {value || <span className="text-gray-500 italic text-sm font-normal">Non renseigné</span>}
            </span>
            <Pencil size={12} className="shrink-0 text-gray-500 group-hover:text-blue-600 transition-colors" />
          </button>
        )}
      </div>
    );
  };

  if (!fiche) {
    return (
      <ProfilEditActions
        fiche={null}
        selectedCoproId={selectedCoproId}
        selectedCoproNom={selectedCoproNom}
        userEmail={userEmail}
        fullName={fullName}
        inline
      />
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Type de personne ── */}
      <div className="pb-4 border-b border-gray-100">
        <p className="text-xs text-gray-400 mb-1">Type de personne</p>
        {editingField === 'raison_sociale' && !isSci ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-500">Saisissez la raison sociale pour passer en personne morale :</p>
            <div className="flex items-center gap-1.5">
              <input
                className="flex-1 text-sm border border-blue-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-0"
                type="text"
                value={tempValue}
                onChange={(e) => setTempValue(e.target.value)}
                autoFocus
                placeholder="Ex : SCI Les Lilas"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && tempValue.trim()) { e.preventDefault(); saveField('raison_sociale'); }
                  if (e.key === 'Escape') setEditingField(null);
                }}
              />
              <button type="button" onClick={() => saveField('raison_sociale')} disabled={saving || !tempValue.trim()}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50" title="Confirmer">
                <Check size={14} />
              </button>
              <button type="button" onClick={() => setEditingField(null)}
                className="shrink-0 flex items-center justify-center w-8 h-8 text-gray-400 hover:bg-gray-100 rounded-lg" title="Annuler">
                <X size={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900">
              <span className={`w-2 h-2 rounded-full shrink-0 ${isSci ? 'bg-purple-400' : 'bg-blue-400'}`} />
              {isSci ? 'Personne morale / SCI' : 'Personne physique'}
            </span>
            <button type="button" onClick={toggleSci} disabled={saving}
              className="text-xs text-gray-500 hover:text-blue-600 hover:underline transition-colors disabled:opacity-50"
              title={isSci ? 'Passer en personne physique' : 'Passer en personne morale / SCI'}>
              Changer
            </button>
          </div>
        )}
      </div>

      {/* ── Identité ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Identité</p>
        {isSci ? (
          <div className="space-y-3">
            {renderField('Raison sociale', 'raison_sociale', 'text', 'SCI Les Lilas', true)}
            <div className="grid grid-cols-2 gap-3">
              {renderField('Prénom du représentant', 'prenom', 'text', 'Jean')}
              {renderField('Nom du représentant', 'nom', 'text', 'Dupont')}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {renderField('Prénom', 'prenom', 'text', 'Jean', true)}
            {renderField('Nom', 'nom', 'text', 'Dupont', true)}
          </div>
        )}
      </div>

      {/* ── Contact ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Contact</p>
        {renderField('Téléphone', 'telephone', 'tel', '06 12 34 56 78', true)}
      </div>

      {/* ── Adresse ── */}
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Adresse</p>
        <div className="space-y-3">
          {renderField('Rue', 'adresse', 'text', '12 rue de la Paix', true)}
          {renderField("Complément d'adresse", 'complement_adresse', 'text', 'Bât. A, appt. 12')}
          <div className="grid grid-cols-2 gap-3">
            {renderField('Code postal', 'code_postal', 'text', '75001', true)}
            {renderField('Ville', 'ville', 'text', 'Paris', true)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Sécurité : changement d'email et de mot de passe
// ============================================================
export function SecurityActions({ currentEmail }: { currentEmail: string }) {
  const supabase = createClient();
  const [emailOpen, setEmailOpen] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  const [newEmail, setNewEmail] = useState('');

  const [pwOpen, setPwOpen] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailLoading(true);
    setEmailError('');
    setEmailSuccess('');
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    if (error) { setEmailError(error.message); setEmailLoading(false); return; }
    setEmailSuccess(`Un email de confirmation a été envoyé à ${newEmail}.`);
    setEmailLoading(false);
    // Notifier l'ancienne adresse du changement demandé
    fetch('/api/auth/send-security-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'email_change_requested', newEmail: newEmail.trim().toLowerCase() }),
    }).catch(() => {});
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwLoading(true);
    setPwError('');
    setPwSuccess('');
    if (newPassword !== confirmPassword) {
      setPwError('Les mots de passe ne correspondent pas.');
      setPwLoading(false);
      return;
    }
    if (newPassword.length < 8) {
      setPwError('Le mot de passe doit contenir au moins 8 caractères.');
      setPwLoading(false);
      return;
    }
    // Vérification du mot de passe actuel
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: currentEmail, password: currentPassword });
    if (signInError) { setPwError('Mot de passe actuel incorrect.'); setPwLoading(false); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { setPwError(error.message); setPwLoading(false); return; }
    setPwSuccess('Mot de passe mis à jour avec succès.');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    setPwLoading(false);
    // Envoyer un e-mail de confirmation de changement de mot de passe
    fetch('/api/auth/send-security-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'password_changed' }),
    }).catch(() => {});
  };

  const closeEmail = () => { setEmailOpen(false); setEmailError(''); setEmailSuccess(''); setNewEmail(''); };
  const closePw = () => { setPwOpen(false); setPwError(''); setPwSuccess(''); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); };

  return (
    <div className="flex flex-wrap gap-2">
      <Button onClick={() => setEmailOpen(true)} variant="secondary" size="sm">
        <Mail size={14} /> Changer d&apos;email
      </Button>
      <Button onClick={() => setPwOpen(true)} variant="secondary" size="sm">
        <Lock size={14} /> Changer de mot de passe
      </Button>

      {/* Modal changement d'email */}
      <Modal isOpen={emailOpen} onClose={closeEmail} title="Changer d'adresse email">
        <form onSubmit={handleEmailChange} className="space-y-4">
          <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
            Adresse actuelle : <strong>{currentEmail}</strong>
          </p>
          <Input
            label="Nouvelle adresse email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            required
            placeholder="nouveau@email.fr"
          />
          {emailError && <p className="text-sm text-red-600">{emailError}</p>}
          {emailSuccess && <p className="text-sm text-green-600">{emailSuccess}</p>}
          {!emailSuccess ? (
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={emailLoading}>Confirmer</Button>
              <Button type="button" variant="secondary" onClick={closeEmail}>Annuler</Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" onClick={closeEmail} fullWidth>Fermer</Button>
          )}
        </form>
      </Modal>

      {/* Modal changement de mot de passe */}
      <Modal isOpen={pwOpen} onClose={closePw} title="Changer de mot de passe">
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <Input label="Mot de passe actuel" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
          <Input label="Nouveau mot de passe" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="8 caractères minimum" />
          <Input label="Confirmer le nouveau mot de passe" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
          {pwError && <p className="text-sm text-red-600">{pwError}</p>}
          {pwSuccess && <p className="text-sm text-green-600">{pwSuccess}</p>}
          {!pwSuccess ? (
            <div className="flex gap-3 pt-1">
              <Button type="submit" loading={pwLoading}>Enregistrer</Button>
              <Button type="button" variant="secondary" onClick={closePw}>Annuler</Button>
            </div>
          ) : (
            <Button type="button" variant="secondary" onClick={closePw} fullWidth>Fermer</Button>
          )}
        </form>
      </Modal>
    </div>
  );
}

// ============================================================
// Gestion des lots du syndic pour une copropriété
// ============================================================
export function LotsActions({ copropriete, ficheSyndic, userEmail, fullName = '' }: {
  copropriete: Copropriete;
  ficheSyndic?: FicheSyndic;
  userEmail: string;
  fullName?: string;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const myCurrentLotIds = copropriete.lots
    .filter((l) => l.coproprietaire_id === ficheSyndic?.id)
    .map((l) => l.id);

  const [selectedLotIds, setSelectedLotIds] = useState<string[]>(myCurrentLotIds);
  const [currentLotIds, setCurrentLotIds] = useState<string[]>(myCurrentLotIds);

  // Identity fields — collected on first linking when no fiche exists yet
  const nameParts = fullName.trim().split(' ');
  const [nom, setNom] = useState(ficheSyndic?.nom ?? nameParts.slice(1).join(' ') ?? '');
  const [prenom, setPrenom] = useState(ficheSyndic?.prenom ?? nameParts[0] ?? '');
  const [telephone, setTelephone] = useState(ficheSyndic?.telephone ?? '');
  const [adresse, setAdresse] = useState('');
  const [complementAdresse, setComplementAdresse] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [ville, setVille] = useState('');

  const toggleLot = (lotId: string) => {
    setSelectedLotIds((prev) =>
      prev.includes(lotId) ? prev.filter((id) => id !== lotId) : [...prev, lotId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let copro = ficheSyndic;

    if (!copro) {
      const { data, error: insErr } = await supabase
        .from('coproprietaires')
        .insert({
          copropriete_id: copropriete.id,
          lot_id: selectedLotIds[0] ?? null,
          nom: nom.trim() || nameParts.slice(1).join(' ') || nameParts[0],
          prenom: prenom.trim() || nameParts[0] || '',
          email: userEmail,
          telephone: normalizePhone(telephone) || null,
          adresse: adresse.trim() || null,
          complement_adresse: complementAdresse.trim() || null,
          code_postal: codePostal.trim() || null,
          ville: ville.trim() || null,
          solde: 0,
          user_id: user.id,
        })
        .select('id, copropriete_id, prenom, nom, telephone')
        .single();

      if (insErr || !data) { setError('Erreur : ' + insErr?.message); setLoading(false); return; }
      copro = data;
    }

    const toRemove = currentLotIds.filter((id) => !selectedLotIds.includes(id));
    if (toRemove.length) {
      await supabase.from('lots').update({ coproprietaire_id: null }).in('id', toRemove);
    }
    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: copro.id }).in('id', selectedLotIds);
    }

    setCurrentLotIds(selectedLotIds);
    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => { setSelectedLotIds(currentLotIds); setIsOpen(true); }}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
      >
        <Pencil size={13} />
        {currentLotIds.length > 0
          ? `${currentLotIds.length} lot${currentLotIds.length > 1 ? 's' : ''} — modifier`
          : 'Me lier à un lot'}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Mes lots — ${copropriete.nom}`}>
        <div className="space-y-4">
          <p className="text-xs text-gray-500 bg-blue-50 rounded-lg px-3 py-2 text-blue-700">
            Sélectionnez les lots dont vous êtes propriétaire dans cette copropriété.
          </p>

          {copropriete.lots.length === 0 ? (
            <p className="text-sm text-gray-400 italic">Aucun lot créé dans cette copropriété.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {copropriete.lots.map((lot) => {
                const takenByOther = lot.coproprietaire_id && lot.coproprietaire_id !== ficheSyndic?.id;
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
                    <span className="text-gray-700">
                      Lot {lot.numero}
                      <span className="text-gray-400 ml-1">({lot.tantiemes} t.)</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          {!ficheSyndic && (
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Vos coordonnées</p>
                <p className="text-xs text-gray-500 mt-0.5">Utilisées dans les documents et avis de la copropriété.</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Prénom" value={prenom} onChange={(e) => setPrenom(e.target.value)} required />
                <Input label="Nom" value={nom} onChange={(e) => setNom(e.target.value)} required />
              </div>
              <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" type="tel" required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="12 rue de la Paix" required />
                <Input label="Complément" value={complementAdresse} onChange={(e) => setComplementAdresse(e.target.value)} placeholder="Bât. A, appt. 12" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Code postal" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="75001" required />
                <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} required />
              </div>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button onClick={handleSave} loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

// ---- Export combiné (rétrocompat) ----
export default function ProfilActions({ fullName: _fullName, email, coproprietes, fichesSyndic }: ProfilActionsProps) {
  return (
    <div className="space-y-4">
      {coproprietes.map((copropriete) => {
        const fiche = fichesSyndic.find((f) => f.copropriete_id === copropriete.id);
        return (
          <div key={copropriete.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Home size={15} className="text-blue-500" />
              <span className="font-medium">{copropriete.nom}</span>
            </div>
            <LotsActions copropriete={copropriete} ficheSyndic={fiche} userEmail={email} />
          </div>
        );
      })}
    </div>
  );
}

const CONFIRM_TEXT = 'SUPPRIMER MON COMPTE';

export function DeleteAccountSection() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [deleted, setDeleted] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    const res = await fetch('/api/user/delete-account', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmText, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? 'Une erreur est survenue.');
      setLoading(false);
      return;
    }
    setDeleted(true);
    setTimeout(() => router.push('/login'), 1500);
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setConfirmText(''); setPassword(''); setError(''); }}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-600 transition-colors duration-150 shrink-0"
      >
        <Trash2 size={12} />
        Supprimer le compte
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Supprimer mon compte" size="md">
        {deleted ? (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <div className="p-3 bg-green-100 rounded-full">
              <CheckCircle2 size={32} className="text-green-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Compte supprimé</p>
              <p className="text-sm text-gray-500 mt-1">Déconnexion en cours…</p>
            </div>
          </div>
        ) : (
        <div className="space-y-5">
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 mb-1">Action irréversible — conformité RGPD</p>
              <p className="text-red-700">
                Votre compte sera supprimé. Vos copropriétés seront conservées mais n&apos;auront plus de syndic attribué jusqu&apos;à la désignation d&apos;un nouveau syndic. Votre fiche dans les copropriétés où vous êtes membre sera détachée.
              </p>
            </div>
          </div>

          <div>
            <Input
              label={`Tapez « ${CONFIRM_TEXT} » pour confirmer`}
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={CONFIRM_TEXT}
              autoFocus
            />
          </div>

          <div>
            <Input
              label="Mot de passe actuel"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

          <div className="flex gap-3 pt-1">
            <Button
              variant="danger"
              loading={loading}
              onClick={handleDelete}
              disabled={confirmText !== CONFIRM_TEXT || password.trim().length === 0}
            >
              <Trash2 size={14} /> Supprimer définitivement
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </div>
        )}
      </Modal>
    </>
  );
}
