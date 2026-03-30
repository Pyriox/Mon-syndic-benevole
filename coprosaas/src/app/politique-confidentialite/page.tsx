import type { Metadata } from "next";
import Link from "next/link";
import SiteLogo from "@/components/ui/SiteLogo";

export const metadata: Metadata = {
  title: "Politique de Confidentialité",
  description:
    "Politique de confidentialité de Mon Syndic Bénévole — données collectées, finalités, droits RGPD et durées de conservation.",
  alternates: { canonical: 'https://mon-syndic-benevole.fr/politique-confidentialite' },
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

export default function PolitiqueConfidentialitePage() {
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
        <h1 className="text-3xl font-bold text-white mb-2">Politique de Confidentialité</h1>
        <p className="text-gray-500 text-sm mb-12">Dernière mise à jour : {lastUpdate}</p>

        <Section title="1. Responsable du traitement">
          <p>
            Le responsable du traitement des données à caractère personnel est{" "}
            <strong className="text-white">Mon Syndic Bénévole</strong>, dont les coordonnées complètes
            figurent dans les{" "}
            <Link href="/mentions-legales" className="text-blue-400 hover:text-blue-300 transition-colors underline">
              Mentions légales
            </Link>
            .
          </p>
          <p>
            Pour toute question relative à la protection de vos données, vous pouvez nous contacter à :{" "}
            <a
              href="mailto:contact@mon-syndic-benevole.fr"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              contact@mon-syndic-benevole.fr
            </a>
          </p>
        </Section>

        <Section title="2. Données collectées">
          <p>Nous collectons les catégories de données suivantes :</p>
          <div className="overflow-x-auto mt-3">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="text-gray-300 border-b border-slate-700">
                  <th className="text-left py-2 pr-4 font-medium">Données</th>
                  <th className="text-left py-2 pr-4 font-medium">Source</th>
                  <th className="text-left py-2 font-medium">Finalité</th>
                </tr>
              </thead>
              <tbody className="text-gray-400">
                <tr className="border-b border-slate-800">
                  <td className="py-2 pr-4">Nom, prénom, email</td>
                  <td className="py-2 pr-4">Inscription</td>
                  <td className="py-2">Création et gestion du compte</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-2 pr-4">Données de copropriété (lots, charges, PV…)</td>
                  <td className="py-2 pr-4">Saisie utilisateur</td>
                  <td className="py-2">Fourniture du Service</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-2 pr-4">Données de paiement</td>
                  <td className="py-2 pr-4">Paiement (Stripe)</td>
                  <td className="py-2">Facturation et gestion des abonnements</td>
                </tr>
                <tr className="border-b border-slate-800">
                  <td className="py-2 pr-4">Données de navigation (pages visitées, actions)</td>
                  <td className="py-2 pr-4">Google Analytics 4</td>
                  <td className="py-2">Mesure d{"'"}audience (avec consentement)</td>
                </tr>
                <tr>
                  <td className="py-2 pr-4">Logs techniques (IP, navigateur, horodatage)</td>
                  <td className="py-2 pr-4">Infrastr. (Vercel / Supabase)</td>
                  <td className="py-2">Sécurité et débogage</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3">
            Nous ne collectons pas de données sensibles au sens de l{"'"}article 9 du RGPD (santé, opinions
            politiques, religion, etc.).
          </p>
        </Section>

        <Section title="3. Bases légales du traitement">
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-gray-300">Exécution du contrat</strong> — traitement nécessaire à la
              fourniture du Service (compte, abonnement, fonctionnalités).
            </li>
            <li>
              <strong className="text-gray-300">Intérêt légitime</strong> — sécurité du Service, prévention
              des fraudes, amélioration des fonctionnalités.
            </li>
            <li>
              <strong className="text-gray-300">Consentement</strong> — cookies analytiques Google Analytics
              (révocable à tout moment via le bandeau cookies).
            </li>
            <li>
              <strong className="text-gray-300">Obligation légale</strong> — conservation des factures et
              données comptables (durée légale : 10 ans).
            </li>
          </ul>
        </Section>

        <Section title="4. Durées de conservation">
          <ul className="list-disc list-inside space-y-2 pl-2">
            <li>
              <strong className="text-gray-300">Données du compte actif :</strong> pendant toute la durée de
              l{"'"}abonnement.
            </li>
            <li>
              <strong className="text-gray-300">Après résiliation :</strong> 30 jours (permettant une
              éventuelle réactivation), puis suppression définitive.
            </li>
            <li>
              <strong className="text-gray-300">Données de facturation :</strong> 10 ans à compter de la
              transaction (obligation comptable et fiscale).
            </li>
            <li>
              <strong className="text-gray-300">Logs de sécurité :</strong> 12 mois maximum.
            </li>
            <li>
              <strong className="text-gray-300">Données analytiques (GA4) :</strong> 14 mois maximum (paramètre
              par défaut Google Analytics).
            </li>
          </ul>
        </Section>

        <Section title="5. Destinataires des données">
          <p>
            Vos données ne sont ni vendues, ni louées, ni cédées à des tiers à des fins commerciales.
            Elles peuvent être partagées avec les sous-traitants suivants, dans la stricte limite de leurs
            missions :
          </p>
          <ul className="list-disc list-inside space-y-2 pl-2 mt-3">
            <li>
              <strong className="text-gray-300">Supabase Inc.</strong> — hébergement de la base de données
              (région Frankfurt, UE).
            </li>
            <li>
              <strong className="text-gray-300">Vercel Inc.</strong> — hébergement de l{"'"}application (CDN
              mondial ; données de traitement routées via UE lorsque possible).
            </li>
            <li>
              <strong className="text-gray-300">Stripe Inc.</strong> — traitement des paiements, certifié
              PCI-DSS niveau 1.
            </li>
            <li>
              <strong className="text-gray-300">Google LLC</strong> — mesure d{"'"}audience via Google Analytics
              4 (avec votre consentement).
            </li>
          </ul>
        </Section>

        <Section title="6. Transferts hors Union Européenne">
          <p>
            Certains sous-traitants (Vercel, Stripe, Google) transfèrent des données vers les États-Unis.
            Ces transferts sont encadrés par les Clauses Contractuelles Types de la Commission européenne
            (décision d{"'"}exécution UE 2021/914) ou par les mécanismes équivalents reconnus par le RGPD.
          </p>
          <p>
            La base de données Supabase est hébergée en Europe (Frankfurt,{" "}
            <code className="text-sm bg-slate-800 px-1.5 py-0.5 rounded">eu-central-1</code>) et ne fait
            pas l{"'"}objet de transferts hors UE.
          </p>
        </Section>

        <Section title="7. Vos droits">
          <p>
            Conformément au RGPD et à la loi Informatique et Libertés, vous disposez des droits suivants :
          </p>
          <ul className="list-disc list-inside space-y-1.5 pl-2 mt-3">
            <li>
              <strong className="text-gray-300">Droit d{"'"}accès</strong> — obtenir une copie de vos données.
            </li>
            <li>
              <strong className="text-gray-300">Droit de rectification</strong> — corriger des données
              inexactes.
            </li>
            <li>
              <strong className="text-gray-300">Droit à l{"'"}effacement</strong> — («&nbsp;droit à l{"'"}oubli&nbsp;»)
              dans les cas prévus par le RGPD.
            </li>
            <li>
              <strong className="text-gray-300">Droit à la limitation</strong> — suspendre temporairement le
              traitement.
            </li>
            <li>
              <strong className="text-gray-300">Droit à la portabilité</strong> — recevoir vos données dans un
              format structuré.
            </li>
            <li>
              <strong className="text-gray-300">Droit d{"'"}opposition</strong> — s{"'"}opposer au traitement
              fondé sur l{"'"}intérêt légitime.
            </li>
            <li>
              <strong className="text-gray-300">Retrait du consentement</strong> — à tout moment pour les
              traitements fondés sur le consentement (cookies analytiques).
            </li>
          </ul>
          <p className="mt-4">
            Pour exercer ces droits, contactez-nous à{" "}
            <a
              href="mailto:contact@mon-syndic-benevole.fr"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              contact@mon-syndic-benevole.fr
            </a>{" "}
            en joignant une pièce d{"'"}identité. Nous répondrons dans un délai d{"'"}un mois.
          </p>
          <p>
            Vous pouvez également introduire une réclamation auprès de la CNIL :{" "}
            <a
              href="https://www.cnil.fr"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 transition-colors"
            >
              www.cnil.fr
            </a>
            .
          </p>
        </Section>

        <Section title="8. Sécurité">
          <p>
            Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour protéger
            vos données contre tout accès non autorisé, perte ou altération :
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 mt-3">
            <li>Chiffrement des communications (HTTPS/TLS) ;</li>
            <li>Authentification sécurisée (mots de passe hashés, session sécurisée via Supabase Auth) ;</li>
            <li>Contrôle d{"'"}accès par rôle (Row Level Security sur la base de données) ;</li>
            <li>Isolation des données entre utilisateurs.</li>
          </ul>
        </Section>

        <Section title="9. Cookies">
          <p>
            Les cookies analytiques (Google Analytics 4) ne sont déposés qu{"'"}avec votre consentement,
            recueilli via le bandeau affiché lors de votre première visite. Vous pouvez retirer ce consentement
            à tout moment en cliquant sur «&nbsp;Gérer les cookies&nbsp;» en bas de page.
          </p>
        </Section>

        <Section title="10. Modifications de la politique">
          <p>
            Cette politique peut être mise à jour pour refléter des évolutions légales ou fonctionnelles.
            En cas de modification substantielle, vous serez informé par email ou notification dans
            l{"'"}application.
          </p>
        </Section>

        <section className="mt-12 pt-6 border-t border-slate-700 text-xs text-gray-500">
          <p>
            Contact DPO / données personnelles :{" "}
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
            <Link href="/cgu" className="text-blue-400 hover:text-blue-300 transition-colors underline">
              CGU / CGV
            </Link>
          </p>
        </section>
      </main>
    </div>
  );
}
