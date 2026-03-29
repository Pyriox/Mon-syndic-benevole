'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function AdminCopyId({ id, iconOnly = false }: { id: string; iconOnly?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copié !' : `Copier l'ID : ${id}`}
      className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 font-mono transition-colors"
    >
      {copied ? (
        <>
          <Check size={12} className="text-green-500" />
          {!iconOnly && <span className="text-green-600">Copié</span>}
        </>
      ) : (
        <>
          <Copy size={12} />
          {!iconOnly && <span>{id.slice(0, 8)}…</span>}
        </>
      )}
    </button>
  );
}
