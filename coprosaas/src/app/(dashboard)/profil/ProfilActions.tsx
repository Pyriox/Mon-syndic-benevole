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
import { Pencil, Home, Mail, Lock } from 'lucide-react';

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
}: {
  fiche: FicheSelectionnee | null;
  selectedCoproId: string | null;
  selectedCoproNom: string;
  userEmail: string;
  fullName: string;
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
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
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
        telephone: telephone.trim() || null,
        adresse: adresse.trim() || null,
        code_postal: codePostal.trim() || null,
        ville: ville.trim() || null,
        solde: 0,
        lot_id: null,
      });
    }

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="secondary" size="sm">
        <Pencil size={14} /> Modifier
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title={`Mon identité — ${selectedCoproNom}`}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <Input label="Téléphone" value={telephone} onChange={(e) => setTelephone(e.target.value)} placeholder="06 12 34 56 78" type="tel" />
          <Input label="Adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="12 rue de la Paix" />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Code postal" value={codePostal} onChange={(e) => setCodePostal(e.target.value)} placeholder="75001" />
            <Input label="Ville" value={ville} onChange={(e) => setVille(e.target.value)} />
          </div>
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
export function LotsActions({ copropriete, ficheSyndic, userEmail }: {
  copropriete: Copropriete;
  ficheSyndic?: FicheSyndic;
  userEmail: string;
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
      const nameParts = (user.user_metadata?.full_name ?? '').trim().split(' ');
      const { data, error: insErr } = await supabase
        .from('coproprietaires')
        .insert({
          copropriete_id: copropriete.id,
          lot_id: selectedLotIds[0] ?? null,
          nom: nameParts.slice(1).join(' ') || nameParts[0],
          prenom: nameParts[0] ?? '',
          email: userEmail,
          telephone: null,
          solde: 0,
          user_id: user.id,
        })
        .select('id, copropriete_id, prenom, nom, telephone')
        .single();

      if (insErr || !data) { setError('Erreur : ' + insErr?.message); setLoading(false); return; }
      copro = data;
    }

    const toRemove = myCurrentLotIds.filter((id) => !selectedLotIds.includes(id));
    if (toRemove.length) {
      await supabase.from('lots').update({ coproprietaire_id: null }).in('id', toRemove);
    }
    if (selectedLotIds.length) {
      await supabase.from('lots').update({ coproprietaire_id: copro.id }).in('id', selectedLotIds);
    }

    setIsOpen(false);
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => { setSelectedLotIds(myCurrentLotIds); setIsOpen(true); }}
        className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline"
      >
        <Pencil size={13} />
        {myCurrentLotIds.length > 0
          ? `${myCurrentLotIds.length} lot${myCurrentLotIds.length > 1 ? 's' : ''} — modifier`
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
export default function ProfilActions({ fullName, email, coproprietes, fichesSyndic }: ProfilActionsProps) {
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
