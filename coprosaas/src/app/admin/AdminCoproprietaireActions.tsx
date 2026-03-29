// ============================================================
// Composant client : actions par copropriétaire dans la table admin
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Loader2 } from 'lucide-react';

interface Coproprietaire {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  complement_adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  solde: number | null;
}

export default function AdminCoproprietaireActions({ cp }: { cp: Coproprietaire }) {
  const router = useRouter();
  const [editOpen,  setEditOpen]  = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);

  // form state
  const [nom,                setNom]               = useState(cp.nom              ?? '');
  const [prenom,             setPrenom]            = useState(cp.prenom           ?? '');
  const [raisonSociale,      setRaisonSociale]     = useState(cp.raison_sociale   ?? '');
  const [telephone,          setTelephone]         = useState(cp.telephone        ?? '');
  const [email,              setEmail]             = useState(cp.email            ?? '');
  const [adresse,            setAdresse]           = useState(cp.adresse          ?? '');
  const [complementAdresse,  setComplementAdresse] = useState(cp.complement_adresse ?? '');
  const [codePostal,         setCodePostal]        = useState(cp.code_postal      ?? '');
  const [ville,              setVille]             = useState(cp.ville            ?? '');
  const [solde,              setSolde]             = useState(String(cp.solde     ?? 0));

  const openEdit = () => {
    // reset to current values
    setNom(cp.nom              ?? '');
    setPrenom(cp.prenom        ?? '');
    setRaisonSociale(cp.raison_sociale ?? '');
    setTelephone(cp.telephone  ?? '');
    setEmail(cp.email          ?? '');
    setAdresse(cp.adresse      ?? '');
    setComplementAdresse(cp.complement_adresse ?? '');
    setCodePostal(cp.code_postal ?? '');
    setVille(cp.ville          ?? '');
    setSolde(String(cp.solde   ?? 0));
    setEditOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch('/api/admin/coproprietaires', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coproprietaireId: cp.id,
        nom,
        prenom,
        raison_sociale: raisonSociale,
        telephone,
        email,
        adresse,
        complement_adresse: complementAdresse,
        code_postal: codePostal,
        ville,
        solde: Number(solde),
      }),
    });
    setLoading(false);
    if (res.ok) {
      setEditOpen(false);
      setDone(true);
      setTimeout(() => router.refresh(), 700);
    } else {
      const { error } = await res.json();
      alert('Erreur : ' + error);
    }
  };

  if (done) return <span className="text-xs text-green-600 font-medium">✓ Modifié</span>;

  return (
    <>
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setEditOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-sm font-bold text-gray-900 mb-4">Modifier le copropriétaire</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nom</label>
                  <input type="text" value={nom} onChange={(e) => setNom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prénom</label>
                  <input type="text" value={prenom} onChange={(e) => setPrenom(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Raison sociale</label>
                <input type="text" value={raisonSociale} onChange={(e) => setRaisonSociale(e.target.value)}
                  placeholder="Si société"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" value={telephone} onChange={(e) => setTelephone(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adresse</label>
                <input type="text" value={adresse} onChange={(e) => setAdresse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Complément d&apos;adresse</label>
                <input type="text" value={complementAdresse} onChange={(e) => setComplementAdresse(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Code postal</label>
                  <input type="text" value={codePostal} onChange={(e) => setCodePostal(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Ville</label>
                  <input type="text" value={ville} onChange={(e) => setVille(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Solde (€)</label>
                <input type="number" step="0.01" value={solde} onChange={(e) => setSolde(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditOpen(false)}
                  className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 transition-colors">
                  Annuler
                </button>
                <button type="submit" disabled={loading}
                  className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition-colors flex items-center gap-1.5">
                  {loading && <Loader2 size={12} className="animate-spin" />}
                  {loading ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <button
        onClick={openEdit}
        className="p-1.5 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors"
        title="Modifier"
      >
        <Pencil size={14} />
      </button>
    </>
  );
}
