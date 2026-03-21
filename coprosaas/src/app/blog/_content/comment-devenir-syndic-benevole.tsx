// ============================================================
// Article : Comment devenir syndic bénévole
// Target KW : "comment devenir syndic bénévole"
// Silo : SILO 1 — Devenir syndic bénévole
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleCommentDevenirSyndicBenevole() {
  return (
    <>
      <p className={p}>
        L&apos;assemblée générale est terminée. Le cabinet professionnel a été remercié — trop cher, pas réactif. Il faut un syndic. Une main se lève. La vôtre, peut-être. Et aussitôt la question qui suit&nbsp;: <strong className={strong}>par où on commence&nbsp;?</strong>
      </p>
      <p className={p}>
        Bonne nouvelle&nbsp;: devenir syndic bénévole ne nécessite ni diplôme, ni agrément, ni formation certifiante. Ce qui compte, c&apos;est la méthode. Ce guide décrit les étapes dans l&apos;ordre où vous allez les rencontrer.
      </p>

      {/* Section 1 */}
      <h2 id="conditions-legales" className={h2}>Qui peut devenir syndic bénévole&nbsp;? Ce que dit la loi</h2>
      <p className={p}>
        La loi du 10 juillet 1965 impose l&apos;existence d&apos;un syndic dans toute copropriété, mais elle n&apos;exige pas qu&apos;il soit professionnel. Un simple copropriétaire peut exercer ce rôle. Les seules conditions légales sont&nbsp;:
      </p>
      <ul className={ul}>
        <li className={li}>Être copropriétaire de l&apos;immeuble (ou son conjoint / partenaire de PACS),</li>
        <li className={li}>Avoir été élu en assemblée générale à la majorité de l&apos;article 25 (majorité absolue des voix de tous les copropriétaires),</li>
        <li className={li}>Disposer d&apos;un mandat dont la durée est fixée par l&apos;AG (en général un à trois ans).</li>
      </ul>
      <p className={p}>
        Pas de carte professionnelle, pas d&apos;assurance obligatoire spécifique, pas de formation requise. En revanche, il est fortement conseillé de vérifier que votre assurance habitation couvre la <strong className={strong}>responsabilité civile du mandataire</strong> — certaines polices l&apos;incluent, d&apos;autres non.
      </p>
      <p className={p}>
        Rappel de contexte&nbsp;: plus de 40&nbsp;% des copropriétés françaises sont gérées sans cabinet professionnel, selon les données du ministère du Logement. C&apos;est une pratique normale, légale, et souvent la plus adaptée pour les immeubles de moins de 30 lots.
      </p>

      {/* Section 2 */}
      <h2 id="election-ag" className={h2}>L&apos;élection en AG&nbsp;: comment ça se passe et ce qu&apos;il ne faut pas rater</h2>
      <p className={p}>
        L&apos;élection doit figurer à l&apos;ordre du jour de l&apos;AG. Un candidat &ldquo;surprise&rdquo; le jour même expose la décision à contestation. La bonne pratique est de mentionner sa candidature dans la convocation ou de la signaler par écrit au président du conseil syndical avant l&apos;envoi.
      </p>
      <p className={p}>Points clés à retenir sur le vote&nbsp;:</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Majorité requise&nbsp;:</strong> article 25 — majorité absolue de tous les copropriétaires, présents, représentés ou absents. Si cette majorité n&apos;est pas atteinte mais que le candidat recueille plus du tiers des voix, un second vote à la majorité simple peut être organisé immédiatement.</li>
        <li className={li}><strong className={strong}>Durée du mandat&nbsp;:</strong> fixée dans la résolution. Un an est le standard recommandé pour un premier mandat — cela laisse une porte de sortie si ça ne convient pas.</li>
        <li className={li}><strong className={strong}>Le PV d&apos;élection&nbsp;:</strong> conservez-en plusieurs originaux. Vous en aurez besoin pour ouvrir le compte bancaire du syndicat et pour prouver votre qualité de syndic aux prestataires.</li>
      </ul>

      {/* Section 3 */}
      <h2 id="30-premiers-jours" className={h2}>Les 30 premiers jours&nbsp;: 5 démarches obligatoires</h2>

      <h3 className={h3}>1. Récupérer les archives de l&apos;ancien syndic (délai légal&nbsp;: 15 jours)</h3>
      <p className={p}>
        L&apos;ancien syndic est légalement tenu de vous remettre l&apos;intégralité des documents dans les 15 jours suivant la fin de son mandat. Ne laissez rien traîner&nbsp;: certains cabinets font volontairement durer le transfert. Une mise en demeure par recommandé peut être envoyée dès le 16e jour.
      </p>
      <p className={p}>La liste de ce que vous devez récupérer&nbsp;:</p>
      <ul className={ul}>
        <li className={li}>Règlement de copropriété + état descriptif de division</li>
        <li className={li}>Procès-verbaux des AG (au moins les 10 dernières années)</li>
        <li className={li}>Contrats en cours (assurance MRI, ascenseur, entretien, etc.)</li>
        <li className={li}>Comptes de l&apos;exercice précédent et état des impayés par copropriétaire</li>
        <li className={li}>Carnet d&apos;entretien de l&apos;immeuble</li>
        <li className={li}>Relevés bancaires du compte courant + compte fonds de travaux</li>
      </ul>

      <h3 className={h3}>2. Ouvrir le compte bancaire séparé</h3>
      <p className={p}>
        <strong className={strong}>Obligation légale absolue&nbsp;:</strong> le compte doit être au nom du <em>syndicat des copropriétaires</em>, pas en votre nom propre. Apportez le PV d&apos;élection à la banque&nbsp;: c&apos;est le document officiel qui vous autorise à agir.
      </p>
      <p className={p}>
        Si votre copropriété comporte plus de 10 lots, vous avez également besoin d&apos;un <strong className={strong}>second compte séparé pour le fonds de travaux ALUR</strong>. Ces sommes ne peuvent pas être mélangées avec la trésorerie courante — voir notre guide sur le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a>.
      </p>

      <h3 className={h3}>3. Informer les prestataires et les créanciers</h3>
      <p className={p}>
        Impact immédiat&nbsp;: chaque prestataire doit connaître le nouveau contact syndic pour les factures, les urgences et les renouvellements. Envoyez une lettre officielle (recommandé ou e-mail avec accusé) mentionnant votre nom, vos coordonnées et le numéro du nouveau compte bancaire pour les remboursements.
      </p>

      <h3 className={h3}>4. Constituer ou vérifier le registre des copropriétaires</h3>
      <p className={p}>
        Vous avez besoin d&apos;un annuaire complet&nbsp;: nom, adresse postale, e-mail, lot(s) et tantièmes de chaque copropriétaire. C&apos;est la base pour les convocations d&apos;AG, les appels de fonds et les relances. Si l&apos;ancien syndic ne vous a pas transmis de fichier à jour, vous devrez le reconstruire.
      </p>

      <h3 className={h3}>5. Identifier les contrats à renouveler dans les 3 prochains mois</h3>
      <p className={p}>
        L&apos;assurance multirisques immeuble (MRI) et les contrats de maintenance se renouvellent souvent tacitement. Un contrat oublié peut se reconductre pour un an à des conditions défavorables. Listez les échéances dans les 90 jours et prenez les décisions qui s&apos;imposent.
      </p>

      {/* Inline CTA */}
      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Vous venez d&apos;être élu syndic bénévole&nbsp;?</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole vous guide dès le premier jour&nbsp;: création guidée de votre copropriété, annuaire des copropriétaires, appels de fonds automatiques. Prêt en moins de 5 minutes, sans formation requise.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer ma copropriété gratuitement →
        </Link>
      </div>

      {/* Section 4 */}
      <h2 id="obligations-recurrentes" className={h2}>Les obligations récurrentes une fois en poste</h2>
      <p className={p}>
        Le syndic bénévole a les mêmes obligations légales qu&apos;un cabinet professionnel — avec la même responsabilité civile. Voici le calendrier des principales tâches&nbsp;:
      </p>

      <h3 className={h3}>Chaque trimestre</h3>
      <ul className={ul}>
        <li className={li}>Émettre les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds provisionnels</a> à date fixe</li>
        <li className={li}>Suivre les paiements et relancer les retardataires</li>
        <li className={li}>Enregistrer les dépenses et les rattacher aux catégories de charges</li>
      </ul>

      <h3 className={h3}>Chaque année</h3>
      <ul className={ul}>
        <li className={li}>Convoquer l&apos;AG ordinaire avec au moins 21 jours de préavis</li>
        <li className={li}>Présenter les comptes de l&apos;exercice clôturé et le budget prévisionnel</li>
        <li className={li}>Envoyer le procès-verbal dans le mois suivant l&apos;AG</li>
        <li className={li}>Voter le montant du fonds de travaux ALUR (si la copropriété est concernée)</li>
        <li className={li}>Renouveler ou renégocier les contrats arrivant à échéance</li>
      </ul>

      <h3 className={h3}>Dès qu&apos;un événement survient</h3>
      <ul className={ul}>
        <li className={li}>Déclarer les sinistres à l&apos;assurance dans les délais contractuels (souvent 5 jours ouvrés)</li>
        <li className={li}>Mettre en demeure les copropriétaires en retard de paiement au-delà de 90 jours</li>
        <li className={li}>Convoquer une AG extraordinaire si une décision urgente ne peut attendre l&apos;AG annuelle</li>
      </ul>

      {/* Section 5 */}
      <h2 id="erreurs-debut" className={h2}>Les 3 erreurs classiques en début de mandat</h2>

      <h3 className={h3}>Erreur 1 — Ne pas formaliser le mandat par écrit</h3>
      <p className={p}>
        Le PV d&apos;élection suffit légalement, mais un <strong className={strong}>contrat de mandat complémentaire</strong> — durée, périmètre exact, conditions de rémunération éventuelle — prévient les malentendus. Les conflits en copropriété naissent souvent d&apos;attentes imprécises.
      </p>

      <h3 className={h3}>Erreur 2 — Gérer les finances dans un fichier Excel</h3>
      <p className={p}>
        Un tableur tient six mois, parfois un an. Il montre rapidement ses limites&nbsp;: pas de génération automatique de PDF, impossible de partager les comptes en temps réel, aucune traçabilité des relances. La migration vers un outil dédié, faite trop tard, est toujours laborieuse. Mieux vaut partir du bon pied.
      </p>

      <h3 className={h3}>Erreur 3 — Oublier le délai de convocation de l&apos;AG</h3>
      <p className={p}>
        <strong className={strong}>21 jours minimum</strong> entre l&apos;envoi des convocations et la date de l&apos;AG&nbsp;: c&apos;est la loi, et ce n&apos;est pas un délai indicatif. Une AG convoquée trop tardivement peut être annulée sur recours d&apos;un copropriétaire. Posez une alerte dès votre prise de fonction.
      </p>

      {/* FAQ */}
      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Faut-il une formation pour devenir syndic bénévole&nbsp;?</h3>
      <p className={p}>Non. Aucune formation certifiante n&apos;est requise par la loi. Des associations de copropriétaires (ARC, UNARC) proposent des formations pratiques utiles pour les débutants, mais elles ne sont pas obligatoires.</p>

      <h3 className={h3}>Un syndic bénévole peut-il être rémunéré&nbsp;?</h3>
      <p className={p}>Oui. L&apos;AG peut voter une rémunération forfaitaire ou des défraiements. Il n&apos;y a aucune obligation légale de travailler gratuitement. Mais la plupart des syndics bénévoles opèrent à titre gratuit, en contrepartie des économies générées pour la copropriété.</p>

      <h3 className={h3}>Que se passe-t-il si personne ne veut être syndic&nbsp;?</h3>
      <p className={p}>Si aucun syndic n&apos;est élu lors de l&apos;AG, tout copropriétaire peut saisir le tribunal judiciaire pour faire désigner un administrateur provisoire — généralement un professionnel, aux frais de la copropriété. Ce n&apos;est pas une situation idéale. Il vaut mieux anticiper la passation.</p>

      <h3 className={h3}>Combien de temps prend la gestion au quotidien&nbsp;?</h3>
      <p className={p}>Pour un immeuble de 5 à 20 lots, entre <strong className={strong}>2 et 5 heures par mois</strong> en moyenne (hors préparation d&apos;AG). La préparation d&apos;une AG annuelle représente 4 à 8 heures supplémentaires. Avec un outil adapté, ce temps peut être divisé par deux.</p>

      <h3 className={h3}>Le syndic bénévole peut-il déléguer des missions&nbsp;?</h3>
      <p className={p}>Oui. Il peut s&apos;appuyer sur d&apos;autres copropriétaires ou des intervenants ponctuels pour des tâches spécifiques (comptabilité, coordination de travaux). La responsabilité légale reste sur le syndic désigné par l&apos;AG.</p>

      {/* Conclusion */}
      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Devenir syndic bénévole, c&apos;est accessible à n&apos;importe quel copropriétaire motivé. Les conditions légales sont minimes. Ce qui fait la différence, c&apos;est la méthode&nbsp;: bien récupérer les archives, ouvrir les bons comptes, notifier les prestataires — et s&apos;équiper d&apos;un outil qui gère les flux récurrents sans se perdre dans des tableurs.
      </p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide complet sur les <a href="/blog/obligations-syndic-benevole" className={a}>obligations légales du syndic bénévole</a> ou sur le <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>calcul des appels de fonds</a>.</p>
    </>
  );
}
