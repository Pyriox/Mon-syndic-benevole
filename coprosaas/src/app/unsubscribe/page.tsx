import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Désabonnement — Mon Syndic Bénévole',
  robots: { index: false },
};

export default function UnsubscribePage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const status = searchParams?.status;

  const content = status === 'success'
    ? {
        title: 'Désabonnement confirmé',
        message: 'Vous ne recevrez plus les e-mails de rappel et de suivi de Mon Syndic Bénévole.',
        note: 'Vous continuerez à recevoir les e-mails essentiels liés à votre compte : confirmations de paiement, alertes de sécurité et notifications légales de votre copropriété.',
      }
    : status === 'invalid'
      ? {
          title: 'Lien invalide',
          message: 'Ce lien de désabonnement est invalide ou a déjà été utilisé.',
          note: 'Si vous souhaitez vous désabonner, utilisez le lien présent dans le dernier e-mail reçu.',
        }
      : {
          title: 'Une erreur est survenue',
          message: 'Nous n\'avons pas pu traiter votre demande. Veuillez réessayer plus tard.',
          note: 'Si le problème persiste, contactez-nous à contact@mon-syndic-benevole.fr.',
        };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6f8', padding: '32px 16px' }}>
      <div style={{ maxWidth: 480, background: '#fff', borderRadius: 10, padding: '40px 32px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <p style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#111827', letterSpacing: -0.2 }}>Mon Syndic Bénévole</p>
        <h1 style={{ margin: '0 0 16px', fontSize: 22, fontWeight: 700, color: '#111827' }}>{content.title}</h1>
        <p style={{ margin: '0 0 20px', fontSize: 15, color: '#374151', lineHeight: 1.6 }}>{content.message}</p>
        <p style={{ margin: 0, fontSize: 13, color: '#6b7280', lineHeight: 1.6 }}>{content.note}</p>
      </div>
    </main>
  );
}
