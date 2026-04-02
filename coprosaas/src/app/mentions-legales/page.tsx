import type { Metadata } from "next";
import Link from "next/link";
import SiteLogo from "@/components/ui/SiteLogo";
import CookiePreferencesButton from "@/components/CookiePreferencesButton";

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Mon Syndic Bénévole — éditeur, hébergement, données personnelles et propriété intellectuelle.",
  alternates: { canonical: 'https://www.mon-syndic-benevole.fr/mentions-legales' },
  robots: { index: true, follow: true },
};

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">

      {/* ── Header minimaliste ── */}
      <header className="border-b border-slate-800 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
            <SiteLogo size={32} />
            <span className="font-bold text-white text-sm">Mon Syndic Bénévole</span>
          </Link>
        </div>
      </header>

      {/* ── Contenu ── */}
      <main className="max-w-4xl mx-auto px-6 py-16">

        <h1 className="text-3xl font-bold text-white mb-2">Mentions légales</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : 26 mars 2026</p>

        {/* 1. Éditeur */}
        <Section title="1. Éditeur du site">
          <p>Le site <strong className="text-white">mon-syndic-benevole.fr</strong> est édité par :</p>
          <ul className="mt-3 space-y-1 text-gray-400">
            <li><span className="text-gray-300 font-medium">Raison sociale :</span> Mon Syndic Bénévole</li>
            <li><span className="text-gray-300 font-medium">Forme juridique :</span> [Forme juridique — ex. SAS, SARL, auto-entrepreneur…]</li>
            <li><span className="text-gray-300 font-medium">Capital social :</span> [Montant du capital]</li>
            <li><span className="text-gray-300 font-medium">Siège social :</span> [Adresse complète]</li>
            <li><span className="text-gray-300 font-medium">SIRET :</span> [Numéro SIRET]</li>
            <li><span className="text-gray-300 font-medium">N° TVA intracommunautaire :</span> [N° TVA si applicable]</li>
            <li>
              <span className="text-gray-300 font-medium">Email :</span>{" "}
              <a href="mailto:contact@mon-syndic-benevole.fr" className="text-blue-400 hover:text-blue-300 transition-colors">
                contact@mon-syndic-benevole.fr
              </a>
            </li>
          </ul>
        </Section>

        {/* 2. Directeur de la publication */}
        <Section title="2. Directeur de la publication">
          <p>
            Le directeur de la publication est <strong className="text-white">[Prénom Nom]</strong>, en sa qualité de
            [gérant / président / auto-entrepreneur] de Mon Syndic Bénévole.
          </p>
        </Section>

        {/* 3. Hébergement */}
        <Section title="3. Hébergement">
          <p>Le site est hébergé par :</p>
          <ul className="mt-3 space-y-1 text-gray-400">
            <li><span className="text-gray-300 font-medium">Société :</span> Vercel Inc.</li>
            <li><span className="text-gray-300 font-medium">Adresse :</span> 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis</li>
            <li>
              <span className="text-gray-300 font-medium">Site web :</span>{" "}
              <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">
                vercel.com
              </a>
            </li>
          </ul>
          <p className="mt-4">
            La base de données est hébergée par <strong className="text-white">Supabase Inc.</strong> (Frankfurt, UE — région <code className="text-sm bg-slate-800 px-1.5 py-0.5 rounded">eu-central-1</code>).
          </p>
        </Section>

        {/* 4. Propriété intellectuelle */}
        <Section title="4. Propriété intellectuelle">
          <p>
            L'ensemble des éléments constituant ce site (structure, textes, logos, graphismes, icônes, images,
            logiciels) est la propriété exclusive de Mon Syndic Bénévole ou fait l'objet d'une autorisation
            d'utilisation. Toute reproduction, représentation, modification, publication, adaptation ou exploitation,
            totale ou partielle, par quelque procédé que ce soit, sans l'autorisation préalable et écrite de
            Mon Syndic Bénévole, est strictement interdite.
          </p>
        </Section>

        {/* 5. Données personnelles (RGPD) */}
        <Section title="5. Données personnelles (RGPD)">
          <p>
            Conformément au Règlement Général sur la Protection des Données (RGPD — UE 2016/679) et à la loi
            Informatique et Libertés du 6 janvier 1978 modifiée, vous disposez des droits suivants concernant
            vos données personnelles :
          </p>
          <ul className="mt-3 space-y-1.5 list-disc list-inside text-gray-400">
            <li>Droit d'accès, de rectification et d'effacement de vos données ;</li>
            <li>Droit à la limitation du traitement et à la portabilité ;</li>
            <li>Droit d'opposition au traitement ;</li>
            <li>Droit d'introduire une réclamation auprès de la CNIL (<a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 transition-colors">www.cnil.fr</a>).</li>
          </ul>
          <p className="mt-4">
            Les données collectées (nom, adresse email, données de copropriété) sont utilisées exclusivement pour
            la fourniture du service Mon Syndic Bénévole. Elles ne sont ni vendues, ni cédées à des tiers à des
            fins commerciales.
          </p>
          <p className="mt-4">
            Pour exercer vos droits ou pour toute question relative au traitement de vos données, vous pouvez
            contacter le responsable du traitement à :{" "}
            <a href="mailto:contact@mon-syndic-benevole.fr" className="text-blue-400 hover:text-blue-300 transition-colors">
              contact@mon-syndic-benevole.fr
            </a>
          </p>
          <p className="mt-4">
            Les données de paiement sont traitées par <strong className="text-white">Stripe Inc.</strong> (San Francisco, CA, États-Unis),
            certifié PCI-DSS niveau 1. Mon Syndic Bénévole ne conserve aucune donnée bancaire ou de carte de paiement.
          </p>
        </Section>

        {/* 6. Cookies */}
        <Section title="6. Cookies">
          <p>
            Ce site utilise des cookies strictement nécessaires à son fonctionnement (session d'authentification)
            ainsi que des cookies analytiques anonymisés via <strong className="text-white">Google Analytics 4</strong> afin
            d'améliorer l'expérience utilisateur.
          </p>
          <p className="mt-4">
            Les cookies analytiques ne sont activés qu'après votre consentement explicite. Vous pouvez modifier votre choix
            à tout moment via le bouton « Gérer les cookies » présent sur le site. La désactivation des cookies strictement
            nécessaires empêche l'accès aux fonctionnalités nécessitant une connexion.
          </p>
        </Section>

        {/* 7. Responsabilité */}
        <Section title="7. Limitation de responsabilité">
          <p>
            Mon Syndic Bénévole met tout en œuvre pour fournir des informations fiables et à jour. Toutefois,
            des erreurs ou omissions peuvent subsister. La responsabilité de Mon Syndic Bénévole ne saurait être
            engagée pour tout dommage direct ou indirect résultant de l'utilisation du site ou des informations
            qui y sont publiées.
          </p>
          <p className="mt-4">
            Mon Syndic Bénévole ne peut garantir l'exactitude, l'exhaustivité ou l'actualité des informations
            diffusées sur ce site. L'utilisateur est seul responsable de l'utilisation qu'il fait de ces
            informations.
          </p>
        </Section>

        {/* 8. Droit applicable */}
        <Section title="8. Droit applicable">
          <p>
            Les présentes mentions légales sont soumises au droit français. En cas de litige, les tribunaux
            français seront seuls compétents.
          </p>
        </Section>

        {/* Back */}
        <div className="mt-14 pt-8 border-t border-slate-800">
          <Link href="/" className="text-blue-400 hover:text-blue-300 transition-colors text-sm">
            ← Retour à l'accueil
          </Link>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 px-6 mt-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-gray-600 text-sm">
          <span>© {new Date().getFullYear()} Mon Syndic Bénévole — Tous droits réservés</span>
          <CookiePreferencesButton />
        </div>
      </footer>

    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-semibold text-white mb-4 pb-2 border-b border-slate-800">{title}</h2>
      <div className="text-gray-400 leading-relaxed space-y-2">{children}</div>
    </section>
  );
}
