// ============================================================
// Article : Logiciel syndic bénévole — ce qui change vraiment
// Target KW : "logiciel syndic bénévole", "logiciel gestion copropriété"
// ============================================================

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleLogicielSyndicBenevole() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        Marc gère une copropriété de 12 lots depuis 2 ans avec Excel. En mars dernier, il a passé 6 heures à préparer son AG : reconstituer les dépenses poste par poste, vérifier qui avait payé quoi, recalculer les quotes-parts du budget prévisionnel, produire un PV lisible. &ldquo;J&apos;ai failli démissionner ce week-end-là.&rdquo;
      </p>
      <p className={p}>
        Il a migré vers un logiciel de gestion dédié en avril. Son AG de juin a pris 2 heures de préparation. Voici la différence concrète entre les deux approches — et comment choisir le bon outil.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Marc a économisé 4 h/mois et 2 700 €/an de frais de syndic.</p>
        <p className="text-sm text-gray-600 mb-4">
          Il a migré depuis Excel en 35 minutes. Son premier appel de fonds a été envoyé 3 heures plus tard.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </CtaLink>
      </div>

      <h2 id="excel-vs-logiciel" className={h2}>La comparaison honnête : Excel, logiciel dédié, syndic pro</h2>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium bg-gray-50 w-2/5">Critère</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium bg-gray-50">Excel</th>
              <th className="text-center py-3 px-4 text-blue-700 font-semibold bg-blue-50">Mon Syndic Bénévole</th>
              <th className="text-center py-3 px-4 text-gray-500 font-medium bg-gray-50">Syndic pro</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Appels de fonds calculés par tantièmes</td>
              <td className="py-3 px-4 text-center text-red-600">Manuel</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Automatique ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Géré par le cabinet</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Avis PDF + envoi e-mail</td>
              <td className="py-3 px-4 text-center text-red-600">À la main, 1 par 1</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">1 clic pour tous ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Inclus</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Suivi paiements + relances</td>
              <td className="py-3 px-4 text-center text-red-600">Saisie manuelle</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Suivi par lot ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Géré par le cabinet</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Documents légaux (convocation AG, PV)</td>
              <td className="py-3 px-4 text-center text-red-600">Aucun modèle</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Modèles intégrés ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Fournis</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Fonds de travaux séparé (ALUR)</td>
              <td className="py-3 px-4 text-center text-gray-600">Onglet séparé</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Compte dédié conforme ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Compte séparé</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Espace personnel copropriétaires</td>
              <td className="py-3 px-4 text-center text-gray-600">Drive partagé</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Accès individuel ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">Portail client</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Contrôle de vos données</td>
              <td className="py-3 px-4 text-center text-gray-600">Votre fichier</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">Votre espace ✓</td>
              <td className="py-3 px-4 text-center text-red-600">Dépend du cabinet</td>
            </tr>
            <tr className="bg-blue-50 border-y-2 border-blue-200">
              <td className="py-3 px-4 font-semibold text-gray-900">Prix / an (12 lots)</td>
              <td className="py-3 px-4 text-center font-medium text-gray-700">Gratuit</td>
              <td className="py-3 px-4 text-center font-bold text-blue-700 bg-blue-100">~240 €/an</td>
              <td className="py-3 px-4 text-center font-bold text-red-600">2 400–4 200 €/an</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Temps de gestion / mois</td>
              <td className="py-3 px-4 text-center text-red-600">~8–10 h</td>
              <td className="py-3 px-4 text-center text-green-700 font-medium bg-blue-50/40">~2–3 h ✓</td>
              <td className="py-3 px-4 text-center text-gray-600">~0 h (délégué)</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h2 id="pourquoi-excel-ne-suffit-pas" className={h2}>Pourquoi Excel ne suffit plus après un an</h2>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">01</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Pas de traçabilité des relances</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Aucune preuve en cas de litige</p>
            <p className="text-xs text-gray-600">Quand un copropriétaire dit &ldquo;je n&apos;ai jamais reçu de relance&rdquo;, vous ne pouvez pas le prouver. Ni la date, ni le canal, ni le contenu.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">02</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Les erreurs de formule sont invisibles</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Appels de fonds faux pendant des trimestres entiers</p>
            <p className="text-xs text-gray-600">Sylvie (comptable de profession) a découvert en AG une erreur de 2 ans sur les charges ascenseur. &ldquo;Il fallait tout recalculer à rebours.&rdquo;</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">03</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Pas de documents légaux conformes</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — Modèles à refaire manuellement à chaque fois</p>
            <p className="text-xs text-gray-600">Convocations AG, PV, avis de paiement — tout doit être mis en forme à la main chaque trimestre. Un chiffre change dans le tableur : le document correspondant ne se met pas à jour.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">04</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Pas de partage en temps réel</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — 20–30 min perdues par demande de copropriétaire</p>
            <p className="text-xs text-gray-600">Exporter, envoyer, s&apos;assurer que la version reçue est la bonne. Ce va-et-vient se répète à chaque demande d&apos;historique de paiement ou de justificatif.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">05</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Pas d&apos;alerte calendaire intégrée</p>
            <p className="text-xs font-medium text-red-600 mb-1">Risque — AG convoquée trop tard = nullité potentielle des résolutions</p>
            <p className="text-xs text-gray-600">J-21 AG, contrats à renouveler, vote annuel fonds de travaux ALUR — tout doit être suivi manuellement. Un seul oubli peut avoir des conséquences légales.</p>
          </div>
        </div>
      </div>

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
        <p className="text-sm font-semibold text-blue-700 mb-1">Marc a migré depuis Excel en 35 minutes. Vous pouvez faire pareil.</p>
        <p className="text-sm text-gray-600 mb-4">
          Lots, tantièmes, appels de fonds, relances, AG, espace copropriétaires — Mon Syndic Bénévole les intègre tous.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </CtaLink>
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

      <h2 id="couts" className={h2}>Le vrai coût : Excel, logiciel dédié, syndic pro</h2>

      <div className="my-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-3">Excel</p>
          <p className="text-3xl font-bold text-gray-900 mb-0.5">0 €</p>
          <p className="text-xs text-gray-400 mb-4">par an</p>
          <div className="pt-3 border-t border-gray-100 space-y-1.5">
            <p className="text-xs text-gray-600">~8–10 h de gestion / mois</p>
            <p className="text-xs text-red-500 font-medium">Votre temps a un coût</p>
          </div>
        </div>
        <div className="rounded-xl border-2 border-blue-500 p-5 text-center bg-blue-50 relative">
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
            Recommandé
          </span>
          <p className="text-sm font-semibold text-blue-700 mb-3">Mon Syndic Bénévole</p>
          <p className="text-3xl font-bold text-blue-700 mb-0.5">~240 €</p>
          <p className="text-xs text-blue-400 mb-4">par an · tout inclus</p>
          <div className="pt-3 border-t border-blue-200 space-y-1.5">
            <p className="text-xs text-gray-700">~2–3 h de gestion / mois</p>
            <p className="text-xs text-blue-600 font-medium">Essai gratuit 14 jours</p>
          </div>
        </div>
        <div className="rounded-xl border border-gray-200 p-5 text-center">
          <p className="text-sm font-semibold text-gray-600 mb-3">Syndic professionnel</p>
          <p className="text-3xl font-bold text-red-600 mb-0.5">2 400–4 200 €</p>
          <p className="text-xs text-gray-400 mb-4">par an (12 lots)</p>
          <div className="pt-3 border-t border-gray-100 space-y-1.5">
            <p className="text-xs text-gray-600">~0 h / mois (délégué)</p>
            <p className="text-xs text-red-500 font-medium">+ frais AG, états datés</p>
          </div>
        </div>
      </div>

      <p className={p}>
        Pour 12 lots, passer à Mon Syndic Bénévole représente une économie de <strong className={strong}>2 160 à 3 960 € par an</strong> par rapport à un syndic professionnel. Une économie qui revient directement aux copropriétaires sous forme de charges moins élevées.
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
        <p className="text-base font-semibold text-white mb-1">Marc a économisé 4 h/mois et 2 700 €/an. En 35 minutes de migration.</p>
        <p className="text-sm text-blue-100 mb-4">Configurez votre copropriété, ajoutez vos lots et émettez votre premier appel de fonds le jour même.</p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </CtaLink>
        <p className="text-xs text-blue-200 mt-2">Essai gratuit 14 jours · Sans carte bancaire · Résiliable à tout moment</p>
      </div>
    </>
  );
}
