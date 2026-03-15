// ============================================================
// Page : Détail d'une copropriété + gestion des lots
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Card, { CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import LotActions, { LotDelete } from './LotActions';
import LotsTable from './LotsTable';
import CoproDelete from './CoproDelete';
import { formatDate } from '@/lib/utils';
import { MapPin, Hash, CalendarDays } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function CopropriétéDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Récupération de la copropriété
  const { data: copro } = await supabase
    .from('coproprietes')
    .select('*')
    .eq('id', id)
    .eq('syndic_id', user.id)   // Sécurité : seul le syndic propriétaire peut voir
    .single();

  if (!copro) notFound();

  // Récupération des lots (sans join implicite pour éviter les problèmes de FK)
  const { data: lots } = await supabase
    .from('lots')
    .select('*')
    .eq('copropriete_id', id)
    .order('position', { ascending: true, nullsFirst: false });

  // Copropriétaires de cette copropriété (pour afficher le nom dans le tableau)
  const { data: coproprietaires } = await supabase
    .from('coproprietaires')
    .select('id, nom, prenom, raison_sociale')
    .eq('copropriete_id', id);
  const coproMap = Object.fromEntries((coproprietaires ?? []).map((c) => [c.id, c]));

  // Calcul du total des tantièmes
  const totalTantiemes = lots?.reduce((sum, lot) => sum + (lot.tantiemes ?? 0), 0) ?? 0;

  return (
    <div className="space-y-6">


      {/* En-tête */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{copro.nom}</h2>
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin size={14} /> {copro.adresse}, {copro.code_postal} {copro.ville}
            </span>
            <span className="flex items-center gap-1">
              <Hash size={14} /> {lots?.length ?? 0} lots
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={14} /> Créée le {formatDate(copro.created_at)}
            </span>
          </div>
        </div>
        <CoproDelete coproprieteId={copro.id} coproprieteNom={copro.nom} />
      </div>

      {/* Carte des lots */}
      <Card>
        <CardHeader
          title="Lots"
          description={`${lots?.length ?? 0} lot(s) — Total tantièmes : ${totalTantiemes}`}
          actions={<LotActions coproprieteId={id} />}
        />

        {lots && lots.length > 0 ? (
          <LotsTable initialLots={lots} coproMap={coproMap} coproprieteId={id} />
        ) : (
          <EmptyState
            title="Aucun lot"
            description="Ajoutez les lots de cette copropriété (appartements, parkings, caves...)."
            action={<LotActions coproprieteId={id} showLabel />}
          />
        )}
      </Card>


    </div>
  );
}
