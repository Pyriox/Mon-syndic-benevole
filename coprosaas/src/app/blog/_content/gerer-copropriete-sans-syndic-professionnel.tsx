// ============================================================
// Article : Gérer une copropriété sans syndic professionnel
// ============================================================

import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleGererCopropriete() {
  return (
    <>
      <p className={p}>
        Quand on évoque le mot &ldquo;syndic&rdquo;, la première image qui vient à l&apos;esprit, c&apos;est souvent celle d&apos;un cabinet qui répond au téléphone une fois sur trois et facture 3&nbsp;000&nbsp;€ par an pour gérer un immeuble de douze appartements. Résultat : de nombreux copropriétaires se demandent si la gestion en autonomie ne serait pas simplement… plus sensée.
      </p>
      <p className={p}>
        La réponse courte : oui, c&apos;est tout à fait possible. Et c&apos;est même très répandu.
      </p>
      <p className={p}>La réponse longue, c&apos;est cet article.</p>

      {/* Section 1 */}
      <h2 className={h2}>Ce que dit la loi (et ce qu&apos;elle ne dit pas)</h2>
      <p className={p}>
        Contrairement à ce que beaucoup croient, la loi du 10 juillet 1965 sur la copropriété{' '}
        <strong className={strong}>n&apos;impose pas de recourir à un syndic professionnel</strong>. Elle impose l&apos;existence d&apos;un syndic — personne physique ou morale — désigné par l&apos;assemblée générale. Ce syndic peut très bien être l&apos;un des copropriétaires lui-même.
      </p>
      <p className={p}>
        C&apos;est ce qu&apos;on appelle le <strong className={strong}>syndic non professionnel</strong>, ou plus communément le <strong className={strong}>syndic bénévole</strong>.
      </p>
      <p className={p}>Il n&apos;a pas besoin de carte professionnelle, pas d&apos;assurance spécifique obligatoire, pas de formation certifiante. Il doit simplement :</p>
      <ul className={ul}>
        <li className={li}>avoir été élu lors d&apos;une assemblée générale (résolution à la majorité absolue, article 25),</li>
        <li className={li}>être titulaire d&apos;un mandat avec une durée définie (en général un an, renouvelable),</li>
        <li className={li}>ouvrir un compte bancaire séparé au nom du syndicat des copropriétaires.</li>
      </ul>
      <p className={p}>C&apos;est tout. Le reste — organisation, outils, délégation de certaines tâches — est laissé à la libre appréciation du syndicat.</p>

      {/* Section 2 */}
      <h2 className={h2}>Qui choisit vraiment le syndic bénévole ?</h2>
      <p className={p}>
        En France, <strong className={strong}>plus de 40&nbsp;% des copropriétés sont gérées sans syndic professionnel</strong>, selon les estimations du ministère du Logement. Ce chiffre grimpe fortement pour les petites structures : dans les immeubles de moins de dix lots, la majorité fonctionne en auto-gestion.
      </p>
      <p className={p}>
        Les profils sont variés : un retraité qui a du temps et de la rigueur, un comptable de profession qui trouve ça logique, un propriétaire-bailleur qui préfère avoir la main sur les dépenses, ou parfois simplement le seul volontaire quand personne d&apos;autre ne se propose.
      </p>
      <p className={p}>Ce n&apos;est donc pas un cas marginal. C&apos;est une pratique normale, encadrée, et pour beaucoup d&apos;immeubles : la plus adaptée.</p>

      {/* Section 3 */}
      <h2 className={h2}>Les vraies responsabilités du syndic bénévole</h2>
      <p className={p}>Avant de se lancer, il est utile de savoir concrètement ce que ça implique. Le syndic bénévole a les mêmes obligations légales qu&apos;un syndic professionnel. Il doit :</p>

      <h3 className={h3}>Sur le plan administratif</h3>
      <ul className={ul}>
        <li className={li}>Convoquer et organiser l&apos;assemblée générale annuelle (et les AG extraordinaires si nécessaire)</li>
        <li className={li}>Rédiger et diffuser les procès-verbaux dans un délai d&apos;un mois</li>
        <li className={li}>Tenir à jour le carnet d&apos;entretien de l&apos;immeuble</li>
        <li className={li}>Archiver les contrats, assurances et documents légaux</li>
      </ul>

      <h3 className={h3}>Sur le plan financier</h3>
      <ul className={ul}>
        <li className={li}>Établir le budget prévisionnel et le soumettre au vote</li>
        <li className={li}><a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>Appeler les charges trimestrielles auprès des copropriétaires</a> (appels de fonds provisionnels)</li>
        <li className={li}>Tenir une comptabilité claire (en partie double pour les copropriétés de plus de 10 lots)</li>
        <li className={li}>Gérer le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> (obligatoire depuis 2017 pour les copropriétés de 10 lots et plus)</li>
      </ul>

      <h3 className={h3}>Sur le plan opérationnel</h3>
      <ul className={ul}>
        <li className={li}>Assurer l&apos;entretien courant des parties communes</li>
        <li className={li}>Gérer les contrats avec les prestataires (nettoyage, ascenseur, espaces verts…)</li>
        <li className={li}>Déclarer et suivre les sinistres auprès de l&apos;assurance</li>
        <li className={li}>Répondre aux sollicitations des copropriétaires et des résidents</li>
      </ul>

      <p className={p}>C&apos;est du boulot — soyons honnêtes. Mais c&apos;est un travail gérable, notamment parce que dans un petit immeuble, il ne se passe pas grand-chose la plupart du temps.</p>

      {/* Section 4 */}
      <h2 className={h2}>Pourquoi autant de syndics bénévoles se perdent en cours de route</h2>
      <p className={p}>La plupart des abandons ne tiennent pas à la complexité des tâches elles-mêmes, mais à <strong className={strong}>l&apos;absence d&apos;organisation</strong>.</p>
      <p className={p}>On accepte le rôle avec les meilleures intentions, et puis :</p>
      <ul className={ul}>
        <li className={li}>Les documents s&apos;accumulent dans un dossier &ldquo;Copro&rdquo; sur le bureau qui grossit sans jamais être rangé.</li>
        <li className={li}>Les appels de charges se font à la main dans un tableau Excel qui &ldquo;marche bien pour l&apos;instant&rdquo;.</li>
        <li className={li}>Le PV de la dernière AG est quelque part dans les mails, on n&apos;est pas sûr du compte exact.</li>
        <li className={li}>Un copropriétaire réclame sa quote-part des dépenses et on passe deux heures à reconstituer les chiffres.</li>
      </ul>
      <p className={p}>
        Ce n&apos;est pas une question de compétence. C&apos;est une question d&apos;outillage. Un syndic professionnel, lui, a des logiciels dédiés, des assistants, des procédures rodées. Le syndic bénévole, historiquement, gérait ça avec des fichiers éparpillés.
      </p>
      <p className={p}>
        C&apos;est précisément ce que des outils comme{' '}
        <a href="https://mon-syndic-benevole.fr" className={a}>Mon Syndic Bénévole</a>{' '}
        cherchent à corriger : centraliser la gestion de copropriété (charges, appels de fonds, AG, documents, incidents) dans un espace simple, sans nécessiter le moindre background en comptabilité.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <p className="text-blue-800 font-semibold mb-3">Ce que Mon Syndic Bénévole centralise pour vous</p>
        <ul className="space-y-2">
          {[
            'Appels de fonds trimestriels calculés automatiquement selon les tantièmes de chaque lot.',
            'Assemblées générales : convocations, votes, procès-verbaux et feuilles de présence en PDF.',
            'GED documents : PV, factures et contrats par dossier, accessibles à tout moment.',
            'Suivi des incidents et travaux : de la déclaration à la résolution.',
            'Tableau de bord temps réel : trésorerie, dépenses, impayés et prochaine AG.',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 shrink-0" />
              {item}
            </li>
          ))}
        </ul>
        <a
          href="https://mon-syndic-benevole.fr/register"
          className="inline-block mt-5 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Essayer gratuitement — 30 jours offerts →
        </a>
      </div>

      {/* Section 5 */}
      <h2 className={h2}>Les avantages concrets d&apos;une gestion sans cabinet</h2>

      <h3 className={h3}>1. L&apos;économie, d&apos;abord</h3>
      <p className={p}>
        Un syndic professionnel facture en moyenne entre <strong className={strong}>150 et 300&nbsp;€ par lot et par an</strong>, auxquels s&apos;ajoutent des honoraires supplémentaires pour chaque AG tenue, chaque lettre recommandée, chaque &ldquo;prestation particulière&rdquo;. Sur un immeuble de quinze lots, ça représente facilement{' '}
        <strong className={strong}>3&nbsp;000 à 5&nbsp;000&nbsp;€ annuels</strong>.
      </p>
      <p className={p}>Une gestion bénévole ramène ce coût à quelques dizaines d&apos;euros par mois au maximum (outils, assurance optionnelle). L&apos;économie est immédiate et directe.</p>

      <h3 className={h3}>2. La réactivité</h3>
      <p className={p}>
        Quand une infiltration apparaît au plafond du couloir commun un vendredi soir, le syndic bénévole — qui vit souvent dans l&apos;immeuble ou à proximité — peut prendre une décision en quelques minutes. Pas de ticket de support, pas d&apos;attente du retour de congés.
      </p>

      <h3 className={h3}>3. La transparence</h3>
      <p className={p}>
        Un copropriétaire qui gère lui-même l&apos;immeuble a une connaissance intime de chaque dépense, de chaque contrat, de chaque décision. Il n&apos;y a pas de &ldquo;boîte noire&rdquo;. Les autres copropriétaires peuvent demander des comptes directement, sans intermédiaire.
      </p>

      <h3 className={h3}>4. L&apos;implication collective</h3>
      <p className={p}>
        Quand la gestion est partagée et visible, les copropriétaires s&apos;y intéressent davantage. On vote mieux lors des AG, on signale les problèmes plus tôt, on paie plus régulièrement ses charges. C&apos;est un cercle vertueux que les gestionnaires professionnels peinent souvent à créer.
      </p>

      {/* Section 6 */}
      <h2 className={h2}>Les situations où un professionnel reste plus adapté</h2>
      <p className={p}>Ce serait partial de prétendre que le syndic bénévole convient à tout le monde. Il y a des cas où faire appel à un cabinet reste judicieux :</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Grande copropriété (50 lots et plus)</strong> : le volume de travail et la complexité comptable justifient souvent un professionnel à plein temps.</li>
        <li className={li}><strong className={strong}>Conflits intenses entre copropriétaires</strong> : un tiers neutre peut désamorcer des situations où un bénévole serait pris en étau.</li>
        <li className={li}><strong className={strong}>Immeuble en mauvais état nécessitant des travaux lourds</strong> : la coordination de grands chantiers demande de l&apos;expérience.</li>
        <li className={li}><strong className={strong}>Syndic bénévole sans disponibilité réelle</strong> : un bénévole débordé qui ne convoque pas l&apos;AG dans les délais expose la copropriété à des recours.</li>
      </ul>
      <p className={p}>La bonne question à se poser n&apos;est pas &ldquo;professionnel ou bénévole ?&rdquo; mais <strong className={strong}>&ldquo;quel niveau de charge de gestion représente mon immeuble, et ai-je les ressources pour l&apos;assumer correctement ?&rdquo;</strong></p>

      {/* Section 7 */}
      <h2 className={h2}>Comment passer d&apos;un syndic professionnel à un syndic bénévole</h2>
      <p className={p}>La transition est plus simple qu&apos;on ne le pense, mais elle demande un minimum de méthode.</p>
      <ol className={ol}>
        <li className={li}><strong className={strong}>Décider en AG.</strong> La résolution de changement de syndic doit être inscrite à l&apos;ordre du jour. L&apos;élection du nouveau syndic se fait à la majorité de l&apos;article 25.</li>
        <li className={li}><strong className={strong}>Récupérer les archives.</strong> L&apos;ancien syndic a 15 jours après la fin de son mandat pour remettre l&apos;intégralité des documents. Ne laissez rien traîner — certains cabinets font traîner volontairement.</li>
        <li className={li}><strong className={strong}>Ouvrir le compte séparé.</strong> C&apos;est une obligation légale. Le compte doit être au nom du syndicat des copropriétaires, pas du syndic bénévole lui-même.</li>
        <li className={li}><strong className={strong}>S&apos;équiper.</strong> Un tableur peut suffire pour un immeuble de 4 lots. Au-delà, un outil dédié évite les erreurs et les trous de mémoire.</li>
        <li className={li}><strong className={strong}>Informer les résidents et prestataires.</strong> Les prestataires ont besoin d&apos;un nouveau contact. Les résidents locataires ont besoin de savoir à qui s&apos;adresser.</li>
      </ol>

      {/* Section 8 */}
      <h2 className={h2}>Ce que les copropriétaires sous-estiment souvent : le temps</h2>
      <p className={p}>L&apos;objection la plus courante contre le syndic bénévole est : &ldquo;mais qui va avoir le temps ?&rdquo;</p>
      <p className={p}>
        En pratique, pour un immeuble de taille raisonnable (5 à 20 lots), le temps réel consacré à la gestion courante se situe entre <strong className={strong}>2 et 5 heures par mois</strong> hors préparation d&apos;AG. La préparation d&apos;une AG annuelle représente 4 à 8 heures supplémentaires.
      </p>
      <p className={p}>Ce n&apos;est pas anodin, mais c&apos;est loin du temps plein que certains imaginent. Et c&apos;est un temps qui peut être réparti — l&apos;un prend en charge les finances, l&apos;autre les relations prestataires, un troisième l&apos;archivage.</p>
      <p className={p}>La copropriété, au fond, c&apos;est une petite entreprise collective. Comme dans toute structure collective, la clé est la répartition des rôles et la clarté des processus.</p>

      {/* FAQ */}
      <h2 className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Le syndic bénévole est-il responsable en cas de problème ?</h3>
      <p className={p}>Oui, comme tout mandataire, il engage sa responsabilité civile. Il est donc prudent de vérifier que son assurance habitation ou une assurance de protection juridique couvre cette activité. Un contrat de mandat clair, voté en AG, est également recommandé.</p>

      <h3 className={h3}>Un syndic bénévole peut-il être rémunéré ?</h3>
      <p className={p}>Oui, l&apos;AG peut voter une rémunération forfaitaire ou des défraiements. Il n&apos;y a aucune obligation de travailler gratuitement.</p>

      <h3 className={h3}>Peut-on avoir un syndic bénévole dans une copropriété avec beaucoup d&apos;impayés ?</h3>
      <p className={p}>C&apos;est possible mais plus délicat. La gestion des impayés nécessite de connaître les procédures de mise en demeure et, si nécessaire, de saisine du tribunal. Des outils et des associations de copropriétaires peuvent aider.</p>

      <h3 className={h3}>Et si personne ne veut endosser le rôle ?</h3>
      <p className={p}>Si aucun syndic n&apos;est élu lors de l&apos;AG, n&apos;importe quel copropriétaire peut saisir le tribunal judiciaire pour faire désigner un administrateur provisoire. Ce n&apos;est jamais une situation idéale — mieux vaut anticiper la passation de pouvoir.</p>

      {/* Conclusion */}
      <h2 className={h2}>En résumé</h2>
      <p className={p}>
        Gérer sa copropriété sans syndic professionnel, c&apos;est légal, courant, et souvent très judicieux pour les immeubles de taille moyenne à petite. Les obstacles réels sont moins la compétence que l&apos;organisation et les outils.
      </p>
      <p className={p}>Si vous lisez cet article en vous demandant si vous avez les épaules pour assumer ce rôle : dans la très grande majorité des cas, la réponse est oui. Ce qu&apos;il vous faut, c&apos;est un cadre clair, des outils adaptés, et une copropriété qui joue le jeu collectivement.</p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>le calcul et la répartition des appels de fonds</a> ou les <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>obligations liées au fonds de travaux ALUR</a>.</p>
    </>
  );
}
