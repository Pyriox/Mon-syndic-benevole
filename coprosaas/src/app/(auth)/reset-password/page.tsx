// ============================================================
// Page de réinitialisation du mot de passe
// Accessible via le lien envoyé par email (Supabase)
// ============================================================
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SiteLogo from '@/components/ui/SiteLogo';
import { ArrowLeft, ShieldCheck } from 'lucide-react';

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [ready, setReady] = useState(false);       // session PASSWORD_RECOVERY active
  const [invalid, setInvalid] = useState(false);   // lien invalide ou expiré
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Supabase envoie le token dans le hash de l'URL (flow implicite)
  // ou établit la session côté serveur via /auth/confirm (flow PKCE).
  // On accepte PASSWORD_RECOVERY (implicite) OU une session existante (PKCE).
  useEffect(() => {
    // Flow PKCE : session déjà établie par /auth/confirm avant la redirection
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    // Si aucune session et aucun événement après 5 s : lien invalide ou expiré
    const timer = setTimeout(() => {
      setReady((prev) => {
        if (!prev) setInvalid(true);
        return prev;
      });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [supabase]);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const { error: updateErr } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateErr) {
      setError('Une erreur est survenue. Veuillez réessayer ou demander un nouveau lien.');
      return;
    }

    setDone(true);
    setTimeout(() => router.push('/login'), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">

      {/* Barre de navigation */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <SiteLogo size={30} />
          <span className="font-bold text-gray-900 text-sm">Mon Syndic Bénévole</span>
        </Link>
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à la connexion
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          <div className="text-center mb-8">
            <div className="inline-flex mb-4">
              <SiteLogo size={56} />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nouveau mot de passe</h1>
            <p className="text-gray-500 mt-1 text-sm">Choisissez un mot de passe sécurisé</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">

            {/* ── Succès ── */}
            {done && (
              <div className="text-center py-4 space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto">
                  <ShieldCheck size={28} className="text-green-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-lg">Mot de passe mis à jour !</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Vous allez être redirigé vers la page de connexion…
                  </p>
                </div>
              </div>
            )}

            {/* ── Lien invalide / expiré ── */}
            {!done && invalid && (
              <div className="text-center py-4 space-y-4">
                <p className="text-red-600 font-medium">Ce lien est invalide ou a expiré.</p>
                <p className="text-sm text-gray-500">
                  Veuillez faire une nouvelle demande de réinitialisation depuis la page de connexion.
                </p>
                <Link
                  href="/login"
                  className="inline-block text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  ← Retour à la connexion
                </Link>
              </div>
            )}

            {/* ── Chargement détection session ── */}
            {!done && !invalid && !ready && (
              <div className="text-center py-8 text-sm text-gray-400">
                Vérification du lien en cours…
              </div>
            )}

            {/* ── Formulaire ── */}
            {!done && !invalid && ready && (
              <form onSubmit={handleReset} className="space-y-4">
                <Input
                  label="Nouveau mot de passe"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="8 caractères minimum"
                  required
                  autoComplete="new-password"
                />
                <Input
                  label="Confirmer le mot de passe"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="new-password"
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Enregistrer le mot de passe
                </Button>
              </form>
            )}
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}
