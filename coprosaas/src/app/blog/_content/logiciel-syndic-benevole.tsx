// ============================================================
// Article : Logiciel syndic bénévole — comparatif 2026
// Target KW : "logiciel syndic bénévole", "logiciel gestion copropriété"
// Silo : SILO 4 — Outils & logiciels (bottom of funnel)
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, li, strong, a } from './styles';

export default function ArticleLogicielSyndicBenevole() {
  return (
    <>
      <p className={p}>
        Vous gérez votre copropriété depuis un an. Vous avez un classeur Excel, deux dossiers Google Drive et une boîte mail qui déborde de messages d&apos;habitants. La prochaine AG approche et vous réalisez que les comptes ne sont pas prêts, que deux copropriétaires n&apos;ont pas payé leurs charges depuis six mois, et que personne ne sait où est le dernier PV officiel.
      </p>
      <p className={p}>
        Excel peut sembler gratuit. Il ne l&apos;est pas — il coûte du temps, des erreurs et parfois de la crédibilité. Ce guide présente ce qu&apos;un <strong className={strong}>logiciel de gestion dédié au syndic bénévole</strong> doit couvrir, et pourquoi certains outils conviennent mieux que d&apos;autres.
      </p>

      {/* Section 1 */}
      <h2 id="pourquoi-excel-ne-suffit-pas" className={h2}>Pourquoi Excel ne suffit plus après un an de gestion</h2>
      <p className={p}>
        Excel est un outil de calcul général. Il excelle pour les analyses ponctuelles. Pour la gestion récurrente d&apos;une copropriété, il présente des lacunes structurelles&nbsp;:
      </p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Pas de traçabilité des relances.</strong> Qui a été relancé, quand, par quel moyen&nbsp;? Ce n&apos;est dans aucun fichier — c&apos;est dans votre tête ou dans un e-mail introuvable.</li>
        <li className={li}><strong className={strong}>Pas de génération de documents.</strong> Chaque appel de fonds, chaque convocation d&apos;AG, chaque PV doit être reformaté à la main. Chaque trimestre, vous reproposez le même travail.</li>
        <li className={li}><strong className={strong}>Pas de partage en temps réel.</strong> Si un copropriétaire veut consulter les comptes ou l&apos;historique des charges, vous devez exporter, envoyer, espérer que la version qu&apos;il lit soit la bonne.</li>
        <li className={li}><strong className={strong}>Pas d&apos;alerte calendaire intégrée.</strong> La date de l&apos;AG, les contrats qui expirent, les impayés qui s&apos;accumulent — tout doit être suivi manuellement.</li>
        <li className={li}><strong className={strong}>Risque d&apos;erreur non détectable.</strong> Une formule mal copiée peut fausser les tantièmes, la répartition des charges, le total des appels de fonds — sans que personne ne s&apos;en aperçoive avant l&apos;AG.</li>
      </ul>

      {/* Section 2 */}
      <h2 id="fonctionnalites-indispensables" className={h2}>Les 6 fonctionnalités vraiment indispensables</h2>

      <h3 className={h3}>1. Gestion des lots et des tantièmes</h3>
      <p className={p}>
        Le logiciel doit intégrer la structure exacte de votre copropriété&nbsp;: chaque lot, son numéro, ses tantièmes généraux et spéciaux (ascenseur, chauffage, eau froide…). C&apos;est la base de tout calcul de répartition des charges. Sans elle, rien n&apos;est fiable.
      </p>

      <h3 className={h3}>2. Génération automatique des appels de fonds</h3>
      <p className={p}>
        Une fois le budget voté, les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds</a> doivent être générés automatiquement chaque trimestre avec la quote-part exacte de chaque copropriétaire. Le logiciel doit les envoyer par e-mail et les archiver comme pièces justificatives.
      </p>

      <h3 className={h3}>3. Suivi des paiements et relances automatiques</h3>
      <p className={p}>
        Chaque paiement reçu doit être rapproché de l&apos;appel de fonds correspondant. Les soldes impayés doivent être visibles en un coup d&apos;œil, avec une historique des relances envoyées.
      </p>

      <h3 className={h3}>4. Comptabilité conforme (compte courant + fonds de travaux)</h3>
      <p className={p}>
        Le logiciel doit gérer deux comptes distincts — compte courant et <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> — et produire les états financiers présentables en AG. Pour les copropriétés de plus de 10 lots, la comptabilité en parties doubles est obligatoire.
      </p>

      <h3 className={h3}>5. Gestion des assemblées générales</h3>
      <p className={p}>
        Génération des convocations (avec les 21 jours de préavis requis), modèles de résolutions, feuille de présence, procès-verbal — tout le cycle de l&apos;AG doit être couvert. La convocation doit pouvoir être envoyée directement depuis l&apos;outil, avec une piste d&apos;audit.
      </p>

      <h3 className={h3}>6. Accès copropriétaires avec espace personnel</h3>
      <p className={p}>
        Chaque copropriétaire doit pouvoir consulter ses appels de fonds, ses paiements, les comptes de la copropriété et les documents postés par le syndic. Cela coupe court aux questions répétées par e-mail et renforce la transparence.
      </p>

      {/* Inline CTA */}
      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Ces 6 fonctionnalités en un seul outil</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole couvre l&apos;intégralité de ces besoins. Configurez votre copropriété en 5 minutes, émettez vos premiers appels de fonds le jour même. Essai gratuit, sans carte bancaire.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester Mon Syndic Bénévole gratuitement →
        </Link>
      </div>

      {/* Section 3 */}
      <h2 id="ce-qui-change-concretement" className={h2}>Ce que ça change concrètement dans votre quotidien</h2>
      <p className={p}>Voici les tâches qui disparaissent réellement quand vous passez à un outil dédié&nbsp;:</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Recalcul des quotes-parts chaque trimestre</strong> → le logiciel les calcule automatiquement depuis les tantièmes.</li>
        <li className={li}><strong className={strong}>Mise en forme et envoi des appels de fonds</strong> → générés en PDF et envoyés en un clic.</li>
        <li className={li}><strong className={strong}>Suivi manuel des paiements reçus</strong> → réconciliation via relevé bancaire ou saisie directe.</li>
        <li className={li}><strong className={strong}>Recherche des anciens PV et documents</strong> → archivage centralisé et consultable par tous.</li>
        <li className={li}><strong className={strong}>Réponses aux questions des copropriétaires</strong> → espace personnel avec accès aux historiques.</li>
      </ul>

      {/* Section 4 */}
      <h2 id="syndic-professionnel-vs-logiciel" className={h2}>Logiciel dédié vs syndic professionnel&nbsp;: la comparaison des coûts</h2>
      <p className={p}>
        Un syndic professionnel facture en moyenne <strong className={strong}>entre 150 et 250&nbsp;€ par lot et par an</strong> pour une gestion de base — soit 1&nbsp;500 à 2&nbsp;500&nbsp;€ pour une copropriété de 10 lots. Ce tarif exclut souvent les frais annexes&nbsp;: mise en demeure, état daté, interventions urgentes.
      </p>
      <p className={p}>
        Un logiciel comme Mon Syndic Bénévole coûte moins de 25&nbsp;€/mois pour l&apos;ensemble de la copropriété, quel que soit le nombre de lots. La différence est restituée directement aux copropriétaires sous forme de charges moins élevées.
      </p>

      {/* Section 5 */}
      <h2 id="criteres-de-choix" className={h2}>Les critères qui font vraiment la différence</h2>
      <p className={p}>
        Au-delà des fonctionnalités, voici les points souvent négligés lors du choix d&apos;un logiciel&nbsp;:
      </p>

      <h3 className={h3}>Le temps de mise en route</h3>
      <p className={p}>
        Si l&apos;outil demande plusieurs jours de configuration ou une formation, vous ne reviendrez jamais dessus après la première friction. Cherchez un outil qui vous permet d&apos;émettre votre premier appel de fonds dans l&apos;heure suivant votre inscription.
      </p>

      <h3 className={h3}>La conformité légale</h3>
      <p className={p}>
        L&apos;outil doit être conforme aux obligations de la loi de 1965, du décret de 1967 et de la loi ALUR. En pratique&nbsp;: calcul des tantièmes par catégorie, fonds de travaux séparé, documents conformes aux modèles légaux.
      </p>

      <h3 className={h3}>L&apos;accompagnement</h3>
      <p className={p}>
        Un syndic bénévole n&apos;est pas un expert. Un bon logiciel intègre des guides, des modèles et un support réactif — pas uniquement une base de connaissances impossible à naviguer à 22 h la veille d&apos;une AG.
      </p>

      {/* FAQ */}
      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>À partir de combien de lots est-il utile d&apos;avoir un logiciel&nbsp;?</h3>
      <p className={p}>Dès le deuxième lot. Même une petite copropriété de 3 ou 4 lots a besoin d&apos;un suivi rigoureux des appels de fonds, des paiements et des AG. Le temps gagné justifie le coût dès la première année.</p>

      <h3 className={h3}>Un logiciel de syndic bénévole est-il conforme à la loi ALUR&nbsp;?</h3>
      <p className={p}>Cela dépend du logiciel. Mon Syndic Bénévole intègre la gestion du fonds de travaux obligatoire sur compte séparé, la comptabilité en parties doubles pour les copropriétés de plus de 10 lots, et les modèles de documents conformes aux obligations légales.</p>

      <h3 className={h3}>Peut-on migrer depuis Excel sans tout ressaisir&nbsp;?</h3>
      <p className={p}>La migration minimale — liste des copropriétaires, lots, tantièmes et budget — prend 15 à 45 minutes selon la taille de la copropriété. L&apos;historique complet des années précédentes peut rester dans Excel sans impact sur l&apos;outil.</p>

      <h3 className={h3}>Est-ce que les copropriétaires doivent aussi créer un compte&nbsp;?</h3>
      <p className={p}>Ils peuvent. Mon Syndic Bénévole permet au syndic d&apos;inviter chaque copropriétaire à accéder à son espace personnel pour consulter ses documents. Ce n&apos;est pas obligatoire — le syndic peut aussi gérer tout seul et envoyer les documents par e-mail.</p>

      {/* Conclusion */}
      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Un logiciel de syndic bénévole n&apos;est pas un luxe. C&apos;est la condition pour exercer ce mandat sereinement, sans risquer des erreurs de calcul, des délais manqués ou une comptabilité impossible à présenter en AG.
      </p>
      <p className={p}>
        Le bon outil doit être opérationnel en moins d&apos;une heure, conforme aux obligations légales, et assez simple pour ne jamais devenir une charge supplémentaire.
      </p>
      <p className={p}>
        <strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur les <a href="/blog/obligations-syndic-benevole" className={a}>obligations légales du syndic bénévole</a> ou sur la <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>gestion d&apos;une copropriété sans syndic professionnel</a>.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-2">Prêt à remplacer vos tableurs&nbsp;?</p>
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
