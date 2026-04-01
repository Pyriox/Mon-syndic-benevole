// ============================================================
// Article : Gérer une copropriété sans syndic professionnel
// ============================================================

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleGererCopropriete() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        D&apos;un côté : un cabinet de syndic qui facture 4 000 € par an pour gérer douze appartements, répond au téléphone une fois sur trois, et traite votre immeuble comme le dossier n°847 de la semaine.
      </p>
      <p className={p}>
        De l&apos;autre : l&apos;idée de tout gérer soi-même, qui fait peur. Comptabilité, assemblées générales, appels de fonds, travaux, impayés… Par où commencer ? Combien de temps ça prend vraiment ? Et si on rate une obligation légale, qui est responsable ?
      </p>
      <p className={p}>
        La réalité : en France, <strong className={strong}>plus de 40 % des copropriétés</strong> sont gérées sans cabinet professionnel — chiffre qui monte à 60 % pour les immeubles de moins de 10 lots. Ce n&apos;est pas marginal. Ce guide n&apos;est pas une liste d&apos;obligations abstraites — c&apos;est une réponse concrète à la question : <strong className={strong}>comment faire ça correctement, sans y passer sa vie ?</strong>
      </p>

      <h2 id="explication" className={h2}>L&apos;explication : ce que ça implique vraiment</h2>
      <h2 id="ce-que-dit-la-loi" className={h2}>Ce que la loi dit — en 3 lignes</h2>
      <p className={p}>
        La loi du 10 juillet 1965 impose l&apos;existence d&apos;un syndic dans toute copropriété. Elle n&apos;impose pas qu&apos;il soit professionnel. Un copropriétaire peut exercer ce rôle — c&apos;est le <strong className={strong}>syndic bénévole</strong>. Aucun diplôme, aucune carte professionnelle, aucune formation certifiante requis.
      </p>
      <p className={p}>
        Les seules exigences légales : être copropriétaire, être élu en AG à la majorité absolue (art. 25), disposer d&apos;un mandat avec une durée définie, et ouvrir un compte bancaire séparé au nom du syndicat.
      </p>

      <h2 id="profils" className={h2}>Trois profils, trois organisations différentes</h2>
      <p className={p}>Voici comment trois syndics bénévoles réels organisent leur gestion quotidienne.</p>

      <h3 className={h3}>Isabelle, 61 ans, retraitée — immeuble de 6 lots, Nantes</h3>
      <p className={p}>
        &ldquo;Je consacre environ 2 heures par mois à la copropriété. L&apos;appel de fonds, j&apos;envoie un e-mail à tout le monde, ils ont viré en 10 jours. L&apos;AG prend une soirée de préparation et 2 heures de réunion. Le reste, c&apos;est de la réactivité — un dégât des eaux, une ampoule à changer. Rien d&apos;insurmontable.&rdquo;
      </p>
      <p className={p}>
        Organisation d&apos;Isabelle : un classeur physique + un dossier Google Drive partagé avec les copropriétaires. Elle a commencé avec Excel et est passée à un outil dédié après sa première AG &ldquo;où je n&apos;avais pas les bons chiffres sous la main&rdquo;.
      </p>

      <h3 className={h3}>Marc, 44 ans, cadre commercial — immeuble de 12 lots, Lyon</h3>
      <p className={p}>
        &ldquo;Je fais ça le week-end. Deux heures le premier dimanche du mois pour les finances, moins d&apos;une heure pour les relances et les e-mails. La difficulté, c&apos;est les prestataires — j&apos;ai dû changer l&apos;entreprise de nettoyage, ça m&apos;a pris 3 semaines de devis et d&apos;échanges. Mais c&apos;est exceptionnel.&rdquo;
      </p>
      <p className={p}>
        Organisation de Marc : tout sur un outil de gestion de copropriété. &ldquo;Je n&apos;aurais pas tenu sans ça — à 12 lots, Excel ça devient vite ingérable pour suivre qui a payé quoi.&rdquo;
      </p>

      <h3 className={h3}>Sylvie, 50 ans, comptable de métier — immeuble de 18 lots, Bordeaux</h3>
      <p className={p}>
        &ldquo;Mon avantage, c&apos;est la compta — je comprends les écritures. Mon problème, c&apos;est le temps. J&apos;ai 18 lots, un ascenseur, un contrat de chauffage collectif et un compte fonds de travaux séparé. Ça représente 4 à 5 heures par mois, plus 8 heures pour l&apos;AG. C&apos;est la limite haute de ce que je peux me permettre.&rdquo;
      </p>
      <p className={p}>
        Organisation de Sylvie : un logiciel de gestion, des alertes automatiques sur les échéances contractuelles, un accès copropriétaires pour les questions. &ldquo;Ça a coupé de 60 % les questions par SMS.&rdquo;
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Ce qui différencie ceux qui tiennent de ceux qui abandonnent</p>
        <p className="text-sm text-gray-600 mb-4">
          Isabelle, Marc et Sylvie ont tous le même point commun : un outil qui calcule les tantièmes, suit les paiements et prépare les documents AG à leur place. Sans ça, la gestion manuelle finit par peser. Essai gratuit 14 jours, sans carte bancaire.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester gratuitement — 14 jours offerts →
        </CtaLink>
      </div>

      <h2 id="temps-reel" className={h2}>Combien de temps ça prend vraiment — décomposition par tâche</h2>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Tâche</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">6 lots</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">12 lots</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">18 lots</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Appels de fonds trimestriels (calcul + envoi)</td>
              <td className="py-3 px-4 text-gray-600 text-right">30 min</td>
              <td className="py-3 px-4 text-gray-600 text-right">45 min</td>
              <td className="py-3 px-4 text-gray-600 text-right">60 min</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Suivi paiements / relances</td>
              <td className="py-3 px-4 text-gray-600 text-right">30 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">60 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">90 min/mois</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Enregistrement des dépenses</td>
              <td className="py-3 px-4 text-gray-600 text-right">20 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">30 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">45 min/mois</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Réponses aux copropriétaires</td>
              <td className="py-3 px-4 text-gray-600 text-right">20 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">40 min/mois</td>
              <td className="py-3 px-4 text-gray-600 text-right">60 min/mois</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Gestion prestataires / travaux</td>
              <td className="py-3 px-4 text-gray-600 text-right">variable</td>
              <td className="py-3 px-4 text-gray-600 text-right">variable</td>
              <td className="py-3 px-4 text-gray-600 text-right">variable</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Préparation AG annuelle (total)</td>
              <td className="py-3 px-4 text-gray-600 text-right">3-4 h</td>
              <td className="py-3 px-4 text-gray-600 text-right">5-6 h</td>
              <td className="py-3 px-4 text-gray-600 text-right">7-9 h</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="py-3 px-4 text-gray-800">Total mensuel moyen (hors AG)</td>
              <td className="py-3 px-4 text-blue-700 text-right">~1,5 h</td>
              <td className="py-3 px-4 text-blue-700 text-right">~3 h</td>
              <td className="py-3 px-4 text-blue-700 text-right">~5 h</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className={p}>
        Ces chiffres correspondent à une gestion <em>avec un outil dédié</em>. Sans outil (tout en Excel + e-mails manuels), comptez <strong className={strong}>1,5 à 2 fois plus de temps</strong> — principalement sur l&apos;appel de fonds, le suivi des paiements et la préparation des documents AG.
      </p>

      <h2 id="economie" className={h2}>Ce que ça représente concrètement en économies</h2>
      <p className={p}>
        Un syndic professionnel facture en moyenne entre <strong className={strong}>150 et 250 € par lot et par an</strong> pour la gestion de base — hors honoraires pour chaque AG, chaque lettre recommandée, chaque état daté lors d&apos;une vente. Sur 12 lots :
      </p>
      <ul className={ul}>
        <li className={li}>Gestion courante : 12 × 200 € = <strong className={strong}>2 400 €/an</strong></li>
        <li className={li}>AG annuelle (honoraires syndic) : 400 à 800 €</li>
        <li className={li}>Frais divers (recommandés, états datés, interventions spéciales) : 200 à 500 €/an</li>
        <li className={li}><strong className={strong}>Total : 3 000 à 3 700 € par an</strong></li>
      </ul>
      <p className={p}>
        Avec un logiciel de gestion dédié (~25 €/mois), l&apos;économie réelle pour la copropriété : <strong className={strong}>2 700 € à 3 400 € par an</strong>, soit 225 à 283 € par mois. Réparti entre les copropriétaires, ça représente 225 à 308 € d&apos;économie annuelle chacun sur un immeuble de 12 lots.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Un syndic professionnel coûte 150 à 250 € par lot et par an</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole revient à moins de 25 €/mois pour toute la copropriété — quel que soit le nombre de lots. Appels de fonds calculés automatiquement, suivi des paiements, AG préparée en un clic. 14 jours gratuits, sans engagement.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer ma copropriété gratuitement →
        </CtaLink>
      </div>

      <h2 id="responsabilites" className={h2}>Les vraies responsabilités — ce qui vous revient concrètement</h2>

      <h3 className={h3}>Administratif</h3>
      <ul className={ul}>
        <li className={li}>Convoquer et organiser l&apos;AG annuelle (délai légal 21 jours minimum)</li>
        <li className={li}>Rédiger et diffuser les PV dans le mois suivant l&apos;AG</li>
        <li className={li}>Tenir à jour le carnet d&apos;entretien de l&apos;immeuble</li>
        <li className={li}>Archiver les contrats, assurances et documents légaux pendant 10 ans</li>
      </ul>

      <h3 className={h3}>Financier</h3>
      <ul className={ul}>
        <li className={li}>Établir le budget prévisionnel et le soumettre au vote</li>
        <li className={li}><a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>Appeler les charges trimestrielles</a> à date fixe</li>
        <li className={li}>Tenir une comptabilité (en parties doubles si plus de 10 lots)</li>
        <li className={li}>Gérer le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> sur compte séparé</li>
      </ul>

      <h3 className={h3}>Opérationnel</h3>
      <ul className={ul}>
        <li className={li}>Assurer et maintenir l&apos;assurance multirisques immeuble (MRI)</li>
        <li className={li}>Gérer les contrats prestataires (nettoyage, ascenseur, espaces verts…)</li>
        <li className={li}>Déclarer les sinistres dans les délais (souvent 5 jours ouvrés)</li>
        <li className={li}>Répondre aux copropriétaires et aux locataires pour les parties communes</li>
      </ul>

      <h2 id="cas-pratiques" className={h2}>3 situations difficiles et comment les gérer</h2>

      <h3 className={h3}>Cas 1 — Infiltration d&apos;eau un vendredi soir à 20 h</h3>
      <p className={p}>
        Marc (12 lots) a reçu un message d&apos;une copropriétaire : une fuite venant du toit inonde sa salle de bain. C&apos;est vendredi, -2 °C, le lendemain il ne peut pas intervenir personnellement.
      </p>
      <p className={p}>
        Ce qu&apos;il a fait : appelé la société de maintenance liée au contrat d&apos;assurance MRI (numéro toujours accessible 24/7). Un plombier d&apos;urgence est intervenu dans les 2 heures pour poser une bâche provisoire. Déclaration de sinistre à l&apos;assurance le lundi matin. Devis de réparation définitive : soumis à l&apos;AG suivante pour travaux votés.
      </p>
      <p className={p}>
        <strong className={strong}>Le point clé :</strong> avoir le numéro d&apos;urgence de l&apos;assurance MRI affiché quelque part d&apos;accessible. 80 % des urgences sont couvertes par ce canal. Le syndic professionnel aurait fait la même chose.
      </p>

      <h3 className={h3}>Cas 2 — Une copropriétaire refuse de payer depuis 4 mois</h3>
      <p className={p}>
        Sylvie (18 lots) avait une copropriétaire qui n&apos;avait pas payé depuis 2 trimestres — 890 € de retard. Premières relances par e-mail : ignorées. Elle a envoyé une mise en demeure par LRAR en mentionnant l&apos;injonction de payer. Résultat : règlement dans les 8 jours. &ldquo;Les gens paient quand ils comprennent que vous connaissez la procédure.&rdquo;
      </p>
      <p className={p}>
        Si la mise en demeure reste sans effet : saisir le tribunal judiciaire par injonction de payer (formulaire Cerfa, ~35 €, délai de réponse 4 à 6 semaines). C&apos;est plus simple que ça en a l&apos;air — et la plupart des dossiers se règlent avant même le jugement.
      </p>

      <h3 className={h3}>Cas 3 — Un copropriétaire exige de voir tous les justificatifs de dépenses</h3>
      <p className={p}>
        Isabelle (6 lots) avait un copropriétaire particulièrement vigilant qui demandait les justificatifs de chaque dépense par e-mail. Elle a résolu le problème en créant un dossier Google Drive partagé avec toutes les factures scannées, accessible à tous les copropriétaires à tout moment. &ldquo;Depuis, je n&apos;ai plus de demande individuelle — ils cherchent eux-mêmes.&rdquo;
      </p>
      <p className={p}>
        C&apos;est la puissance de la transparence : non seulement elle désamorce les tensions, mais elle réduit votre charge de travail.
      </p>

      <h2 id="solution" className={h2}>La solution : les outils qui font toute la différence</h2>
      <h2 id="pourquoi-se-perdent" className={h2}>Pourquoi autant de syndics bénévoles abandonnent en cours de route</h2>
      <p className={p}>La plupart des abandons ne viennent pas de la complexité des tâches, mais de <strong className={strong}>l&apos;absence d&apos;organisation</strong> et d&apos;outillage. Le schéma classique :</p>
      <ul className={ul}>
        <li className={li}>An 1 : tout va bien, on gère à la main dans Excel et par e-mail.</li>
        <li className={li}>An 2 : les documents s&apos;accumulent, les soldes ne sont plus clairs, l&apos;AG devient difficile à préparer.</li>
        <li className={li}>An 3 : un copropriétaire conteste un montant, il faut reconstituer 3 ans d&apos;historique. Découragement.</li>
      </ul>
      <p className={p}>
        La solution n&apos;est pas de décourager — c&apos;est de s&apos;outiller dès le départ. Un outil de gestion de copropriété ne remplace pas votre jugement. Il automatise les tâches répétitives (calcul des tantièmes, envoi des appels, suivi des paiements) pour que vous puissiez vous concentrer sur ce qui demande vraiment votre attention.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Excel, c&apos;est le problème — pas vous</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole remplace le tableur par un outil pensé pour la copropriété : historique complet des paiements, calcul automatique par tantièmes, alertes sur les échéances légales. Opérationnel en 15 minutes.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Tester Mon Syndic Bénévole gratuitement →
        </CtaLink>
      </div>

      <h2 id="quand-professionnel" className={h2}>Les 4 cas où un syndic professionnel reste plus adapté</h2>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Copropriété de 50 lots et plus</strong> : le volume de travail et la complexité comptable justifient souvent un professionnel à temps partiel ou plein.</li>
        <li className={li}><strong className={strong}>Conflits graves entre copropriétaires</strong> : un tiers neutre et extérieur peut désamorcer des situations où un bénévole serait pris en étau.</li>
        <li className={li}><strong className={strong}>Chantier lourd en cours</strong> : la coordination d&apos;un ravalement de 150 000 € avec 3 entreprises demande de l&apos;expérience et du temps.</li>
        <li className={li}><strong className={strong}>Syndic sans disponibilité réelle</strong> : un bénévole qui ne peut pas consacrer 2 heures par mois expose la copropriété à des délais manqués et à leurs conséquences légales.</li>
      </ul>
      <p className={p}>La vraie question n&apos;est pas &ldquo;professionnel ou bénévole ?&rdquo; mais : <strong className={strong}>&ldquo;quel niveau de charge de gestion représente mon immeuble, et ai-je les ressources pour l&apos;assumer correctement ?&rdquo;</strong></p>

      <h2 id="comment-passer" className={h2}>Comment passer d&apos;un syndic professionnel à un syndic bénévole en 5 étapes</h2>
      <ol className={ol}>
        <li className={li}><strong className={strong}>Décider et voter en AG.</strong> La résolution de remplacement du syndic doit être à l&apos;ordre du jour. Élection du bénévole à la majorité art. 25.</li>
        <li className={li}><strong className={strong}>Envoyer la LRAR à l&apos;ancien syndic</strong> dès le lendemain pour demander le transfert des archives dans les 15 jours légaux.</li>
        <li className={li}><strong className={strong}>Ouvrir le compte séparé</strong> au nom du syndicat. Les anciens mandats bancaires de l&apos;ancien syndic sont annulés de plein droit à la fin de son mandat.</li>
        <li className={li}><strong className={strong}>S&apos;équiper.</strong> Un tableur peut convenir pour 4 lots. Au-delà, un outil dédié évite les erreurs et le temps perdu.</li>
        <li className={li}><strong className={strong}>Informer résidents et prestataires</strong> de vos nouvelles coordonnées et du nouveau RIB.</li>
      </ol>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Prenez vos fonctions du bon pied — dès le premier jour</p>
        <p className="text-sm text-gray-600 mb-4">
          Créez votre copropriété sur Mon Syndic Bénévole en 15 minutes : lots, tantièmes, copropriétaires. Votre premier appel de fonds est calculé et prêt à envoyer le jour même de votre prise de mandat.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer ma copropriété gratuitement →
        </CtaLink>
      </div>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Le syndic bénévole est-il responsable sur ses biens personnels ?</h3>
      <p className={p}>En cas de faute dans l&apos;exercice du mandat, le syndic bénévole engage sa responsabilité civile — ce qui peut théoriquement impacter son patrimoine. En pratique, les condamnations pour faute de bonne foi sont rares. Vérifiez que votre assurance habitation ou une protection juridique couvre cette activité.</p>

      <h3 className={h3}>Un syndic bénévole peut-il gérer une copropriété avec beaucoup d&apos;impayés ?</h3>
      <p className={p}>C&apos;est plus délicat mais possible. La gestion des impayés nécessite de connaître les procédures (mise en demeure, injonction de payer) — et d&apos;avoir le courage de les appliquer. Des prestataires juridiques spécialisés proposent des forfaits de recouvrement pour copropriétés.</p>

      <h3 className={h3}>Et si personne ne veut endosser le rôle ?</h3>
      <p className={p}>Tout copropriétaire peut saisir le tribunal judiciaire pour faire désigner un administrateur provisoire — généralement un professionnel, aux frais de la copropriété. Anticipez la passation de pouvoir 3 mois à l&apos;avance pour éviter ce scénario.</p>

      <h3 className={h3}>Peut-on partager le rôle de syndic entre plusieurs copropriétaires ?</h3>
      <p className={p}>Légalement, il n&apos;y a qu&apos;un seul syndic. Mais le travail peut parfaitement être réparti : un copropriétaire gère les finances, un autre les prestataires, un troisième les relations avec les résidents. La responsabilité légale reste sur la personne élue syndic — les autres sont des collaborateurs bénévoles.</p>

      <h3 className={h3}>Peut-on ne pas avoir de syndic dans une copropriété ?</h3>
      <p className={p}>Non. La loi du 10 juillet 1965 (art. 17) impose l&apos;existence d&apos;un syndic dans <strong className={strong}>toute copropriété, sans exception</strong>. Ce qui est libre, c&apos;est la <em>nature</em> du syndic : professionnel ou bénévole. &ldquo;Gérer sans syndic professionnel&rdquo; signifie confier la gestion à un copropriétaire élu — pas supprimer toute organisation. Une copropriété sans syndic est en situation irrégulière : tout copropriétaire peut saisir le tribunal pour faire désigner un administrateur provisoire, aux frais de la copropriété.</p>

      <h3 className={h3}>Quelles sont les obligations légales d&apos;une copropriété gérée en bénévole ?</h3>
      <p className={p}>Elles sont <strong className={strong}>identiques</strong> à celles d&apos;une copropriété gérée par un professionnel. Le syndic bénévole doit : convoquer l&apos;AG annuelle avec au moins 21 jours de préavis, émettre les appels de fonds trimestriels, tenir une comptabilité séparée, ouvrir un compte bancaire au nom du syndicat, gérer le fonds de travaux ALUR sur un compte rémunéré séparé (obligatoire pour toutes les copropriétés depuis 2025), maintenir l&apos;assurance multirisques immeuble, et archiver les documents pendant 10 ans. Le bénévolat concerne la personne qui exerce — pas le niveau d&apos;exigence légale.</p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Gérer sa copropriété sans syndic professionnel, c&apos;est légal, courant et économiquement très avantageux pour les petits et moyens immeubles. Isabelle, Marc et Sylvie le font chacun à leur façon — avec entre 1,5 et 5 heures par mois selon la taille de l&apos;immeuble.
      </p>
      <p className={p}>Ce qui fait la différence entre un syndic qui tient dans la durée et un qui abandonne au bout de 2 ans : l&apos;organisation, les bons outils, et une copropriété qui joue le jeu collectivement.</p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/comment-devenir-syndic-benevole" className={a}>comment devenir syndic bénévole</a> ou sur les <a href="/blog/obligations-syndic-benevole" className={a}>obligations légales détaillées du syndic</a>.</p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-2">Gérez votre immeuble sans vous y noyer</p>
        <p className="text-sm text-blue-100 mb-4">Appels de fonds, AG, fonds de travaux — tout en un. Essai gratuit 14 jours.</p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Créer ma copropriété sur Mon Syndic Bénévole →
        </CtaLink>
      </div>
    </>
  );
}
