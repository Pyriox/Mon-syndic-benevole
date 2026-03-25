'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { ArrowRightLeft, AlertTriangle } from 'lucide-react';

interface TransfertSyndicProps {
  coproprieteId: string;
  coproprieteNom: string;
}

export default function TransfertSyndic({ coproprieteId, coproprieteNom }: TransfertSyndicProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const CONFIRM_TEXT = coproprieteNom;

  const handleClose = () => {
    setIsOpen(false);
    setEmail('');
    setConfirm('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (confirm.trim() !== CONFIRM_TEXT) {
      setError(`Veuillez saisir exactement "${CONFIRM_TEXT}" pour confirmer.`);
      return;
    }

    setLoading(true);

    const res = await fetch(`/api/coproprietes/${coproprieteId}/transferer-syndic`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? 'Erreur lors du transfert');
      setLoading(false);
      return;
    }

    // Transfert réussi — le syndic actuel n'a plus accès à cette copropriété
    handleClose();
    router.push('/coproprietes');
    router.refresh();
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 text-sm text-amber-600 hover:text-amber-700 font-medium border border-amber-300 hover:border-amber-400 bg-amber-50 hover:bg-amber-100 rounded-lg px-3 py-1.5 transition-colors"
      >
        <ArrowRightLeft size={14} />
        Transférer la gestion
      </button>

      <Modal isOpen={isOpen} onClose={handleClose} title="Transférer la gestion du syndicat">
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Avertissement */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            <AlertTriangle size={16} className="shrink-0 mt-0.5 text-amber-700" />
            <div>
              <p className="font-semibold mb-1">Action irréversible</p>
              <p className="text-xs leading-relaxed">
                Vous allez transférer la gestion de <strong>{coproprieteNom}</strong> à un autre compte.
                Vous perdrez immédiatement l&apos;accès à cette copropriété.
              </p>
            </div>
          </div>

          {/* Email du nouveau syndic */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email du nouveau syndic
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nouveau-syndic@exemple.fr"
              required
              autoComplete="off"
            />
            <p className="text-xs text-gray-400 mt-1">
              Le nouveau syndic doit déjà avoir un compte sur cette plateforme.
            </p>
          </div>

          {/* Confirmation par nom de copropriété */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirmez en saisissant le nom de la copropriété
            </label>
            <Input
              type="text"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={CONFIRM_TEXT}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Saisissez exactement : <span className="font-medium text-gray-600">{CONFIRM_TEXT}</span>
            </p>
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={handleClose} disabled={loading}>
              Annuler
            </Button>
            <Button
              type="submit"
              loading={loading}
              disabled={!email || confirm.trim() !== CONFIRM_TEXT}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              <ArrowRightLeft size={14} /> Transférer la gestion
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
