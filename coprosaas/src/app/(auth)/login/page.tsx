// ============================================================
// Page de connexion + récupération de mot de passe
// ============================================================
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SiteLogo from '@/components/ui/SiteLogo';
import { ArrowLeft, MailCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  // Mode : 'login' | 'forgot'
  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError('Email ou mot de passe incorrect. Veuillez réessayer.');
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);
    setResetError('');

    const { error: resetErr } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setResetLoading(false);

    if (resetErr) {
      setResetError('Une erreur est survenue. Vérifiez l\'adresse email et réessayez.');
      return;
    }

    setResetSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white flex flex-col">

      {/* Barre de navigation supérieure */}
      <nav className="w-full px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <SiteLogo size={30} />
          <span className="font-bold text-gray-900 text-sm">Mon Syndic Bénévole</span>
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Retour à l'accueil
        </Link>
      </nav>

      {/* Contenu centré */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">

          {/* Logo + accroche */}
          <div className="text-center mb-8">
            <div className="inline-flex mb-4">
              <SiteLogo size={56} />
            </div>
            {mode === 'login' ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Connexion</h1>
                <p className="text-gray-500 mt-1 text-sm">Votre espace Mon Syndic Bénévole</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900">Mot de passe oublié</h1>
                <p className="text-gray-500 mt-1 text-sm">Recevez un lien de réinitialisation par email</p>
              </>
            )}
          </div>

          {/* ── MODE CONNEXION ── */}
          {mode === 'login' && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
              <form onSubmit={handleLogin} className="space-y-4">
                <Input
                  label="Adresse email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="syndic@copropriete.fr"
                  required
                  autoComplete="email"
                />

                <div>
                  <Input
                    label="Mot de passe"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <div className="mt-1.5 text-right">
                    <button
                      type="button"
                      onClick={() => { setMode('forgot'); setResetEmail(email); setResetSent(false); setResetError(''); }}
                      className="text-xs text-blue-500 hover:text-blue-700 transition-colors"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" fullWidth loading={loading} size="lg">
                  Se connecter
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">ou</span>
                </div>
              </div>

              <div className="text-center">
                <p className="text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-blue-600 hover:text-blue-700 font-medium underline-offset-2 hover:underline">
                    Créer un compte gratuitement
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ── MODE MOT DE PASSE OUBLIÉ ── */}
          {mode === 'forgot' && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/60 border border-gray-100 p-8">
              {resetSent ? (
                <div className="text-center py-4 space-y-4">
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-100 mx-auto">
                    <MailCheck size={28} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-lg">Email envoyé !</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Un lien de réinitialisation a été envoyé à{' '}
                      <span className="font-medium text-gray-700">{resetEmail}</span>.
                      Vérifiez votre boîte de réception (et vos spams).
                    </p>
                  </div>
                  <button
                    onClick={() => setMode('login')}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Saisissez votre adresse email. Vous recevrez un lien pour choisir un nouveau mot de passe.
                  </p>

                  <Input
                    label="Adresse email"
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="syndic@copropriete.fr"
                    required
                    autoComplete="email"
                  />

                  {resetError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                      {resetError}
                    </div>
                  )}

                  <Button type="submit" fullWidth loading={resetLoading} size="lg">
                    Envoyer le lien de réinitialisation
                  </Button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors pt-1"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}
            </div>
          )}

          <p className="text-center text-xs text-gray-400 mt-6">
            © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
          </p>
        </div>
      </div>
    </div>
  );
}

