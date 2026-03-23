// ============================================================
// Page : Liste des copropriétés
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { Building2, Plus, MapPin, Hash } from 'lucide-react';

export default async function CopropriétésPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Récupération des copropriétés du syndic connecté
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('*')
    .eq('syndic_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétés</h2>
          <p className="text-gray-500 mt-1">
            {coproprietes?.length ?? 0} copropriété{(coproprietes?.length ?? 0) > 1 ? 's' : ''}
          </p>
        </div>
        <Link href="/coproprietes/nouvelle">
          <Button>
            <Plus size={16} /> Nouvelle copropriété
          </Button>
        </Link>
      </div>

      {/* Grille des copropriétés */}
      {coproprietes && coproprietes.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {coproprietes.map((copro) => (
            <Link
              key={copro.id}
              href={`/coproprietes/${copro.id}`}
              className="group"
            >
              <Card className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer h-full">
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2.5 bg-blue-100 rounded-xl">
                    <Building2 size={22} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate group-hover:text-blue-600">
                      {copro.nom}
                    </h3>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <MapPin size={14} className="shrink-0" />
                    <span className="truncate">{copro.adresse}, {copro.code_postal} {copro.ville}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Hash size={14} className="shrink-0" />
                    <span>{copro.nombre_lots} lot{copro.nombre_lots > 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Aucune copropriété"
          description="Créez votre première copropriété pour commencer à gérer vos charges et copropriétaires."
        />
      )}
    </div>
  );
}
