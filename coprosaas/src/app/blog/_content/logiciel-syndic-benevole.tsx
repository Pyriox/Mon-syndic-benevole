// ============================================================
// Article : Logiciel syndic bénévole — ce qui change vraiment
// Target KW : "logiciel syndic bénévole", "logiciel gestion copropriété"
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleLogicielSyndicBenevole() {
  return (
    <>
      <p className={p}>
        Marc gère une copropriété de 12 lots depuis 2 ans avec Excel. En mars dernier, il a passé 6 heures à préparer son AG : reconstituer les dépenses poste par poste, vérifier qui avait payé quoi, recalculer les quotes-parts du budget prévisionnel, produire un PV lisible. &ldquo;J&apos;ai failli démissionner ce week-end-là.&rdquo;
      </p>
      <p className={p}>
        Il a migré vers un logiciel de gestion dédié en avril. Son AG de juin a pris 2 heures de préparation. Voici la différence concrète entre les deux approches — et comment choisir le bon outil.
      </p>

      <h2 id="excel-vs-logiciel" className={h2}>Excel vs logiciel dédié : la comparaison honnête</h2>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Tâche</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Excel</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium">Logiciel dédié</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Calcul des appels de fonds par tantièmes</td>
              <td className="py-3 px-4 text-center text-gray-600">Manuel, risque d&apos;erreur</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Automatique</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Génération des avis de paiement en PDF</td>
              <td className="py-3 px-4 text-center text-gray-600">À la main, 1 par 1</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">En 1 clic pour tous</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Envoi des appels par e-mail</td>
              <td className="py-3 px-4 text-center text-gray-600">Copier/coller manuel</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Envoi groupé intégré</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Suivi des paiements reçus</td>
              <td className="py-3 px-4 text-center text-gray-600">Saisie manuelle dans le tableur</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Rapprochement par lot</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Relances automatiques impayés</td>
              <td className="py-3 px-4 text-center text-red-600">Non disponible</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Configurable (J+15, J+30)</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Fonds de travaux séparé des charges</td>
              <td className="py-3 px-4 text-center text-gray-600">Onglet séparé, risque de confusion</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Séparation comptable automatique</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Génération convocation AG avec délai 21j</td>
              <td className="py-3 px-4 text-center text-red-600">Manuel, délai à calculer à la main</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Validation automatique du délai</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Accès copropriétaires aux documents</td>
              <td className="py-3 px-4 text-center text-gray-600">Drive partagé, gestion manuelle</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">Espace personnel par copropriétaire</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Export comptable pour AG</td>
              <td className="py-3 px-4 text-center text-gray-600">Mise en forme manuelle (1-2 h)</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium">PDF généré en 30 secondes</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Coût</td>
              <td className="py-3 px-4 text-center text-gray-600">Gratuit (mais coûte du temps)</td>
              <td className="py-3 px-4 text-center text-gray-700">~20-30 €/mois</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={p}>
        La conclusion de Marc : &ldquo;Excel me coûtait 4 heures supplémentaires par mois par rapport à l&apos;outil. À 25 € par mois, le logiciel me fait économiser du temps à un coût inférieur au salaire minimum horaire.&rdquo;
      </p>

      <h2 id="pourquoi-excel-ne-suffit-pas" className={h2}>Les 5 limitations concrètes d&apos;Excel en gestion de copropriété</h2>

      <h3 className={h3}>1. Pas de traçabilité des relances</h3>
      <p className={p}>
        Qui avez-vous relancé, quand, par quel canal ? Ce n&apos;est dans aucun fichier Excel — c&apos;est dans votre mémoire ou dans un e-mail introuvable. Quand un copropriétaire dit &ldquo;je n&apos;ai jamais reçu de relance&rdquo;, vous n&apos;avez aucune preuve.
      </p>

      <h3 className={h3}>2. Les erreurs de formule sont invisibles</h3>
      <p className={p}>
        Une référence copiée avec un décalage dans les tantièmes peut fausser tous les appels de fonds pendant des trimestres entiers — sans que personne ne s&apos;en aperçoive avant l&apos;AG. Sylvie (comptable de profession) a découvert en AG une erreur de 2 ans sur les charges ascenseur d&apos;un lot. &ldquo;Il fallait tout recalculer à rebours.&rdquo;
      </p>

      <h3 className={h3}>3. Pas de génération de documents conformes</h3>
      <p className={p}>
        Chaque avis de paiement, chaque convocation d&apos;AG, chaque PV doit être mis en forme à la main. Chaque trimestre, le même travail recommence. Et si vous changez un chiffre dans le tableau, le document correspondant ne se met pas à jour automatiquement.
      </p>

      <h3 className={h3}>4. Pas de partage en temps réel</h3>
      <p className={p}>
        Si un copropriétaire veut consulter son historique de paiement ou les justificatifs de dépenses, vous devez exporter, envoyer, espérer que la version qu&apos;il reçoit est la bonne. Ce va-et-vient représente en moyenne 20 à 30 minutes de travail supplémentaire par demande.
      </p>

      <h3 className={h3}>5. Pas d&apos;alerte calendaire intégrée</h3>
      <p className={p}>
        La date de l&apos;AG (21 jours avant), les contrats qui expirent, le vote annuel du fonds de travaux ALUR — tout doit être suivi manuellement. Un oubli peut avoir des conséquences légales (AG convoquée trop tard = risque d&apos;annulation).
      </p>

      <h2 id="fonctionnalites-indispensables" className={h2}>Les 6 fonctionnalités vraiment indispensables</h2>

      <h3 className={h3}>1. Gestion des lots et des tantièmes par grille</h3>
      <p className={p}>
        Le logiciel doit intégrer la structure exacte de votre copropriété : chaque lot, ses tantièmes généraux, ses tantièmes spéciaux (ascenseur, chauffage, eau froide…). Sans cette base exacte, chaque calcul de répartition est approximatif.
      </p>

      <h3 className={h3}>2. Génération automatique des appels de fonds</h3>
      <p className={p}>
        Une fois le budget voté, les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds</a> sont générés automatiquement chaque trimestre avec la quote-part exacte de chaque copropriétaire. L&apos;envoi par e-mail et l&apos;archivage comme pièces justificatives sont inclus.
      </p>

      <h3 className={h3}>3. Suivi des paiements et relances</h3>
      <p className={p}>
        Chaque paiement reçu est rapproché de l&apos;appel correspondant. Les soldes impayés sont visibles en un coup d&apos;œil, avec l&apos;historique des relances envoyées — date, canal, réponse.
      </p>

      <h3 className={h3}>4. Comptabilité séparée charges courantes / fonds de travaux</h3>
      <p className={p}>
        Le logiciel doit gérer deux comptes distincts — compte courant et <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> — et produire les états financiers présentables en AG. Pour les copropriétés de plus de 10 lots, la comptabilité en parties doubles est obligatoire.
      </p>

      <h3 className={h3}>5. Cycle AG complet</h3>
      <p className={p}>
        Génération des convocations (avec vérification automatique du délai de 21 jours), modèles de résolutions, feuille de présence, procès-verbal en PDF — tout le cycle de l&apos;AG couvert dans un seul outil.
      </p>

      <h3 className={h3}>6. Espace personnel pour chaque copropriétaire</h3>
      <p className={p}>
        Chaque copropriétaire accède à ses appels de fonds, son historique de paiements, les comptes de la copropriété et les documents postés par le syndic. Résultat : 60 à 80 % de demandes individuelles en moins (d&apos;après les retours d&apos;Isabelle et Sylvie).
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Ces 6 fonctionnalités en un seul outil</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole couvre l&apos;intégralité de ces besoins. Configurez votre copropriété en 15 minutes, émettez vos premiers appels de fonds le jour même. Essai gratuit, sans carte bancaire.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester Mon Syndic Bénévole gratuitement →
        </Link>
      </div>

      <h2 id="migration-excel" className={h2}>Comment migrer depuis Excel en 30 minutes</h2>
      <p className={p}>
        La migration minimale ne requiert pas de ressaisir l&apos;historique complet. Voici ce dont vous avez besoin pour démarrer :
      </p>

      <ol className={ol}>
        <li className={li}>
          <strong className={strong}>La liste des lots et des copropriétaires</strong> avec leurs tantièmes (généraux + spéciaux). Source : le règlement de copropriété ou le fichier de l&apos;ancien syndic.
        </li>
        <li className={li}>
          <strong className={strong}>Le budget prévisionnel de l&apos;exercice en cours</strong> voté en AG. Suffit pour générer les appels de fonds du trimestre en cours.
        </li>
        <li className={li}>
          <strong className={strong}>Les soldes de chaque copropriétaire</strong> à la date de migration (qui a payé quoi jusqu&apos;à aujourd&apos;hui). Exportable depuis votre relevé bancaire.
        </li>
      </ol>

      <p className={p}>
        L&apos;historique des 2 ou 3 exercices précédents peut rester dans votre Excel sans impact sur la gestion future. Marc a migré en 35 minutes un dimanche matin. Son premier appel de fonds avec le nouvel outil a été envoyé 3 heures plus tard.
      </p>

      <h2 id="couts" className={h2}>Coût réel : logiciel vs syndic professionnel</h2>
      <p className={p}>
        Un syndic professionnel facture en moyenne <strong className={strong}>150 à 250 € par lot et par an</strong> pour la gestion de base, hors frais annexes (AG, états datés, interventions spéciales). Pour 12 lots : 1 800 à 3 000 € de gestion de base + 600 à 1 200 € de frais annexes = <strong className={strong}>2 400 à 4 200 € par an</strong>.
      </p>
      <p className={p}>
        Un logiciel comme Mon Syndic Bénévole : <strong className={strong}>moins de 300 € par an</strong> pour l&apos;ensemble de la copropriété quel que soit le nombre de lots. La différence revient directement aux copropriétaires sous forme de charges moins élevées.
      </p>

      <h2 id="criteres-de-choix" className={h2}>Les critères qui font vraiment la différence dans le choix d&apos;un outil</h2>

      <h3 className={h3}>Le temps de mise en route</h3>
      <p className={p}>
        Si l&apos;outil demande plusieurs jours de configuration ou une formation, vous ne l&apos;utiliserez pas après la première friction. L&apos;objectif : pouvoir émettre votre premier appel de fonds dans la première heure suivant votre inscription.
      </p>

      <h3 className={h3}>La conformité légale</h3>
      <p className={p}>
        L&apos;outil doit être conforme aux obligations de la loi de 1965, du décret de 1967 et de la loi ALUR : calcul par grille de tantièmes, fonds de travaux séparé, documents conformes aux modèles légaux. Vérifiez que les convocations d&apos;AG incluent bien le délai de 21 jours et les documents obligatoires.
      </p>

      <h3 className={h3}>L&apos;accès copropriétaires</h3>
      <p className={p}>
        Un outil sans espace personnel pour les copropriétaires ne résout que la moitié du problème. L&apos;autre moitié, c&apos;est la transparence et la réduction des questions répétitives par e-mail ou SMS.
      </p>

      <h3 className={h3}>Le support</h3>
      <p className={p}>
        Un syndic bénévole n&apos;est pas expert. Le support doit être réactif — pas uniquement une base de connaissances générique impossible à naviguer à 22 h la veille d&apos;une AG.
      </p>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>À partir de combien de lots est-il utile d&apos;avoir un logiciel ?</h3>
      <p className={p}>Dès le deuxième lot. Même une petite copropriété de 3 ou 4 lots a besoin d&apos;un suivi rigoureux des appels de fonds, des paiements et des AG. La question est moins le nombre de lots que la rigueur que vous souhaitez maintenir dans la durée.</p>

      <h3 className={h3}>Le logiciel est-il conforme à la loi ALUR ?</h3>
      <p className={p}>Cela dépend du logiciel. Mon Syndic Bénévole intègre le fonds de travaux obligatoire sur compte séparé, la séparation comptable des charges et du fonds, et les modèles de documents conformes aux obligations légales.</p>

      <h3 className={h3}>Les copropriétaires doivent-ils aussi créer un compte ?</h3>
      <p className={p}>C&apos;est optionnel. Mon Syndic Bénévole permet d&apos;inviter chaque copropriétaire à accéder à son espace personnel — mais le syndic peut aussi tout gérer seul et envoyer les documents par e-mail sans que les copropriétaires aient à se connecter.</p>

      <h3 className={h3}>Peut-on l&apos;utiliser pour plusieurs copropriétés ?</h3>
      <p className={p}>Oui. Les copropriétés sont gérées dans des espaces distincts, avec leurs propres copropriétaires, lots, budgets et appels de fonds. C&apos;est utile pour un syndic bénévole qui gère 2 ou 3 immeubles dans le même quartier.</p>

      <h3 className={h3}>Les données sont-elles sécurisées ?</h3>
      <p className={p}>Les données financières et les coordonnées des copropriétaires sont des données personnelles et sensibles. Mon Syndic Bénévole est hébergé sur une infrastructure européenne conforme au RGPD, avec authentification sécurisée et sauvegardes automatiques quotidiennes.</p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Un logiciel de syndic bénévole n&apos;est pas un luxe. C&apos;est la condition pour exercer ce mandat sereinement au-delà d&apos;un an, sans risquer des erreurs de calcul, des délais manqués ou une comptabilité impossible à présenter en AG.
      </p>
      <p className={p}>
        Le bon outil doit être opérationnel en moins d&apos;une heure, conforme aux obligations légales, et assez simple pour ne jamais devenir une charge supplémentaire. Marc, 8 mois après sa migration : &ldquo;Je regrette de ne pas l&apos;avoir fait dès le départ.&rdquo;
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-2">Prêt à remplacer vos tableurs ?</p>
        <p className="text-sm text-blue-100 mb-4">14 jours d&apos;essai gratuit. Aucune carte bancaire requise.</p>
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
