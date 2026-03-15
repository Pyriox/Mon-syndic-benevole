// ============================================================
// Page : Nouvelle copropriété — Formulaire de création
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NouvelleCopropriétéPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    code_postal: '',
    ville: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Récupération de l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/login');
      return;
    }

    const { error: dbError } = await supabase.from('coproprietes').insert({
      nom: formData.nom.trim(),
      adresse: formData.adresse.trim(),
      code_postal: formData.code_postal.trim(),
      ville: formData.ville.trim(),
      syndic_id: user.id,
    });

    if (dbError) {
      setError('Erreur lors de la création : ' + dbError.message);
      setLoading(false);
      return;
    }

    // Redirection vers la liste après création
    router.push('/coproprietes');
    router.refresh();
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      {/* Lien retour */}
      <Link href="/coproprietes" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> Retour aux copropriétés
      </Link>

      <div>
        <h2 className="text-2xl font-bold text-gray-900">Nouvelle copropriété</h2>
        <p className="text-gray-500 mt-1">Renseignez les informations de la copropriété.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nom de la copropriété"
            name="nom"
            value={formData.nom}
            onChange={handleChange}
            placeholder="Résidence Les Cerisiers"
            required
          />

          <Input
            label="Adresse"
            name="adresse"
            value={formData.adresse}
            onChange={handleChange}
            placeholder="12 rue de la Paix"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Code postal"
              name="code_postal"
              value={formData.code_postal}
              onChange={handleChange}
              placeholder="75001"
              maxLength={5}
              required
            />
            <Input
              label="Ville"
              name="ville"
              value={formData.ville}
              onChange={handleChange}
              placeholder="Paris"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="submit" loading={loading}>
              Créer la copropriété
            </Button>
            <Link href="/coproprietes">
              <Button type="button" variant="secondary">Annuler</Button>
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}
