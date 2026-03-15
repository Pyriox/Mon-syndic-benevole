// ============================================================
// Page d'inscription
// - Sans token : inscription syndic uniquement
// - Avec ?token=xxx : inscription copropriétaire via invitation
// ============================================================
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SiteLogo from '@/components/ui/SiteLogo';
import { Lock } from 'lucide-react';

// ---- Formulaire (utilise useSearchParams → doit être dans Suspense) ----
function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [mode, setMode] = useState<'syndic' | 'coproprietaire' | 'loading' | 'invalid'>(
    () => token ? 'loading' : 'syndic'
  );
  const [invitationEmail, setInvitationEmail] = useState('');
  const [coproprieteNom, setCoproprieteNom] = useState('');

  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/invitations?token=${token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
          setMode('invalid');
        } else {
          setInvitationEmail(data.email);
          setCoproprieteNom(data.copropriete ?? '');
          setMode('coproprietaire');
        }
      })
      .catch(() => { setError("Impossible de vérifier l'invitation."); setMode('invalid'); });
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }
    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    setLoading(true);

    const isCopro = mode === 'coproprietaire';
    const emailToUse = isCopro ? invitationEmail : formData.email;
    const role = isCopro ? 'copropriétaire' : 'syndic';

    const { data, error: authError } = await supabase.auth.signUp({
      email: emailToUse,
      password: formData.password,
      options: { data: { full_name: formData.fullName, role } },
    });

    if (authError) {
      setError('Erreur : ' + authError.message);
      setLoading(false);
      return;
    }

    if (token && isCopro && data.user) {
      await fetch('/api/invitations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, user_id: data.user.id, full_name: formData.fullName }),
      });
    }

    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    router.push('/dashboard');
    router.refresh();
  };

  // --- États d'affichage ---

  if (mode === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <Link href="/login" className="mt-6 inline-block text-blue-600 hover:underline text-sm">Retour à la connexion</Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-gray-500 text-sm">
            Un email de confirmation a été envoyé à{' '}
            <strong>{mode === 'coproprietaire' ? invitationEmail : formData.email}</strong>.
            Cliquez sur le lien pour activer votre compte.
          </p>
          <Link href="/login" className="mt-6 inline-block text-blue-600 hover:underline text-sm">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex mb-4">
            <SiteLogo size={56} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Mon Syndic Bénévole</h1>
          {mode === 'syndic'
            ? <p className="text-gray-500 mt-1 text-sm">30 jours gratuits · puis 25€/mois · sans engagement</p>
            : <p className="text-gray-500 mt-1 text-sm">Vous avez été invité à rejoindre <strong>{coproprieteNom}</strong></p>
          }
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">
            {mode === 'syndic' ? 'Créer mon compte syndic' : 'Créer mon compte copropriétaire'}
          </h2>

          <form onSubmit={handleRegister} className="space-y-4">
            <Input
              label="Nom complet"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Jean Dupont"
              required
            />

            {/* Email : libre pour syndic, verrouillé pour copropriétaire */}
            {mode === 'coproprietaire' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  <Lock size={14} className="text-gray-400 shrink-0" />
                  <span>{invitationEmail}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">Email défini par votre syndic, non modifiable</p>
              </div>
            ) : (
              <Input
                label="Adresse email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@email.fr"
                required
              />
            )}

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Minimum 8 caractères"
              required
              hint="Au moins 8 caractères"
            />

            <Input
              label="Confirmer le mot de passe"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
            )}

            <Button type="submit" fullWidth loading={loading} size="lg">
              {mode === 'syndic' ? 'Créer mon compte' : 'Rejoindre la copropriété'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés
        </p>
      </div>
    </div>
  );
}

// ---- Export avec Suspense (requis pour useSearchParams) ----
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}