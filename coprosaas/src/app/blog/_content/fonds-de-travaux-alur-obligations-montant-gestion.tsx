// ============================================================
// Article : Fonds de travaux ALUR — obligations, montant, gestion
// ============================================================

import { h2, h3, p, ul, li, strong, a } from './styles';

export default function ArticleFondsTravaux() {
  return (
    <>
      <p className={p}>
        Il y a des obligations légales qu&apos;on connaît de nom sans vraiment en maître les contours. Le fonds de travaux ALUR en fait partie. Beaucoup de <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>syndics bénévoles</a> savent qu&apos;il faut &ldquo;mettre de l&apos;argent de côté pour les travaux&rdquo;, mais ignorent les règles précises qui encadrent ce mécanisme — ce qui expose la copropriété à des irrégularités, parfois sans le savoir.
      </p>
      <p className={p}>Ce guide fait le tour complet de la question : cadre légal, calcul du montant, vote en AG, utilisation des sommes, et ce qui se passe en cas de cession d&apos;un lot.</p>

      {/* Section 1 */}
      <h2 id="contexte-loi-alur" className={h2}>Pourquoi ce fonds existe : le contexte de la loi ALUR</h2>
      <p className={p}>
        La loi ALUR (Accès au Logement et Urbanisme Rénové) a été adoptée en mars 2014. Parmi ses nombreuses dispositions touchant à la copropriété, l&apos;une des plus structurantes a été la création du <strong className={strong}>fonds de travaux obligatoire</strong>.
      </p>
      <p className={p}>
        L&apos;idée de départ était simple : trop de copropriétés françaises se retrouvaient dans l&apos;incapacité de financer des travaux pourtant nécessaires — ravalement, toiture, mise aux normes de l&apos;ascenseur — faute d&apos;épargne collective. Résultat : des immeubles qui se dégradent progressivement pendant que les copropriétaires se disputent sur le financement, et des travaux d&apos;urgence qui finissent par coûter deux fois plus cher.
      </p>
      <p className={p}>En imposant une épargne de précaution, le législateur a voulu briser ce cycle. Depuis le <strong className={strong}>1er janvier 2017</strong>, la constitution de ce fonds est donc obligatoire pour toutes les copropriétés concernées.</p>

      {/* Section 2 */}
      <h2 id="qui-est-concerne" className={h2}>Qui est concerné ?</h2>
      <p className={p}>
        Toutes les copropriétés soumises à la loi du 10 juillet 1965 et comportant <strong className={strong}>plus de 10 lots</strong> sont dans le champ d&apos;application. La notion de &ldquo;lot&rdquo; inclut les lots principaux (appartements, locaux commerciaux) mais aussi les lots accessoires (caves, parkings, garages) — ce qui peut changer le décompte dans certaines configurations.
      </p>
      <p className={p}>
        <strong className={strong}>Les copropriétés de 10 lots et moins</strong> sont dispensées de l&apos;obligation, mais peuvent tout à fait voter un fonds de travaux volontaire. C&apos;est d&apos;ailleurs souvent une bonne pratique pour les petits immeubles anciens dont les équipements approchent de leur fin de vie.
      </p>
      <p className={p}>
        À noter : les immeubles neufs bénéficient d&apos;un délai. Une copropriété peut décider, à l&apos;unanimité des copropriétaires, de ne pas constituer le fonds pendant les <strong className={strong}>cinq premières années</strong> suivant la réception de l&apos;immeuble. Au-delà, l&apos;obligation s&apos;applique.
      </p>

      {/* Section 3 */}
      <h2 id="montant-minimum" className={h2}>Le montant minimum : ce que dit la loi</h2>
      <p className={p}>
        La loi fixe un plancher, pas un plafond. La cotisation annuelle au fonds de travaux doit être <strong className={strong}>au minimum égale à 5&nbsp;% du budget prévisionnel</strong> voté en AG pour l&apos;année concernée.
      </p>
      <p className={p}>
        Exemple concret : si votre budget annuel de charges courantes est de 18&nbsp;000&nbsp;€, la cotisation minimale au fonds de travaux est de 900&nbsp;€ pour l&apos;année. Répartis entre les copropriétaires selon les tantièmes, cela représente en général quelques dizaines d&apos;euros par trimestre par appartement.
      </p>
      <p className={p}>
        L&apos;AG peut voter un montant supérieur à ce minimum — et c&apos;est souvent conseillé lorsqu&apos;un plan pluriannuel de travaux est envisagé ou que le diagnostic technique global (DTG) a identifié des besoins importants à moyen terme. Il n&apos;y a pas de limite haute légale.
      </p>

      {/* Section 4 */}
      <h2 id="vote-ag" className={h2}>Le vote en AG : quelle majorité ?</h2>
      <p className={p}>
        Le montant de la cotisation annuelle est soumis au vote lors de l&apos;assemblée générale, à la <strong className={strong}>majorité de l&apos;article 24</strong> (majorité simple des voix exprimées des copropriétaires présents ou représentés). C&apos;est la majorité la plus facile à atteindre.
      </p>
      <p className={p}>En pratique, deux situations se présentent :</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Premier vote (mise en place du fonds)</strong> : l&apos;AG vote simultanément le principe et le montant de la cotisation pour le premier exercice.</li>
        <li className={li}><strong className={strong}>Votes suivants</strong> : chaque année, l&apos;AG peut décider de maintenir le montant précédent, de l&apos;augmenter ou de le diminuer — à condition de rester au-dessus du seuil légal de 5&nbsp;%.</li>
      </ul>
      <p className={p}>Un point souvent mal compris : l&apos;AG ne peut pas <strong className={strong}>supprimer</strong> le fonds de travaux par un vote, sauf dans les cas dérogatoires prévus par la loi. Un vote de suppression pure et simple serait nul et contraire à la loi.</p>

      {/* Section 5 */}
      <h2 id="compte-separe" className={h2}>Un compte bancaire séparé : l&apos;obligation méconnue</h2>
      <p className={p}>
        Les sommes versées au fonds de travaux <strong className={strong}>ne peuvent pas être mélangées avec la trésorerie courante</strong> de la copropriété. La loi est explicite : le fonds de travaux doit être déposé sur un compte bancaire séparé, ouvert au nom du syndicat des copropriétaires.
      </p>
      <p className={p}>
        Si vous gérez la copropriété avec un compte courant unique pour tout, vous n&apos;êtes pas en conformité. Il faut ouvrir un second compte — ce que la plupart des banques font facilement, avec un compte d&apos;épargne dédié type Livret A au nom du syndicat.
      </p>
      <p className={p}>Pourquoi cette séparation ? Pour éviter que les fonds de travaux soient utilisés pour couvrir un découvert de trésorerie courante, et pour garantir leur disponibilité immédiate quand un vote de travaux intervient.</p>

      {/* Section 6 */}
      <h2 id="utilisation" className={h2}>À quoi peuvent servir ces fonds ?</h2>
      <p className={p}>Le fonds de travaux ne peut être utilisé que pour <strong className={strong}>financer des travaux votés en assemblée générale</strong>. Il ne peut pas servir à couvrir des charges courantes, même en cas de difficultés de trésorerie.</p>
      <p className={p}>Les travaux éligibles incluent notamment :</p>
      <ul className={ul}>
        <li className={li}>Les travaux de conservation de l&apos;immeuble (ravalement, toiture, étanchéité…)</li>
        <li className={li}>Les travaux de mise en conformité réglementaire (ascenseur, électricité des communs, accessibilité…)</li>
        <li className={li}>Les améliorations adoptées en AG (isolation thermique, installation de panneaux solaires communs…)</li>
      </ul>
      <p className={p}>
        En revanche, les dépenses d&apos;entretien courant (remplacement d&apos;une ampoule, réparation d&apos;une serrure, nettoyage) ne sont pas financées par le fonds de travaux — elles relèvent du budget prévisionnel ordinaire.
      </p>

      {/* Section 7 */}
      <h2 id="vente-lot" className={h2}>Ce qui se passe lors de la vente d&apos;un lot</h2>
      <p className={p}>
        C&apos;est le point le plus déstabilisant pour les copropriétaires qui découvrent la règle au moment de vendre : <strong className={strong}>les sommes versées au fonds de travaux sont définitivement acquises au syndicat des copropriétaires</strong>. Elles ne sont pas remboursables au vendeur.
      </p>
      <p className={p}>
        Concrètement, si M. Bernard a versé 1&nbsp;200&nbsp;€ au fonds de travaux sur trois ans et décide de vendre son appartement, il ne récupère pas ces 1&nbsp;200&nbsp;€. Ces fonds restent dans la copropriété et bénéficient à l&apos;acquéreur, qui reprend le lot avec sa quote-part du fonds intégrée.
      </p>
      <p className={p}>
        En contrepartie, lors de la vente, le notaire doit informer l&apos;acquéreur de l&apos;état du fonds de travaux. Un fonds bien alimenté est un argument positif : il signifie que la copropriété est prévoyante et que l&apos;acquéreur n&apos;aura pas à supporter un appel de fonds exceptionnel massif dans les premières années.
      </p>

      {/* Section 8 */}
      <h2 id="risques" className={h2}>Les risques en cas de non-respect</h2>
      <p className={p}>Ne pas constituer le fonds de travaux, ou le gérer de façon irrégulière, expose la copropriété à plusieurs conséquences.</p>
      <p className={p}>
        <strong className={strong}>Sur le plan légal</strong>, un copropriétaire peut contester en justice les décisions prises par une AG qui n&apos;aurait pas voté ce fonds. L&apos;absence de compte séparé peut également être soulevée lors d&apos;une transaction immobilière pour bloquer la vente ou négocier une réduction de prix.
      </p>
      <p className={p}>
        <strong className={strong}>Sur le plan pratique</strong>, une copropriété sans réserve est une copropriété vulnérable. Quand la chaudière lâche en janvier ou que la toiture prend l&apos;eau après une tempête, il faut appeler des fonds exceptionnels en urgence — ce qui génère presque systématiquement des tensions et des refus de payer.
      </p>
      <p className={p}>
        <strong className={strong}>Sur le plan de la valorisation immobilière</strong>, les agences et les notaires regardent de près l&apos;état du fonds de travaux. Un immeuble avec un fonds constitué se vend mieux et plus vite.
      </p>

      {/* Section 9 */}
      <h2 id="dtg" className={h2}>Fonds de travaux et diagnostic technique global (DTG)</h2>
      <p className={p}>
        Depuis 2017, les copropriétés de plus de 10 ans et de plus de 200 lots ont l&apos;obligation de réaliser un <strong className={strong}>diagnostic technique global (DTG)</strong>, qui dresse un état des lieux complet de l&apos;immeuble et projette les travaux nécessaires sur dix ans. Pour les copropriétés plus petites, le DTG est facultatif mais recommandé.
      </p>
      <p className={p}>
        Le DTG est utile pour calibrer le fonds de travaux au-delà du minimum légal. Si le diagnostic indique que la toiture devra être refaite d&apos;ici cinq ans pour un coût estimé à 80&nbsp;000&nbsp;€ sur un immeuble de vingt lots, il est raisonnable d&apos;augmenter la cotisation annuelle pour constituer une réserve suffisante — plutôt que de se retrouver à voter 4&nbsp;000&nbsp;€ d&apos;appel exceptionnel par lot du jour au lendemain.
      </p>

      {/* Section 10 */}
      <h2 id="pratique-erreurs" className={h2}>Gérer le fonds de travaux en pratique : éviter les erreurs courantes</h2>
      <p className={p}>Voici les erreurs que font le plus souvent les syndics bénévoles qui manquent d&apos;outillage :</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Oublier de le soumettre au vote chaque année.</strong> Le montant doit être voté annuellement. Un oubli en AG ne signifie pas que la cotisation tombe à zéro, mais il est bon de le confirmer formellement chaque année.</li>
        <li className={li}><strong className={strong}>Mélanger les comptes.</strong> Utiliser le même compte courant pour les charges et pour le fonds de travaux est une irrégularité fréquente. Elle peut causer des problèmes lors d&apos;une vente ou d&apos;un contrôle.</li>
        <li className={li}><strong className={strong}>Ne pas tracer les mouvements.</strong> Chaque versement au fonds, chaque décaissement pour des travaux, chaque solde en fin d&apos;exercice doit être documenté et présenté à l&apos;AG.</li>
        <li className={li}><strong className={strong}>Utiliser le fonds pour des dépenses courantes.</strong> Cela arrive lors d&apos;une mauvaise passe de trésorerie. C&apos;est illégal, même si on a l&apos;intention de &ldquo;rembourser plus tard&rdquo;.</li>
      </ul>

      {/* Section 11 — Product */}
      <h2 id="notre-outil" className={h2}>Ce que Mon Syndic Bénévole fait pour vous</h2>
      <p className={p}>
        Gérés manuellement, les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds travaux ALUR</a> ressemblent à tout le reste : un tableau Excel, des virements à vérifier, des soldes à recalculer. Le risque d&apos;erreur et d&apos;oubli est réel.
      </p>
      <p className={p}>
        Sur <a href="https://mon-syndic-benevole.fr" className={a}>Mon Syndic Bénévole</a>, le fonds de travaux ALUR est traité comme un type d&apos;appel de fonds dédié, distinct des charges courantes :
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <ul className="space-y-2">
          {[
            'Création en quelques clics : vous renseignez le montant annuel voté, la plateforme calcule la cotisation trimestrielle de chaque copropriétaire selon ses tantièmes.',
            'Suivi des paiements en temps réel : chaque règlement est enregistré, les relances s\'identifient immédiatement.',
            'Historique complet : chaque copropriétaire peut voir combien il a versé depuis la création du fonds — précieux lors d\'une revente.',
            'Séparation comptable claire : le fonds de travaux est tracé séparément des charges courantes dans les rapports financiers.',
            'Export des données pour préparer l\'approbation des comptes ou répondre aux demandes du notaire lors d\'une transaction.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </div>

      <p className={p}>Le tout sans comptable, sans formation spécifique, et sans risque d&apos;oublier une case.</p>

      {/* FAQ */}
      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Le fonds de travaux peut-il être utilisé pour une réparation urgente sans vote en AG ?</h3>
      <p className={p}>Non. Même en cas d&apos;urgence, l&apos;utilisation du fonds de travaux nécessite un vote en AG. En cas de sinistre urgent, le syndic peut engager des dépenses conservatoires sous sa propre responsabilité, couvertes par le budget courant ou un appel exceptionnel.</p>

      <h3 className={h3}>Que se passe-t-il si le fonds de travaux est insuffisant pour couvrir des travaux votés ?</h3>
      <p className={p}>L&apos;écart est couvert par un appel de fonds exceptionnel complémentaire. Le fonds vient en déduction du montant total à appeler, ce qui réduit d&apos;autant la charge pour les copropriétaires.</p>

      <h3 className={h3}>Un copropriétaire peut-il s&apos;opposer à verser au fonds de travaux ?</h3>
      <p className={p}>Non. Une fois voté en AG, le montant est exigible de tous les copropriétaires selon leurs tantièmes. Un refus de payer expose le copropriétaire aux mêmes procédures de recouvrement que pour les charges courantes impayées.</p>

      <h3 className={h3}>Le taux de 5&nbsp;% se calcule sur quel budget exactement ?</h3>
      <p className={p}>Sur le budget prévisionnel des charges courantes voté en AG pour l&apos;exercice en cours, hors fonds de travaux lui-même. Si vous avez un budget de 20&nbsp;000&nbsp;€ de charges courantes, le minimum légal est de 1&nbsp;000&nbsp;€ de cotisation annuelle au fonds.</p>

      <h3 className={h3}>Les petites copropriétés de moins de 10 lots peuvent-elles bénéficier du fonds si elles en constituent un volontairement ?</h3>
      <p className={p}>Oui, et les mêmes règles de bonne gestion s&apos;appliquent : vote en AG, compte séparé, traçabilité des mouvements.</p>

      {/* Conclusion */}
      <h2 id="ce-quil-faut-retenir" className={h2}>Ce qu&apos;il faut retenir</h2>
      <p className={p}>
        Le fonds de travaux ALUR n&apos;est pas une contrainte administrative parmi d&apos;autres. C&apos;est un outil de gestion saine qui protège l&apos;immeuble, les copropriétaires et la valeur des biens sur le long terme. Les copropriétés qui l&apos;ont correctement constitué traversent les imprévus — tempête, vétusté soudaine, mise aux normes imposée — sans crise financière ni guerre entre voisins.
      </p>
      <p className={p}>
        Pour un <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>syndic bénévole</a>, le défi n&apos;est pas de comprendre le principe — il est simple — c&apos;est de le mettre en œuvre rigoureusement année après année, avec les bons outils et la bonne traçabilité.
      </p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>le calcul et la répartition des appels de fonds copropriété</a> ou <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>comment gérer une copropriété sans syndic professionnel</a>.</p>
    </>
  );
}
