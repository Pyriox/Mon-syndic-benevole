// ============================================================
// Article : Préparer et organiser une AG de copropriété — guide complet
// Target KW : "assemblée générale copropriété", "préparer AG copropriété",
//             "convoquer assemblée générale copropriété", "ordre du jour AG copropriété"
// ============================================================

/* eslint-disable @next/next/no-html-link-for-pages */

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleAssembleeGenerale() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        Il est 23 h. L&apos;assemblée générale est dans trois semaines et Anne-Sophie, syndic bénévole d&apos;une résidence de 10 lots à Nantes, en est encore à chercher les relevés bancaires dans ses e-mails, à reconstituer les dépenses de l&apos;année poste par poste, à vérifier si elle a bien tous les devis annexés à convoquer. &ldquo;La première fois, j&apos;ai passé quatre week-ends entiers à préparer une réunion de deux heures.&rdquo;
      </p>
      <p className={p}>
        La deuxième année, après avoir migré vers un outil dédié, la même AG lui a pris <strong className={strong}>une matinée</strong> — comptes bouclés, convocations générées, envoyées avec le bon délai. La réunion elle-même s&apos;est tenue en 1 h 30 chrono.
      </p>
      <p className={p}>
        Ce guide couvre l&apos;intégralité du cycle AG — de la préparation des comptes à la notification du PV — avec les templates légaux, les règles de majorité, les erreurs à éviter, et ce que vous pouvez déléguer à un outil pour ne plus jamais rater une date critique.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Anne-Sophie prépare son AG en une matinée. Vous pouvez faire pareil.</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole gère le cycle complet de votre AG : brouillon, planification, convocation PDF avec le bon délai légal, procès-verbal, envoi. Zéro calcul de date, zéro mise en forme manuelle.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Préparer mon AG gratuitement →
        </CtaLink>
      </div>

      <h2 id="quand-ag" className={h2}>Quand tenir l&apos;AG : les dates légales</h2>
      <p className={p}>
        La loi impose une <strong className={strong}>assemblée générale ordinaire au moins une fois par an</strong>, dans les six mois suivant la clôture de l&apos;exercice comptable (art. 7 décret du 17 mars 1967). Si votre exercice clôt au 31 décembre, l&apos;AG doit se tenir au plus tard le 30 juin de l&apos;année suivante.
      </p>
      <p className={p}>
        En pratique, la majorité des copropriétés tiennent leur AG <strong className={strong}>entre mars et juin</strong> — période où les comptes de l&apos;année précédente sont bouclés et où la mobilisation des copropriétaires est la meilleure.
      </p>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Clôture de l&apos;exercice</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">AG à tenir avant le</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Convocation à envoyer avant le</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Commencer à préparer dès le</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700 font-medium">31 décembre</td>
              <td className="py-3 px-4 text-gray-700">30 juin</td>
              <td className="py-3 px-4 text-gray-700">9 juin (J-21)</td>
              <td className="py-3 px-4 text-gray-600">Mi-avril (8 semaines avant)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700 font-medium">31 mars</td>
              <td className="py-3 px-4 text-gray-700">30 septembre</td>
              <td className="py-3 px-4 text-gray-700">9 septembre</td>
              <td className="py-3 px-4 text-gray-600">Mi-juillet</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700 font-medium">30 juin</td>
              <td className="py-3 px-4 text-gray-700">31 décembre</td>
              <td className="py-3 px-4 text-gray-700">10 décembre</td>
              <td className="py-3 px-4 text-gray-600">Mi-octobre</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-6 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Attention — le délai de 21 jours est minimum, pas recommandé</p>
        <p className="text-sm text-gray-700">
          21 jours calendaires entre la <em>première présentation</em> de la lettre recommandée et la date de l&apos;AG (pas la date d&apos;envoi). En pratique, prévoyez toujours <strong>24 à 25 jours</strong> pour absorber un week-end ou un jour férié. Une AG convoquée à J-18 peut être annulée sur recours — même si vous étiez de bonne foi.
        </p>
      </div>

      <h2 id="preparation" className={h2}>J-8 semaines : préparer le contenu de l&apos;AG</h2>
      <p className={p}>
        La majorité du travail de l&apos;AG se fait en amont — pas le soir de la réunion. Voici les quatre chantiers à ouvrir deux mois avant.
      </p>

      <h3 className={h3}>1. Clôturer les comptes de l&apos;exercice précédent</h3>
      <p className={p}>
        Les copropriétaires doivent approuver les comptes de l&apos;exercice N-1 en AG. Vous devez donc les <strong className={strong}>clôturer avant d&apos;envoyer les convocations</strong> — pas après. Deux colonnes à préparer : dépenses réalisées vs budget voté. L&apos;écart explique la régularisation annuelle (solde à payer ou trop-perçu à rembourser).
      </p>
      <p className={p}>
        Pour comprendre en détail le calcul de la régularisation et sa répartition par copropriétaire (notamment quand des <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>charges spéciales</a> sont impliquées), consultez notre guide complet sur les appels de fonds.
      </p>

      <h3 className={h3}>2. Établir le budget prévisionnel</h3>
      <p className={p}>
        Le budget de l&apos;exercice N+1 doit être présenté poste par poste : assurance MRI, nettoyage, électricité des communs, contrat ascenseur, espaces verts, petits travaux d&apos;entretien courants. Chaque poste doit s&apos;appuyer sur un <strong className={strong}>justificatif ou un devis</strong> pour être défendable en AG.
      </p>
      <p className={p}>
        N&apos;oubliez pas le vote du <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> — obligatoire pour toutes les copropriétés depuis 2025 (minimum 5 % du budget prévisionnel). Il figure systématiquement à l&apos;ordre du jour.
      </p>

      <h3 className={h3}>3. Recenser les résolutions</h3>
      <p className={p}>
        Listez tout ce qui doit être voté :
      </p>
      <ul className={ul}>
        <li className={li}>Résolutions <strong className={strong}>obligatoires</strong> : approbation des comptes N-1, vote du budget N+1, vote du fonds de travaux, renouvellement du mandat du syndic si applicable</li>
        <li className={li}>Résolutions <strong className={strong}>facultatives</strong> : travaux, changement de prestataire, autorisation exceptionnelle pour le syndic</li>
        <li className={li}>Résolutions <strong className={strong}>demandées par des copropriétaires</strong> : tout copropriétaire peut demander l&apos;inscription d&apos;une résolution à l&apos;ordre du jour par LRAR au syndic, avant l&apos;envoi des convocations</li>
      </ul>

      <div className="my-6 rounded-xl bg-blue-50 border border-blue-100 p-5">
        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">Conseil pratique</p>
        <p className="text-sm text-gray-700">Envoyez un e-mail aux copropriétaires 6 semaines avant l&apos;AG pour recueillir leurs demandes de résolutions et vérifier leur disponibilité sur les créneaux que vous avez choisis. Vous évitez les surprises et montrez une gestion transparente.</p>
      </div>

      <h3 className={h3}>4. Rassembler les annexes obligatoires</h3>
      <p className={p}>
        La convocation doit être accompagnée de tous les documents permettant aux copropriétaires de voter en connaissance de cause. La liste minimale :
      </p>

      <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Documents à joindre à la convocation</p>
        </div>
        <div className="divide-y divide-gray-100">
          {([
            { cat: 'Comptabilité', docs: ['Comptes de l\'exercice clos — dépenses par poste, montant appelé, solde', 'Tableau de répartition des charges par copropriétaire', 'Relevés bancaires du compte courant et du compte fonds de travaux'] },
            { cat: 'Résolutions financières', docs: ['Projet de budget prévisionnel N+1 (poste par poste)', 'Proposition de cotisation au fonds de travaux'] },
            { cat: 'Travaux votés', docs: ['Au moins deux devis comparatifs pour chaque résolution travaux de l\'article 25', 'Note technique de présentation pour les travaux importants'] },
            { cat: 'Formulaires obligatoires', docs: ['Formulaire de vote par correspondance (obligatoire depuis la loi ELAN 2018)', 'Formulaire de délégation de pouvoirs'] },
          ] as { cat: string; docs: string[] }[]).map(({ cat, docs }) => (
            <div key={cat} className="px-5 py-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">{cat}</p>
              <ul className="space-y-1">
                {docs.map((d) => (
                  <li key={d} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-400 mt-0.5 flex-shrink-0">→</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <h2 id="convocation" className={h2}>La convocation : template et points légaux (J-21)</h2>
      <p className={p}>
        La convocation est le document dont la régularité conditionne la validité <em>de toutes les résolutions votées lors de l&apos;AG</em>. Un seul point non respecté et un copropriétaire mécontent peut faire annuler les décisions. Voici le modèle conforme.
      </p>

      <div className="my-6 bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm leading-relaxed">
        <p className="text-gray-400 text-xs mb-4 font-sans uppercase tracking-wider">— Modèle de convocation AG ordinaire —</p>
        <p className="mb-2 text-gray-800 font-semibold font-mono">SYNDICAT DES COPROPRIÉTAIRES</p>
        <p className="mb-1 text-gray-700 font-mono">[Nom de la résidence] — [Adresse complète]</p>
        <p className="mb-4 text-gray-700 font-mono">Syndic bénévole : [Prénom NOM] — [e-mail] — [téléphone]</p>
        <p className="mb-1 text-gray-700 font-mono">[Ville], le [date d&apos;envoi]</p>
        <p className="mb-4 text-gray-700 font-mono">Envoi par lettre recommandée avec accusé de réception</p>
        <p className="mb-2 text-gray-800 font-mono">Madame / Monsieur [Nom], propriétaire du lot n° [X]</p>
        <p className="mb-4 text-gray-700 font-mono">Objet : Convocation à l&apos;Assemblée Générale Ordinaire du [date de l&apos;AG]</p>
        <p className="mb-4 text-gray-700 font-mono">
          En ma qualité de syndic non-professionnel bénévole, j&apos;ai l&apos;honneur de vous convoquer à l&apos;Assemblée Générale Ordinaire des copropriétaires de [nom copropriété] qui se tiendra le :<br />
          <strong>[JOUR] [DATE] à [Heure]</strong><br />
          [Adresse précise de la réunion — salle, étage, code d&apos;accès si nécessaire]
        </p>
        <p className="mb-2 text-gray-800 font-mono font-semibold">Ordre du jour :</p>
        <ol className="list-decimal ml-5 mb-4 space-y-1 font-mono text-gray-700">
          <li>Désignation du président de séance et du secrétaire</li>
          <li>Approbation des comptes de l&apos;exercice [N-1] — art. 18 loi 1965 (majorité art. 24)</li>
          <li>Quitus de gestion au syndic pour l&apos;exercice [N-1] (majorité art. 24)</li>
          <li>Vote du budget prévisionnel [N+1] — art. 14-1 loi 1965 (majorité art. 24)</li>
          <li>Vote de la cotisation au fonds de travaux [N+1] — art. 14-2 loi 1965 (majorité art. 25)</li>
          <li>[Résolution travaux / autre — intitulé précis] (majorité art. [X])</li>
          <li>Questions diverses</li>
        </ol>
        <p className="mb-3 text-gray-700 font-mono">Pièces jointes : comptes exercice [N-1], budget [N+1], devis [prestataire], formulaires de vote par correspondance et de délégation de pouvoir.</p>
        <p className="mb-1 text-gray-700 font-mono">Cordialement,</p>
        <p className="text-gray-700 font-mono">[Prénom NOM] — Syndic non-professionnel bénévole</p>
      </div>

      <div className="my-6 bg-amber-50 border border-amber-200 rounded-xl p-5">
        <p className="text-sm font-semibold text-amber-800 mb-3">5 points légaux à vérifier avant d&apos;envoyer</p>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5 flex-shrink-0">✓</span><span>Délai de 21 jours minimum entre la <em>première présentation</em> du recommandé et la date de l&apos;AG (prévoyez 24 jours minimum)</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5 flex-shrink-0">✓</span><span>Chaque copropriétaire convoqué individuellement — y compris les indivisaires (un représentant désigné ou les deux convoqués)</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5 flex-shrink-0">✓</span><span>La majorité applicable est indiquée pour chaque résolution à l&apos;ordre du jour</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5 flex-shrink-0">✓</span><span>Le formulaire de vote par correspondance est joint (obligatoire depuis la loi ELAN, décret 2020)</span></li>
          <li className="flex items-start gap-2"><span className="text-amber-600 font-bold mt-0.5 flex-shrink-0">✓</span><span>Les documents comptables et devis sont bien annexés (sans eux, des résolutions peuvent être contestées)</span></li>
        </ul>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Mon Syndic Bénévole calcule automatiquement le bon délai</p>
        <p className="text-sm text-gray-600 mb-4">
          Indiquez la date de votre AG — la plateforme calcule la date limite d&apos;envoi des convocations et vous alerte si vous êtes trop juste. La convocation PDF est générée avec les données de votre copropriété et l&apos;ordre du jour que vous avez saisi.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Générer ma convocation automatiquement →
        </CtaLink>
      </div>

      <h2 id="regles-majorite" className={h2}>Les règles de majorité : articles 24, 25 et 26</h2>
      <p className={p}>
        C&apos;est le point qui déroute le plus les syndics bénévoles débutants. Une résolution votée avec la mauvaise règle de majorité peut être annulée. Voici le tableau de référence.
      </p>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Règle</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Ce qu&apos;elle exige</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Pour quoi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 font-semibold text-gray-800 align-top">Art. 24<br /><span className="text-xs font-normal text-gray-500">Majorité simple</span></td>
              <td className="py-3 px-4 text-gray-700 align-top">Majorité des voix des copropriétaires <em>présents et représentés</em> uniquement</td>
              <td className="py-3 px-4 text-gray-600 align-top">
                <ul className="space-y-1">
                  <li>→ Approbation des comptes annuels</li>
                  <li>→ Vote du budget prévisionnel</li>
                  <li>→ Petits travaux d&apos;entretien courant</li>
                  <li>→ Présentation des parties communes en vue d&apos;accessibilité</li>
                  <li>→ Installation de compteurs individuels (eau, énergie)</li>
                </ul>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-semibold text-gray-800 align-top">Art. 25<br /><span className="text-xs font-normal text-gray-500">Majorité absolue</span></td>
              <td className="py-3 px-4 text-gray-700 align-top">Majorité des voix de <em>tous</em> les copropriétaires (présents + absents + représentés)</td>
              <td className="py-3 px-4 text-gray-600 align-top">
                <ul className="space-y-1">
                  <li>→ <strong className={strong}>Élection / renouvellement du syndic</strong></li>
                  <li>→ Vote du fonds de travaux ALUR</li>
                  <li>→ Travaux d&apos;amélioration (sauf article 26)</li>
                  <li>→ Autorisation au syndic de certains actes</li>
                  <li>→ Installation antenne collective, interphonie</li>
                </ul>
              </td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-semibold text-gray-800 align-top">Art. 26<br /><span className="text-xs font-normal text-gray-500">Double majorité</span></td>
              <td className="py-3 px-4 text-gray-700 align-top">Majorité des copropriétaires <em>ET</em> des 2/3 des tantièmes</td>
              <td className="py-3 px-4 text-gray-600 align-top">
                <ul className="space-y-1">
                  <li>→ Vente d&apos;une partie commune</li>
                  <li>→ Modification du règlement de copropriété</li>
                  <li>→ Surélévation ou adjonction de bâtiment</li>
                  <li>→ Travaux de démolition</li>
                </ul>
              </td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-semibold text-gray-800 align-top">Unanimité</td>
              <td className="py-3 px-4 text-gray-700 align-top">100 % des copropriétaires</td>
              <td className="py-3 px-4 text-gray-600 align-top">
                <ul className="space-y-1">
                  <li>→ Suppression d&apos;un droit de jouissance exclusif</li>
                  <li>→ Aliénation d&apos;une partie commune dont la conservation est nécessaire</li>
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-6 rounded-xl bg-blue-50 border border-blue-100 p-5">
        <p className="text-xs font-semibold text-blue-700 uppercase tracking-wider mb-2">La règle du second tour (art. 25-1)</p>
        <p className="text-sm text-gray-700">
          Si une résolution de l&apos;art. 25 recueille <strong>plus du tiers des voix</strong> sans atteindre la majorité absolue, un <strong>second vote à la majorité de l&apos;art. 24</strong> peut être organisé <em>immédiatement</em> lors de la même AG — sans nouvelle convocation. C&apos;est souvent la résolution qui passe au second tour qui débloque une situation. Ne levez pas la séance trop vite.
        </p>
      </div>

      <h2 id="deroulement" className={h2}>Le jour de l&apos;AG : conduire la séance</h2>

      <h3 className={h3}>Avant d&apos;ouvrir la séance</h3>
      <p className={p}>
        Préparez votre <strong className={strong}>feuille de présence</strong> en listant tous les lots, leurs propriétaires et leurs tantièmes. À l&apos;arrivée de chaque copropriétaire, notez sa présence et récoltez les pouvoirs des absents qui ont délégué. Il n&apos;y a pas de quorum légal en copropriété — vous pouvez commencer même si un seul copropriétaire est présent.
      </p>

      <h3 className={h3}>Ouverture de la séance</h3>
      <p className={p}>
        La première résolution est toujours la désignation du <strong className={strong}>président de séance</strong> (à ne pas confondre avec le syndic — c&apos;est souvent un copropriétaire différent) et du <strong className={strong}>secrétaire de séance</strong> (qui rédige ou aide à rédiger le PV). Notez le nombre de tantièmes représentés — c&apos;est la base du calcul pour toutes les majorités.
      </p>

      <h3 className={h3}>Pendant les votes</h3>
      <p className={p}>
        Pour chaque résolution, annoncez clairement : l&apos;intitulé exact, la majorité applicable, et le résultat après vote (voix pour / contre / abstentions, en nombre de voix et en tantièmes). La majorité se calcule toujours <strong className={strong}>en tantièmes</strong>, pas en têtes, sauf disposition contraire.
      </p>

      <div className="my-6 rounded-xl bg-green-50 border border-green-200 p-5">
        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Exemple — vote travaux ascenseur (art. 25)</p>
        <p className="text-sm text-gray-700 mb-3">
          Copropriété de 1 000 tantièmes. 6 copropriétaires présents/représentés = 680 tantièmes. Absent sans pouvoir : 320 tantièmes.
        </p>
        <div className="overflow-x-auto rounded-lg border border-green-200">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-green-50">
              <tr className="border-b border-green-200">
                <th className="text-left py-2 px-3 text-green-700 font-medium">Résultat du vote</th>
                <th className="text-right py-2 px-3 text-green-700 font-medium">Tantièmes</th>
                <th className="text-left py-2 px-3 text-green-700 font-medium">Majorité art. 25 requise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-green-100">
              <tr><td className="py-2 px-3 text-gray-700">Pour</td><td className="py-2 px-3 text-right">420</td><td className="py-2 px-3 text-gray-500" rowSpan={3}>→ 501 tantièmes sur 1 000 total</td></tr>
              <tr><td className="py-2 px-3 text-gray-700">Contre</td><td className="py-2 px-3 text-right">180</td></tr>
              <tr><td className="py-2 px-3 text-gray-700">Abstentions</td><td className="py-2 px-3 text-right">80</td></tr>
              <tr className="bg-green-50 font-semibold"><td className="py-2 px-3 text-gray-800">Total exprimés (présents)</td><td className="py-2 px-3 text-right">680</td><td className="py-2 px-3 text-red-600">✗ 420 &lt; 501 — résolution rejetée</td></tr>
              <tr><td className="py-2 px-3 text-gray-600 italic" colSpan={3} className="py-2 px-3 text-gray-600 italic">Mais &gt; 333 (1/3 de 1 000) → second vote art. 24 possible immédiatement. À la majorité des présents (420 &gt; 260) : résolution adoptée ✓</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      <h2 id="pv-redaction" className={h2}>Le procès-verbal : rédiger, signer, notifier</h2>
      <p className={p}>
        Le PV est le document officiel qui fait foi des décisions prises. Il doit être <strong className={strong}>signé séance tenante</strong> par le président de séance et le secrétaire (et les scrutateurs si désignés). Notifiez-le à tous les copropriétaires dans le <strong className={strong}>mois suivant l&apos;AG</strong> — le délai de contestation (2 mois) ne court qu&apos;à partir de cette notification.
      </p>

      <div className="my-6 bg-gray-50 border border-gray-200 rounded-xl p-6 text-sm leading-relaxed">
        <p className="text-gray-400 text-xs mb-4 font-sans uppercase tracking-wider">— Structure type du procès-verbal —</p>
        <p className="mb-3 text-gray-800 font-bold font-mono">PROCÈS-VERBAL DE L&apos;ASSEMBLÉE GÉNÉRALE ORDINAIRE</p>
        <p className="mb-1 text-gray-700 font-mono">Syndicat des copropriétaires de [nom] — [adresse]</p>
        <p className="mb-4 text-gray-700 font-mono">Date : [jour/mois/année] à [heure] — [lieu exact]</p>
        <p className="mb-2 text-gray-700 font-mono"><strong>Président de séance :</strong> [Nom], désigné(e) à l&apos;unanimité</p>
        <p className="mb-4 text-gray-700 font-mono"><strong>Secrétaire :</strong> [Nom]</p>
        <p className="mb-2 text-gray-700 font-mono"><strong>Feuille de présence :</strong></p>
        <p className="mb-1 text-gray-600 font-mono italic">— Lot 1 (180 t.) M. Dupont — Présent</p>
        <p className="mb-1 text-gray-600 font-mono italic">— Lot 2 (155 t.) Mme Martin — Représentée par M. Dupont (pouvoir joint)</p>
        <p className="mb-1 text-gray-600 font-mono italic">— Lot 3 (105 t.) M. Leroy — Absent sans pouvoir</p>
        <p className="mb-4 text-gray-600 font-mono italic">→ Total tantièmes représentés : 335 / 1 000 (soit 33,5 %)</p>
        <p className="mb-2 text-gray-800 font-mono font-bold">RÉSOLUTION N°1 — APPROBATION DES COMPTES [N-1]</p>
        <p className="mb-1 text-gray-700 font-mono">Après présentation par le syndic des comptes de l&apos;exercice clos au [date], l&apos;assemblée :</p>
        <p className="mb-1 text-gray-700 font-mono">DÉCIDE d&apos;approuver les comptes de l&apos;exercice [N-1] arrêtés à [montant total dépenses].</p>
        <p className="mb-1 text-gray-700 font-mono">POUR : [X tantièmes] / CONTRE : [X tantièmes] / ABSTENTIONS : [X tantièmes]</p>
        <p className="mb-4 text-gray-800 font-mono font-semibold">→ RÉSOLUTION ADOPTÉE à la majorité de l&apos;article 24.</p>
        <p className="mb-2 text-gray-600 font-mono italic">[Répéter pour chaque résolution]</p>
        <p className="mb-4 text-gray-700 font-mono">L&apos;ordre du jour étant épuisé, la séance est levée à [heure].</p>
        <p className="text-gray-700 font-mono">Fait à [Ville], le [date de signature]</p>
        <p className="text-gray-700 font-mono">Le Président de séance : __________ Le Secrétaire : __________</p>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">PV généré automatiquement — résolutions, votes, signatures</p>
        <p className="text-sm text-gray-600 mb-4">
          Dans Mon Syndic Bénévole, saisissez les résultats de vote résolution par résolution. La plateforme génère le PV en PDF avec la mise en forme correcte, les données de votre copropriété et le décompte exact des tantièmes — prêt à être signé et envoyé.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Générer mon PV d&apos;AG automatiquement →
        </CtaLink>
      </div>

      <h2 id="apres-ag" className={h2}>Après l&apos;AG : les obligations dans les 30 jours</h2>
      <p className={p}>
        La réunion terminée, le travail n&apos;est pas fini. Quatre actions à accomplir dans le mois qui suit :
      </p>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-blue-600 font-mono w-8">J+7</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Faire signer le PV par tous les signataires</p>
            <p className="text-xs text-gray-600">Le PV signé séance tenante est idéal. Si ce n&apos;est pas fait sur place, collectez les signatures dans la semaine — les souvenirs sont encore frais.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-blue-600 font-mono w-8">J+30</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Notifier le PV à tous les copropriétaires</p>
            <p className="text-xs text-gray-600">Par LRAR ou e-mail si accord préalable de chaque copropriétaire. La notification ouvre le délai de contestation de 2 mois — plus vous l&apos;envoyez tôt, plus vite ce délai est refermé. Conservez les preuves d&apos;envoi.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-blue-600 font-mono w-8">J+30</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Mettre en œuvre les décisions votées</p>
            <p className="text-xs text-gray-600">Passer les commandes pour les travaux votés, engager les prestataires sélectionnés, résilier les contrats remplacés. Un vote en AG oblige à l&apos;exécution — le syndic ne peut pas retarder sans motif légitime.</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-blue-600 font-mono w-8">J+30</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Émettre les nouveaux appels de fonds sur la base du budget voté</p>
            <p className="text-xs text-gray-600">Une fois le budget de l&apos;exercice N+1 approuvé en AG, c&apos;est ce montant qui sert de base aux <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds trimestriels</a> à venir. Si des travaux exceptionnels ont été votés, des appels complémentaires peuvent être émis selon le calendrier du chantier.</p>
          </div>
        </div>
      </div>

      <div className="my-6 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <p className="text-sm font-semibold text-amber-800 mb-2">Mettre à jour le registre national des copropriétés</p>
        <p className="text-sm text-gray-700">Chaque année après l&apos;AG, les données financières de l&apos;exercice clos doivent être mises à jour sur le <strong>registre national des copropriétés</strong> (registre.coproprietes.gouv.fr). C&apos;est une obligation annuelle. L&apos;oublier expose la copropriété à une mise en demeure de l&apos;ANAH.</p>
      </div>

      <h2 id="erreurs" className={h2}>5 erreurs qui peuvent invalider votre AG</h2>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">01</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Délai de convocation non respecté</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Nullité potentielle de toutes les résolutions votées</p>
            <p className="text-xs text-gray-600">Le délai de 21 jours court à partir de la <em>première présentation</em> de la LRAR au destinataire — pas de l&apos;envoi en boîte aux lettres. Prévoyez systématiquement 24 à 25 jours de marge. Anne-Sophie utilise maintenant un outil qui calcule cette date à sa place.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">02</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Résolution votée avec la mauvaise majorité</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Résolution annulable sur recours dans les 2 mois</p>
            <p className="text-xs text-gray-600">Appliquer l&apos;article 24 à une résolution qui nécessitait l&apos;article 25 rend la décision contestable. Indiquez la majorité applicable sur chaque résolution <em>avant</em> le vote et dans le PV.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">03</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Résolution absente de l&apos;ordre du jour convoqué</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Le vote est nul, quelle que soit la majorité obtenue</p>
            <p className="text-xs text-gray-600">On ne peut voter que ce qui est à l&apos;ordre du jour de la convocation. Pas d&apos;improvisation le soir de l&apos;AG — même à l&apos;unanimité des présents, un vote hors ordre du jour est sans valeur légale.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">04</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">PV non notifié dans le mois suivant l&apos;AG</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Délai de contestation indéfiniment ouvert</p>
            <p className="text-xs text-gray-600">Le délai de 2 mois pour contester une résolution ne court qu&apos;à partir de la notification du PV. Tant que le PV n&apos;est pas envoyé, la fenêtre reste ouverte. Envoyez le PV dans les 30 jours — idéalement dans les 15.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">05</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Formulaire de vote par correspondance non joint</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Irrégularité de forme ouvrant droit à contestation</p>
            <p className="text-xs text-gray-600">Obligatoire depuis le décret du 2 juillet 2020 (loi ELAN). Chaque copropriétaire doit pouvoir voter sans être présent. Le formulaire doit être joint à chaque convocation, même si personne ne l&apos;utilise jamais.</p>
          </div>
        </div>
      </div>

      <h2 id="outil" className={h2}>Ce que Mon Syndic Bénévole automatise dans le cycle AG</h2>
      <p className={p}>
        La gestion manuelle d&apos;une AG représente en réalité <strong className={strong}>quatre à neuf heures de travail dispersé sur plusieurs semaines</strong> — dont une bonne partie peut être automatisée. Voici exactement ce que la plateforme prend en charge.
      </p>

      <div className="my-6 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-slate-800 px-6 py-4">
          <p className="text-sm font-semibold text-white mb-0.5">Le cycle AG dans Mon Syndic Bénévole</p>
          <p className="text-xs text-slate-300">5 étapes, de la préparation à la notification du PV</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-6 py-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">1</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Brouillon d&apos;AG</p>
              <p className="text-sm text-gray-600">Créez votre AG, saisissez l&apos;ordre du jour résolution par résolution en précisant la majorité applicable, le montant si applicable, et les pièces jointes. Tout reste en brouillon — vous pouvez modifier jusqu&apos;au dernier moment.</p>
            </div>
          </div>
          <div className="px-6 py-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">2</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Planification et vérification du délai</p>
              <p className="text-sm text-gray-600">Indiquez la date et l&apos;heure de l&apos;AG. La plateforme calcule automatiquement la date limite d&apos;envoi des convocations (J-21) et vous alerte si vous dépassez la fenêtre de sécurité. Validez la planification — l&apos;AG passe en statut &ldquo;planifiée&rdquo;.</p>
            </div>
          </div>
          <div className="px-6 py-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">3</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Envoi des convocations PDF</p>
              <p className="text-sm text-gray-600">Un clic envoie à chaque copropriétaire sa convocation personnalisée en PDF — avec ses données de lot, les résolutions, les pièces jointes et le formulaire de vote par correspondance. L&apos;envoi est tracé avec date et heure pour chaque destinataire.</p>
            </div>
          </div>
          <div className="px-6 py-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">4</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Saisie des votes et génération du PV</p>
              <p className="text-sm text-gray-600">Après l&apos;AG, saisissez résolution par résolution le résultat du vote (pour, contre, abstentions, en tantièmes). La plateforme détermine automatiquement si la résolution est adoptée ou rejetée selon la règle de majorité applicable — et génère le PV en PDF.</p>
            </div>
          </div>
          <div className="px-6 py-4 flex gap-4 items-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">5</div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-0.5">Notification du PV et création des appels de fonds</p>
              <p className="text-sm text-gray-600">Envoyez le PV signé à tous les copropriétaires depuis la plateforme — avec preuve d&apos;envoi datée. Si le budget N+1 a été voté, il est disponible immédiatement comme base pour les prochains <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds trimestriels</a>.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="my-6 overflow-x-auto rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[480px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium bg-gray-50">Tâche</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium bg-gray-50">Gestion manuelle</th>
              <th className="text-center py-3 px-4 text-blue-700 font-semibold bg-blue-50">Mon Syndic Bénévole</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Calcul de la date limite de convocation</td>
              <td className="py-3 px-4 text-center text-red-600">Calcul manuel, risque d&apos;erreur</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">Automatique ✓</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Génération des convocations individuelles PDF</td>
              <td className="py-3 px-4 text-center text-red-600">Word + publipostage manuel</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">1 clic pour tous ✓</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Envoi avec traçabilité</td>
              <td className="py-3 px-4 text-center text-gray-600">LRAR papier ou e-mail sans preuve</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">Horodaté par destinataire ✓</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Vérification de la majorité applicable</td>
              <td className="py-3 px-4 text-center text-red-600">À vérifier à la main</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">Intégrée par résolution ✓</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Génération du PV après AG</td>
              <td className="py-3 px-4 text-center text-red-600">Saisie Word + mise en forme</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">PDF généré automatiquement ✓</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Transposition du budget en appels de fonds</td>
              <td className="py-3 px-4 text-center text-red-600">Recalcul manuel des tantièmes</td>
              <td className="py-3 px-4 text-center text-green-700 bg-blue-50/30">Automatique à la publication ✓</td>
            </tr>
            <tr className="bg-blue-50 border-t-2 border-blue-200">
              <td className="py-3 px-4 font-semibold text-gray-900">Temps total estimé (10 lots)</td>
              <td className="py-3 px-4 text-center font-semibold text-red-600">6 à 9 heures</td>
              <td className="py-3 px-4 text-center font-bold text-blue-700">1,5 à 2 heures ✓</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Anne-Sophie prépare maintenant son AG en une matinée.</p>
        <p className="text-sm text-gray-600 mb-4">
          Comptes clôturés dans la plateforme, budget pré-rempli, convocations générées en un clic avec le bon délai — le cycle AG complet est guidé. Pour aller plus loin sur les <a href="/blog/obligations-syndic-benevole" className={a}>obligations légales du syndic bénévole</a> tout au long de l&apos;année, consultez notre guide complet.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Préparer mon AG avec Mon Syndic Bénévole →
        </CtaLink>
      </div>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Peut-on tenir une AG sans que tous les copropriétaires soient présents ?</h3>
      <p className={p}>
        Oui. Il n&apos;y a <strong className={strong}>pas de quorum en copropriété</strong> — l&apos;AG délibère quel que soit le nombre de présents ou représentés (art. 22 loi 1965). Un seul copropriétaire présent peut voter toutes les résolutions. Les majorités (art. 24, 25, 26) s&apos;appliquent toujours de la même façon — mais les absents sans pouvoir ne comptent pas pour les résolutions de l&apos;art. 24, tandis qu&apos;ils comptent comme des voix &ldquo;contre&rdquo; pour les résolutions de l&apos;art. 25.
      </p>

      <h3 className={h3}>Peut-on convoquer l&apos;AG par e-mail ?</h3>
      <p className={p}>
        Oui, mais <strong className={strong}>uniquement si le copropriétaire a donné son accord écrit préalable</strong> pour ce mode de notification. Sans accord individuel, la convocation doit être envoyée par LRAR ou remise en main propre contre émargement. L&apos;accord peut être recueilli lors d&apos;une AG précédente (mention au PV) ou par un formulaire signé. Pour les copropriétaires qui n&apos;ont pas donné leur accord, maintenez l&apos;envoi postal.
      </p>

      <h3 className={h3}>Combien coûte l&apos;envoi des convocations par recommandé ?</h3>
      <p className={p}>
        Un recommandé coûte environ 4 à 5 € par envoi. Pour une copropriété de 10 lots, c&apos;est 40 à 50 € par AG. La loi autorise la voie électronique avec accord préalable — ce qui réduit ce coût à zéro. Les syndics professionnels facturent souvent chaque recommandé comme frais supplémentaires. En gestion bénévole, c&apos;est une dépense de la copropriété à prévoir dans le budget.
      </p>

      <h3 className={h3}>Que faire si la majorité de l&apos;article 25 n&apos;est pas atteinte pour l&apos;élection du syndic ?</h3>
      <p className={p}>
        Si vous recueillez plus d&apos;un tiers des voix sans atteindre la majorité absolue, un second vote à la majorité simple de l&apos;art. 24 peut être organisé immédiatement (art. 25-1). Si même ce second tour échoue, les copropriétaires peuvent demander au tribunal judiciaire de désigner un syndic judiciaire. Anticipez toujours votre réélection en la mettant à l&apos;ordre du jour <em>avant</em> la fin de votre mandat.
      </p>

      <h3 className={h3}>Peut-on tenir une AG extraordinaire en cours d&apos;année ?</h3>
      <p className={p}>
        Oui. Le syndic peut convoquer une AG extraordinaire à tout moment si une décision urgente ne peut pas attendre l&apos;AG ordinaire — travaux urgents votables en AG, remplacement d&apos;un prestataire, décision liée à un sinistre. Les mêmes règles de convocation s&apos;appliquent : délai de 21 jours, ordre du jour précis, documents annexés. Tout copropriétaire peut aussi demander une AG extraordinaire — par LRAR au syndic.
      </p>

      <h3 className={h3}>Combien de temps faut-il préparer une AG ordinaire, honnêtement ?</h3>
      <p className={p}>
        Sans outil dédié : comptez <strong className={strong}>6 à 9 heures réparties sur 3 à 4 semaines</strong> — clôture des comptes, mise en forme des documents, publipostage des convocations, rédaction du PV. Avec un outil comme Mon Syndic Bénévole où les données sont déjà en place (dépenses enregistrées au fil de l&apos;année, tantièmes configurés) : <strong className={strong}>1 h 30 à 2 heures</strong> au total. Pour plus de détails sur la façon dont un <a href="/blog/logiciel-syndic-benevole" className={a}>logiciel pour syndic bénévole</a> change la gestion quotidienne, consultez notre comparatif.
      </p>

      <h3 className={h3}>Qui signe le PV si le président de séance n&apos;est pas le syndic ?</h3>
      <p className={p}>
        Le PV est signé par le <strong className={strong}>président de séance</strong> et le <strong className={strong}>secrétaire de séance</strong>, désignés en début d&apos;AG. Le syndic (même bénévole) peut être élu président de séance, mais ce n&apos;est pas automatique. Si le syndic est aussi président de séance, il signe en les deux qualités. Les scrutateurs (si désignés) signent également.
      </p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        L&apos;assemblée générale n&apos;est pas une réunion de routine — c&apos;est le moment où se prennent toutes les décisions engageant la copropriété pour l&apos;année. Bien préparée, elle se tient en 1 h 30 et donne à tous les copropriétaires une vision claire des finances et des projets. Mal préparée (délai manqué, résolution hors ordre du jour, PV non envoyé), elle peut déboucher sur des contentieux coûteux.
      </p>
      <p className={p}>
        Le calendrier est simple : commencez à préparer 8 semaines avant, envoyez les convocations à J-24 minimum, tenez votre réunion, signez et notifiez le PV dans les 30 jours. Si vous venez de prendre vos fonctions, consultez notre <a href="/blog/comment-devenir-syndic-benevole" className={a}>guide des premières démarches du syndic bénévole</a> pour les démarches qui précèdent la première AG.
      </p>
      <p className={p}>
        Pour un syndic bénévole, la différence entre &ldquo;subir&rdquo; l&apos;AG et la gérer sereinement tient souvent à un seul facteur : les données sont-elles en ordre tout au long de l&apos;année, ou tout est-il à reconstituer la veille ? C&apos;est exactement ce que règle un outil de gestion dédié.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-1">Préparez votre prochaine AG en une matinée.</p>
        <p className="text-sm text-blue-100 mb-4">
          Convocations PDF, vérification du délai légal, PV généré après la réunion, notification aux copropriétaires — tout le cycle AG est guidé, pas à pas.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer mon espace gratuit →
        </CtaLink>
        <p className="text-xs text-blue-200 mt-2">Essai gratuit 14 jours · Sans carte bancaire · Résiliable à tout moment</p>
      </div>
    </>
  );
}
