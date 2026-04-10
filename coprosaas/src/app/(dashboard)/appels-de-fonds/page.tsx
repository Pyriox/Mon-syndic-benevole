// ============================================================
// Page : Appels de fonds
// ============================================================
import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Appels de fonds' };

import { createClient } from '@/lib/supabase/server';
import { requireCoproAccess } from '@/lib/supabase/require-copro-access';
import Link from 'next/link';
import EmptyState from '@/components/ui/EmptyState';
import AppelFondsActions from './AppelFondsActions';
import AppelFondsCard from './AppelFondsCard';
import AppelFondsSerieCard from './AppelFondsSerieCard';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { Wallet } from 'lucide-react';
import { hasChargesSpecialesAddon, isSubscribed } from '@/lib/subscription';
import UpgradeBanner from '@/components/ui/UpgradeBanner';
import ReadOnlyBanner from '@/components/ui/ReadOnlyBanner';
import PageHelp from '@/components/ui/PageHelp';

interface Poste { libelle: string; categorie: string; montant: number }

function parsePostes(description: string | null | undefined): Poste[] | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && 'libelle' in parsed[0]) return parsed;
  } catch { /* not JSON */ }
  return null;
}

// Extrait la clé de série et le numéro (ex. "Appel 2026 — 2/4" → { base: "Appel 2026", n: 2, total: 4 })
function parseSerie(titre: string): { base: string; n: number; total: number } | null {
  const m = titre.match(/^(.+) — (\d+)\/(\d+)$/);
  if (!m) return null;
  return { base: m[1], n: parseInt(m[2]), total: parseInt(m[3]) };
}

