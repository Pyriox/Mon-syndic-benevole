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
import { Lock, ArrowRight, Building2, Users, FileText, CalendarDays } from 'lucide-react';
import { trackEvent } from '@/lib/gtag';

const BENEFITS = [
  { icon: Building2, text: 'Gérez plusieurs copropriétés depuis un seul espace' },
  { icon: Users,     text: 'Annuaire des copropriétaires et suivi des lots' },
  { icon: FileText,  text: 'Documents, dépenses et appels de fonds centralisés' },
  { icon: CalendarDays, text: 'Assemblées générales, votes et PV en quelques clics' },
];

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

  const [formData, setFormData] = useState({ prenom: '', nom: '', email: '', password: '', confirmPassword: '' });
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
    const fullName = `${formData.prenom.trim()} ${formData.nom.trim()}`.trim();

    const { data, error: authError } = await supabase.auth.signUp({
      email: emailToUse,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
        data: { full_name: fullName, prenom: formData.prenom.trim(), nom: formData.nom.trim(), role },
      },
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
        body: JSON.stringify({ token, user_id: data.user.id, full_name: fullName }),
      });
    }

    trackEvent('sign_up', { role, method: 'email' });

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (mode === 'invalid') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">⚠️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Lien invalide</h2>
          <p className="text-gray-500 text-sm">{error}</p>
          <Link href="/login" className="mt-6 inline-block text-blue-600 hover:underline text-sm font-medium">
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 text-4xl">✉️</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Vérifiez votre email</h2>
          <p className="text-gray-500 text-sm leading-relaxed">
            Un lien de confirmation a été envoyé à{' '}
            <strong className="text-gray-800">{mode === 'coproprietaire' ? invitationEmail : formData.email}</strong>.
            Cliquez dessus pour activer votre compte.
          </p>
          <Link href="/login" className="mt-8 inline-flex items-center gap-1.5 text-blue-600 hover:underline text-sm font-medium">
            Retour à la connexion <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  // --- Formulaire principal ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-0 shadow-2xl rounded-3xl overflow-hidden">

        {/* ── Panneau gauche : valeur ── */}
        <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 p-12 text-white">
          <div>
            <div className="flex items-center gap-3 mb-12">
              <SiteLogo size={40} />
              <span className="font-bold text-lg tracking-tight">Mon Syndic Bénévole</span>
            </div>

            <h2 className="text-3xl font-extrabold leading-tight mb-4">
              La gestion de copropriété,{' '}
              <span className="text-blue-200">enfin simple.</span>
            </h2>
            <p className="text-blue-100/80 text-sm leading-relaxed mb-10">
              Conçu pour les syndics bénévoles qui veulent gérer leur immeuble sérieusement,
              sans y passer leurs soirées.
            </p>

            <ul className="space-y-4">
              {BENEFITS.map(({ icon: Icon, text }) => (
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
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {['A','B','C'].map((l) => (
                  <div key={l} className="w-8 h-8 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs font-bold text-white">
                    {l}
                  </div>
                ))}
              </div>
              <p className="text-blue-100/70 text-xs leading-relaxed">
                Rejoignez des syndics bénévoles<br/>qui ont simplifié leur gestion.
              </p>
            </div>
          </div>
        </div>

        {/* ── Panneau droit : formulaire ── */}
        <div className="bg-white flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          {/* Logo mobile + lien retour */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex lg:hidden items-center gap-2.5">
              <SiteLogo size={36} />
              <span className="font-bold text-gray-800">Mon Syndic Bénévole</span>
            </div>
            <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors ml-auto">
              ← Retour à l&apos;accueil
            </Link>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">
              {mode === 'syndic' ? 'Créer mon compte' : 'Rejoindre la copropriété'}
            </h1>
            {mode === 'syndic' ? (
              <p className="text-sm text-gray-500">
                Déjà un compte ?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">Se connecter</Link>
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Vous avez été invité à rejoindre{' '}
                <strong className="text-gray-700">{coproprieteNom}</strong>
              </p>
            )}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Prénom"
                name="prenom"
                type="text"
                value={formData.prenom}
                onChange={handleChange}
                placeholder="Jean"
                required
              />
              <Input
                label="Nom"
                name="nom"
                type="text"
                value={formData.nom}
                onChange={handleChange}
                placeholder="Dupont"
                required
              />
            </div>

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
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="pt-1">
              <Button type="submit" fullWidth loading={loading} size="lg">
                <span>{mode === 'syndic' ? 'Créer mon compte' : 'Rejoindre la copropriété'}</span>
                <ArrowRight size={16} />
              </Button>
            </div>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            © {new Date().getFullYear()} Mon Syndic Bénévole
          </p>
        </div>

      </div>
    </div>
  );
}

// ---- Export avec Suspense (requis pour useSearchParams) ----
export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}