import type { Metadata } from "next";
import Link from "next/link";
import LandingNav from '@/app/LandingNav';

export const dynamic = 'force-static';
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Conditions Générales d'Utilisation",
  description:
    "Conditions Générales d'Utilisation et de Vente de Mon Syndic Bénévole — modalités d'accès, abonnements, obligations et responsabilités.",
  alternates: { canonical: 'https://www.mon-syndic-benevole.fr/cgu' },
  robots: { index: false, follow: true },
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
  const lastUpdate = new Date("2026-06-04").toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="min-h-screen bg-slate-950 text-gray-200">
      <LandingNav />
      <div className="h-16" aria-hidden="true" />

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
              href="https://www.mon-syndic-benevole.fr"
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
            Un essai gratuit de <strong className="text-white">14 jours</strong> est accordé à tout
            nouvel utilisateur. Lors de la souscription, un moyen de paiement valide (carte bancaire ou
            IBAN) est enregistré via la plateforme{" "}
            <strong className="text-white">Stripe</strong>{" "}; aucun montant n{"'"}est prélevé pendant
            la période d{"'"}essai.
          </p>
          <p>
            À l{"'"}issue des 14 jours, l{"'"}abonnement sélectionné démarre{" "}
            <strong className="text-white">automatiquement</strong> et le premier prélèvement est
            effectué. Pour ne pas être prélevé, l{"'"}utilisateur doit annuler son abonnement avant la
            fin de l{"'"}essai depuis son espace « Abonnement ». Des rappels sont envoyés par e-mail
            à J‑7, J‑3 et J‑1 avant l{"’"}échéance.
          </p>
          <p>
            La période d{"'"}essai est accordée une seule fois par utilisateur. Toute tentative de
            contournement (comptes multiples, etc.) peut entraîner la suspension du compte.
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
            <strong className="text-white">Droit de rétractation :</strong> conformément à l{"'"}article
            L.221-18 du Code de la consommation, l{"'"}utilisateur consommateur dispose d{"'"}un délai de
            rétractation de 14&nbsp;jours à compter de la conclusion du contrat, qu{"'"}il peut exercer sans
            frais ni pénalité en annulant depuis l{"'"}espace « Abonnement » ou par e-mail à{" "}
            <a href="mailto:contact@mon-syndic-benevole.fr" className="text-blue-400 hover:text-blue-300 transition-colors">
              contact@mon-syndic-benevole.fr
            </a>.
          </p>
          <p>
            Pour les abonnements avec période d{"'"}essai, l{"'"}annulation pendant les 14&nbsp;jours d{"'"}essai
            entraîne la résiliation immédiate et aucun montant ne sera prélevé — ce qui constitue
            l{"'"}exercice plein et entier du droit de rétractation. Pour les souscriptions directes sans
            période d{"'"}essai, l{"'"}utilisateur peut demander la résiliation et le remboursement intégral
            dans les 14&nbsp;jours suivant la souscription.
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

        <Section title="8. Données personnelles et protection de la vie privée">
          <p>
            Mon Syndic Bénévole traite des données à caractère personnel dans le cadre de la fourniture du
            Service. Les modalités complètes de ce traitement sont décrites dans la{" "}
            <Link
              href="/politique-confidentialite"
              className="text-blue-400 hover:text-blue-300 transition-colors underline"
            >
              Politique de Confidentialité
            </Link>
            , qui fait partie intégrante des présentes CGU/CGV. La présente section précise les aspects
            relatifs au traitement des données de tiers (copropriétaires) confiées à Mon Syndic Bénévole
            par le syndic utilisateur.
          </p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.1 Rôles respectifs — Responsable de traitement et sous-traitant
          </h3>
          <p>
            Dans le cadre du Règlement (UE) 2016/679 (RGPD), les rôles sont répartis comme suit :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>
              <strong className="text-white">Le syndic utilisateur</strong> est <strong className="text-white">responsable de traitement</strong>{" "}
              pour l{"'"}ensemble des données personnelles relatives aux copropriétaires et aux tiers qu{"'"}il
              saisit dans le Service (noms, coordonnées, données financières, etc.).
            </li>
            <li>
              <strong className="text-white">Mon Syndic Bénévole</strong> agit en qualité de{" "}
              <strong className="text-white">sous-traitant</strong> (art. 28 RGPD) pour ces données,
              en ce qu{"'"}il les traite exclusivement pour le compte et sur instruction du syndic.
            </li>
            <li>
              Mon Syndic Bénévole est <strong className="text-white">responsable de traitement</strong>{" "}
              pour ses propres données d{"'"}exploitation (comptes utilisateurs, données de facturation,
              logs techniques, données d{"'"}analyse anonymisées).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.2 Engagements de Mon Syndic Bénévole en tant que sous-traitant (art. 28 RGPD)
          </h3>
          <p>En acceptant les présentes CGU/CGV, le syndic utilisateur donne instruction à Mon Syndic Bénévole de traiter les données de copropriété aux seules fins de la fourniture du Service. Mon Syndic Bénévole s{"'"}engage à :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>
              Ne traiter les données personnelles des copropriétaires que sur instruction documentée du syndic
              (utilisation du Service), sauf obligation légale contraire ;
            </li>
            <li>
              Garantir la confidentialité des données traitées et s{"'"}assurer que les personnes habilitées
              à y accéder s{"'"}engagent à la confidentialité ;
            </li>
            <li>
              Mettre en œuvre les mesures techniques et organisationnelles appropriées pour assurer la
              sécurité des données (chiffrement au repos et en transit, contrôle d{"'"}accès, sauvegardes
              régulières) ;
            </li>
            <li>
              Notifier le syndic sans délai injustifié en cas de violation de données susceptible d{"'"}affecter
              les données de sa copropriété (art. 33 RGPD) ;
            </li>
            <li>
              Ne pas recruter de nouveau sous-traitant ultérieur sans en informer le syndic au préalable
              (voir section 8.4 ci-dessous) ;
            </li>
            <li>
              Restituer ou supprimer les données de copropriété à la résiliation du compte, au choix du
              syndic, conformément à la section 11 des présentes.
            </li>
          </ul>
          <p>
            Le syndic, en qualité de responsable de traitement, est seul responsable de s{"'"}assurer que
            les copropriétaires sont informés du traitement de leurs données personnelles (art. 13 RGPD),
            notamment lors de leur première invitation sur la plateforme.
          </p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.3 Données traitées, finalités et durées de conservation
          </h3>
          <p>Mon Syndic Bénévole traite les catégories de données suivantes :</p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>
              <strong className="text-white">Données de compte syndic :</strong> nom, prénom, adresse e-mail,
              mot de passe chiffré (bcrypt), rôle — conservées pendant la durée de l{"'"}abonnement actif et
              jusqu{"'"}à 3 ans après résiliation.
            </li>
            <li>
              <strong className="text-white">Données de copropriété :</strong> identité des copropriétaires,
              adresses e-mail, tantièmes, données financières (charges, appels de fonds, soldes) — conservées
              pendant la durée de l{"'"}abonnement et jusqu{"'"}à 5 ans après résiliation (délai de prescription
              légale en matière de copropriété).
            </li>
            <li>
              <strong className="text-white">Données de facturation :</strong> historique des transactions
              Stripe, montants, dates — conservées 10 ans (obligation comptable légale).
            </li>
            <li>
              <strong className="text-white">Logs d{"'"}envoi d{"'"}e-mails :</strong> destinataire, objet,
              horodatage, statut de livraison — conservés 5 ans (preuve légale d{"'"}envoi des convocations et
              appels de fonds).
            </li>
            <li>
              <strong className="text-white">Données d{"'"}usage anonymisées :</strong> pages visitées,
              actions réalisées, sans identification possible — conservées 13 mois (recommandation CNIL).
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.4 Sous-traitants ultérieurs
          </h3>
          <p>
            Mon Syndic Bénévole fait appel aux prestataires techniques suivants, qui agissent en qualité de
            sous-traitants ultérieurs et avec lesquels des contrats de traitement de données conformes à
            l{"'"}art. 28 RGPD ont été conclus :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>
              <strong className="text-white">Supabase Inc.</strong> (États-Unis) — hébergement de la base de
              données et authentification. Transfert encadré par les Clauses Contractuelles Types de la
              Commission européenne.
            </li>
            <li>
              <strong className="text-white">Resend Inc.</strong> (États-Unis) — plateforme d{"'"}envoi d{"'"}e-mails
              transactionnels. Transfert encadré par les Clauses Contractuelles Types.
            </li>
            <li>
              <strong className="text-white">Stripe Inc.</strong> (États-Unis) — traitement des paiements.
              Certifié PCI-DSS niveau 1. Transfert encadré par les Clauses Contractuelles Types.
            </li>
            <li>
              <strong className="text-white">Vercel Inc.</strong> (États-Unis) — hébergement de l{"'"}application.
              Transfert encadré par les Clauses Contractuelles Types.
            </li>
          </ul>
          <p>
            Mon Syndic Bénévole s{"'"}engage à informer le syndic de tout changement concernant l{"'"}ajout ou
            le remplacement d{"'"}un sous-traitant ultérieur, en lui donnant la possibilité de s{"'"}y opposer.
          </p>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.5 Base légale des e-mails automatiques envoyés aux copropriétaires
          </h3>
          <p>
            Le Service envoie automatiquement des e-mails aux copropriétaires pour le compte du syndic.
            La base légale de ces envois varie selon le type d{"'"}e-mail :
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-400 pl-2">
            <li>
              <strong className="text-white">Convocations d{"'"}AG, rappels de convocation, PV d{"'"}AG :</strong>{" "}
              obligation légale (art. 9 et 17-1 du décret n°&nbsp;67-223 du 17&nbsp;mars&nbsp;1967) — ces
              e-mails ne comportent pas de lien de désabonnement.
            </li>
            <li>
              <strong className="text-white">Avis d{"'"}appel de fonds, relances d{"'"}impayés :</strong>{" "}
              exécution du contrat liant le copropriétaire à la copropriété (obligation de payer sa
              quote-part de charges) — ces e-mails ne comportent pas de lien de désabonnement.
            </li>
            <li>
              <strong className="text-white">Rappels pré-échéance (J-7) :</strong> intérêt légitime —
              ces e-mails permettent au copropriétaire de s{"'"}y opposer.
            </li>
          </ul>

          <h3 className="text-sm font-semibold text-white mt-4 mb-1">
            8.6 Droits des personnes concernées
          </h3>
          <p>
            Toute personne dont les données sont traitées dans le cadre du Service dispose des droits suivants
            au titre du RGPD : accès (art. 15), rectification (art. 16), effacement (art. 17), limitation
            du traitement (art. 18), portabilité (art. 20), opposition (art. 21).
          </p>
          <p>
            <strong className="text-white">Pour les copropriétaires :</strong> ces droits s{"'"}exercent
            auprès du syndic bénévole responsable de traitement, qui en est l{"'"}interlocuteur principal.
            En cas de difficulté, une demande peut également être adressée à Mon Syndic Bénévole à
            l{"'"}adresse{" "}
            <a href="mailto:contact@mon-syndic-benevole.fr" className="text-blue-400 hover:text-blue-300 transition-colors">
              contact@mon-syndic-benevole.fr
            </a>
            .
          </p>
          <p>
            <strong className="text-white">Pour les syndics utilisateurs :</strong> ces droits s{"'"}exercent
            directement auprès de Mon Syndic Bénévole à la même adresse.
          </p>
          <p>
            En cas de réponse insatisfaisante, une réclamation peut être introduite auprès de la{" "}
            <strong className="text-white">CNIL</strong> (Commission Nationale de l{"'"}Informatique et des
            Libertés) via{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              cnil.fr
            </a>
            .
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
            consommateur peut recourir gratuitement à un médiateur de la consommation. Mon Syndic
            Bénévole a désigné le{" "}
            <strong className="text-white">CNPM Médiation-Consommation</strong>, accessible à
            l{"'"}adresse{" "}
            <a
              href="https://www.cnpm-mediation-consommation.eu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              cnpm-mediation-consommation.eu
            </a>
            . La plateforme européenne de règlement en ligne des litiges (RLL) est également accessible
            via{" "}
            <a
              href="https://ec.europa.eu/consumers/odr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              ec.europa.eu/consumers/odr
            </a>
            .
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
