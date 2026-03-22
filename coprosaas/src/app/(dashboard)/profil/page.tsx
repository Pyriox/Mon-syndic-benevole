// ============================================================
// Page : Profil du syndic
// - Sécurité (email, mot de passe)
// - Identité liée à la copropriété en cours
// - Statut de copropriétaire (lots)
// ============================================================
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import Card, { CardHeader } from '@/components/ui/Card';
import { ProfilEditActions, ProfilIdentiteEditor, LotsActions, SecurityActions } from './ProfilActions';
import { User, Building2, Mail, ShieldCheck } from 'lucide-react';

export default async function ProfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const fullName: string = user.user_metadata?.full_name ?? '';
  const email: string = user.email ?? '';

  const cookieStore = await cookies();
  const selectedCoproId = cookieStore.get('selected_copro_id')?.value ?? null;

  // Toutes les copropriétés gérées par ce syndic + leurs lots
  const { data: coproprietes } = await supabase
    .from('coproprietes')
    .select('id, nom, lots(id, numero, tantiemes, coproprietaire_id)')
    .eq('syndic_id', user.id)
    .order('nom');

  // Rôle déterminé depuis la DB (plus fiable que les métadonnées)
  const accountRole: 'syndic' | 'copropriétaire' = (coproprietes ?? []).length > 0 ? 'syndic' : 'copropriétaire';

  const selectedCopro = (coproprietes ?? []).find((c) => c.id === selectedCoproId) ?? null;

  // Fiche copropriétaire pour la copropriété en cours (cherche d'abord par user_id, puis par email)
  let ficheSelectionnee = null;
  if (selectedCoproId) {
    const { data: f1 } = await supabase
      .from('coproprietaires')
      .select('id, nom, prenom, raison_sociale, telephone, adresse, code_postal, ville')
      .eq('copropriete_id', selectedCoproId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (f1) {
      ficheSelectionnee = f1;
    } else {
      const { data: f2 } = await supabase
        .from('coproprietaires')
        .select('id, nom, prenom, raison_sociale, telephone, adresse, code_postal, ville')
        .eq('copropriete_id', selectedCoproId)
        .eq('email', email)
        .is('user_id', null)
        .maybeSingle();
      ficheSelectionnee = f2;
    }
  }

  const coproprieteIds = (coproprietes ?? []).map((c) => c.id);

  // Fiches copropriétaire pour la section "lots" (toutes les copros)
  const { data: fichesSyndic } = await supabase
    .from('coproprietaires')
    .select('id, copropriete_id, prenom, nom, telephone')
    .eq('user_id', user.id)
    .in('copropriete_id', coproprieteIds.length ? coproprieteIds : ['none']);

  // Pour les comptes copropriétaires : résoudre le nom de la copropriété sélectionnée
  // (selectedCopro est null pour eux car ils ne sont pas syndic_id de la copropriété)
  let selectedCoproNomAffiche: string | null = selectedCopro?.nom ?? null;
  if (!selectedCoproNomAffiche && selectedCoproId) {
    const { data: sc } = await supabase
      .from('coproprietes')
      .select('nom')
      .eq('id', selectedCoproId)
      .maybeSingle();
    selectedCoproNomAffiche = sc?.nom ?? null;
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Mon profil</h2>
        <p className="text-gray-500 mt-1">Gérez vos informations et la sécurité de votre compte.</p>
      </div>

      {/* ---- Mon compte (email + sécurité) ---- */}
      <Card>
        <CardHeader
          title="Mon compte"
          description="Informations de connexion"
        />
        <div className="space-y-3 mt-4">
          <div className="flex items-center gap-3 text-sm">
            <Mail size={16} className="text-gray-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 leading-none mb-0.5">Adresse email</p>
              <p className="font-medium text-gray-900">{email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <ShieldCheck size={16} className="text-blue-500 shrink-0" />
            <div>
              <p className="text-xs text-gray-400 leading-none mb-0.5">Rôle</p>
              <p className="font-medium text-blue-700">{accountRole === 'syndic' ? 'Syndic bénévole' : 'Copropriétaire'}</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <SecurityActions currentEmail={email} />
        </div>
      </Card>

      {/* ---- Identité liée à la copropriété en cours ---- */}
      {selectedCoproNomAffiche ? (
        <Card>
          <CardHeader
            title={`Mon identité — ${selectedCoproNomAffiche}`}
            description="Vos informations en tant que copropriétaire sur cette copropriété"
          />
          <div className="mt-4">
            <ProfilIdentiteEditor
              fiche={ficheSelectionnee}
              selectedCoproId={selectedCoproId}
              selectedCoproNom={selectedCoproNomAffiche ?? ''}
              userEmail={email}
              fullName={fullName}
            />
          </div>
        </Card>
      ) : null}

      {/* ---- Statut copropriétaire (lots) — syndic uniquement ---- */}
      {accountRole === 'syndic' && (
      <Card>
        <CardHeader
          title="Mon statut de copropriétaire"
          description="En tant que syndic bénévole, liez-vous à vos lots dans chaque copropriété"
        />

        {(coproprietes ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 italic mt-4">
            Aucune copropriété créée. Commencez par ajouter une copropriété.
          </p>
        ) : (
          <div className="space-y-3 mt-4">
            {(coproprietes ?? []).map((copropriete) => {
              const fiche = (fichesSyndic ?? []).find((f) => f.copropriete_id === copropriete.id);
              const lotsArray = Array.isArray(copropriete.lots) ? copropriete.lots : [];
              const myLots = lotsArray.filter((l) => l.coproprietaire_id === fiche?.id);

              return (
                <div
                  key={copropriete.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={16} className="text-blue-500 shrink-0" />
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{copropriete.nom}</p>
                      {myLots.length > 0 ? (
                        <div className="flex gap-1 mt-1 flex-wrap">
                          {myLots.map((lot) => (
                            <span
                              key={lot.id}
                              className="inline-flex items-center text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full"
                            >
                              Lot {lot.numero}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">Aucun lot associé</p>
                      )}
                    </div>
                  </div>
                  <LotsActions
                    copropriete={{ ...copropriete, lots: lotsArray }}
                    ficheSyndic={fiche}
                    userEmail={email}
                  />
                </div>
              );
            })}
          </div>
        )}
      </Card>
      )}
    </div>
  );
}