export default async function AppelsDeFondsPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { user, selectedCoproId, role: userRole, copro: copropriete } = await requireCoproAccess();

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];
  const db = supabase; // Les RLS policies autorisent la lecture pour les deux rôles

  const [{ data: appels }, { data: coproAddons }] = await Promise.all([
    db
      .from('appels_de_fonds')
      .select('*, coproprietes(nom), lignes_appels_de_fonds(id, montant_du, regularisation_ajustement, paye, date_paiement, coproprietaires(id, nom, prenom))')
      .eq('copropriete_id', selectedCoproId ?? 'none')
      .gte('date_echeance', `${annee}-01-01`)
      .lt('date_echeance', `${annee + 1}-01-01`)
      .order('date_echeance', { ascending: true }),
    db
      .from('copro_addons')
      .select('addon_key, status, current_period_end, cancel_at_period_end')
      .eq('copropriete_id', selectedCoproId ?? 'none'),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // role === null = nouveau compte sans copropriété → traité comme syndic (cohérent avec le layout)
  const isSyndic = userRole === 'syndic' || userRole === null;
  const canWrite = isSubscribed(copropriete?.plan);
  const specialChargesEnabled = hasChargesSpecialesAddon(coproAddons ?? []);

  // ── Calculer les stats par appel ──────────────────────────────────────────
  type AppelWithStats = {
    appel: NonNullable<typeof appels>[number];
    lignes: ReturnType<typeof normaliseLignes>;
    postes: Poste[] | null;
    nbPayes: number;
    nbImpayes: number;
    pctPaye: number;
  };

  const normaliseLignes = (raw: unknown[]) =>
    raw.map((l: unknown) => {
      const ligne = l as Record<string, unknown>;
      return {
        ...ligne,
        coproprietaires: Array.isArray(ligne.coproprietaires) ? (ligne.coproprietaires[0] ?? null) : ligne.coproprietaires,
      };
    });

  const withStats: AppelWithStats[] = (appels ?? []).map((appel) => {
    const lignes = normaliseLignes((appel.lignes_appels_de_fonds ?? []) as unknown[]);
    const nbPayes = lignes.filter((l) => (l as unknown as { paye: boolean }).paye).length;
    const echeance = new Date(appel.date_echeance);
    echeance.setHours(0, 0, 0, 0);
    const echeancePlusGrace = new Date(echeance);
    echeancePlusGrace.setDate(echeancePlusGrace.getDate() + 15);
    const nbImpayes = today > echeancePlusGrace ? lignes.filter((l) => !(l as unknown as { paye: boolean }).paye).length : 0;
    const pctPaye = lignes.length > 0 ? Math.round((nbPayes / lignes.length) * 100) : 0;
    return { appel, lignes: lignes as ReturnType<typeof normaliseLignes>, postes: parsePostes(appel.description), nbPayes, nbImpayes, pctPaye };
  });

  // ── Grouper les séries ────────────────────────────────────────────────────
  // Une série = appels partageant le même ag_resolution_id (non null) ET dont le titre finit en "— N/M"
  type SerieGroup = {
    key: string;
    serieTitre: string;
    agResolutionId: string;
    items: AppelWithStats[];
  };

  const seriesMap = new Map<string, SerieGroup>();
  const singles: AppelWithStats[] = [];

  for (const item of withStats) {
    const parsed = parseSerie(item.appel.titre);
    if (parsed && item.appel.ag_resolution_id) {
      const key = `${item.appel.ag_resolution_id}__${parsed.base}`;
      if (!seriesMap.has(key)) {
        seriesMap.set(key, { key, serieTitre: parsed.base, agResolutionId: item.appel.ag_resolution_id, items: [] });
      }
      seriesMap.get(key)!.items.push(item);
    } else {
      singles.push(item);
    }
  }

  // Les series avec un seul élément sont traitées comme singles
  const confirmedSeries: SerieGroup[] = [];
  for (const serie of seriesMap.values()) {
    if (serie.items.length > 1) {
      serie.items.sort((a, b) => {
        const pa = parseSerie(a.appel.titre);
        const pb = parseSerie(b.appel.titre);
        return (pa?.n ?? 0) - (pb?.n ?? 0);
      });
      confirmedSeries.push(serie);
    } else {
      singles.push(...serie.items);
    }
  }

  const totalCount = confirmedSeries.length + singles.length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* ── Bandeau lecture seule ── */}
      {isSyndic && !canWrite && <ReadOnlyBanner />}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appels de fonds</h2>
          <p className="text-gray-500 mt-1">{totalCount} appel(s) de fonds</p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          {isSyndic && totalCount > 0 && (canWrite ? <AppelFondsActions coproprietes={coproprietes ?? []} specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner compact />)}
        </div>
      </div>

      <PageHelp tone={isSyndic ? 'blue' : 'slate'}>
        {isSyndic
          ? 'Les appels de fonds correspondent aux provisions demandées aux copropriétaires pour financer le budget voté en AG et les dépenses à venir.'
          : 'Consultez ici vos avis de paiement, leurs échéances et l’état de vos règlements pour l’exercice en cours.'}
      </PageHelp>

      {isSyndic && canWrite && !specialChargesEnabled && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Les appels ciblés par bâtiment ou clé spéciale nécessitent l&apos;option <strong>Charges spéciales</strong>. Vous pouvez l&apos;activer depuis <Link href="/abonnement" className="font-semibold underline underline-offset-2">Abonnement</Link>.
        </div>
      )}

      {totalCount > 0 ? (
        <div className="space-y-3">
          {/* Séries */}
          {confirmedSeries.map((serie) => (
            <AppelFondsSerieCard
              key={serie.key}
              serieTitre={serie.serieTitre}
              agResolutionId={serie.agResolutionId}
              total={serie.items.reduce((s, i) => s + i.appel.montant_total, 0)}
              appels={serie.items.map((item) => ({
                id: item.appel.id,
                titre: item.appel.titre,
                montant_total: item.appel.montant_total,
                date_echeance: item.appel.date_echeance,
                nbPayes: item.nbPayes,
                nbImpayes: item.nbImpayes,
                pctPaye: item.pctPaye,
                lignesCount: item.lignes.length,
              }))}
              appelCards={serie.items.map((item) => (
                <AppelFondsCard
                  key={item.appel.id}
                  appel={{ ...item.appel, copropriete_id: selectedCoproId ?? undefined }}
                  lignes={item.lignes as Parameters<typeof AppelFondsCard>[0]['lignes']}
                  postes={item.postes}
                  isSyndic={isSyndic}
                  canWrite={canWrite}
                  nbPayes={item.nbPayes}
                  nbImpayes={item.nbImpayes}
                  pctPaye={item.pctPaye}
                />
              ))}
            />
          ))}

          {/* Appels individuels */}
          {singles.map((item) => (
            <AppelFondsCard
              key={item.appel.id}
              appel={{ ...item.appel, copropriete_id: selectedCoproId ?? undefined }}
              lignes={item.lignes as Parameters<typeof AppelFondsCard>[0]['lignes']}
              postes={item.postes}
              isSyndic={isSyndic}
              canWrite={canWrite}
              nbPayes={item.nbPayes}
              nbImpayes={item.nbImpayes}
              pctPaye={item.pctPaye}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet size={48} strokeWidth={1.5} />}
          title="Aucun appel de fonds"
          description={isSyndic ? "Créez un appel de fonds pour répartir les charges entre les copropriétaires." : undefined}
          action={isSyndic && (canWrite ? <AppelFondsActions coproprietes={coproprietes ?? []} showLabel specialChargesEnabled={specialChargesEnabled} /> : <UpgradeBanner />)}
        />
      )}
    </div>
  );
}