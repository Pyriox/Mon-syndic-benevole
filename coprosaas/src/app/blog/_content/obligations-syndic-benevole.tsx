// ============================================================
// Article : Obligations du syndic bénévole — calendrier et templates
// Target KW : "obligations syndic bénévole", "responsabilité syndic bénévole"
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleObligationsSyndicBenevole() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        Juin 2023. Christophe, syndic bénévole d&apos;une résidence de 9 lots à Nantes, reçoit une mise en demeure d&apos;un copropriétaire. Motif : l&apos;assemblée générale a été convoquée 18 jours avant la réunion, au lieu des 21 jours légaux. Deux résolutions votées lors de cette AG sont potentiellement annulables. Travaux de ravalement déjà engagés pour 28 000 €.
      </p>
      <p className={p}>
        Christophe n&apos;était pas négligent — il ne savait simplement pas. La gestion bénévole est gratuite pour la copropriété, mais elle n&apos;est pas exempte d&apos;obligations. Ce guide les répertorie toutes, avec les dates qui comptent.
      </p>

      <h2 id="cadre-legal" className={h2}>Le cadre légal du syndic bénévole</h2>
      <p className={p}>
        Le syndic non-professionnel exerce dans le cadre de la <strong className={strong}>loi du 10 juillet 1965</strong> et du <strong className={strong}>décret du 17 mars 1967</strong>. Ces textes s&apos;appliquent à tous les syndics, qu&apos;ils soient professionnels ou bénévoles. Il n&apos;existe pas de régime allégé pour les bénévoles — les mêmes obligations s&apos;appliquent, les mêmes délais, les mêmes documents.
      </p>
      <p className={p}>
        La seule différence : le syndic bénévole n&apos;est pas soumis à la loi Hoguet (licence professionnelle, assurance RCP obligatoire). Il doit en revanche être copropriétaire de l&apos;immeuble concerné.
      </p>

      <div className="my-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-gray-700">
        <p className="font-semibold text-amber-800 mb-2">Responsabilité personnelle</p>
        <p>Le syndic bénévole peut être tenu responsable de ses fautes dans l&apos;exercice de son mandat (gestion de fonds, décisions prises sans AG, délais manqués). Sa responsabilité civile personnelle peut être engagée si le syndicat des copropriétaires subit un préjudice.</p>
      </div>

      <h2 id="calendrier-annuel" className={h2}>Le calendrier complet des obligations annuelles</h2>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Délai / Date</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Obligation</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Base légale</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">J-21 avant AG</td>
              <td className="py-3 px-4 text-gray-700">Envoi de la convocation + ordre du jour + documents annexes</td>
              <td className="py-3 px-4 text-gray-500">Art. 9 décret 1967</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800">Avant l&apos;AG</td>
              <td className="py-3 px-4 text-gray-700">Mise à disposition du projet de résolutions et des comptes</td>
              <td className="py-3 px-4 text-gray-500">Art. 11 décret 1967</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">J+1 mois après AG</td>
              <td className="py-3 px-4 text-gray-700">Notification du PV à tous les copropriétaires</td>
              <td className="py-3 px-4 text-gray-500">Art. 17 décret 1967</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800">J+2 mois après AG</td>
              <td className="py-3 px-4 text-gray-700">Mise en œuvre des décisions votées</td>
              <td className="py-3 px-4 text-gray-500">Art. 18 loi 1965</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">Trimestriellement</td>
              <td className="py-3 px-4 text-gray-700">Émission des <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds</a> sur budget voté</td>
              <td className="py-3 px-4 text-gray-500">Art. 14-1 loi 1965</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800">Annuellement (AG)</td>
              <td className="py-3 px-4 text-gray-700">Vote du budget prévisionnel, approbation des comptes N-1</td>
              <td className="py-3 px-4 text-gray-500">Art. 14-1 loi 1965</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">Annuellement (AG)</td>
              <td className="py-3 px-4 text-gray-700">Vote de la cotisation au <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux</a> (min. 5 % budget)</td>
              <td className="py-3 px-4 text-gray-500">Art. 14-2 loi 1965</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800">Annuellement</td>
              <td className="py-3 px-4 text-gray-700">Mise à jour de la fiche synthétique de la copropriété (immatriculation)</td>
              <td className="py-3 px-4 text-gray-500">Art. 711-4 CCH</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">Lors de toute vente</td>
              <td className="py-3 px-4 text-gray-700">Fourniture de l&apos;état daté (situation comptable du lot vendu)</td>
              <td className="py-3 px-4 text-gray-500">Art. 5 décret 1967</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 font-medium text-gray-800">En permanence</td>
              <td className="py-3 px-4 text-gray-700">Tenue du carnet d&apos;entretien de l&apos;immeuble</td>
              <td className="py-3 px-4 text-gray-500">Art. 18 loi 1965</td>
            </tr>
            <tr>
              <td className="py-3 px-4 font-medium text-gray-800">En permanence</td>
              <td className="py-3 px-4 text-gray-700">Conservation en compte séparé du fonds de travaux</td>
              <td className="py-3 px-4 text-gray-500">Art. 14-2 loi 1965</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Ces 11 échéances, gérées automatiquement</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole calcule vos dates critiques et vous alerte avant chaque échéance — J-21 AG, notification PV, appels de fonds trimestriels. Zéro délai manqué.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </Link>
      </div>

      <h2 id="convocation-ag" className={h2}>Template : convocation d&apos;AG conforme</h2>
      <p className={p}>
        La convocation doit être envoyée par <strong className={strong}>lettre recommandée avec accusé de réception</strong> (LRAR) ou par tout autre moyen permettant de justifier la date de remise (remise en main propre avec émargement, voie électronique avec accord préalable écrit des copropriétaires concernés).
      </p>

      <div className="my-6 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 font-mono leading-relaxed">
        <p className="font-sans font-semibold text-gray-800 mb-3">Modèle de convocation AG ordinaire</p>
        <p className="mb-2">[Ville], le [date]</p>
        <p className="mb-4">Lettre Recommandée avec Accusé de Réception</p>
        <p className="mb-2">Objet : Convocation à l&apos;Assemblée Générale ordinaire de la copropriété [adresse]</p>
        <p className="mb-4">Monsieur / Madame,</p>
        <p className="mb-4">
          En ma qualité de syndic non-professionnel bénévole de la copropriété [adresse], j&apos;ai l&apos;honneur de vous convoquer à l&apos;Assemblée Générale ordinaire du syndicat des copropriétaires qui se tiendra le :<br />
          <strong>[Jour] [date] à [heure]</strong><br />
          [Adresse de la réunion]
        </p>
        <p className="mb-2">L&apos;ordre du jour de cette assemblée est le suivant :</p>
        <ol className="list-decimal ml-5 mb-4 space-y-1">
          <li>Désignation du président de séance et du secrétaire</li>
          <li>Approbation des comptes de l&apos;exercice [N-1] (art. 18 loi 1965)</li>
          <li>Vote du budget prévisionnel [N+1]</li>
          <li>Vote de la cotisation au fonds de travaux (art. 14-2 loi 1965)</li>
          <li>[Résolution spécifique 1]</li>
          <li>[Résolution spécifique 2]</li>
          <li>Questions diverses</li>
        </ol>
        <p className="mb-4">
          Les documents suivants sont joints à la présente convocation :<br />
          - État financier de l&apos;exercice [N-1]<br />
          - Projet de budget prévisionnel [N+1]<br />
          - Contrats et devis relatifs aux résolutions [numéros]
        </p>
        <p className="mb-4">
          Si vous êtes dans l&apos;impossibilité d&apos;assister à cette assemblée, vous pouvez donner pouvoir à un autre copropriétaire (formulaire de délégation ci-joint) ou voter par correspondance (formulaire joint).
        </p>
        <p className="mb-1">Cordialement,</p>
        <p>[Votre nom]</p>
        <p>Syndic non-professionnel bénévole</p>
        <p>[Coordonnées]</p>
      </div>

      <div className="my-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-gray-700">
        <p className="font-semibold text-amber-800 mb-2">Points légaux à vérifier avant d&apos;envoyer</p>
        <ul className="space-y-1 text-sm">
          <li>✓ Délai de 21 jours minimum entre l&apos;envoi (date de présentation au bureau) et la date de l&apos;AG</li>
          <li>✓ Tous les copropriétaires sont convoqués, y compris les indivisaires (un représentant notifié)</li>
          <li>✓ Les documents réglementaires sont joints (comptes, projets de résolutions avec devis si travaux)</li>
          <li>✓ Formulaire de vote par correspondance joint (obligatoire depuis ELAN 2018)</li>
          <li>✓ Mentions obligatoires : identification du syndicat, lieu exact de la réunion, heure</li>
        </ul>
      </div>

      <h2 id="pv-ag" className={h2}>Template : procès-verbal d&apos;AG</h2>
      <p className={p}>
        Le PV doit être signé séance tenante par le président de séance, le secrétaire, et les scrutateurs. Il doit être notifié à tous les copropriétaires dans le mois suivant l&apos;AG.
      </p>

      <div className="my-6 bg-gray-50 border border-gray-200 rounded-xl p-5 text-sm text-gray-700 font-mono leading-relaxed">
        <p className="font-sans font-semibold text-gray-800 mb-3">Structure type de PV d&apos;AG</p>
        <p className="mb-2 font-bold">PROCÈS-VERBAL DE L&apos;ASSEMBLÉE GÉNÉRALE</p>
        <p className="mb-4">Du [date] — Résidence [nom] — [adresse]</p>
        <p className="mb-2"><strong>Présidence de séance :</strong> [Nom], élu(e) à l&apos;unanimité</p>
        <p className="mb-2"><strong>Secrétaire :</strong> [Nom]</p>
        <p className="mb-2"><strong>Présents et représentés :</strong></p>
        <p className="mb-4">[Liste des lots, propriétaires, tantièmes, présents/représentés/absents → Total : XX tantièmes sur YY = quorum atteint / non atteint]</p>
        <p className="mb-2 font-bold">RÉSOLUTION N°1 — [Intitulé]</p>
        <p className="mb-2">L&apos;assemblée, après en avoir délibéré, décide à la majorité de l&apos;article [24/25/26] :</p>
        <p className="mb-1">[Texte exact de la décision]</p>
        <p className="mb-1">POUR : [tantièmes] [voix]</p>
        <p className="mb-1">CONTRE : [tantièmes] [voix]</p>
        <p className="mb-4">ABSTENTIONS : [tantièmes] [voix] → RÉSOLUTION [ADOPTÉE / REJETÉE]</p>
        <p className="mb-4">[Répéter pour chaque résolution]</p>
        <p className="mb-2">L&apos;ordre du jour étant épuisé, la séance est levée à [heure].</p>
        <p className="mb-4">Le présent procès-verbal est signé par le président de séance et le secrétaire.</p>
        <p>[Signature Président] __________ [Signature Secrétaire] __________</p>
      </div>

      <h2 id="mise-en-demeure" className={h2}>Template : mise en demeure pour charges impayées</h2>
      <p className={p}>
        Avant toute procédure judiciaire, la mise en demeure par LRAR est l&apos;étape obligatoire. Elle fait courir les intérêts de retard (taux légal) et constitue la preuve que le débiteur a été formellement informé.
      </p>

      <div className="my-6 bg-amber-50 border border-amber-200 rounded-xl p-5 text-sm text-gray-700 font-mono leading-relaxed">
        <p className="font-sans font-semibold text-amber-800 mb-3">Modèle mise en demeure charges impayées</p>
        <p className="mb-4">Lettre Recommandée avec Accusé de Réception</p>
        <p className="mb-4">Objet : MISE EN DEMEURE — Impayés de charges de copropriété</p>
        <p className="mb-4">Monsieur / Madame [Nom], propriétaire du lot [n°] — [adresse]</p>
        <p className="mb-4">
          Après plusieurs relances amiables restées sans suite, je me vois contraint, en ma qualité de syndic non-professionnel de la copropriété [adresse], de vous mettre en demeure de régler sous 8 jours à compter de la présente les sommes suivantes :
        </p>
        <p className="mb-1">— Appel de fonds [trimestre/date] : [montant] €</p>
        <p className="mb-1">— Appel de fonds [trimestre/date] : [montant] €</p>
        <p className="mb-4">— TOTAL DÛ : [montant total] €</p>
        <p className="mb-4">
          À défaut de règlement dans ce délai, le syndicat des copropriétaires se réserve le droit d&apos;engager une procédure d&apos;injonction de payer devant le Tribunal judiciaire compétent, les frais de procédure étant à votre charge.
        </p>
        <p className="mb-4">
          Je reste à votre disposition pour convenir d&apos;un échéancier si votre situation le justifie.<br />
          Règlement à effectuer par virement : IBAN [IBAN] — BIC [BIC] — Référence : [COPRO-LOT-NOM]
        </p>
        <p className="mb-1">[Ville], le [date]</p>
        <p>[Votre nom] — Syndic non-professionnel bénévole</p>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Convocation, PV, mise en demeure — pré-remplis en 2 clics</p>
        <p className="text-sm text-gray-600 mb-4">
          Tous ces modèles sont intégrés dans Mon Syndic Bénévole avec les données de votre copropriété. Envoyez directement depuis la plateforme, avec preuve de réception.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </Link>
      </div>

      <h2 id="erreurs-a-eviter" className={h2}>5 erreurs qui finissent en contentieux</h2>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-amber-500 font-mono w-6">01</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Délai de convocation non respecté</p>
            <p className="text-xs font-medium text-amber-700 mb-1">Risque — Nullité potentielle de toutes les résolutions votées</p>
            <p className="text-xs text-gray-600">Le délai de 21 jours court à partir de la <em>première présentation</em> de la LRAR, pas de la date d&apos;envoi. Prévoyez 24 jours minimum pour ne jamais être au bord.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-amber-500 font-mono w-6">02</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Travaux engagés sans vote d&apos;AG</p>
            <p className="text-xs font-medium text-amber-700 mb-1">Risque — Remboursement personnel si le syndicat conteste la dépense</p>
            <p className="text-xs text-gray-600">Seuls les actes conservatoires (fuite active, sécurité immédiate) dispensent d&apos;un vote préalable. Au-delà, tout doit passer en AG, même 200 €.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-amber-500 font-mono w-6">03</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Compte fonds de travaux non séparé</p>
            <p className="text-xs font-medium text-amber-700 mb-1">Risque — Irrégularité sanctionnable, états financiers non conformes</p>
            <p className="text-xs text-gray-600">Le fonds doit être sur un compte distinct au nom du syndicat, sur un livret rémunéré (Livret A recommandé).</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-amber-500 font-mono w-6">04</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">PV non notifié dans le mois suivant l&apos;AG</p>
            <p className="text-xs font-medium text-amber-700 mb-1">Risque — Fenêtre de contestation ouverte indéfiniment</p>
            <p className="text-xs text-gray-600">Le délai de 2 mois pour contester une résolution ne court qu&apos;à partir de la notification du PV. Tant que vous ne notifiez pas, il ne se ferme pas.</p>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-amber-500 font-mono w-6">05</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">Immatriculation non mise à jour chaque année</p>
            <p className="text-xs font-medium text-amber-700 mb-1">Risque — Mise en demeure ANAH, désignation d&apos;un administrateur provisoire</p>
            <p className="text-xs text-gray-600">Le registre national des copropriétés doit être actualisé chaque année avec les données financières de l&apos;exercice clos.</p>
          </div>
        </div>
      </div>

      <h2 id="checklist" className={h2}>Checklist des obligations par période</h2>

      <div className="my-8 rounded-2xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-5 py-4 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist réglementaire — Syndic bénévole</p>
          <p className="text-xs text-gray-400 mt-0.5">À parcourir tout au long de l&apos;année</p>
        </div>
        <div className="divide-y divide-gray-100">
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-blue-600 mb-2">En continu</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Appels de fonds trimestriels émis sur la base du budget voté
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Suivi des paiements et relance des impayés (amiable, puis LRAR)
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Carnet d&apos;entretien à jour (interventions, contrôles obligatoires)
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Assurance multirisques immeuble (MRI) souscrite et à jour
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Répondre aux demandes d&apos;état daté en cas de vente
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Conservation des documents (justificatifs, contrats, courriers)
              </li>
            </ul>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-amber-600 mb-2">J−21 avant l&apos;AG (minimum)</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Clôturer les comptes N-1 et préparer le bilan
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Établir le projet de budget N+1
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Recueillir les demandes de résolutions des copropriétaires
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Envoyer les convocations avec PJ obligatoires (comptes, budget, devis)
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Joindre le formulaire de vote par correspondance
              </li>
            </ul>
          </div>
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-green-600 mb-2">J+1 mois après l&apos;AG</p>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Notifier le PV signé à tous les copropriétaires (LRAR ou e-mail accepté)
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Mettre en œuvre les décisions votées (commandes, contrats)
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Émettre les appels de fonds complémentaires pour les travaux votés
              </li>
              <li className="flex items-start gap-2.5 text-sm text-gray-700">
                <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                Mettre à jour le registre national des copropriétés
              </li>
            </ul>
          </div>
        </div>
        <div className="bg-blue-50 border-t border-blue-100 px-5 py-4">
          <p className="text-xs text-blue-700 font-medium">Astuce : Mon Syndic Bénévole intègre toutes ces échéances et vous alerte automatiquement avant chaque date critique.</p>
        </div>
      </div>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Le syndic bénévole doit-il souscrire une assurance responsabilité ?</h3>
      <p className={p}>Il n&apos;y est pas légalement contraint, contrairement aux syndics professionnels. Cependant, dans les copropriétés de taille significative, une assurance RCP personnelle est vivement recommandée. Certaines assurances multirisques immeuble incluent une garantie responsabilité du syndic bénévole — vérifiez votre contrat.</p>

      <h3 className={h3}>Peut-on convoquer l&apos;AG par e-mail ?</h3>
      <p className={p}>Oui, mais uniquement si le copropriétaire a donné son accord écrit préalable à ce mode de convocation. À défaut d&apos;accord, la convocation doit être faite par LRAR ou remise en main propre contre émargement. L&apos;accord peut être recueilli via un formulaire signé en AG, mention au PV.</p>

      <h3 className={h3}>Que se passe-t-il si la majorité requise n&apos;est pas atteinte ?</h3>
      <p className={p}>Il n&apos;y a pas de quorum en copropriété — l&apos;AG délibère quel que soit le nombre de présents. Art. 25 : si la majorité absolue n&apos;est pas atteinte mais qu&apos;un tiers des voix a été recueilli, un second vote à l&apos;art. 24 peut se tenir dans la même AG (art. 25-1). Art. 26 : une nouvelle AG peut être convoquée dans les 3 mois pour voter à la majorité de l&apos;art. 25.</p>

      <h3 className={h3}>Le syndic bénévole peut-il être rémunéré ?</h3>
      <p className={p}>Oui. Depuis 2014, l&apos;AG peut voter une rémunération pour le syndic bénévole à la majorité de l&apos;article 25. Cette rémunération doit être votée explicitement — elle ne peut pas être fixée unilatéralement. Elle est soumise à imposition dans la catégorie des revenus correspondants.</p>

      <h3 className={h3}>Combien de temps faut-il conserver les archives ?</h3>
      <p className={p}>5 ans pour les documents comptables et les convocations/PV d&apos;AG. 10 ans pour les contrats de travaux et les documents de garantie. Certains documents (acte de propriété, règlement de copropriété, carnet d&apos;entretien) doivent être conservés sans limite de durée.</p>

      <h3 className={h3}>Que faire si un copropriétaire conteste une résolution d&apos;AG ?</h3>
      <p className={p}>Le recours doit être formé dans les 2 mois suivant la notification du PV. Avant tout contentieux, une tentative de médiation ou de conciliation peut être proposée. Si le délai de 2 mois est expiré, la résolution est définitive. La bonne pratique est d&apos;envoyer les PV rapidement — et de conserver les preuves d&apos;envoi.</p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Le mandat de syndic bénévole est exigeant sur le plan légal. Les mêmes temps et formalités s&apos;appliquent qu&apos;un professionnel soit aux commandes ou non. La différence est que le bénévole ne dispose pas d&apos;une équipe administrative pour gérer ces délais.
      </p>
      <p className={p}>
        Un bon outil de gestion, un calendrier rigoureux, et les bons modèles de documents permettent de tenir ce mandat sereinement — et d&apos;éviter l&apos;erreur de Christophe.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-1">Christophe a perdu 28 000 € de travaux sur un délai de 3 jours.</p>
        <p className="text-sm text-blue-100 mb-4">Avec Mon Syndic Bénévole, chaque date critique est calculée automatiquement. Vous êtes alerté avant, pas après.</p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer votre syndic en moins de 30 minutes →
        </Link>
        <p className="text-xs text-blue-200 mt-2">Essai gratuit 14 jours · Sans carte bancaire</p>
      </div>
    </>
  );
}
