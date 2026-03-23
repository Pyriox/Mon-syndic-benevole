'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createExercice, calculerRegularisation } from './actions';
import Button from '@/components/ui/Button';
import { Calculator, RefreshCw } from 'lucide-react';

interface Props {
  coproprieteId: string;
  annee: number;
  exerciceId?: string;
  isRecalculate?: boolean;
}

export default function ExerciceCreate({ coproprieteId, annee, exerciceId, isRecalculate }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleClick = async () => {
    setLoading(true);
    setError('');

    let exId = exerciceId;
    if (!exId) {
      const result = await createExercice({ coproprieteId, annee });
      if (result.error) { setError(result.error); setLoading(false); return; }
      exId = result.exerciceId!;
    }

    const result = await calculerRegularisation(exId);
    if (result.error) { setError(result.error); setLoading(false); return; }

    setLoading(false);
    router.refresh();
  };

  return (
    <div>
      <Button onClick={handleClick} loading={loading} size="sm">
        {isRecalculate ? <RefreshCw size={14} /> : <Calculator size={14} />}
        {isRecalculate ? 'Recalculer' : `Calculer la régularisation ${annee}`}
      </Button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
