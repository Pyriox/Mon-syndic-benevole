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
import { ArrowRight, MailCheck, Shield, Clock, TrendingUp } from 'lucide-react';

const REASSURANCES = [
  { icon: Shield,      text: 'Données sécurisées et hébergées en Europe' },
  { icon: Clock,       text: "Accès 24h/24 depuis n'importe quel appareil" },
  { icon: TrendingUp,  text: 'Mis à jour régulièrement, sans frais supplémentaires' },
];

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [mode, setMode] = useState<'login' | 'forgot'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden">

        {/* ── Panneau gauche ── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
          <div>
            <Link href="/" className="flex items-center gap-3 mb-12 group">
              <SiteLogo size={40} />
              <span className="font-bold text-lg tracking-tight">Mon Syndic Bénévole</span>
            </Link>

            <h2 className="text-3xl font-extrabold leading-tight mb-4">
              Bon retour<br />
              <span className="text-blue-200">parmi nous.</span>
            </h2>
            <p className="text-blue-100/80 text-sm leading-relaxed mb-10">
              Votre espace de gestion de copropriété vous attend.
              Toutes vos données, documents et assemblées en un seul endroit.
            </p>

            <ul className="space-y-4">
              {REASSURANCES.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="mt-0.5 w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-white" />
                  </div>
                  <span className="text-sm text-blue-50 leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-12 pt-8 border-t border-white/15">
            <p className="text-blue-200/60 text-xs">
              © {new Date().getFullYear()} Mon Syndic Bénévole · Tous droits réservés
            </p>
          </div>
        </div>

        {/* ── Panneau droit : formulaire ── */}
        <div className="bg-white flex flex-col justify-center p-10 lg:p-12">

          {/* Lien retour landing */}
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="flex items-center justify-center gap-2.5 lg:hidden">
              <SiteLogo size={36} />
              <span className="font-bold text-gray-800">Mon Syndic Bénévole</span>
            </Link>
            <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors ml-auto">
              ← Retour à l&apos;accueil
            </Link>
          </div>

          {/* ── MODE CONNEXION ── */}
          {mode === 'login' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Connexion</h1>
                <p className="text-sm text-gray-500">
                  Pas encore de compte ?{' '}
                  <Link href="/register" className="text-blue-600 hover:underline font-medium">
                    Créer un compte
                  </Link>
                </p>
              </div>

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
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div className="pt-1">
                  <Button type="submit" fullWidth loading={loading} size="lg">
                    <span>Se connecter</span>
                    <ArrowRight size={16} />
                  </Button>
                </div>
              </form>

              <p className="text-center text-xs text-gray-400 mt-8">
                © {new Date().getFullYear()} Mon Syndic Bénévole
              </p>
            </>
          )}

          {/* ── MODE MOT DE PASSE OUBLIÉ ── */}
          {mode === 'forgot' && (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
                  {resetSent ? 'Email envoyé !' : 'Mot de passe oublié ?'}
                </h1>
                <p className="text-sm text-gray-500">
                  {resetSent
                    ? 'Vérifiez votre boîte de réception (et vos spams).'
                    : 'Saisissez votre email pour recevoir un lien de réinitialisation.'}
                </p>
              </div>

              {resetSent ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-5 rounded-2xl bg-green-50 border border-green-100">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <MailCheck size={22} className="text-green-600" />
                    </div>
                    <p className="text-sm text-green-800 leading-relaxed">
                      Un lien a été envoyé à{' '}
                      <strong className="text-green-900">{resetEmail}</strong>.
                    </p>
                  </div>
                  <button
                    onClick={() => setMode('login')}
                    className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
                  >
                    ← Retour à la connexion
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-4">
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
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      {resetError}
                    </div>
                  )}

                  <div className="pt-1">
                    <Button type="submit" fullWidth loading={resetLoading} size="lg">
                      <span>Envoyer le lien</span>
                      <ArrowRight size={16} />
                    </Button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full text-center text-sm text-gray-500 hover:text-gray-700 transition-colors pt-1"
                  >
                    ← Retour à la connexion
                  </button>
                </form>
              )}

              <p className="text-center text-xs text-gray-400 mt-8">
                © {new Date().getFullYear()} Mon Syndic Bénévole
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  );
}

