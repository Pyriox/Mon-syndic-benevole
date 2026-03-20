// ============================================================
// Article : Appel de fonds copropriété — calcul et répartition
// ============================================================

import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleAppelDeFonds() {
  return (
    <>
      <p className={p}>
        Chaque trimestre, le même e-mail ou la même lettre dans les boîtes aux lettres : l&apos;appel de fonds. Et chaque trimestre, les mêmes questions dans l&apos;immeuble — pourquoi ce montant ? Comment c&apos;est calculé ? Pourquoi M. Dupont au rez-de-chaussée paie-t-il moins que Mme Martin au troisième ?
      </p>
      <p className={p}>
        Pour le <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>syndic bénévole</a>, c&apos;est souvent le sujet qui génère le plus de questions et, parfois, le plus de tensions. Non pas parce que le calcul est compliqué, mais parce qu&apos;il n&apos;est pas toujours bien expliqué ni bien documenté.
      </p>
      <p className={p}>Cet article remet les pendules à l&apos;heure.</p>

      {/* Section 1 */}
      <h2 id="definition" className={h2}>Qu&apos;est-ce qu&apos;un appel de fonds, exactement ?</h2>
      <p className={p}>
        Un appel de fonds est une <strong className={strong}>demande de paiement adressée à chaque copropriétaire</strong> pour couvrir les dépenses à venir (ou en cours) de la copropriété. Il ne s&apos;agit pas d&apos;une facture : c&apos;est une provision, une avance sur les frais collectifs.
      </p>
      <p className={p}>On distingue deux grandes catégories :</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Les appels de fonds de budget prévisionnel</strong>, qui couvrent les charges courantes de l&apos;immeuble (entretien, assurance, eau, électricité des parties communes, prestataires habituels). Ils sont émis chaque trimestre, à date fixe.</li>
        <li className={li}><strong className={strong}>Les appels de fonds exceptionnels</strong>, qui financent des dépenses non prévues ou des travaux votés en AG (ravalement de façade, remplacement de la chaudière, réfection de la toiture…).</li>
      </ul>
      <p className={p}>
        À ces deux catégories s&apos;ajoute, depuis la loi ALUR de 2014, <strong className={strong}>le fonds de travaux</strong> : une cotisation annuelle obligatoire pour les copropriétés de 10 lots et plus, destinée à anticiper les gros travaux futurs.
      </p>

      {/* Section 2 */}
      <h2 id="tantiemes" className={h2}>La base de tout : les tantièmes</h2>
      <p className={p}>
        Avant de parler de calcul, il faut comprendre le mécanisme des <strong className={strong}>tantièmes</strong> (ou millièmes), parce que tout repose dessus.
      </p>
      <p className={p}>
        Lors de la création d&apos;une copropriété, un géomètre attribue à chaque lot une quote-part exprimée en tantièmes sur un total (souvent 1&nbsp;000 ou 10&nbsp;000). Cette quote-part reflète la valeur relative du lot au sein de l&apos;ensemble immobilier : surface, étage, exposition, présence d&apos;un parking ou d&apos;une cave.
      </p>
      <p className={p}>Un exemple simple : prenez un immeuble de 10 appartements avec un total de 1&nbsp;000 tantièmes.</p>

      {/* Table */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Lot</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Tantièmes</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Quote-part</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Appartement T3, 3e étage, avec parking</td>
              <td className="py-3 px-4 text-gray-700">140</td>
              <td className="py-3 px-4 text-gray-700">14,0 %</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Appartement T2, RDC</td>
              <td className="py-3 px-4 text-gray-700">72</td>
              <td className="py-3 px-4 text-gray-700">7,2 %</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Studio, 1er étage</td>
              <td className="py-3 px-4 text-gray-700">58</td>
              <td className="py-3 px-4 text-gray-700">5,8 %</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={p}>
        Si le budget annuel s&apos;élève à 12&nbsp;000&nbsp;€, le T3 avec parking contribue à hauteur de 1&nbsp;680&nbsp;€ par an (soit 420&nbsp;€ par trimestre), le T2 du RDC à 864&nbsp;€ (216&nbsp;€ par trimestre), et le studio à 696&nbsp;€ (174&nbsp;€ par trimestre).
      </p>
      <p className={p}>Le principe est simple. La difficulté vient de la gestion dans le temps : qui a payé quoi, qui est en retard, comment régulariser en fin d&apos;exercice.</p>

      {/* Section 3 */}
      <h2 id="types-charges" className={h2}>Les deux types de charges et leur répartition</h2>
      <p className={p}>Tous les tantièmes ne se valent pas — ou plutôt, ils ne s&apos;appliquent pas tous aux mêmes dépenses. La loi distingue deux catégories de charges :</p>

      <h3 className={h3}>Les charges générales</h3>
      <p className={p}>
        Elles concernent <strong className={strong}>l&apos;ensemble des copropriétaires</strong> et sont réparties selon les tantièmes généraux inscrits dans le règlement de copropriété. Entrent dans cette catégorie : l&apos;assurance de l&apos;immeuble, l&apos;administration, les honoraires du syndic, l&apos;entretien des parties communes accessibles à tous.
      </p>

      <h3 className={h3}>Les charges spéciales</h3>
      <p className={p}>
        Elles s&apos;appliquent uniquement aux <strong className={strong}>copropriétaires qui bénéficient effectivement d&apos;un service</strong>. L&apos;ascenseur en est l&apos;exemple le plus courant : les habitants du rez-de-chaussée n&apos;utilisent pas l&apos;ascenseur, ils n&apos;ont donc pas à en financer l&apos;entretien (ou alors dans une proportion réduite). Même logique pour un interphone qui ne dessert que certains bâtiments, ou un parking dont seuls certains lots disposent.
      </p>
      <p className={p}>Cette distinction est fondamentale, et c&apos;est souvent là que les erreurs se glissent dans les appels de fonds rédigés manuellement : appliquer les tantièmes généraux à des charges qui auraient dû être réparties selon des tantièmes spéciaux — ou l&apos;inverse.</p>

      {/* Section 4 */}
      <h2 id="calcul-trimestriel" className={h2}>Comment calculer un appel de fonds trimestriel : la méthode pas à pas</h2>
      <p className={p}>Voici la démarche concrète pour établir un appel de fonds de budget prévisionnel.</p>

      <ol className={ol}>
        <li className={li}>
          <strong className={strong}>Voter un budget prévisionnel en AG.</strong> Le budget prévisionnel est obligatoirement soumis au vote des copropriétaires lors de l&apos;assemblée générale (majorité simple, article 24). Il liste toutes les dépenses prévisibles pour l&apos;exercice à venir : contrats de maintenance, assurances, consommations, espaces verts, etc.
        </li>
        <li className={li}>
          <strong className={strong}>Diviser par quatre.</strong> Les appels de fonds courants se font par quart du budget annuel, à chaque début de trimestre. Si le budget est de 14&nbsp;400&nbsp;€, chaque appel trimestriel porte sur 3&nbsp;600&nbsp;€.
        </li>
        <li className={li}>
          <strong className={strong}>Appliquer les tantièmes de chaque lot.</strong> Pour chaque lot, on multiplie le montant trimestriel par la quote-part du lot. Avec un lot de 120 tantièmes sur 1&nbsp;000 et un appel trimestriel de 3&nbsp;600&nbsp;€ : 120&nbsp;÷&nbsp;1&nbsp;000&nbsp;×&nbsp;3&nbsp;600&nbsp;=&nbsp;<strong className={strong}>432&nbsp;€</strong>.
        </li>
        <li className={li}>
          <strong className={strong}>Tenir compte du solde de chaque copropriétaire.</strong> Si un copropriétaire a un solde créditeur, ce montant peut venir en déduction de l&apos;appel. À l&apos;inverse, un solde débiteur peut faire l&apos;objet d&apos;une relance distincte.
        </li>
        <li className={li}>
          <strong className={strong}>Notifier les copropriétaires.</strong> L&apos;appel de fonds doit être communiqué avec un délai raisonnable avant la date d&apos;échéance, en général 10 à 15 jours avant la fin du trimestre. Le document doit mentionner : le montant, la période concernée, la date d&apos;échéance, et les coordonnées bancaires.
        </li>
      </ol>

      {/* Section 5 */}
      <h2 id="appel-exceptionnel" className={h2}>L&apos;appel de fonds exceptionnel : même logique, calendrier différent</h2>
      <p className={p}>
        Lorsque l&apos;AG vote des travaux non prévus au budget, un appel de fonds exceptionnel est émis. Il suit la même logique de répartition par tantièmes, mais son calendrier est dicté par l&apos;avancement du chantier.
      </p>
      <p className={p}>
        Pour des travaux importants, il est courant de fractionner en plusieurs tranches : un premier appel au démarrage (30-40&nbsp;% du total), un deuxième en cours de chantier, un dernier à la réception. Les copropriétaires votent ce fractionnement en AG en même temps qu&apos;ils votent les travaux.
      </p>
      <p className={p}>Un point souvent négligé : pour les travaux votés à une majorité spécifique (article 25), les tantièmes applicables peuvent être différents de ceux du budget courant si les travaux concernent des équipements à usage spécial. Vérifiez toujours quelle grille de tantièmes s&apos;applique avant d&apos;émettre l&apos;appel.</p>

      {/* Section 6 */}
      <h2 id="impayes" className={h2}>Ce qui se passe quand un copropriétaire ne paie pas</h2>
      <p className={p}>C&apos;est une réalité avec laquelle tout syndic, bénévole ou professionnel, finit par se retrouver. La procédure légale est progressive :</p>
      <ol className={ol}>
        <li className={li}><strong className={strong}>Mise en demeure</strong> par lettre simple, puis recommandée — rappeler le montant dû et la date d&apos;échéance dépassée.</li>
        <li className={li}><strong className={strong}>Pénalités de retard</strong> : la loi prévoit des intérêts au taux légal à compter de la mise en demeure (article 36 du décret de 1967).</li>
        <li className={li}><strong className={strong}>Injonction de payer</strong> : si l&apos;impayé persiste, le syndic peut saisir le tribunal judiciaire selon une procédure simplifiée. Le juge statue généralement en quelques semaines.</li>
        <li className={li}><strong className={strong}>Hypothèque légale</strong> : le syndicat bénéficie d&apos;une hypothèque légale sur le lot du débiteur, prélevée sur le prix en cas de vente.</li>
      </ol>
      <p className={p}>Il n&apos;est pas nécessaire d&apos;en arriver là dans la plupart des cas. Une communication régulière, un tableau de bord clair sur les soldes, et une relance rapide à la première défaillance suffisent généralement à éviter les situations bloquées.</p>

      {/* Section 7 */}
      <h2 id="regularisation" className={h2}>La régularisation annuelle : l&apos;étape que tout le monde redoute</h2>
      <p className={p}>En fin d&apos;exercice, le budget prévisionnel se confronte aux dépenses réelles. Il y a presque toujours un écart — en plus ou en moins.</p>
      <ul className={ul}>
        <li className={li}>Si les dépenses réelles ont été <strong className={strong}>supérieures</strong> au budget voté : un appel de régularisation est émis pour couvrir la différence.</li>
        <li className={li}>Si elles ont été <strong className={strong}>inférieures</strong> : un surplus a été collecté, conservé au crédit des copropriétaires et déduit du premier appel de l&apos;exercice suivant.</li>
      </ul>
      <p className={p}>
        Cette régularisation doit être présentée de façon lisible à l&apos;AG lors de l&apos;approbation des comptes. C&apos;est souvent là que les syndics bénévoles qui manquent d&apos;outils rencontrent des difficultés : reconstituer le détail poste par poste, expliquer chaque écart, justifier chaque dépense.
      </p>

      {/* Section 8 — Product */}
      <h2 id="suivi-manuel" className={h2}>Le principal problème des syndics bénévoles : le suivi manuel</h2>
      <p className={p}>
        Calculer un appel de fonds une fois, c&apos;est faisable. Mais le faire tous les trimestres, pour chaque copropriétaire, en tenant à jour les soldes, en intégrant les régularisations, en gérant les impayés, en produisant les justificatifs pour l&apos;AG…
      </p>
      <p className={p}>
        La plupart des syndics bénévoles qui abandonnent le font à ce stade. Pas parce qu&apos;ils ne savent pas faire, mais parce qu&apos;ils font ça dans des tableaux Excel bricolés, sans historique propre, sans traçabilité claire.
      </p>
      <p className={p}>
        C&apos;est exactement ce problème que résout{' '}
        <a href="https://mon-syndic-benevole.fr" className={a}>Mon Syndic Bénévole</a>.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <p className="text-blue-800 font-semibold mb-3">Ce que la plateforme gère pour vous</p>
        <ul className="space-y-2">
          {[
            'La répartition par tantièmes calculée instantanément, lot par lot.',
            'Un avis de paiement individuel envoyé par e-mail en un clic, avec le montant exact de chaque copropriétaire.',
            'Le suivi des paiements en temps réel — les soldes se mettent à jour automatiquement à chaque règlement.',
            'Les appels en série (trimestriels sur toute une année) générés en une seule opération.',
            'Un tableau de bord avec le taux de recouvrement, les impayés en cours et l\'état de la trésorerie.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className={p}>Plus besoin de rechercher dans vos mails quel copropriétaire a payé quoi. Tout est centralisé, daté, et exportable.</p>

      {/* Section 9 */}
      <h2 id="fonds-travaux-alur" className={h2}>Appel de fonds et fonds de travaux ALUR : ne pas confondre</h2>
      <p className={p}>
        Depuis le 1er janvier 2017, les copropriétés de 10 lots et plus ont l&apos;obligation de constituer un <strong className={strong}><a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a></strong>. Ce fonds est alimenté par une cotisation annuelle votée en AG, dont le montant ne peut être inférieur à 5&nbsp;% du budget prévisionnel.
      </p>
      <p className={p}>
        Attention : le fonds de travaux <strong className={strong}>n&apos;est pas remboursable</strong>. Quand un copropriétaire vend son lot, la somme qu&apos;il a versée dans ce fonds reste acquise à la copropriété. C&apos;est un point à bien communiquer aux nouveaux acquéreurs.
      </p>

      {/* FAQ */}
      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>À quelle fréquence envoyer les appels de fonds ?</h3>
      <p className={p}>Pour les charges courantes : une fois par trimestre, en début de trimestre (1er janvier, 1er avril, 1er juillet, 1er octobre). Pour les travaux exceptionnels : selon le calendrier validé en AG.</p>

      <h3 className={h3}>Les tantièmes peuvent-ils changer ?</h3>
      <p className={p}>Oui, mais c&apos;est rare et complexe. Une modification du règlement de copropriété est nécessaire, votée à l&apos;unanimité des copropriétaires. En pratique, les tantièmes restent stables sur la durée de vie d&apos;une copropriété.</p>

      <h3 className={h3}>Un copropriétaire peut-il contester son appel de fonds ?</h3>
      <p className={p}>Il peut contester le montant si la répartition ne correspond pas aux tantièmes figurant dans le règlement de copropriété, ou si des charges générales ont été incorrectement affectées. La contestation doit se faire dans les deux mois suivant la notification du PV d&apos;AG pour les décisions votées.</p>

      <h3 className={h3}>Comment gérer les lots avec plusieurs propriétaires (indivision) ?</h3>
      <p className={p}>L&apos;appel de fonds est adressé à l&apos;indivision dans son ensemble. Les propriétaires indivis désignent entre eux un représentant unique pour les relations avec le syndic.</p>

      <h3 className={h3}>Un appel de fonds peut-il couvrir des dettes antérieures ?</h3>
      <p className={p}>Non. On ne peut pas appeler des fonds pour rembourser des dettes passées non couvertes par le budget voté. Il faudrait voter une dépense spécifique en AG pour régulariser.</p>

      {/* Conclusion */}
      <h2 id="ce-quil-faut-retenir" className={h2}>Ce qu&apos;il faut retenir</h2>
      <p className={p}>
        L&apos;appel de fonds n&apos;est pas une science exacte, mais c&apos;est un processus qui gagne à être rigoureux, transparent et traçable. Les disputes entre voisins sur les charges viennent rarement de mauvaise volonté — elles viennent presque toujours d&apos;un manque de lisibilité.
      </p>
      <p className={p}>
        Un copropriétaire qui comprend d&apos;où vient son montant, qui voit l&apos;état de la trésorerie, qui reçoit un avis de paiement clair avec la date d&apos;échéance : c&apos;est un copropriétaire qui paie à temps et qui fait confiance au syndic bénévole.
      </p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>les obligations du fonds de travaux ALUR</a> ou <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>comment gérer une copropriété sans syndic professionnel</a>.</p>
    </>
  );
}
