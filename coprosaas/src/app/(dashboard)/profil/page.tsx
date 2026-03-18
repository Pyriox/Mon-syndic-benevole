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
import { ProfilEditActions, LotsActions, SecurityActions } from './ProfilActions';
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
              <p className="font-medium text-blue-700">Syndic bénévole</p>
            </div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <SecurityActions currentEmail={email} />
        </div>
      </Card>

      {/* ---- Identité liée à la copropriété en cours ---- */}
      {selectedCopro ? (
        <Card>
          <CardHeader
            title={`Mon identité — ${selectedCopro.nom}`}
            description="Vos informations en tant que copropriétaire sur cette copropriété"
            actions={
              <ProfilEditActions
                fiche={ficheSelectionnee}
                selectedCoproId={selectedCoproId}
                selectedCoproNom={selectedCopro.nom}
                userEmail={email}
                fullName={fullName}
              />
            }
          />
          <div className="space-y-2 mt-4">
            {ficheSelectionnee ? (
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-gray-400 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400 leading-none mb-0.5">Identité</p>
                  <p className="font-medium text-gray-900">
                    {ficheSelectionnee.raison_sociale
                      ? ficheSelectionnee.raison_sociale
                      : `${ficheSelectionnee.prenom ?? ''} ${ficheSelectionnee.nom ?? ''}`.trim() || <span className="text-gray-400 italic">Non renseigné</span>}
                  </p>
                  {ficheSelectionnee.raison_sociale && (ficheSelectionnee.prenom || ficheSelectionnee.nom) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      Représentant : {`${ficheSelectionnee.prenom ?? ''} ${ficheSelectionnee.nom ?? ''}`.trim()}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">
                Aucune fiche copropriétaire pour cette copropriété.{' '}
                <span className="text-blue-600">Cliquez sur « Modifier » pour en créer une.</span>
              </p>
            )}
          </div>
        </Card>
      ) : null}

      {/* ---- Statut copropriétaire (lots) ---- */}
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
    </div>
  );
}
