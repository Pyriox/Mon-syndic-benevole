'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateCopropriete } from './actions';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Pencil } from 'lucide-react';

interface CoproEditProps {
  coproprieteId: string;
  initialNom: string;
  initialAdresse: string;
  initialCodePostal: string;
  initialVille: string;
}

export default function CoproEdit({ coproprieteId, initialNom, initialAdresse, initialCodePostal, initialVille }: CoproEditProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    nom: initialNom,
    adresse: initialAdresse,
    code_postal: initialCodePostal,
    ville: initialVille,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await updateCopropriete({ coproprieteId, ...form });
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }
    setIsOpen(false);
    setLoading(false);
    router.refresh();
  };

  return (
    <>
      <Button variant="secondary" onClick={() => setIsOpen(true)}>
        <Pencil size={14} /> Modifier la copropriété
      </Button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Modifier la copropriété">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la copropriété"
            name="nom"
            value={form.nom}
            onChange={handleChange}
            required
          />
          <Input
            label="Adresse"
            name="adresse"
            value={form.adresse}
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code postal"
              name="code_postal"
              value={form.code_postal}
              onChange={handleChange}
              maxLength={5}
              required
            />
            <Input
              label="Ville"
              name="ville"
              value={form.ville}
              onChange={handleChange}
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>Enregistrer</Button>
            <Button type="button" variant="secondary" onClick={() => setIsOpen(false)}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
