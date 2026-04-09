// ============================================================
// Page : Liste des copropriétés
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Coproprietes' };

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/ui/EmptyState';
import { ArrowRight, Building2, Hash, MapPin, Plus, Settings2 } from 'lucide-react';

export default async function CopropriétésPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id, nom, adresse, code_postal, ville, nombre_lots, created_at')
    .eq('syndic_id', user.id)
    .order('created_at', { ascending: false });

  const coproIds = (coproprietes ?? []).map((c) => c.id);
  const lotsByCopro = new Map<string, number>();
  if (coproIds.length > 0) {
    const { data: lots } = await supabase
      .from('lots')
      .select('copropriete_id')
      .in('copropriete_id', coproIds);

    for (const lot of lots ?? []) {
      const coproId = lot.copropriete_id as string;
      lotsByCopro.set(coproId, (lotsByCopro.get(coproId) ?? 0) + 1);
    }
  }

  const coproCount = coproprietes?.length ?? 0;
  const totalLots = (coproprietes ?? []).reduce((sum, copro) => {
    const lotsCount = lotsByCopro.has(copro.id)
      ? (lotsByCopro.get(copro.id) ?? 0)
      : (copro.nombre_lots ?? 0);
    return sum + lotsCount;
  }, 0);
  const emptyCopros = (coproprietes ?? []).filter((copro) => {
    const lotsCount = lotsByCopro.has(copro.id)
      ? (lotsByCopro.get(copro.id) ?? 0)
      : (copro.nombre_lots ?? 0);
    return lotsCount === 0;
  }).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Copropriétés</h2>
          <p className="mt-1 text-gray-500">
            Retrouvez chaque copropriété, sa vue d&apos;ensemble et son paramétrage en un clic.
          </p>
        </div>
        <Link href="/coproprietes/nouvelle">
          <Button>
            <Plus size={16} /> Nouvelle copropriété
          </Button>
        </Link>
      </div>

      {coproCount > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card padding="sm" className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Copropriétés</p>
              <p className="text-lg font-bold text-gray-900">{coproCount}</p>
            </div>
          </Card>

          <Card padding="sm" className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5">
              <Hash size={18} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Lots suivis</p>
              <p className="text-lg font-bold text-gray-900">{totalLots}</p>
            </div>
          </Card>

          <Card padding="sm" className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-50 p-2.5">
              <Settings2 size={18} className="text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">À compléter</p>
              <p className="text-lg font-bold text-gray-900">{emptyCopros}</p>
            </div>
          </Card>
        </div>
      )}

      {coproCount > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Vos copropriétés</h3>
            <p className="text-sm text-gray-500">
              Ouvrez la vue d&apos;ensemble pour piloter la copro ou allez directement au paramétrage des clés de répartition.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {(coproprietes ?? []).map((copro) => {
              const lotsCount = lotsByCopro.has(copro.id)
                ? (lotsByCopro.get(copro.id) ?? 0)
                : (copro.nombre_lots ?? 0);

              return (
                <Card key={copro.id} className="flex h-full flex-col border-gray-200">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-100 p-2.5">
                      <Building2 size={22} className="text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-gray-900">{copro.nom}</h3>
                      <p className="mt-1 text-xs text-gray-500">Gestion centralisée de la copropriété</p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 text-sm text-gray-600">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span>{copro.adresse}, {copro.code_postal} {copro.ville}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Hash size={14} className="shrink-0" />
                      <span>{lotsCount} lot{lotsCount > 1 ? 's' : ''}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Link href={`/coproprietes/${copro.id}`}>
                      <Button className="w-full" size="sm">
                        Vue d&apos;ensemble <ArrowRight size={14} />
                      </Button>
                    </Link>
                    <Link href={`/coproprietes/${copro.id}/parametrage`}>
                      <Button variant="secondary" className="w-full" size="sm">
                        <Settings2 size={14} /> Paramétrage
                      </Button>
                    </Link>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={<Building2 size={48} strokeWidth={1.5} />}
          title="Aucune copropriété"
          description="Créez votre première copropriété pour commencer à gérer vos charges et copropriétaires."
          action={
            <Link
              href="/coproprietes/nouvelle"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
            >
              <Plus size={16} /> Nouvelle copropriété
            </Link>
          }
        />
      )}
    </div>
  );
}
