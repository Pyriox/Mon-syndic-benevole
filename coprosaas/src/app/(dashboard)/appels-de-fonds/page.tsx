// ============================================================
// Page : Appels de fonds
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import EmptyState from '@/components/ui/EmptyState';
import AppelFondsActions from './AppelFondsActions';
import AppelFondsCard from './AppelFondsCard';
import AnneeSelector from '@/components/ui/AnneeSelector';
import { Wallet } from 'lucide-react';
import { cookies } from 'next/headers';

interface Poste { libelle: string; categorie: string; montant: number }

function parsePostes(description: string | null | undefined): Poste[] | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && 'libelle' in parsed[0]) return parsed;
  } catch { /* not JSON */ }
  return null;
}

export default async function AppelsDeFondsPage({ searchParams }: { searchParams: Promise<{ annee?: string }> }) {
  const { annee: anneeParam } = await searchParams;
  const annee = parseInt(anneeParam ?? String(new Date().getFullYear()));

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  const { data: copropriete } = selectedCoproId
    ? await supabase.from('coproprietes').select('id, nom, syndic_id').eq('id', selectedCoproId).maybeSingle()
    : { data: null };

  const coproprietes = copropriete ? [{ id: copropriete.id, nom: copropriete.nom }] : [];

  const { data: appels } = await supabase
    .from('appels_de_fonds')
    .select('*, coproprietes(nom), lignes_appels_de_fonds(id, montant_du, paye, date_paiement, coproprietaires(id, nom, prenom))')
    .eq('copropriete_id', selectedCoproId ?? 'none')
    .gte('created_at', `${annee}-01-01`)
    .lt('created_at', `${annee + 1}-01-01`)
    .order('created_at', { ascending: false });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isSyndic = copropriete?.syndic_id === user.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Appels de fonds</h2>
          <p className="text-gray-500 mt-1">{appels?.length ?? 0} appel(s) de fonds</p>
        </div>
        <div className="flex items-center gap-3">
          <AnneeSelector annee={annee} />
          <AppelFondsActions coproprietes={coproprietes ?? []} />
        </div>
      </div>

      {appels && appels.length > 0 ? (
        <div className="space-y-3">
          {appels.map((appel) => {
            const lignes = (appel.lignes_appels_de_fonds ?? []) as any[];
            const nbPayes = lignes.filter((l) => l.paye).length;
            const echeance = new Date(appel.date_echeance);
            echeance.setHours(0, 0, 0, 0);
            const nbImpayes = today > echeance ? lignes.filter((l) => !l.paye).length : 0;
            const pctPaye = lignes.length > 0 ? Math.round((nbPayes / lignes.length) * 100) : 0;

            return (
              <AppelFondsCard
                key={appel.id}
                appel={{ ...appel, copropriete_id: selectedCoproId ?? undefined }}
                lignes={lignes.map((l) => ({
                  ...l,
                  coproprietaires: Array.isArray(l.coproprietaires) ? (l.coproprietaires[0] ?? null) : l.coproprietaires,
                }))}
                postes={parsePostes(appel.description)}
                isSyndic={isSyndic}
                nbPayes={nbPayes}
                nbImpayes={nbImpayes}
                pctPaye={pctPaye}
              />
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Wallet size={48} strokeWidth={1.5} />}
          title="Aucun appel de fonds"
          description="Créez un appel de fonds pour répartir les charges entre les copropriétaires."
          action={<AppelFondsActions coproprietes={coproprietes ?? []} showLabel />}
        />
      )}
    </div>
  );
}