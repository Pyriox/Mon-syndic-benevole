// ============================================================
// Article : Fonds de travaux ALUR — obligations, montant, gestion
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleFondsTravaux() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        C&apos;était un vendredi de janvier. La chaudière collective de la Résidence des Érables — 14 lots, immeuble de 1982 — a rendu l&apos;âme à 23 h. Il faisait -5 °C dehors. Le syndic bénévole, Isabelle, a passé la nuit à trouver un chauffagiste d&apos;urgence. Résultat : 6 800 € de remplacement, payés en 3 semaines grâce à... 0 € de fonds de travaux constitués. Un appel d&apos;urgence de 485 € par copropriétaire, envoyé par SMS à 7 h du matin un samedi. Trois copropriétaires ont refusé de payer.
      </p>
      <p className={p}>
        Ce n&apos;est pas un cas isolé — c&apos;est ce qui arrive quand une copropriété n&apos;a pas de réserve. Et pour beaucoup de syndics bénévoles, le <strong className={strong}>fonds de travaux ALUR</strong> reste mal connu, mal géré, ou carrément absent — parfois sans le savoir.
      </p>

      <h2 id="explication" className={h2}>L&apos;explication : ce que la loi impose</h2>
      <h2 id="contexte-loi-alur" className={h2}>Pourquoi ce fonds existe : le problème concret qu&apos;il résout</h2>
      <p className={p}>
        Avant la loi ALUR (mars 2014), aucune obligation d&apos;épargne collective n&apos;existait dans les copropriétés. Résultat documenté : des milliers d&apos;immeubles sans réserve, incapables de financer des travaux pourtant indispensables — ravalement, toiture, ascenseur — faute d&apos;épargne collective. Les travaux d&apos;urgence, réalisés sans préparation, coûtent en moyenne <strong className={strong}>30 à 40 % plus cher</strong> que des travaux planifiés.
      </p>
      <p className={p}>
        Depuis le <strong className={strong}>1er janvier 2017</strong>, la constitution d&apos;un fonds de travaux est obligatoire pour toutes les copropriétés concernées. Ce n&apos;est plus optionnel.
      </p>

      <h2 id="qui-est-concerne" className={h2}>Qui est concerné — et qui peut choisir de ne pas l&apos;être</h2>
      <p className={p}>
        <strong className={strong}>Obligatoire</strong> pour toutes les copropriétés soumises à la loi du 10 juillet 1965 et comportant <strong className={strong}>plus de 10 lots</strong>. La notion de &ldquo;lot&rdquo; inclut les lots principaux (appartements, locaux) ET les lots accessoires (caves, parkings, garages). Un immeuble de 8 appartements + 4 caves + 4 parkings = 16 lots → obligation.
      </p>
      <p className={p}>
        <strong className={strong}>Facultatif mais fortement recommandé</strong> pour les copropriétés de 10 lots et moins. Avec un immeuble de 8 lots dont la toiture date de 1985, mettre volontairement de l&apos;argent de côté chaque année est simplement prudent.
      </p>
      <p className={p}>
        <strong className={strong}>Exception pour les immeubles neufs :</strong> une copropriété peut décider, à l&apos;unanimité, de ne pas constituer le fonds pendant les <strong className={strong}>cinq premières années</strong> suivant la réception de l&apos;immeuble. Au-delà, l&apos;obligation s&apos;applique sans exception.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Votre fonds de travaux, géré sans risque d&apos;oubli</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole crée le compte fonds de travaux séparé et calcule les cotisations trimestrielles par lot. Alerte automatique avant chaque vote en AG.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester gratuitement — 14 jours offerts →
        </Link>
      </div>

      <h2 id="montant-minimum" className={h2}>Combien mettre de côté : le minimum légal, et ce qu&apos;il faut vraiment prévoir</h2>

      <h3 className={h3}>Le plancher légal</h3>
      <p className={p}>
        La cotisation annuelle doit être <strong className={strong}>au minimum égale à 5 % du budget prévisionnel</strong> des charges courantes voté en AG. Exemple concret : budget annuel 18 000 € → fonds de travaux minimum : 900 €/an.
      </p>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Budget annuel</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Minimum légal (5 %)</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Recommandé (10 %)</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Par trimestre (10 %)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">12 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">600 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">1 200 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">300 €/trimestre</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">18 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">900 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">1 800 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">450 €/trimestre</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">24 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">1 200 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">2 400 €/an</td>
              <td className="py-3 px-4 text-gray-700 text-right">600 €/trimestre</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className={h3}>Pourquoi 5 % est souvent insuffisant</h3>
      <p className={p}>
        5 % du budget courant représente en général <strong className={strong}>entre 50 et 120 € par copropriétaire et par an</strong>. Sur 10 ans, une copropriété de 14 lots avec un budget de 18 000 € aura constitué : 900 € × 10 ans = 9 000 €. C&apos;est moins que le coût d&apos;un simple ravalement sur un petit immeuble (20 000 à 40 000 €).
      </p>
      <p className={p}>
        La vraie question à se poser n&apos;est pas &ldquo;quel est le minimum légal ?&rdquo; mais <strong className={strong}>&ldquo;quel sera le coût des travaux prévisibles dans les 10 ans, et combien faut-il mettre de côté chaque année pour y faire face ?&rdquo;</strong>
      </p>

      <h2 id="planification" className={h2}>Comment calculer un plan de dotation réaliste</h2>
      <p className={p}>
        Exemple concret : Résidence les Érables (14 lots, immeuble de 1982, budget 18 000 €/an). Nathalie, après la crise de la chaudière, a fait réaliser un diagnostic technique simplifié. Résultat :
      </p>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Equipement</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Age actuel</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Durée de vie</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Coût estimé</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Dans combien d&apos;ans</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">À mettre de côté/an</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Chaudière collective</td>
              <td className="py-3 px-4 text-gray-600">0 an (neuve)</td>
              <td className="py-3 px-4 text-gray-600">15 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right">8 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">15 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right font-medium">535 €/an</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Ravalement façade</td>
              <td className="py-3 px-4 text-gray-600">8 ans</td>
              <td className="py-3 px-4 text-gray-600">18 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right">32 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">10 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right font-medium">3 200 €/an</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Toiture</td>
              <td className="py-3 px-4 text-gray-600">43 ans</td>
              <td className="py-3 px-4 text-gray-600">45-50 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right">24 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">5 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right font-medium">4 800 €/an</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Ascenseur (mise aux normes)</td>
              <td className="py-3 px-4 text-gray-600">12 ans</td>
              <td className="py-3 px-4 text-gray-600">20 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right">15 000 €</td>
              <td className="py-3 px-4 text-gray-700 text-right">8 ans</td>
              <td className="py-3 px-4 text-gray-700 text-right font-medium">1 875 €/an</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="py-3 px-4 text-gray-800">Total annuel recommandé</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-blue-700 text-right">10 410 €/an</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-600 italic">Minimum légal (5 % de 18 000 €)</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-gray-600 text-right italic">900 €/an</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={p}>
        Le minimum légal (900 €/an) représente moins de 9 % de ce que cet immeuble devrait réellement mettre de côté. L&apos;AG d&apos;Isabelle a voté un fonds de travaux à <strong className={strong}>5 500 €/an</strong> — un compromis entre le minimum légal et les besoins réels. C&apos;est toujours mieux que 900 €.
      </p>

      <h2 id="vote-ag" className={h2}>Le vote en AG : quelle majorité, quelle résolution</h2>
      <p className={p}>
        Le montant de la cotisation annuelle est soumis au vote à la <strong className={strong}>majorité de l&apos;article 25</strong> (majorité des voix de tous les copropriétaires, présents, représentés ou absents).
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6 text-sm">
        <p className="text-gray-500 text-xs mb-3 uppercase tracking-wider">Modèle de résolution AG</p>
        <p className="text-gray-700 leading-relaxed">
          <strong>Résolution n° [X] — Fonds de travaux ALUR</strong><br /><br />
          L&apos;assemblée générale, après présentation par le syndic de l&apos;état du fonds de travaux constitué à ce jour ([montant] €) et du budget prévisionnel de l&apos;exercice [année] arrêté à [montant] €,<br /><br />
          <strong>Décide</strong> de fixer la cotisation annuelle au fonds de travaux à [montant] € pour l&apos;exercice [année], soit [%] % du budget prévisionnel, conformément à l&apos;article 14-2 de la loi du 10 juillet 1965.<br /><br />
          Cette cotisation sera appelée trimestriellement à raison de [montant ÷ 4] € par appel et répartie entre les copropriétaires selon leurs tantièmes généraux.<br /><br />
          <em>Résultat du vote : [X] voix pour / [X] voix contre / [X] abstentions</em>
        </p>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Constituez votre fonds de travaux sans vous perdre</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole gère la cotisation au fonds de travaux séparément des charges courantes, calcule les quotes-parts par lot et alerte chaque année avant le vote en AG.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester Mon Syndic Bénévole gratuitement →
        </Link>
      </div>

      <h2 id="compte-separe" className={h2}>Le compte bancaire séparé : une obligation méconnue mais contrôlable</h2>
      <p className={p}>
        Les sommes versées au fonds de travaux <strong className={strong}>ne peuvent pas être mélangées avec la trésorerie courante</strong>. La loi est explicite : le fonds de travaux doit être déposé sur un compte bancaire séparé, ouvert au nom du syndicat des copropriétaires.
      </p>
      <p className={p}>
        En pratique : ouvrez un <strong className={strong}>Livret A au nom du syndicat</strong> dans votre banque. C&apos;est gratuit, disponible immédiatement en cas de besoin, et rémunéré (ce qui compense partiellement l&apos;inflation). La plupart des banques le font en 30 minutes sur présentation du PV d&apos;AG.
      </p>
      <p className={p}>
        Lors d&apos;une vente d&apos;un lot dans la copropriété, le notaire vérifie l&apos;existence de ce compte séparé. Un fonds de travaux géré sur le compte courant ordinaire peut bloquer ou compliquer la transaction.
      </p>

      <h2 id="utilisation" className={h2}>À quoi ces fonds peuvent — et ne peuvent pas — servir</h2>

      <h3 className={h3}>Ce qui est éligible</h3>
      <ul className={ul}>
        <li className={li}>Travaux de conservation de l&apos;immeuble (ravalement, toiture, étanchéité, fondations)</li>
        <li className={li}>Travaux de mise aux normes (ascenseur, installation électrique des communs, accessibilité PMR)</li>
        <li className={li}>Améliorations votées en AG (isolation thermique, installation de panneaux solaires communs)</li>
      </ul>

      <h3 className={h3}>Ce qui n&apos;est pas éligible</h3>
      <ul className={ul}>
        <li className={li}>Dépenses d&apos;entretien courant (remplacement d&apos;une ampoule, réparation d&apos;une serrure, nettoyage)</li>
        <li className={li}><strong className={strong}>Couverture d&apos;un découvert de trésorerie courante</strong> — même provisoirement, même avec l&apos;intention de rembourser. C&apos;est illégal.</li>
        <li className={li}>Dépenses sans vote préalable de l&apos;AG (sauf urgence absolue avec ratification ultérieure)</li>
      </ul>

      <h2 id="vente-lot" className={h2}>Ce qui se passe lors de la vente d&apos;un lot — le point le plus contesté</h2>
      <p className={p}>
        C&apos;est le point le plus déstabilisant pour les copropriétaires qui découvrent la règle au moment de vendre : <strong className={strong}>les sommes versées au fonds de travaux sont définitivement acquises au syndicat</strong>. Elles ne sont pas remboursables au vendeur.
      </p>
      <p className={p}>
        Exemple : M. Durand a versé 1 800 € au fonds de travaux sur 6 ans. Il vend son appartement. Ces 1 800 € restent dans la copropriété — ils ne viennent pas en déduction du prix de vente (c&apos;est l&apos;acheteur qui bénéficie du fonds constitué). En revanche, le notaire mentionne l&apos;état du fonds dans l&apos;acte : un fonds bien alimenté est un <strong className={strong}>argument de vente positif</strong>, car l&apos;acheteur sait qu&apos;il n&apos;aura pas à financer seul les prochains travaux.
      </p>
      <p className={p}>
        Communicquez cette règle à vos copropriétaires dès votre premier appel incluant le fonds de travaux — c&apos;est la source de confusion n°1, et ça évite des disputes après coup.
      </p>

      <h2 id="risques" className={h2}>Ce que vous risquez si vous ne respectez pas ces règles</h2>

      <h3 className={h3}>Risque légal</h3>
      <p className={p}>
        Un copropriétaire peut contester en justice les décisions d&apos;une AG qui n&apos;a pas voté le fonds de travaux. L&apos;absence de compte séparé peut être soulevée lors d&apos;une transaction ou d&apos;un contrôle. La responsabilité personnelle du syndic peut être engagée en cas de gestion irrégulière.
      </p>

      <h3 className={h3}>Risque pratique</h3>
      <p className={p}>
        Une copropriété sans réserve est une copropriété vulnérable. La chaudière, la toiture, l&apos;ascenseur : tous ces équipements ont une durée de vie. Quand ils lâchent, sans épargne collective, le seul recours est un appel d&apos;urgence en plein hiver — avec les tensions qui vont avec.
      </p>

      <h3 className={h3}>Risque immobilier</h3>
      <p className={p}>
        Les agences et les notaires regardent systématiquement l&apos;état du fonds de travaux. Un immeuble bien doté se vend plus vite et à meilleur prix. Un immeuble sans réserve avec des travaux en suspens peut faire baisser le prix de vente de 5 à 15 %.
      </p>

      <h2 id="solution" className={h2}>La solution : un suivi propre, sans risque d&apos;oubli</h2>
      <h2 id="notre-outil" className={h2}>Gérer le fonds de travaux sans erreur : ce que l&apos;outil automatise</h2>
      <p className={p}>
        Géré manuellement, le fonds de travaux ALUR ressemble à tout le reste : un onglet de plus dans le tableau Excel, des virements à vérifier, des soldes à recalculer. Le risque d&apos;erreur (et d&apos;oubli lors du vote en AG) est réel.
      </p>

      <h2 id="dtg" className={h2}>Fonds de travaux et plan pluriannuel de travaux (PPT)</h2>
      <p className={p}>
        Depuis le 1er janvier 2025, toutes les copropriétés dont l&apos;immeuble a plus de <strong className={strong}>15 ans</strong> ont l&apos;obligation d&apos;élaborer un <strong className={strong}>plan pluriannuel de travaux (PPT)</strong> (loi Climat et Résilience, 2021). Cette obligation est distincte du fonds de travaux ALUR mais complémentaire : le PPT identifie et planifie les travaux sur 10 ans, tandis que le fonds en constitue la réserve financière. Le DTG (diagnostic technique global), quant à lui, reste facultatif pour la majorité des copropriétés, mais constitue l&apos;outil de diagnostic idéal pour élaborer un PPT solide ou justifier en AG une dotation supérieure au minimum légal.
      </p>
      <p className={p}>
        Un DTG coûte entre 800 et 2 500 € selon la taille de l&apos;immeuble. Il projette les travaux nécessaires sur 10 ans avec une estimation de coût. C&apos;est le meilleur outil pour présenter en AG une dotation ambitieuse mais justifiée — et obtenir l&apos;approbation des copropriétaires.
      </p>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Le fonds de travaux peut-il être utilisé pour une réparation urgente sans vote ?</h3>
      <p className={p}>Non. Même en cas d&apos;urgence absolue, l&apos;utilisation nécessite un vote en AG. En revanche, le syndic peut engager des dépenses conservatoires urgentes sur le budget courant (ou sa propre trésorerie à titre conservatoire), puis convoquer une AG extraordinaire pour ratifier et décider du financement.</p>

      <h3 className={h3}>Si le fonds est insuffisant pour couvrir les travaux votés, que se passe-t-il ?</h3>
      <p className={p}>L&apos;écart est couvert par un appel de fonds exceptionnel. Le fonds de travaux vient en déduction du montant total à appeler, ce qui réduit la charge pour les copropriétaires. C&apos;est précisément pour ça qu&apos;il vaut mieux avoir un fonds abondant.</p>

      <h3 className={h3}>Un copropriétaire peut-il refuser de verser au fonds de travaux ?</h3>
      <p className={p}>Non. Une fois voté en AG, le montant est exigible de tous selon leurs tantièmes. Un refus expose aux mêmes procédures de recouvrement que pour les charges courantes impayées.</p>

      <h3 className={h3}>Le taux de 5 % se calcule sur quel budget exactement ?</h3>
      <p className={p}>Sur le budget prévisionnel des charges courantes voté en AG, <em>hors fonds de travaux lui-même</em>. Budget 20 000 € de charges courantes → minimum légal : 1 000 €/an.</p>

      <h3 className={h3}>Peut-on moduler la cotisation en fonction des travaux prévus ?</h3>
      <p className={p}>Oui. L&apos;AG peut voter un montant différent chaque année — à condition de rester au-dessus du plancher légal (5 %). Si de gros travaux approchent, il est judicieux d&apos;augmenter la dotation 2 à 3 ans à l&apos;avance pour éviter un appel exceptionnel massif.</p>

      <h3 className={h3}>L&apos;AG peut-elle supprimer le fonds de travaux par un vote ?</h3>
      <p className={p}>Non pour les copropriétés de plus de 10 lots. Un vote de suppression pure et simple serait nul et contraire à la loi. Seule une modification du nombre de lots (en dessous de 10) permettrait d&apos;y déroger.</p>

      <h2 id="ce-quil-faut-retenir" className={h2}>Ce qu&apos;il faut retenir</h2>
      <p className={p}>
        Le fonds de travaux ALUR n&apos;est pas une contrainte administrative parmi d&apos;autres. C&apos;est un outil de gestion saine qui protège l&apos;immeuble, les copropriétaires et la valeur des biens. Nathalie, après la crise de la chaudière, a obtenu en AG un vote à <strong className={strong}>unanimité</strong> pour porter le fonds à 5 500 €/an. &ldquo;Plus personne ne discute le montant depuis que j&apos;ai montré le tableau des travaux prévus sur 10 ans.&rdquo;
      </p>
      <p className={p}>
        Le défi du syndic bénévole n&apos;est pas de comprendre le principe — il est simple. C&apos;est de le mettre en œuvre rigoureusement, année après année, avec les bons outils et la bonne traçabilité.
      </p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>le calcul et la répartition des appels de fonds</a> ou <a href="/blog/obligations-syndic-benevole" className={a}>les obligations complètes du syndic bénévole</a>.</p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-2">Gérez votre fonds de travaux sans risque d&apos;oubli</p>
        <p className="text-sm text-blue-100 mb-4">Séparation automatique des comptes, alerte annuelle avant le vote en AG, historique complet pour l&apos;état daté.</p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer ma copropriété sur Mon Syndic Bénévole →
        </Link>
      </div>
    </>
  );
}
