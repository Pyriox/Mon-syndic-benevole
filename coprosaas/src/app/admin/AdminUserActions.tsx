// ============================================================
// Composant client : actions par utilisateur dans la table admin
// ============================================================
'use client';

import { useRef, useState } from 'react';
import { Mail, MoreHorizontal, Loader2, KeyRound } from 'lucide-react';


interface Props {
  userId: string;
  userEmail: string;
  isConfirmed: boolean;
  isSelf: boolean;
  // Legacy props passed from the list — unused in this slim component
  fullName?: string;
  isAdmin?: boolean;
  isSuspended?: boolean;
  userRole?: string;
}

async function getErrorMessage(response: Response, fallback = 'Une erreur est survenue.') {
  try {
    const data = await response.json() as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AdminUserActions({ userEmail, isConfirmed, isSelf }: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState('');
  const [error, setError] = useState('');
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const [pendingAction, setPendingAction] = useState<'resend' | 'reset_password' | null>(null);

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  };

  const handleResend = async () => {
    setError('');
    setOpen(false);
    setPendingAction('resend');

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resend_confirmation', email: userEmail }),
    });

    setPendingAction(null);
    if (response.ok) {
      setDone('Email envoyé');
      setTimeout(() => setDone(''), 3000);
      return;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  const handleResetPassword = async () => {
    setError('');
    setOpen(false);
    setPendingAction('reset_password');

    const response = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset_password', email: userEmail }),
    });

    setPendingAction(null);
    if (response.ok) {
      setDone('Reset envoyé');
      setTimeout(() => setDone(''), 3000);
      return;
    }

    setError(`Erreur : ${await getErrorMessage(response)}`);
  };

  if (isSelf) return null;
  if (done) return <span className="text-xs font-medium text-green-600">{done}</span>;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="relative flex items-center justify-end">
        {pendingAction ? (
          <Loader2 size={15} className="animate-spin text-gray-400" />
        ) : (
          <>
            <button
              ref={buttonRef}
              onClick={toggleOpen}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            >
              <MoreHorizontal size={15} />
            </button>

            {open && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                <div
                  className="fixed z-50 min-w-[190px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
                  style={{ top: dropPos?.top ?? 0, right: dropPos?.right ?? 0 }}
                >
                  {!isConfirmed && (
                    <button
                      onClick={handleResend}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                    >
                      <Mail size={14} className="text-blue-500" />
                      Renvoyer la confirmation
                    </button>
                  )}
                  <button
                    onClick={handleResetPassword}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <KeyRound size={14} className="text-orange-500" />
                    Envoyer reset mot de passe
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {error ? <p className="max-w-[220px] text-right text-[11px] text-red-600">{error}</p> : null}
    </div>
  );
}
