// ============================================================
// Page de réinitialisation du mot de passe
// Accessible via le lien envoyé par email (Supabase)
//
// Stratégie anti-scanner (Gmail, Outlook Safe Links…) :
// verifyOtp() n'est JAMAIS appelé automatiquement au chargement
// de la page. Il est déclenché uniquement par un clic explicite
// de l'utilisateur. Les scanners d'email ne cliquent pas sur
// des boutons — ils ne peuvent donc pas consommer le token.
// ============================================================
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SiteLogo from '@/components/ui/SiteLogo';
import { ArrowLeft, ShieldCheck, KeyRound } from 'lucide-react';

type Stage =
  | 'verify_prompt'   // token_hash présent, en attente du clic utilisateur
  | 'verifying'       // verifyOtp en cours
  | 'form'            // session active, formulaire de MDP
  | 'invalid'         // token expiré ou invalide
  | 'done';           // MDP mis à jour avec succès

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [stage, setStage] = useState<Stage>('verifying');
  const [tokenHash, setTokenHash] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const hash = searchParams.get('token_hash');
    const type = searchParams.get('type');

    if (hash && type === 'recovery') {
      // Token présent : on attend l'action explicite de l'utilisateur
      // (ne PAS appeler verifyOtp ici — les scanners chargeraient la page sans cliquer)
      setTokenHash(hash);
      setStage('verify_prompt');
      return;
    }

    // Pas de token_hash : l'utilisateur est peut-être arrivé directement
    // ou via un flow implicite avec une session déjà établie.
    void supabase.auth.getSession().then((result) => {
      if (result.data.session) {
        setStage('form');
      } else {
        setStage('invalid');
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVerify = async () => {
    if (!tokenHash) return;
    setStage('verifying');
    const { error: otp_err } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
    if (otp_err) {
      setStage('invalid');
    } else {
      setStage('form');
    }
  };

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
      setError('Impossible de mettre à jour le mot de passe. Réessayez, puis demandez un nouveau lien si le problème persiste.');
      return;
    }

    setStage('done');
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
            {stage === 'done' && (
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
            {stage === 'invalid' && (
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

            {/* ── Vérification en cours ── */}
            {stage === 'verifying' && (
              <div className="text-center py-8 text-sm text-gray-600">
                Vérification du lien en cours…
              </div>
            )}

            {/* ── Invite à cliquer (anti-scanner) ── */}
            {stage === 'verify_prompt' && (
              <div className="text-center space-y-5">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-100 mx-auto">
                  <KeyRound size={28} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Votre lien est prêt</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Cliquez sur le bouton ci-dessous pour choisir votre nouveau mot de passe.
                  </p>
                </div>
                <Button onClick={handleVerify} fullWidth size="lg">
                  Choisir mon nouveau mot de passe
                </Button>
              </div>
            )}

            {/* ── Formulaire ── */}
            {stage === 'form' && (
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

          <p className="text-center text-xs text-gray-500 mt-6">
            © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}

