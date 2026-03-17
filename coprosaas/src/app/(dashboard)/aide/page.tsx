'use client';

// ============================================================
// Page Aide & Contact
// Formulaire de contact + FAQ syndic bénévole
// ============================================================
import { useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { MailCheck, ChevronDown, ChevronUp, HelpCircle, MessageSquare, Phone, ExternalLink } from 'lucide-react';

// ── Données FAQ ──────────────────────────────────────────────
const FAQ: { question: string; answer: string }[] = [
  {
    question: "Qui peut être syndic bénévole ?",
    answer:
      "Tout copropriétaire peut devenir syndic bénévole de sa propre copropriété, sans conditions de diplôme ni de carte professionnelle. La loi Hoguet exige une carte professionnelle uniquement pour les syndics professionnels. Le syndic bénévole doit simplement être élu en AG par les copropriétaires.",
  },
  {
    question: "Quelle est la durée du mandat d'un syndic bénévole ?",
    answer:
      "Le mandat du syndic est voté en Assemblée Générale. Sa durée maximale est de 3 ans (renouvelable). En pratique, la plupart des copropriétés l'élisent pour 1 ou 2 ans afin de renouveler régulièrement la confiance.",
  },
  {
    question: "Le syndic bénévole peut-il être rémunéré ?",
    answer:
      "Non, le syndic bénévole n'est pas rémunéré pour sa gestion courante. Il peut cependant percevoir un remboursement de frais engagés pour la copropriété (timbres, déplacements…) à condition que ces remboursements soient votés par l'AG et justifiés.",
  },
  {
    question: "Quelles sont les obligations légales d'un syndic bénévole ?",
    answer:
      "Le syndic bénévole a les mêmes obligations qu'un syndic professionnel : tenir un compte séparé au nom du syndicat des copropriétaires, convoquer au minimum une AG par an, établir et soumettre le budget prévisionnel, tenir à jour le registre des copropriétaires, et souscrire une assurance responsabilité civile.",
  },
  {
    question: "Comment convoquer une Assemblée Générale ?",
    answer:
      "La convocation doit être envoyée au moins 21 jours avant la date de l'AG (ou 15 jours si votre règlement de copropriété le prévoit). Elle doit contenir l'ordre du jour, les documents nécessaires aux votes (état des charges, budget…), et être envoyée par lettre recommandée ou par voie dématérialisée si les copropriétaires y ont consenti. Notre application génère automatiquement ce document.",
  },
  {
    question: "Comment calculer les charges en tantièmes ?",
    answer:
      "Les charges générales sont réparties au prorata des tantièmes de chaque lot, définis dans le règlement de copropriété. Par exemple, un lot disposant de 150 tantièmes sur 1 000 supportera 15 % des charges générales. L'application calcule automatiquement les quotes-parts à partir des tantièmes renseignés.",
  },
  {
    question: "Faut-il ouvrir un compte bancaire au nom de la copropriété ?",
    answer:
      "Oui, c'est obligatoire. La loi ALUR de 2014 impose au syndic d'ouvrir un compte séparé au nom du syndicat des copropriétaires dès lors que la copropriété compte plus de 15 lots. En dessous de ce seuil, une dispense peut être accordée par l'AG à l'unanimité.",
  },
  {
    question: "Comment gérer les impayés de charges ?",
    answer:
      "En cas d'impayé, le syndic doit d'abord adresser une mise en demeure par lettre recommandée. Sans réponse, il peut saisir le président du tribunal judiciaire par une procédure d'injonction de payer, sans avocat obligatoire. La créance est garantie par le privilège immobilier spécial sur le lot du débiteur.",
  },
  {
    question: "Comment déclarer un sinistre sur les parties communes ?",
    answer:
      "Le syndic doit déclarer le sinistre à l'assureur de la copropriété dans les 5 jours ouvrés suivant sa connaissance (ou 2 jours pour un vol). La déclaration mentionne la nature du sinistre, sa date approximative, les parties touchées et les premiers éléments de constat. Conservez bien tous les justificatifs et photos.",
  },
  {
    question: "L'application fonctionne-t-elle sur mobile ?",
    answer:
      "L'interface est intégralement responsive et s'adapte aux smartphones et tablettes. Vous pouvez consulter les données, gérer les incidents et accéder aux documents depuis n'importe quel appareil connecté.",
  },
  {
    question: "Comment exporter ou archiver mes données ?",
    answer:
      "Les documents générés (convocations, PV, appels de fonds) sont au format PDF et peuvent être téléchargés à tout moment depuis chaque section. Un export global de vos données est disponible dans les paramètres de votre compte.",
  },
  {
    question: "Mes données sont-elles sécurisées ?",
    answer:
      "Les données sont hébergées sur des serveurs européens (Supabase — Union Européenne), chiffrées en transit (HTTPS/TLS) et au repos (AES-256). L'accès est protégé par une authentification sécurisée. Nous ne revendons aucune donnée à des tiers.",
  },
];

// ── Composant accordéon pour une question ───────────────────
function FaqItem({ question, answer, defaultOpen = false }: { question: string; answer: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start justify-between gap-4 py-4 text-left group"
      >
        <span className="text-sm font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">
          {question}
        </span>
        {open
          ? <ChevronUp size={16} className="shrink-0 mt-0.5 text-blue-500" />
          : <ChevronDown size={16} className="shrink-0 mt-0.5 text-gray-400 group-hover:text-blue-400" />
        }
      </button>
      {open && (
        <p className="pb-4 text-sm text-gray-600 leading-relaxed">{answer}</p>
      )}
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function AidePage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (!res.ok) throw new Error();
      setSent(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer ou nous contacter directement par email.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-12">

      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Aide & Contact</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Questions fréquentes sur le syndic bénévole, et formulaire pour nous contacter.
        </p>
      </div>

      {/* Grille : contact gauche / ressources droite */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* ── Formulaire de contact ── */}
        <div className="md:col-span-2">
          <Card padding="lg">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                <MessageSquare size={16} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-gray-900">Envoyer un message</h2>
                <p className="text-xs text-gray-400">Nous répondons sous 24 h (jours ouvrés)</p>
              </div>
            </div>

            {sent ? (
              <div className="flex flex-col items-center justify-center py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <MailCheck size={28} className="text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">Message envoyé !</p>
                <p className="text-sm text-gray-500 max-w-xs">
                  Merci pour votre message. Notre équipe vous répondra dans les meilleurs délais.
                </p>
                <button
                  onClick={() => { setSent(false); setName(''); setEmail(''); setSubject(''); setMessage(''); }}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-2"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Votre nom"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jean Dupont"
                    required
                  />
                  <Input
                    label="Adresse email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jean@copropriete.fr"
                    required
                  />
                </div>

                <Input
                  label="Sujet"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Ex : Question sur les appels de fonds"
                  required
                />

                <Textarea
                  label="Votre message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Décrivez votre question ou problème en détail…"
                  rows={5}
                  required
                />

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Button type="submit" loading={loading}>
                  Envoyer le message
                </Button>
              </form>
            )}
          </Card>
        </div>

        {/* ── Colonne droite : infos + ressources ── */}
        <div className="space-y-4">

          {/* Contact direct */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Contact direct</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageSquare size={13} className="text-blue-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Email</p>
                  <a href="mailto:support@syndic-benevole.eu" className="text-xs text-blue-600 hover:underline">
                    support@syndic-benevole.eu
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-md bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Phone size={13} className="text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-700">Disponibilité</p>
                  <p className="text-xs text-gray-500">Lun – Ven, 9 h – 18 h</p>
                </div>
              </li>
            </ul>
          </Card>

          {/* Ressources légales */}
          <Card padding="md">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Ressources utiles</h3>
            <ul className="space-y-2">
              {[
                { label: 'Legifrance – loi du 10 juillet 1965', url: 'https://www.legifrance.gouv.fr/loda/id/JORFTEXT000000508853' },
                { label: 'ANIL – fiche syndic bénévole', url: 'https://www.anil.org/votre-projet/vous-etes-proprietaire/syndic-benevole/' },
                { label: 'Service-public.fr – copropriété', url: 'https://www.service-public.fr/particuliers/vosdroits/N31337' },
              ].map(({ label, url }) => (
                <li key={url}>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink size={11} className="shrink-0" />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </Card>

        </div>
      </div>

      {/* ── FAQ ── */}
      <div>
        <div className="flex items-center gap-2.5 mb-5">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <HelpCircle size={16} className="text-indigo-600" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">Questions fréquentes</h2>
            <p className="text-xs text-gray-400">Sur le syndic bénévole et l&apos;application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Colonne 1 */}
          <Card padding="md">
            {FAQ.slice(0, Math.ceil(FAQ.length / 2)).map((item, i) => (
              <FaqItem key={i} {...item} defaultOpen={i === 0} />
            ))}
          </Card>
          {/* Colonne 2 */}
          <Card padding="md">
            {FAQ.slice(Math.ceil(FAQ.length / 2)).map((item, i) => (
              <FaqItem key={i} {...item} />
            ))}
          </Card>
        </div>
      </div>

    </div>
  );
}
