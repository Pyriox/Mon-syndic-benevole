// ============================================================
// Article : Copropriété sans syndic — est-ce légal et que faire ?
// Target KW : "copropriété sans syndic", "copropriété sans syndic que faire",
//             "que faire sans syndic de copropriété", "immeuble sans syndic"
// Distinct de /blog/gerer-copropriete-sans-syndic-professionnel (qui traite
// du choix syndic bénévole vs professionnel) : ici l'intention est
// « il n'y a plus AUCUN syndic, légal ou non ».
// ============================================================

/* eslint-disable @next/next/no-html-link-for-pages */

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleCoproprieteSansSyndic() {
  return (
    <>
      <p className={p}>
        Le mandat du syndic s&apos;est terminé en AG sans que personne ne se présente pour le remplacer. Ou l&apos;ancien syndic a démissionné par e-mail, un vendredi soir, sans préavis. Ou encore : personne ne s&apos;est jamais vraiment posé la question, et cela fait deux ans que la copropriété fonctionne « entre voisins », sans mandat, sans compte à jour, sans AG.
      </p>
      <p className={p}>
        <strong className={strong}>Réponse courte : non, ce n&apos;est pas légal, mais ce n&apos;est pas non plus une catastrophe irréversible.</strong> La loi du 10 juillet 1965 impose qu&apos;un syndic administre toute copropriété, sans exception liée à la taille de l&apos;immeuble (art. 17). Une copropriété sans syndic est en situation irrégulière — mais la régularisation est une démarche encadrée, réalisable en quelques semaines, et qui ne nécessite pas obligatoirement de repasser par un syndic professionnel.
      </p>
      <p className={p}>
        Ce guide explique ce que dit précisément la loi, les risques concrets d&apos;une absence de syndic (banque, assurance, travaux, vente d&apos;un lot), qui peut convoquer l&apos;assemblée générale dans cette situation, et comment désigner rapidement un nouveau syndic — professionnel ou bénévole.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Un copropriétaire est prêt à devenir syndic bénévole ?</p>
        <p className="text-sm text-gray-600 mb-4">
          Une fois élu en AG, Mon Syndic Bénévole permet de centraliser en quelques minutes les copropriétaires, les tantièmes, les appels de fonds et les documents de la copropriété.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Découvrir Mon Syndic Bénévole →
        </CtaLink>
        <p className="text-xs text-blue-400 mt-2">Essai gratuit 14 jours · Résiliable à tout moment</p>
      </div>

      <h2 id="legal" className={h2}>Peut-on légalement avoir une copropriété sans syndic ?</h2>
      <p className={p}>
        Non. L&apos;article 17 de la loi n° 65-557 du 10 juillet 1965 est explicite : <strong className={strong}>« Le syndicat est représenté par un syndic »</strong> et « tout syndicat de copropriétaires doit être administré par un syndic ». Cette obligation ne connaît pas d&apos;exception liée au nombre de lots — une copropriété de 2 lots y est autant soumise qu&apos;un immeuble de 50 lots.
      </p>
      <p className={p}>
        Ce que la loi rend libre, en revanche, c&apos;est <strong className={strong}>la nature du syndic</strong> : professionnel titulaire d&apos;une carte professionnelle, copropriétaire élu à titre bénévole, ou président du conseil syndical dans le cas particulier du syndicat coopératif (voir plus bas). Aucune de ces options ne dispense de l&apos;obligation d&apos;en avoir un.
      </p>
      <p className={p}>
        En pratique, une copropriété peut malgré tout se retrouver sans syndic pendant une période — le temps que la situation se régularise. Le syndicat des copropriétaires, lui, continue d&apos;exister juridiquement (il n&apos;est pas dissous), mais il n&apos;a plus personne légalement habilité à agir en son nom.
      </p>

      <h2 id="cas-frequents" className={h2}>Dans quels cas une copropriété se retrouve sans syndic ?</h2>
      <p className={p}>
        Ce n&apos;est jamais volontaire — c&apos;est presque toujours le résultat d&apos;un enchaînement d&apos;événements banals :
      </p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Mandat arrivé à expiration sans renouvellement</strong> — l&apos;AG annuelle n&apos;a pas été tenue, ou la résolution de renouvellement du syndic n&apos;a pas été inscrite à l&apos;ordre du jour à temps.</li>
        <li className={li}><strong className={strong}>Démission du syndic</strong> — bénévole fatigué qui arrête sans successeur identifié, ou syndic professionnel qui résilie le contrat en cours de mandat.</li>
        <li className={li}><strong className={strong}>Révocation en AG</strong> — les copropriétaires votent la fin du mandat (souvent après un conflit) sans avoir préparé de remplaçant.</li>
        <li className={li}><strong className={strong}>Décès ou incapacité du syndic bénévole</strong> — situation rare mais réelle dans les petites copropriétés gérées par un copropriétaire âgé, sans personne pour prendre le relais dans l&apos;urgence.</li>
        <li className={li}><strong className={strong}>Cessation d&apos;activité du syndic professionnel</strong> — liquidation du cabinet, retrait de la carte professionnelle, ou simple refus de renouveler le contrat sans que l&apos;AG suivante ait désigné de remplaçant.</li>
        <li className={li}><strong className={strong}>Absence de candidat lors du renouvellement</strong> — l&apos;AG arrive à la résolution « désignation du syndic » et personne ne se présente, y compris pour reprendre le mandat sortant.</li>
        <li className={li}><strong className={strong}>Erreur de procédure lors du vote</strong> — une élection contestée ou mal convoquée peut être annulée a posteriori, laissant rétroactivement la copropriété sans syndic valablement désigné.</li>
        <li className={li}><strong className={strong}>Petite copropriété gérée informellement</strong> — 2 à 4 lots où les propriétaires se répartissent les tâches « entre voisins » depuis des années, sans jamais avoir formalisé de mandat ni tenu d&apos;AG.</li>
      </ul>

      <h2 id="risques" className={h2}>Quels sont les risques concrets d&apos;une copropriété sans syndic ?</h2>
      <p className={p}>
        Le risque n&apos;est pas une sanction pénale immédiate (voir la section suivante), mais un <strong className={strong}>blocage progressif du fonctionnement</strong> de la copropriété, sur plusieurs fronts à la fois :
      </p>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">01</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Compte bancaire du syndicat bloqué ou mal géré</p>
            <p className="text-xs text-gray-600">Le compte séparé (art. 18 de la loi de 1965) doit être mouvementé par le syndic. Sans syndic en exercice, plus personne n&apos;est légalement habilité à signer un virement ou un chèque — la banque peut geler les opérations dès qu&apos;elle constate l&apos;absence de mandat à jour.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">02</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Fournisseurs et prestataires impayés</p>
            <p className="text-xs text-gray-600">Contrat d&apos;entretien, ascenseur, nettoyage : personne n&apos;est habilité à valider une facture ou à la régler. Les prestataires peuvent suspendre leurs services, voire résilier le contrat pour non-paiement.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">03</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Assurance de l&apos;immeuble en péril</p>
            <p className="text-xs text-gray-600">Le syndicat est légalement tenu de s&apos;assurer contre les risques de responsabilité civile dont il doit répondre (art. 9-1 de la loi de 1965). Sans syndic, personne ne peut renouveler le contrat à échéance, ni déclarer un sinistre dans les délais contractuels (souvent 5 jours ouvrés) — un incendie ou un dégât des eaux mal déclaré peut priver la copropriété de toute indemnisation.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">04</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Travaux à l&apos;arrêt</p>
            <p className="text-xs text-gray-600">Même des travaux déjà votés en AG ne peuvent pas être engagés : personne n&apos;a le pouvoir de signer un devis ou de commander une intervention urgente (fuite de toiture, panne d&apos;ascenseur).</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">05</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Appels de charges et recouvrement à l&apos;arrêt</p>
            <p className="text-xs text-gray-600">Sans syndic, personne n&apos;émet les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds trimestriels</a> ni ne relance les impayés. La trésorerie de la copropriété se dégrade en silence, parfois pendant plusieurs mois avant que quiconque ne s&apos;en aperçoive.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">06</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Le syndicat ne peut plus agir ni être poursuivi normalement en justice</p>
            <p className="text-xs text-gray-600">Le syndic est le représentant légal du syndicat des copropriétaires (art. 18). Sans syndic, le syndicat ne peut ni engager une procédure (contre un copropriétaire débiteur, un prestataire défaillant) ni être valablement assigné — ce qui peut nécessiter la désignation en urgence d&apos;un administrateur provisoire pour débloquer un dossier en cours.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">07</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Vente d&apos;un lot compliquée, voire bloquée</p>
            <p className="text-xs text-gray-600">Le notaire exige un état daté établi par le syndic avant toute vente. Sans syndic pour l&apos;établir, la signature de l&apos;acte peut être retardée de plusieurs semaines, le temps qu&apos;un syndic (ou un administrateur provisoire) soit désigné.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">08</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Archives et documents dispersés</p>
            <p className="text-xs text-gray-600">Sans syndic pour centraliser PV d&apos;AG, contrats, comptes et carnet d&apos;entretien, ces documents restent dispersés entre plusieurs copropriétaires — au risque de disparaître complètement au fil des reventes de lots.</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-100 bg-red-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-sm font-bold text-red-400 font-mono w-6">09</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">L&apos;assemblée générale annuelle n&apos;est plus tenue</p>
            <p className="text-xs text-gray-600">Sans syndic pour la convoquer, l&apos;AG ordinaire annuelle — pourtant obligatoire — n&apos;a plus lieu, et la situation irrégulière tend à se perpétuer d&apos;année en année si personne ne prend l&apos;initiative de la débloquer (voir la section suivante).</p>
          </div>
        </div>
      </div>

      <h2 id="sanction" className={h2}>Y a-t-il une amende ou une « sanction » automatique ?</h2>
      <p className={p}>
        Non, il n&apos;existe <strong className={strong}>pas d&apos;amende automatique</strong> prévue par la loi pour une copropriété qui se retrouve sans syndic. Il faut distinguer trois niveaux, souvent confondus :
      </p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>L&apos;absence de syndic elle-même</strong> n&apos;est pas sanctionnée par une amende chiffrée. C&apos;est une irrégularité au regard de l&apos;article 17 de la loi de 1965, pas une infraction pénale.</li>
        <li className={li}><strong className={strong}>L&apos;impossibilité de fonctionner juridiquement</strong> est la vraie conséquence : sans représentant légal, le syndicat ne peut plus agir normalement (voir les risques ci-dessus). C&apos;est un blocage opérationnel, pas une punition.</li>
        <li className={li}><strong className={strong}>L&apos;intervention judiciaire</strong> reste possible mais n&apos;est pas automatique : elle suppose qu&apos;un copropriétaire, un créancier ou toute personne intéressée saisisse le président du tribunal judiciaire pour faire désigner un <strong className={strong}>administrateur provisoire</strong> (art. 46 du décret n° 67-223 du 17 mars 1967), lorsque le fonctionnement normal de la copropriété est rendu impossible du fait de la carence du syndic. Les honoraires de cet administrateur, souvent supérieurs à ceux d&apos;un syndic ordinaire, sont à la charge de la copropriété.</li>
      </ul>
      <p className={p}>
        Autrement dit : personne ne reçoit de contravention pour « copropriété sans syndic ». Mais plus la situation dure, plus le risque de blocage (banque, assurance, vente d&apos;un lot) et de coût (administrateur provisoire, contentieux) augmente. Mieux vaut régulariser tôt que d&apos;attendre qu&apos;un tiers saisisse la justice.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Régulariser sans repasser par un cabinet professionnel</p>
        <p className="text-sm text-gray-600 mb-4">
          Si un copropriétaire est volontaire pour devenir syndic bénévole, Mon Syndic Bénévole guide la prise en main : lots, tantièmes, comptes, premier appel de fonds — sans connaissances comptables préalables.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Essayer gratuitement 14 jours →
        </CtaLink>
        <p className="text-xs text-blue-400 mt-2">Essai gratuit 14 jours · Résiliable à tout moment</p>
      </div>

      <h2 id="regulariser" className={h2}>Comment régulariser une copropriété sans syndic : la marche à suivre</h2>
      <ol className={ol}>
        <li className={li}>
          <strong className={strong}>Établir précisément la situation.</strong> Depuis quand le mandat est-il terminé ? Y a-t-il eu démission écrite, révocation en AG, ou simple absence de renouvellement ? Rassemblez le dernier PV d&apos;AG, le dernier contrat de syndic et les derniers relevés bancaires disponibles.
        </li>
        <li className={li}>
          <strong className={strong}>Mobiliser le conseil syndical, s&apos;il existe.</strong> C&apos;est l&apos;instance la plus légitime pour organiser la suite : il peut mettre en demeure l&apos;ancien syndic de convoquer une AG, ou convoquer lui-même l&apos;assemblée en cas de carence.
        </li>
        <li className={li}>
          <strong className={strong}>Identifier un ou plusieurs candidats</strong> avant l&apos;envoi des convocations — un copropriétaire volontaire pour devenir syndic bénévole, et/ou un ou plusieurs devis de syndics professionnels, pour donner à l&apos;AG un vrai choix.
        </li>
        <li className={li}>
          <strong className={strong}>Convoquer l&apos;assemblée générale</strong> avec à l&apos;ordre du jour la désignation d&apos;un nouveau syndic (voir qui peut convoquer dans la section suivante). Notre <a href="/blog/assemblee-generale-copropriete-guide" className={a}>guide de l&apos;assemblée générale</a> détaille le délai de convocation (21 jours) et le contenu de l&apos;ordre du jour.
        </li>
        <li className={li}>
          <strong className={strong}>Élire le nouveau syndic à la majorité de l&apos;article 25</strong> (majorité des voix de tous les copropriétaires). Si cette majorité n&apos;est pas atteinte mais que le candidat obtient plus du tiers des voix, un second vote à la majorité simple de l&apos;article 24 peut être organisé immédiatement, dans la même AG.
        </li>
        <li className={li}>
          <strong className={strong}>Si aucune candidature n&apos;aboutit</strong>, ou si personne n&apos;est en mesure de convoquer l&apos;AG, saisir le président du tribunal judiciaire (requête ou référé) pour faire désigner un administrateur provisoire, le temps de retrouver une solution stable.
        </li>
        <li className={li}>
          <strong className={strong}>Une fois le syndic élu</strong>, reprendre les fondamentaux sans attendre : accès ou réouverture du compte bancaire séparé au nom du syndicat, mise à jour de l&apos;assurance multirisques immeuble, récupération des archives disponibles, notification des prestataires, et mise à jour de l&apos;immatriculation de la copropriété sur le registre national des copropriétés.
        </li>
      </ol>

      <h2 id="qui-convoque-ag" className={h2}>Qui peut convoquer l&apos;assemblée générale lorsqu&apos;il n&apos;y a plus de syndic ?</h2>
      <p className={p}>
        C&apos;est le point qui bloque le plus souvent une régularisation : sans syndic, qui a le pouvoir légal d&apos;organiser l&apos;AG qui va en élire un nouveau ? L&apos;article 8 du décret n° 67-223 du 17 mars 1967 prévoit une hiérarchie précise :
      </p>
      <ol className={ol}>
        <li className={li}><strong className={strong}>Le syndic</strong> — c&apos;est la règle générale, mais elle ne s&apos;applique évidemment pas ici puisqu&apos;il n&apos;y en a plus.</li>
        <li className={li}><strong className={strong}>Le conseil syndical</strong>, s&apos;il existe et si l&apos;assemblée n&apos;a pas été réunie depuis plus de douze mois.</li>
        <li className={li}><strong className={strong}>Un copropriétaire habilité à cet effet par le règlement de copropriété</strong>, si celui-ci prévoit une telle clause.</li>
        <li className={li}><strong className={strong}>À défaut, un ou plusieurs copropriétaires représentant au moins le quart des voix du syndicat</strong> peuvent convoquer eux-mêmes l&apos;assemblée générale.</li>
      </ol>
      <p className={p}>
        Si aucune de ces options ne peut être actionnée — pas de conseil syndical, pas de clause dans le règlement, et aucun copropriétaire ne réunit le quart des voix nécessaire — la dernière solution consiste à demander au président du tribunal judiciaire, par requête ou en référé, la désignation d&apos;un mandataire de justice chargé spécifiquement de convoquer l&apos;assemblée, ou d&apos;un administrateur provisoire disposant de l&apos;ensemble des pouvoirs du syndic (art. 46 du décret de 1967). Dans la grande majorité des petites copropriétés, il n&apos;est toutefois pas nécessaire d&apos;aller jusque-là : un ou deux copropriétaires motivés suffisent généralement à réunir le quart des voix requis.
      </p>

      <h2 id="nommer-syndic-benevole" className={h2}>Comment nommer un syndic bénévole</h2>
      <p className={p}>
        Une fois l&apos;AG convoquée avec la résolution « désignation du syndic » à l&apos;ordre du jour, un copropriétaire peut se porter candidat pour devenir syndic bénévole. Aucune condition n&apos;est requise au-delà d&apos;être copropriétaire (ou conjoint / partenaire de PACS d&apos;un copropriétaire) : pas de diplôme, pas de carte professionnelle, pas de formation obligatoire. L&apos;élection se fait comme pour tout syndic, à la majorité de l&apos;article 25.
      </p>
      <p className={p}>
        Une fois élu, le nouveau syndic bénévole doit agir vite sur quelques points structurants : récupérer l&apos;état de trésorerie et les références bancaires (dans les 15 jours suivant la fin du mandat précédent lorsqu&apos;un ancien syndic professionnel est encore identifiable), ouvrir ou reprendre le compte bancaire séparé du syndicat, et notifier les prestataires de sa prise de fonction. Notre guide <a href="/blog/comment-devenir-syndic-benevole" className={a}>comment devenir syndic bénévole</a> détaille pas à pas ces 30 premiers jours, avec les modèles de courriers à utiliser.
      </p>

      <h2 id="syndic-pro-ou-benevole" className={h2}>Faut-il forcément reprendre un syndic professionnel ?</h2>
      <p className={p}>
        Non. La loi impose un syndic, pas un professionnel. Trois options existent, chacune avec ses contraintes :
      </p>
      <ul className={ul}>
        <li className={li}>
          <strong className={strong}>Syndic professionnel</strong> — titulaire d&apos;une carte professionnelle, d&apos;une garantie financière et d&apos;une assurance de responsabilité civile professionnelle. Solution la plus simple à mettre en place rapidement (signature d&apos;un contrat), mais la plus coûteuse et souvent la moins réactive pour une petite copropriété.
        </li>
        <li className={li}>
          <strong className={strong}>Syndic bénévole</strong> — un copropriétaire élu, sans rémunération obligatoire (l&apos;AG peut voter une indemnisation ou des défraiements). Solution la plus économique, adaptée aux copropriétés de taille moyenne où au moins un copropriétaire est disponible pour s&apos;investir. Voir notre guide <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>gérer sa copropriété sans syndic professionnel</a> pour peser le pour et le contre.
        </li>
        <li className={li}>
          <strong className={strong}>Syndicat coopératif</strong> — une forme prévue par l&apos;article 17-1 de la loi de 1965, où c&apos;est le président du conseil syndical, élu par les copropriétaires, qui exerce directement les fonctions de syndic, de manière collégiale avec le conseil syndical. Cette forme suppose que le syndicat des copropriétaires soit constitué en syndicat coopératif — une décision qui se prépare et se vote en amont, pas une solution à improviser dans l&apos;urgence d&apos;une absence de syndic.
        </li>
      </ul>
      <p className={p}>
        Dans l&apos;urgence d&apos;une copropriété sans syndic, le syndic bénévole est souvent la solution la plus rapide à mettre en œuvre : elle ne nécessite qu&apos;un vote en AG et un copropriétaire volontaire, sans délai de mise en concurrence ni négociation de contrat.
      </p>

      <h2 id="petite-copropriete" className={h2}>Cas particulier : la petite copropriété de 2 à 5 lots</h2>
      <p className={p}>
        Depuis l&apos;ordonnance n° 2019-1101 du 30 octobre 2019, un régime allégé s&apos;applique aux copropriétés d&apos;au plus 5 lots à usage de logements, de bureaux ou de commerces, dont le budget prévisionnel moyen sur trois exercices consécutifs est inférieur à un seuil fixé par décret. Ce régime simplifie certaines règles de fonctionnement : constitution d&apos;un conseil syndical non obligatoire, adaptation des règles de mise en concurrence des contrats de syndic, et pour les copropriétés ne comportant que deux lots, possibilité de prendre certaines décisions par accord écrit unanime des deux copropriétaires sans réunion physique.
      </p>
      <p className={p}>
        <strong className={strong}>Ce régime allège des formalités de fonctionnement — il ne supprime pas l&apos;obligation d&apos;avoir un syndic.</strong> L&apos;article 17 de la loi de 1965 s&apos;applique à « tout syndicat de copropriétaires », sans exception de taille. Une copropriété de 2 lots doit donc, comme les autres, être administrée par un syndic (professionnel, bénévole, ou l&apos;un des deux copropriétaires eux-mêmes) — ce qui, en pratique, est souvent la solution la plus simple : l&apos;un des deux propriétaires devient syndic bénévole de sa propre copropriété.
      </p>

      <h2 id="checklist" className={h2}>Que faire immédiatement si la copropriété n&apos;a plus de syndic : checklist</h2>
      <div className="rounded-xl border border-gray-200 overflow-hidden mb-6">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">À vérifier dans les premiers jours</p>
        </div>
        <div className="divide-y divide-gray-100">
          {([
            'Vérifier la date exacte de fin du dernier mandat (PV d\'AG, contrat de syndic) et la cause : mandat expiré, démission, révocation.',
            'Récupérer les documents disponibles auprès de l\'ancien syndic ou du conseil syndical : PV des dernières AG, contrats en cours, carnet d\'entretien.',
            'Vérifier la situation du compte bancaire séparé du syndicat : qui a encore la signature, quel est le solde, des prélèvements sont-ils encore actifs.',
            'Vérifier l\'état de l\'assurance multirisques immeuble : est-elle encore valide, à quelle date arrive-t-elle à échéance.',
            'Identifier les factures et contrats urgents à ne pas laisser filer (ascenseur, chaudière collective, contrats arrivant à échéance).',
            'Vérifier si un conseil syndical existe encore et le mobiliser en priorité pour organiser la suite.',
            'Identifier qui, parmi les copropriétaires, représente au moins le quart des voix pour convoquer l\'AG si besoin.',
            'Rechercher un ou plusieurs candidats au poste de syndic (bénévole et/ou devis de syndics professionnels).',
            'Convoquer l\'assemblée générale avec la désignation du syndic à l\'ordre du jour.',
            'Une fois le syndic élu, mettre à jour sans attendre : compte bancaire, assurance, prestataires, immatriculation au registre national des copropriétés.',
          ]).map((item) => (
            <div key={item} className="px-5 py-3 flex items-start gap-3">
              <span className="flex-shrink-0 w-4 h-4 rounded border-2 border-gray-300 mt-0.5" aria-hidden="true" />
              <p className="text-sm text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">La checklist ci-dessus tient en une AG et quelques jours de démarches</p>
        <p className="text-sm text-gray-600 mb-4">
          Une fois le nouveau syndic bénévole élu, Mon Syndic Bénévole aide à reprendre la main rapidement : lots et tantièmes, premier appel de fonds, espace copropriétaires, documents centralisés.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer mon espace gratuitement →
        </CtaLink>
        <p className="text-xs text-blue-400 mt-2">Essai gratuit 14 jours · Résiliable à tout moment</p>
      </div>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Est-il obligatoire d&apos;avoir un syndic ?</h3>
      <p className={p}>Oui. L&apos;article 17 de la loi du 10 juillet 1965 impose qu&apos;un syndic administre tout syndicat de copropriétaires, quelle que soit la taille de l&apos;immeuble. Seule la nature du syndic (professionnel, bénévole, syndicat coopératif) est laissée au choix des copropriétaires.</p>

      <h3 className={h3}>Une copropriété peut-elle fonctionner sans syndic ?</h3>
      <p className={p}>Pas normalement, et pas durablement. Le syndicat des copropriétaires continue d&apos;exister juridiquement, mais sans syndic, plus personne n&apos;est habilité à mouvementer le compte bancaire, signer des contrats, représenter le syndicat en justice ou établir les documents nécessaires à une vente. Le fonctionnement se bloque progressivement plutôt que de s&apos;arrêter d&apos;un coup.</p>

      <h3 className={h3}>Qui paie les factures lorsqu&apos;il n&apos;y a plus de syndic ?</h3>
      <p className={p}>En théorie, personne n&apos;est légalement habilité à valider et régler les factures du syndicat tant qu&apos;aucun syndic n&apos;est en exercice. En pratique, un membre du conseil syndical ou un copropriétaire agit parfois de manière informelle pour éviter une coupure de service urgente — mais cela reste une solution temporaire, sans base légale solide, qui doit être régularisée au plus vite par l&apos;élection d&apos;un nouveau syndic.</p>

      <h3 className={h3}>Peut-on vendre un appartement si la copropriété n&apos;a pas de syndic ?</h3>
      <p className={p}>C&apos;est compliqué mais pas nécessairement impossible. Le notaire demande systématiquement un état daté établi par le syndic ; sans syndic pour l&apos;établir, la vente est généralement retardée le temps qu&apos;un syndic (ou un administrateur provisoire désigné par le tribunal judiciaire) soit en mesure de le produire. Mieux vaut régulariser la situation avant de mettre un lot en vente.</p>

      <h3 className={h3}>Qui peut convoquer une assemblée générale sans syndic ?</h3>
      <p className={p}>Dans l&apos;ordre : le conseil syndical (si l&apos;AG n&apos;a pas été réunie depuis plus de 12 mois), un copropriétaire habilité par le règlement de copropriété, ou à défaut un ou plusieurs copropriétaires représentant au moins le quart des voix du syndicat (art. 8 du décret du 17 mars 1967). En dernier recours, un administrateur provisoire peut être désigné par le président du tribunal judiciaire.</p>

      <h3 className={h3}>Peut-on devenir syndic bénévole du jour au lendemain ?</h3>
      <p className={p}>L&apos;élection elle-même prend le temps d&apos;une AG (convoquée avec un délai de 21 jours). Une fois élu en revanche, le nouveau syndic bénévole peut agir dès le lendemain : ouvrir le compte bancaire, notifier les prestataires, commencer à réunir les documents de la copropriété. Aucune formation ni période de carence n&apos;est requise.</p>

      <h3 className={h3}>Que se passe-t-il si personne ne veut être syndic ?</h3>
      <p className={p}>Si aucun copropriétaire ne se porte candidat et qu&apos;aucun syndic professionnel n&apos;est retenu, tout intéressé (copropriétaire, créancier, ancien syndic) peut saisir le président du tribunal judiciaire pour faire désigner un administrateur provisoire, chargé des pouvoirs du syndic le temps qu&apos;une solution stable soit trouvée. Ses honoraires sont à la charge de la copropriété.</p>

      <h3 className={h3}>Une copropriété de deux lots doit-elle avoir un syndic ?</h3>
      <p className={p}>Oui. Le régime simplifié des petites copropriétés (ordonnance du 30 octobre 2019) allège certaines règles de fonctionnement pour les copropriétés de 2 à 5 lots, mais ne supprime pas l&apos;obligation légale d&apos;avoir un syndic prévue par l&apos;article 17 de la loi de 1965. En pratique, l&apos;un des deux copropriétaires devient souvent syndic bénévole de sa propre copropriété.</p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Une copropriété sans syndic n&apos;est pas légale, mais ce n&apos;est pas non plus une impasse. Le syndicat des copropriétaires continue d&apos;exister ; ce qui manque, c&apos;est une personne légalement habilitée à le représenter. La régularisation suit un chemin balisé : établir la situation, mobiliser le conseil syndical ou le quart des voix nécessaire pour convoquer l&apos;AG, présenter une ou plusieurs candidatures, et élire un nouveau syndic — professionnel ou bénévole.
      </p>
      <p className={p}>
        Plus la situation dure, plus les risques concrets s&apos;accumulent : compte bancaire bloqué, assurance non renouvelée, vente d&apos;un lot compliquée. Mieux vaut agir dès les premiers signes d&apos;absence de syndic que d&apos;attendre qu&apos;un tiers saisisse le tribunal judiciaire.
      </p>
      <p className={p}>
        <strong className={strong}>Pour aller plus loin :</strong> consultez notre guide pour <a href="/blog/comment-devenir-syndic-benevole" className={a}>devenir syndic bénévole</a>, notre guide complet pour <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>gérer une copropriété sans syndic professionnel</a>, ou notre guide de <a href="/blog/assemblee-generale-copropriete-guide" className={a}>l&apos;assemblée générale de copropriété</a> pour la convocation et les majorités applicables.
      </p>

      <div className="my-8 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">Sources officielles</p>
        <ul className="text-sm text-gray-700 space-y-1">
          <li><a href="https://www.legifrance.gouv.fr/loda/id/LEGITEXT000006068256" target="_blank" rel="noopener noreferrer" className={a}>Légifrance — loi n° 65-557 du 10 juillet 1965</a></li>
          <li><a href="https://www.service-public.gouv.fr/particuliers/vosdroits/F2608" target="_blank" rel="noopener noreferrer" className={a}>Service-Public.fr — le syndic de copropriété</a></li>
          <li><a href="https://www.anil.org/votre-besoin/gerer-un-bien/copropriete/syndic/" target="_blank" rel="noopener noreferrer" className={a}>ANIL — le syndic en copropriété</a></li>
          <li><a href="https://www.anah.fr/" target="_blank" rel="noopener noreferrer" className={a}>ANAH — Agence nationale de l&apos;habitat</a></li>
        </ul>
      </div>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-1">Un copropriétaire volontaire ? Reprenez la main en une AG.</p>
        <p className="text-sm text-blue-100 mb-4">
          Mon Syndic Bénévole centralise les copropriétaires, tantièmes, appels de fonds, documents et assemblées générales — sans connaissances comptables préalables.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer mon espace gratuit →
        </CtaLink>
        <p className="text-xs text-blue-200 mt-2">Essai gratuit 14 jours · Résiliable à tout moment</p>
      </div>
    </>
  );
}
