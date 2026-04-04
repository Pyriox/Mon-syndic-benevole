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
  const [error, setError] = useState('');

  const generate = async () => {
    setLoading(true);
    setError('');

    const response = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (response.ok) {
      const { link: nextLink } = await response.json() as { link: string };
      setLink(nextLink);
      return;
    }

    const { error: apiError } = await response.json() as { error?: string };
    setError(apiError ?? 'Impossible de générer le lien.');
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
        className="flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100"
        title="Copier le lien de connexion (à ouvrir en navigation privée)"
      >
        {copied ? <Check size={11} /> : <ClipboardCopy size={11} />}
        {!iconOnly && (copied ? 'Copié !' : 'Copier le lien')}
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        onClick={generate}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md border border-purple-200 bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 transition-colors hover:bg-purple-100 disabled:opacity-50"
        title={error ? `Erreur : ${error}` : 'Générer un lien de connexion pour ce compte (support)'}
      >
        {loading ? <Loader2 size={11} className="animate-spin" /> : <KeyRound size={11} />}
        {!iconOnly && 'Générer un lien'}
      </button>
      {error && !iconOnly ? <p className="text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
