// ============================================================
// Page d'inscription
// - Sans token : inscription syndic uniquement
// - Avec ?token=xxx : inscription copropriétaire via invitation
// ============================================================
'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { redirectToDashboard } from '@/lib/auth-redirect';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import SiteLogo from '@/components/ui/SiteLogo';
import { Lock, ArrowRight, Building2, Users, FileText, CalendarDays } from 'lucide-react';
import { trackAnonymousEvent, trackConsentAwareEvent } from '@/lib/gtag';
import { logEventForEmail } from '@/lib/actions/log-user-event';
import { getCanonicalSiteUrl } from '@/lib/site-url';
import { buildInvitationLoginHref, getInvitationAcceptanceState } from '@/lib/invitation-acceptance';

const BENEFITS = [
  { icon: Building2, text: 'Gérez plusieurs copropriétés depuis un seul espace' },
  { icon: Users,     text: 'Annuaire des copropriétaires et suivi des lots' },
  { icon: FileText,  text: 'Documents, dépenses et appels de fonds centralisés' },
  { icon: CalendarDays, text: 'Assemblées générales, votes et PV en quelques clics' },
];

// ---- Formulaire (utilise useSearchParams → doit être dans Suspense) ----
function RegisterForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const supabase = createClient();

  const [mode, setMode] = useState<'syndic' | 'coproprietaire' | 'loading' | 'invalid'>(
    () => token ? 'loading' : 'syndic'
  );
  const [invitationEmail, setInvitationEmail] = useState('');
  const [coproprieteNom, setCoproprieteNom] = useState('');
  const [invitationPrenom, setInvitationPrenom] = useState('');
  const [invitationNom, setInvitationNom] = useState('');

  const [formData, setFormData] = useState({ prenom: '', nom: '', email: '', password: '', confirmPassword: '' });
  const [acceptCgu, setAcceptCgu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sessionMismatch, setSessionMismatch] = useState(false);

  // Tracking d'abandon de formulaire
  const formStartedRef = useRef(false);
  const formSubmittedRef = useRef(false);
  useEffect(() => {
    return () => {
      if (formStartedRef.current && !formSubmittedRef.current) {
        trackAnonymousEvent('form_abandonment', { form: 'register', role: mode });
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const invitationToken = token;
    if (!invitationToken) return;
    const safeInvitationToken = invitationToken;

    let cancelled = false;

    async function loadInvitation() {
      try {
        const response = await fetch(`/api/invitations?token=${encodeURIComponent(safeInvitationToken)}`);
        const data = await response.json().catch(() => ({})) as {
          error?: string;
          email?: string;
          copropriete?: string;
          prenom?: string | null;
          nom?: string | null;
        };

        if (!response.ok || data.error || !data.email) {
          if (cancelled) return;
          setError(data.error ?? "Impossible de vérifier cette invitation. Demandez un nouveau lien d\'invitation à votre syndic.");
          setMode('invalid');
          return;
        }

        if (cancelled) return;

        setInvitationEmail(data.email);
        setCoproprieteNom(data.copropriete ?? '');
        setInvitationPrenom(data.prenom ?? '');
        setInvitationNom(data.nom ?? '');
        setFormData((prev) => ({
          ...prev,
          prenom: data.prenom ?? '',
          nom: data.nom ?? '',
        }));

        const { data: sessionData } = await supabase.auth.getSession();
        const session = sessionData.session;
        const invitationState = getInvitationAcceptanceState({
          invitationEmail: data.email,
          currentUserEmail: session?.user?.email ?? null,
        });

        if (invitationState === 'accept-now' && session?.user) {
          const fullName = typeof session.user.user_metadata?.full_name === 'string'
            ? session.user.user_metadata.full_name
            : `${data.prenom ?? ''} ${data.nom ?? ''}`.trim();

          const linkResponse = await fetch('/api/invitations', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: safeInvitationToken,
              user_id: session.user.id,
              full_name: fullName,
            }),
          });

          const linkResult = await linkResponse.json().catch(() => ({})) as { error?: string };

          if (cancelled) return;

          if (linkResponse.ok) {
            redirectToDashboard();
            return;
          }

          setError(linkResult.error ?? 'Impossible de rattacher cette invitation à votre compte. Vérifiez que vous êtes connecté avec la bonne adresse email.');
        }

        if (cancelled) return;
        setSessionMismatch(invitationState === 'wrong-account');
        setMode('coproprietaire');
      } catch {
        if (cancelled) return;
        setError("Impossible de vérifier l'invitation.");
        setMode('invalid');
      }
    }

    void loadInvitation();

    return () => {
      cancelled = true;
    };
  // `createClient()` retourne une nouvelle instance ; on évite de la mettre en dépendance
  // pour ne pas relancer en boucle le chargement/acceptation de l'invitation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    formStartedRef.current = true;
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    formSubmittedRef.current = true;
    setError('');

    if (formData.password !== formData.confirmPassword) {
      const errMsg = 'Les mots de passe ne correspondent pas.';
      setError(errMsg);
      trackAnonymousEvent('registration_error', { error: 'password_mismatch' });
      return;
    }
    if (formData.password.length < 8) {
      const errMsg = 'Le mot de passe doit contenir au moins 8 caractères.';
      setError(errMsg);
      trackAnonymousEvent('registration_error', { error: 'password_too_short' });
      return;
    }
    if (!acceptCgu) {
      const errMsg = "Vous devez accepter les conditions générales d'utilisation.";
      setError(errMsg);
      trackAnonymousEvent('registration_error', { error: 'cgu_not_accepted' });
      return;
    }

    setLoading(true);

    const isCopro = mode === 'coproprietaire';

    // ── Mode invitation : création compte côté serveur, email déjà vérifié ──
    if (isCopro && token) {
      const res = await fetch('/api/invitations/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          password: formData.password,
          prenom: (invitationPrenom || formData.prenom).trim(),
          nom: (invitationNom || formData.nom).trim(),
        }),
      });
      const result = await res.json();
      if (!res.ok) {
        const errMsg = result.error ?? 'Impossible de finaliser l\'inscription pour cette invitation. Réessayez ou demandez un nouveau lien.';
        setError(errMsg);
        trackAnonymousEvent('registration_error', { error: result.error ?? 'invitation_error', role: 'copropriétaire' });
        setLoading(false);
        return;
      }
      // Connexion directe sans email de confirmation
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: result.email,
        password: formData.password,
      });
      if (signInError) {
        setError(signInError.message);
        trackAnonymousEvent('registration_error', { error: 'sign_in_failed', role: 'copropriétaire' });
        setLoading(false);
        return;
      }
      trackConsentAwareEvent({
        standardEvent: 'sign_up',
        anonymousEvent: 'sign_up_anonymous',
        params: { role: 'copropriétaire', method: 'invitation' },
      });
      redirectToDashboard();
      return;
    }

    // ── Mode syndic : inscription standard avec email de confirmation ──
    const fullName = `${formData.prenom.trim()} ${formData.nom.trim()}`.trim();

    const { data, error: authError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${getCanonicalSiteUrl()}/auth/confirm`,
        data: { full_name: fullName, prenom: formData.prenom.trim(), nom: formData.nom.trim(), role: 'syndic' },
      },
    });

    if (authError) {
      const errMsg = 'Inscription impossible pour le moment. Vérifiez vos informations et réessayez. Si le problème persiste, contactez le support.';
      setError(errMsg);
      trackAnonymousEvent('registration_error', { error: authError.code ?? 'sign_up_failed', role: 'syndic' });
      setLoading(false);
      return;
    }

    // Supabase renvoie identities: [] lorsque l'email est déjà utilisé (sans erreur explicite)
    if (data.user?.identities?.length === 0) {
      const errMsg = 'Cette adresse email est déjà utilisée. Essayez de vous connecter.';
      setError(errMsg);
      trackAnonymousEvent('registration_error', { error: 'email_already_exists', role: 'syndic' });
      setLoading(false);
      return;
    }

    trackConsentAwareEvent({
      standardEvent: 'sign_up',
      anonymousEvent: 'sign_up_anonymous',
      params: { role: 'syndic', method: 'email' },
    });
    void logEventForEmail({
      email: formData.email,
      eventType: 'user_registered',
      label: 'Inscription du compte',
    }).catch(() => undefined);

    if (data.user && !data.session) {
      setSuccess(true);
      setLoading(false);
      return;
    }

    redirectToDashboard();
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-indigo-950 flex items-start lg:items-center justify-center px-4 py-6 sm:py-8">
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
            <Link href="/" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-900 transition-colors ml-auto">
              ← Retour à l&apos;accueil
            </Link>
          </div>

          <div className="mb-8">
            {mode === 'coproprietaire' && (
              <div className="flex items-center gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 mb-5">
                <Building2 size={20} className="text-blue-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-blue-600 font-medium uppercase tracking-wide leading-none mb-0.5">Vous rejoignez</p>
                  <p className="font-semibold text-blue-800 truncate">{coproprieteNom}</p>
                </div>
              </div>
            )}
            <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Créer mon compte</h1>
            <p className="text-sm text-gray-500">
              Déjà un compte ?{' '}
              <Link
                href={mode === 'coproprietaire' && token ? buildInvitationLoginHref(token, invitationEmail) : '/login'}
                className="text-blue-600 hover:underline font-medium"
              >
                Se connecter
              </Link>
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mode === 'coproprietaire' && invitationPrenom ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prénom</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                    <Lock size={14} className="text-gray-500 shrink-0" />
                    <span>{invitationPrenom}</span>
                  </div>
                </div>
              ) : (
                <Input
                  label="Prénom"
                  name="prenom"
                  type="text"
                  autoComplete="given-name"
                  value={formData.prenom}
                  onChange={handleChange}
                  placeholder="Jean"
                  required
                />
              )}
              {mode === 'coproprietaire' && invitationNom ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nom</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                    <Lock size={14} className="text-gray-500 shrink-0" />
                    <span>{invitationNom}</span>
                  </div>
                </div>
              ) : (
                <Input
                  label="Nom"
                  name="nom"
                  type="text"
                  autoComplete="family-name"
                  value={formData.nom}
                  onChange={handleChange}
                  placeholder="Dupont"
                  required
                />
              )}
            </div>

            {mode === 'coproprietaire' ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse email</label>
                <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm">
                  <Lock size={14} className="text-gray-500 shrink-0" />
                  <span>{invitationEmail}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">Email défini par votre syndic, non modifiable</p>
              </div>
            ) : (
              <Input
                label="Adresse email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="vous@email.fr"
                required
              />
            )}

            {mode === 'coproprietaire' && token && invitationEmail && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 space-y-2">
                <p>
                  {sessionMismatch ? (
                    <>
                      Cette invitation est destinée à <strong>{invitationEmail}</strong>. Déconnectez-vous puis reconnectez-vous avec cette adresse pour la rattacher automatiquement.
                    </>
                  ) : (
                    <>
                      Vous avez déjà un compte avec <strong>{invitationEmail}</strong> ? Connectez-vous et nous rattacherons automatiquement cette invitation.
                    </>
                  )}
                </p>
                <Link
                  href={buildInvitationLoginHref(token, invitationEmail)}
                  className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
                >
                  Se connecter avec cette adresse <ArrowRight size={14} />
                </Link>
              </div>
            )}

            <Input
              label="Mot de passe"
              name="password"
              type="password"
              autoComplete="new-password"
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
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />

            {/* ── CGU / CGV ── */}
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptCgu}
                onChange={(e) => setAcceptCgu(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <span className="text-xs text-gray-500 leading-snug">
                J&apos;ai lu et j&apos;accepte les{' '}
                <Link href="/cgu" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Conditions Générales d&apos;Utilisation
                </Link>{' '}
                ainsi que la{' '}
                <Link href="/politique-confidentialite" target="_blank" className="text-blue-600 hover:underline font-medium">
                  Politique de Confidentialité
                </Link>.
              </span>
            </label>

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

          <p className="text-center text-xs text-gray-500 mt-8">
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