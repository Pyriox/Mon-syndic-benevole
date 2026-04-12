'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Trash2, AlertTriangle } from 'lucide-react';

interface CoproDeleteProps {
  coproprieteId: string;
  coproprieteNom: string;
}

export default function CoproDelete({ coproprieteId, coproprieteNom }: CoproDeleteProps) {
  const router = useRouter();
  const supabase = createClient();

  const [isOpen, setIsOpen] = useState(false);
  const [confirmName, setConfirmName] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Vérification par saisie du nom de la copropriété
    if (confirmName.trim() !== coproprieteNom) {
      setError('Le nom saisi ne correspond pas. Vérifiez la casse et les espaces.');
      setLoading(false);
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { error: passwordError } = await supabase.auth.signInWithPassword({
      email: user.email ?? '',
      password,
    });
    if (passwordError) {
      setError('Mot de passe incorrect.');
      setLoading(false);
      return;
    }

    // Suppression en cascade : coproprietaires, lots, dépenses, appels, incidents, assemblées, documents, dossiers
    await supabase.from('repartitions_depenses').delete().in(
      'depense_id',
      (await supabase.from('depenses').select('id').eq('copropriete_id', coproprieteId)).data?.map((d) => d.id) ?? []
    );
    await supabase.from('depenses').delete().eq('copropriete_id', coproprieteId);

    await supabase.from('lignes_appels_de_fonds').delete().in(
      'appel_id',
      (await supabase.from('appels_de_fonds').select('id').eq('copropriete_id', coproprieteId)).data?.map((a) => a.id) ?? []
    );
    await supabase.from('appels_de_fonds').delete().eq('copropriete_id', coproprieteId);

    const resolutionRows = await supabase.from('resolutions').select('id').in(
      'ag_id',
      (await supabase.from('assemblees_generales').select('id').eq('copropriete_id', coproprieteId)).data?.map((a) => a.id) ?? []
    );
    if ((resolutionRows.data?.length ?? 0) > 0) {
      await supabase.from('resolutions').delete().in('id', resolutionRows.data!.map((r) => r.id));
    }
    await supabase.from('assemblees_generales').delete().eq('copropriete_id', coproprieteId);

    await supabase.from('incidents').delete().eq('copropriete_id', coproprieteId);
    await supabase.from('documents').delete().eq('copropriete_id', coproprieteId);
    await supabase.from('coproprietaires').delete().eq('copropriete_id', coproprieteId);
    await supabase.from('lots').delete().eq('copropriete_id', coproprieteId);

    // Suppression de la copropriété
    const { error: delError } = await supabase.from('coproprietes').delete().eq('id', coproprieteId);

    if (delError) {
      setError('Erreur lors de la suppression : ' + delError.message);
      setLoading(false);
      return;
    }

    router.push('/coproprietes');
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => { setIsOpen(true); setConfirmName(''); setPassword(''); setError(''); }}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg
                   text-red-600 hover:bg-red-50 border border-red-200 hover:border-red-300
                   transition-all duration-150"
      >
        <Trash2 size={15} />
        Supprimer la copropriété
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Supprimer la copropriété" size="md">
        <form onSubmit={handleDelete} className="space-y-5">

          {/* Avertissement */}
          <div className="flex gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-red-800 mb-1">
                Action irréversible
              </p>
              <p className="text-red-700">
                Vous êtes sur le point de supprimer définitivement la copropriété{' '}
                <strong>« {coproprieteNom} »</strong> ainsi que toutes les données associées :
              </p>
              <ul className="mt-2 space-y-0.5 text-red-600 list-disc list-inside">
                <li>Tous les copropriétaires</li>
                <li>Tous les lots</li>
                <li>Toutes les dépenses et répartitions</li>
                <li>Tous les appels de fonds</li>
                <li>Tous les incidents et travaux</li>
                <li>Toutes les assemblées générales</li>
                <li>Tous les documents</li>
              </ul>
            </div>
          </div>

          {/* Confirmation par saisie du nom */}
          <div>
            <Input
              label={`Tapez le nom de la copropriété pour confirmer : « ${coproprieteNom} »`}
              type="text"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              placeholder={coproprieteNom}
              required
              autoFocus
            />
          </div>

          <div>
            <Input
              label="Mot de passe actuel"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 font-medium">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <Button type="submit" loading={loading} variant="danger">
              Supprimer définitivement
            </Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
