'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cloturerExercice } from './actions';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { Lock, AlertTriangle } from 'lucide-react';

export default function CloturerButton({ exerciceId }: { exerciceId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCloturer = async () => {
    setLoading(true);
    setError('');
    const result = await cloturerExercice(exerciceId);
    if (result.error) { setError(result.error); setLoading(false); return; }
    setOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Lock size={14} />
        Clôturer l&apos;exercice
      </Button>

      <Modal isOpen={open} onClose={() => !loading && setOpen(false)} title="Clôturer l&apos;exercice">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-red-50 rounded-lg shrink-0">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <div>
              <p className="text-sm text-gray-700 leading-relaxed">
                La clôture est <strong>définitive et irréversible</strong>. Une fois clôturé,
                l&apos;exercice ne pourra plus être modifié.
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Assurez-vous que les comptes ont été approuvés en Assemblée Générale
                avant de procéder à la clôture.
              </p>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-1">
            <Button variant="danger" loading={loading} onClick={handleCloturer}>
              Confirmer la clôture
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={loading}>
              Annuler
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
