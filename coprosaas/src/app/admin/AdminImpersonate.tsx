// ============================================================
// Composant client : génère un lien de connexion magique
// pour accéder au compte d'un utilisateur (support)
// ============================================================
'use client';

import { useState } from 'react';
import { KeyRound, ClipboardCopy, Check, Loader2 } from 'lucide-react';

interface Props {
  email: string;
  iconOnly?: boolean;
}

export default function AdminImpersonate({ email, iconOnly = false }: Props) {
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState('');
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setLoading(false);
    if (res.ok) {
      const { link: l } = await res.json() as { link: string };
      setLink(l);
    } else {
      const { error } = await res.json() as { error: string };
      alert('Erreur : ' + error);
    }
  };

  const copy = async () => {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (link) {
    return (
      <button
        onClick={copy}
        className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 hover:bg-purple-100 transition-colors"
        title="Copier le lien de connexion (à ouvrir en navigation privée)"
      >
        {copied ? <Check size={11} /> : <ClipboardCopy size={11} />}
        {!iconOnly && (copied ? 'Copié !' : 'Copier le lien')}
      </button>
    );
  }

  return (
    <button
      onClick={generate}
      disabled={loading}
      className="flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md px-2 py-1 hover:bg-purple-100 transition-colors disabled:opacity-50"
      title="Générer un lien de connexion pour ce compte (support)"
    >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
        {!iconOnly && 'Générer un lien'}
    </button>
  );
}
