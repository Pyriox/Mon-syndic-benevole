import type { Metadata } from "next";
import Link from "next/link";
import SiteLogo from "@/components/ui/SiteLogo";

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation et de Vente de Mon Syndic Bénévole — modalités d'accès, abonnements, obligations et responsabilités.",
  alternates: { canonical: 'https://mon-syndic-benevole.fr/cgu' },
  robots: { index: true, follow: true },
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-lg font-semibold text-white mb-3 pb-2 border-b border-slate-700">{title}</h2>
      <div className="space-y-3 text-gray-400 text-sm leading-relaxed">{children}</div>
    </section>
  );
}

export default function CguPage() {
  const lastUpdate = new Date("2026-03-24").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      {/* ── Header ── */}
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
        <h1 className="text-3xl font-bold text-white mb-2">
          Conditions Générales d{"'"}Utilisation et de Vente
        </h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : {lastUpdate}</p>

        <Section title="1. Objet">
          <p>
            Les présentes Conditions Générales d{"'"}Utilisation et de Vente (ci-après «&nbsp;CGU/CGV&nbsp;»)
            régissent l{"'"}accès et l{"'"}utilisation du service <strong className="text-white">Mon Syndic
            Bénévole</strong> (ci-après «&nbsp;le Service&nbsp;»), édité par Mon Syndic Bénévole, accessible
            à l{"'"}adresse{" "}
            <a
              href="https://mon-syndic-benevole.fr"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              mon-syndic-benevole.fr
            </a>
            .
          </p>
          <p>
            Le Service est une application SaaS (Software as a Service) de gestion de copropriété destinée
            aux syndics bénévoles et aux copropriétaires.
          </p>
          <p>
            L{"'"}utilisation du Service implique l{"'"}acceptation pleine et entière des présentes CGU/CGV.
            Toute personne qui n{"'"}accepte pas ces conditions ne doit pas utiliser le Service.
          </p>
        </Section>

        <Section title="2. Accès au Service et création de compte">
          <p>
            L{"'"}accès au Service nécessite la création d{"'"}un compte. L{"'"}utilisateur s{"'"}engage à
            fournir des informations exactes, complètes et à les maintenir à jour.
          </p>
          <p>
            Chaque compte est strictement personnel et ne peut être partagé. L{"'"}utilisateur est seul
            responsable de la confidentialité de ses identifiants et de toute activité réalisée depuis son
            compte.
          </p>
          <p>
            L{"'"}accès au Service est réservé aux personnes majeures capables de contracter. En créant un
            compte, l{"'"}utilisateur déclare remplir ces conditions.
          </p>
        </Section>

        <Section title="3. Description du Service">
          <p>Mon Syndic Bénévole offre notamment les fonctionnalités suivantes :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>Gestion de copropriétés : lots, copropriétaires, documents ;</li>
            <li>Suivi des dépenses et appels de fonds ;</li>
            <li>Organisation et suivi des assemblées générales ;</li>
            <li>Gestion des incidents et travaux ;</li>
            <li>Espace collaboratif pour les copropriétaires invités.</li>
          </ul>
          <p>
            Mon Syndic Bénévole se réserve le droit de modifier, améliorer ou supprimer des fonctionnalités
            à tout moment, notamment pour des raisons techniques ou légales, sans obligation d{"'"}indemnisation.
          </p>
        </Section>

        <Section title="4. Période d'essai">
          <p>
            Un essai gratuit peut être proposé aux nouveaux utilisateurs pour une durée limitée, selon les
            conditions affichées lors de l{"'"}inscription. À l{"'"}issue de la période d{"'"}essai, l{"'"}accès
            aux fonctionnalités premium est conditionné à la souscription d{"'"}un abonnement payant.
          </p>
          <p>
            La période d{"'"}essai est accordée une seule fois par utilisateur. Toute tentative de contournement
            (comptes multiples, etc.) peut entraîner la suspension du compte.
          </p>
        </Section>

        <Section title="5. Abonnements et tarifs">
          <p>
            L{"'"}accès complet au Service est soumis à la souscription d{"'"}un abonnement payant. Les tarifs
            en vigueur sont indiqués sur la page de tarification du site.
          </p>
          <p>
            Les abonnements sont proposés sur une base mensuelle ou annuelle. Le paiement est effectué par
            carte bancaire via la plateforme sécurisée{" "}
            <strong className="text-white">Stripe</strong>, certifiée PCI-DSS. Mon Syndic Bénévole ne conserve
            aucune donnée bancaire.
          </p>
          <p>
            Les abonnements sont renouvelés automatiquement à leur échéance. L{"'"}utilisateur peut résilier à
            tout moment depuis son espace «&nbsp;Abonnement&nbsp;» ; la résiliation prend effet à la fin de la
            période en cours, sans remboursement proratisé sauf disposition légale contraire.
          </p>
          <p>
            Conformément à l{"'"}article L.221-28 12° du Code de la consommation, le droit de rétractation de
            14 jours ne s{"'"}applique pas aux contenus numériques fournis immédiatement après acceptation
            expresse de l{"'"}utilisateur et renonciation à son droit de rétractation.
          </p>
        </Section>

        <Section title="6. Obligations de l'utilisateur">
          <p>L{"'"}utilisateur s{"'"}engage à :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>Utiliser le Service conformément à sa destination et aux lois en vigueur ;</li>
            <li>Ne pas porter atteinte aux droits de tiers ou à la sécurité du Service ;</li>
            <li>
              Ne pas utiliser le Service pour stocker, diffuser ou traiter des données illicites,
              à caractère discriminatoire, haineux ou portant atteinte à la vie privée de tiers ;
            </li>
            <li>Ne pas tenter de contourner les mécanismes de sécurité du Service ;</li>
            <li>
              S{"'"}assurer que les données de copropriété saisies (notamment celles concernant des tiers —
              copropriétaires, prestataires) sont collectées et traitées dans le respect du RGPD.
            </li>
          </ul>
          <p>
            L{"'"}utilisateur agissant en tant que syndic est seul responsable de la légalité et de l{"'"}exactitude
            des données qu{"'"}il saisit dans le Service.
          </p>
        </Section>

        <Section title="7. Propriété intellectuelle">
          <p>
            Le Service, son code source, son interface, ses marques, logos et contenus sont la propriété
            exclusive de Mon Syndic Bénévole ou de ses concédants de licence. Toute reproduction, modification,
            distribution ou exploitation non autorisée est strictement interdite.
          </p>
          <p>
            L{"'"}utilisateur conserve l{"'"}entière propriété des données qu{"'"}il saisit dans le Service.
            Il concède à Mon Syndic Bénévole une licence d{"'"}utilisation limitée, non exclusive, aux seules
            fins de la fourniture du Service.
          </p>
        </Section>

        <Section title="8. Données personnelles">
          <p>
            Mon Syndic Bénévole traite des données à caractère personnel dans le cadre de la fourniture du
            Service. Les modalités de ce traitement sont détaillées dans la{" "}
            <Link
              href="/politique-confidentialite"
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Politique de Confidentialité
            </Link>
            , qui fait partie intégrante des présentes CGU/CGV.
          </p>
        </Section>

        <Section title="9. Disponibilité du Service">
          <p>
            Mon Syndic Bénévole s{"'"}engage à mettre en œuvre les moyens raisonnables pour assurer la
            disponibilité du Service 24h/24, 7j/7. Des interruptions pour maintenance ou cas de force majeure
            peuvent survenir. Elles ne donnent pas droit à indemnisation.
          </p>
          <p>
            En cas d{"'"}indisponibilité prolongée (plus de 72h consécutives, hors force majeure), l{"'"}utilisateur
            peut contacter le support à{" "}
            <a
              href="mailto:contact@mon-syndic-benevole.fr"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              contact@mon-syndic-benevole.fr
            </a>
            .
          </p>
        </Section>

        <Section title="10. Limitation de responsabilité">
          <p>
            Mon Syndic Bénévole est un outil d{"'"}aide à la gestion. Il ne constitue pas un conseil juridique
            ou comptable. L{"'"}utilisateur reste seul responsable des décisions prises dans le cadre de la
            gestion de sa copropriété.
          </p>
          <p>
            La responsabilité de Mon Syndic Bénévole est limitée au montant des sommes versées au titre de
            l{"'"}abonnement au cours des 12 derniers mois. Elle ne saurait être engagée pour des dommages
            indirects, pertes d{"'"}exploitation ou perte de données imputables à l{"'"}utilisateur.
          </p>
        </Section>

        <Section title="11. Résiliation">
          <p>
            L{"'"}utilisateur peut résilier son compte à tout moment depuis son espace «&nbsp;Abonnement&nbsp;»
            ou en contactant le support. Les données sont conservées pendant 30 jours après la résiliation,
            puis supprimées définitivement, sauf obligation légale de conservation.
          </p>
          <p>
            Mon Syndic Bénévole se réserve le droit de suspendre ou résilier un compte en cas de violation
            des présentes CGU/CGV, sans préavis ni remboursement.
          </p>
        </Section>

        <Section title="12. Modification des CGU/CGV">
          <p>
            Mon Syndic Bénévole se réserve le droit de modifier les présentes CGU/CGV à tout moment. Les
            utilisateurs seront informés de toute modification substantielle par email ou notification dans
            l{"'"}application, avec un préavis de 30 jours. La poursuite de l{"'"}utilisation du Service après
            ce délai vaut acceptation des nouvelles conditions.
          </p>
        </Section>

        <Section title="13. Droit applicable et juridiction">
          <p>
            Les présentes CGU/CGV sont soumises au droit français. En cas de litige, une solution amiable
            sera recherchée en priorité. À défaut, les tribunaux compétents du ressort du siège social de
            Mon Syndic Bénévole seront seuls compétents.
          </p>
          <p>
            Conformément aux articles L.611-1 et suivants du Code de la consommation, l{"'"}utilisateur
            consommateur peut recourir gratuitement à un médiateur de la consommation en cas de litige.
          </p>
        </Section>

        <section className="mt-12 pt-6 border-t border-slate-700 text-xs text-gray-500">
          <p>
            Pour toute question relative aux présentes CGU/CGV :{" "}
            <a
              href="mailto:contact@mon-syndic-benevole.fr"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              contact@mon-syndic-benevole.fr
            </a>
          </p>
          <p className="mt-2">
            <Link href="/mentions-legales" className="text-blue-400 hover:text-blue-300 transition-colors underline">
              Mentions légales
            </Link>
            {" — "}
            <Link
              href="/politique-confidentialite"
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Politique de confidentialité
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
