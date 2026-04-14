'use client';

// Composant client : actions de confirmation e-mail sur la page détail utilisateur
import { useState } from 'react';
import { Loader2, MailCheck, ShieldCheck } from 'lucide-react';
import { AdminConfirmDialog } from './AdminActionDialog';

interface Props {
  userId: string;
  userEmail: string;
}

export default function AdminUserConfirmActions({ userId, userEmail }: Props) {
  const [resendDone, setResendDone] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [forceDone, setForceDone] = useState(false);

  const handleResend = async () => {
    if (resendLoading) return;
    setResendLoading(true);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resend_confirmation', email: userEmail }),
      });
      setResendDone(true);
    } finally {
      setResendLoading(false);
    }
  };

  const handleForceConfirm = async () => {
    setConfirmLoading(true);
    try {
      await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'force_confirm', userId }),
      });
      setForceDone(true);
    } finally {
      setConfirmLoading(false);
      setConfirmOpen(false);
    }
  };

  if (forceDone) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-xs font-medium text-emerald-700">
        <ShieldCheck size={12} /> Compte vérifié
      </span>
    );
  }

  return (
    <>
      <button
        onClick={handleResend}
        disabled={resendLoading || resendDone}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:border-red-300 disabled:opacity-60 transition-all"
      >
        {resendLoading ? <Loader2 size={12} className="animate-spin" /> : <MailCheck size={12} />}
        {resendDone ? 'E-mail envoyé' : 'Renvoyer e-mail'}
      </button>

      <button
        onClick={() => setConfirmOpen(true)}
        disabled={confirmLoading}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-700 hover:border-red-300 disabled:opacity-60 transition-all"
      >
        {confirmLoading ? <Loader2 size={12} className="animate-spin" /> : <ShieldCheck size={12} />}
        Forcer vérification
      </button>

      <AdminConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Forcer la vérification"
        description={<p>Marquer <strong>{userEmail}</strong> comme vérifié sans intervention de l'utilisateur ?</p>}
        confirmLabel="Vérifier le compte"
        onConfirm={handleForceConfirm}
        isLoading={confirmLoading}
      />
    </>
  );
}
