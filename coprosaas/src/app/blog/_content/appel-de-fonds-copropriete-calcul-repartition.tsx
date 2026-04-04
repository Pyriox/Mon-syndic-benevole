// ============================================================
// Article : Appel de fonds copropriété — calcul, répartition, relance
// ============================================================

/* eslint-disable @next/next/no-html-link-for-pages, react/no-unescaped-entities */

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleAppelDeFonds() {
  return (
    <>
      <h2 id="probleme" className={h2}>Le problème</h2>
      <p className={p}>
        Chaque trimestre, c&apos;est la même scène : ouvrir le fichier Excel, retrouver les tantièmes de chacun, recalculer les quotes-parts, rédiger 8 avis de paiement un par un, les envoyer par mail. Quelques jours plus tard, les questions arrivent : &ldquo;Pourquoi ce montant ?&rdquo; Et les relances pour les impayés commencent.
      </p>
      <p className={p}>
        Pour un syndic bénévole sans outil adapté, l&apos;appel de fonds trimestriel représente facilement <strong className={strong}>4 à 6 heures de travail répétitif</strong> — sans filet, sans traçabilité, et avec le risque permanent d&apos;une erreur sur les tantièmes que personne ne détecte avant l&apos;AG.
      </p>
      <p className={p}>
        Ce guide explique le calcul, les modèles de documents, et la procédure de relance. Il montre aussi ce qui peut être entièrement automatisé — pour que vous ne recommenciez plus ce calcul depuis zéro chaque trimestre.
      </p>

      <h2 id="explication" className={h2}>L&apos;explication : comment fonctionne un appel de fonds</h2>
      <h2 id="definition" className={h2}>Qu&apos;est-ce qu&apos;un appel de fonds — et pourquoi c&apos;est une provision, pas une facture</h2>
      <p className={p}>
        Un appel de fonds est une <strong className={strong}>demande de paiement adressée à chaque copropriétaire</strong> pour couvrir les dépenses à venir de la copropriété. C&apos;est une provision — une avance sur des frais collectifs dont le total réel ne sera connu qu&apos;en fin d&apos;exercice. Ce n&apos;est pas une facture pour une prestation déjà rendue.
      </p>
      <p className={p}>La distinction a une conséquence pratique : il y a toujours une régularisation en fin d&apos;année entre ce qui a été appelé et ce qui a réellement été dépensé.</p>
      <p className={p}>On distingue trois types d&apos;appels de fonds :</p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Les appels de budget prévisionnel</strong> — charges courantes (entretien, assurance, espaces verts, électricité des communs…). Émis chaque trimestre à date fixe.</li>
        <li className={li}><strong className={strong}>Les appels exceptionnels</strong> — travaux votés en AG (ravalement, toiture, remplacement chaudière). Émis selon le calendrier du chantier.</li>
        <li className={li}><strong className={strong}>Le fonds de travaux ALUR</strong> — épargne obligatoire pour <strong className={strong}>toutes les copropriétés depuis 2025</strong>, au moins 5 % du budget prévisionnel par an. Séparé des charges courantes, déposé sur un compte bancaire distinct.</li>
      </ul>

      <h2 id="tantiemes" className={h2}>Les tantièmes : la base de tout calcul</h2>
      <p className={p}>
        Chaque lot de la copropriété s&apos;est vu attribuer, lors de la création, une <strong className={strong}>quote-part exprimée en tantièmes</strong> (ou millièmes). Ce nombre reflète la valeur relative du lot : surface, étage, exposition, présence d&apos;un parking ou d&apos;une cave.
      </p>
      <p className={p}>
        Ces tantièmes figurent dans le <strong className={strong}>règlement de copropriété</strong> et dans l&apos;état descriptif de division. Vous ne les trouvez pas ? L&apos;ancien syndic ou le notaire qui a établi le règlement peut vous les fournir.
      </p>

      <div className="overflow-x-auto mb-6 rounded-xl border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Lot</th>
              <th className="text-left py-3 px-4 text-gray-500 font-medium">Type</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Tantièmes</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Quote-part</th>
              <th className="text-right py-3 px-4 text-gray-500 font-medium">Appel T1 (budget 9 600 €/an)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr>
              <td className="py-3 px-4 text-gray-700">Lot 1 — T3, 3e ét. + parking</td>
              <td className="py-3 px-4 text-gray-600">Appartement</td>
              <td className="py-3 px-4 text-gray-700 text-right">180</td>
              <td className="py-3 px-4 text-gray-700 text-right">18,0 %</td>
              <td className="py-3 px-4 text-gray-800 text-right font-semibold">432,00 €</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Lot 2 — T3, 2e étage</td>
              <td className="py-3 px-4 text-gray-600">Appartement</td>
              <td className="py-3 px-4 text-gray-700 text-right">155</td>
              <td className="py-3 px-4 text-gray-700 text-right">15,5 %</td>
              <td className="py-3 px-4 text-gray-800 text-right font-semibold">372,00 €</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700">Lot 3 — T2, 1er étage</td>
              <td className="py-3 px-4 text-gray-600">Appartement</td>
              <td className="py-3 px-4 text-gray-700 text-right">105</td>
              <td className="py-3 px-4 text-gray-700 text-right">10,5 %</td>
              <td className="py-3 px-4 text-gray-800 text-right font-semibold">252,00 €</td>
            </tr>
            <tr className="bg-gray-50">
              <td className="py-3 px-4 text-gray-700">Lot 4 — Studio, RDC</td>
              <td className="py-3 px-4 text-gray-600">Appartement</td>
              <td className="py-3 px-4 text-gray-700 text-right">72</td>
              <td className="py-3 px-4 text-gray-700 text-right">7,2 %</td>
              <td className="py-3 px-4 text-gray-800 text-right font-semibold">173,00 €</td>
            </tr>
            <tr>
              <td className="py-3 px-4 text-gray-700 italic">Lots 5 à 8</td>
              <td className="py-3 px-4 text-gray-600">—</td>
              <td className="py-3 px-4 text-gray-700 text-right">488</td>
              <td className="py-3 px-4 text-gray-700 text-right">48,8 %</td>
              <td className="py-3 px-4 text-gray-800 text-right font-semibold">1 171,00 €</td>
            </tr>
            <tr className="bg-blue-50 font-semibold">
              <td className="py-3 px-4 text-gray-800">Total</td>
              <td className="py-3 px-4"></td>
              <td className="py-3 px-4 text-gray-800 text-right">1 000</td>
              <td className="py-3 px-4 text-gray-800 text-right">100 %</td>
              <td className="py-3 px-4 text-blue-700 text-right">2 400,00 €</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="my-6 rounded-xl bg-blue-50 border border-blue-200 p-5">
        <p className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">La formule à retenir</p>
        <p className="text-base font-semibold text-blue-900 mb-3">
          Appel du lot = (tantièmes du lot ÷ total tantièmes) × (budget annuel ÷ 4)
        </p>
        <p className="text-sm text-gray-600 mb-1"><strong>Exemple — Lot 1 (180 tantièmes sur 1 000)</strong></p>
        <p className="text-sm text-gray-700 font-mono bg-white rounded-lg px-3 py-2 border border-blue-100 inline-block">
          (180 ÷ 1 000) × (9 600 ÷ 4) = 0,18 × 2 400 = <strong>432,00 €</strong>
        </p>
        <p className="text-sm text-gray-500 mt-3">Le total des appels de tous les lots doit toujours être égal au quart du budget annuel voté — ici <strong>2 400 €</strong>. Si votre total ne colle pas, il y a une erreur de tantièmes ou d&apos;arrondi.</p>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Générez vos appels de fonds automatiquement</p>
        <p className="text-sm text-gray-600 mb-4">
          Renseignez vos lots et vos tantièmes une seule fois. Mon Syndic Bénévole calcule chaque quote-part et génère les avis pour tous vos copropriétaires en 30 secondes — sans formule, sans erreur.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Générer mes appels de fonds automatiquement →
        </CtaLink>
      </div>

      <h2 id="types-charges" className={h2}>Charges générales vs charges spéciales : une distinction qui change tout</h2>

      <h3 className={h3}>Les charges générales</h3>
      <p className={p}>
        Elles concernent l&apos;ensemble des copropriétaires et se répartissent selon les <strong className={strong}>tantièmes généraux</strong> : assurance de l&apos;immeuble, administration, entretien des parties communes accessibles à tous.
      </p>

      <h3 className={h3}>Les charges spéciales</h3>
      <p className={p}>
        Elles touchent <strong className={strong}>uniquement les copropriétaires qui bénéficient du service</strong>. L&apos;ascenseur est l&apos;exemple le plus courant : les habitants du RDC ne l&apos;utilisent pas, ils n&apos;en financent pas l&apos;entretien (ou une part réduite définie dans le règlement). Même logique pour un système de chauffage collectif dont certains lots se sont désolidarisés.
      </p>
      <p className={p}>
        <strong className={strong}>Erreur fréquente chez les syndics bénévoles :</strong> appliquer les tantièmes généraux à une dépense qui devrait utiliser des tantièmes spéciaux. Résultat : certains paient trop, d&apos;autres pas assez — et une contestation en AG est toujours possible si la répartition ne colle pas au règlement.
      </p>

      <div className="my-6 rounded-xl bg-amber-50 border border-amber-200 p-5">
        <p className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">Exemple chiffré — ascenseur</p>
        <p className="text-sm text-gray-700 mb-3">
          Immeuble de 8 lots. Contrat entretien ascenseur : <strong>1 200 €/an</strong>. Le RDC (Lot 4, 72 tantièmes) n&apos;utilise pas l&apos;ascenseur.{' '}
          Les tantièmes <em>spéciaux ascenseur</em> définis au règlement portent uniquement sur les lots 1 à 3 et 5 à 8, soit un total de <strong>928 tantièmes spéciaux</strong>.
        </p>
        <div className="overflow-x-auto rounded-lg border border-amber-200">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-amber-50">
              <tr className="border-b border-amber-200">
                <th className="text-left py-2 px-3 text-amber-700 font-medium">Lot</th>
                <th className="text-right py-2 px-3 text-amber-700 font-medium">Tantièmes spéciaux</th>
                <th className="text-right py-2 px-3 text-amber-700 font-medium">Appel T1 ascenseur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100">
              <tr><td className="py-2 px-3 text-gray-700">Lot 1 — T3, 3e ét.</td><td className="py-2 px-3 text-right">180</td><td className="py-2 px-3 text-right font-semibold">58,62 €</td></tr>
              <tr className="bg-amber-50/50"><td className="py-2 px-3 text-gray-700">Lot 2 — T3, 2e ét.</td><td className="py-2 px-3 text-right">155</td><td className="py-2 px-3 text-right font-semibold">50,43 €</td></tr>
              <tr><td className="py-2 px-3 text-gray-700">Lot 4 — Studio RDC</td><td className="py-2 px-3 text-right text-gray-400 italic">0 (RDC)</td><td className="py-2 px-3 text-right text-gray-400 italic">0,00 €</td></tr>
              <tr className="bg-amber-100 font-semibold"><td className="py-2 px-3">Total</td><td className="py-2 px-3 text-right">928</td><td className="py-2 px-3 text-right text-amber-800">300,00 €</td></tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-500 mt-2">Formule Lot 1 : (180 ÷ 928) × (1 200 ÷ 4) = 0,1940 × 300 = 58,62 €</p>
      </div>

      <h2 id="calcul-trimestriel" className={h2}>Calculer un appel de fonds trimestriel : la méthode complète</h2>

      <ol className={ol}>
        <li className={li}>
          <strong className={strong}>Voter le budget prévisionnel en AG</strong> (majorité art. 24). Il liste toutes les dépenses prévisibles de l&apos;exercice : EDF communs, assurance MRI, contrat nettoyage, entretien ascenseur, espaces verts. Pour la Résidence du Parc 2025 : <strong className={strong}>9 600 €</strong>.
        </li>
        <li className={li}>
          <strong className={strong}>Diviser par quatre.</strong> 9 600 ÷ 4 = 2 400 € à appeler ce trimestre sur l&apos;ensemble des lots.
        </li>
        <li className={li}>
          <strong className={strong}>Appliquer les tantièmes.</strong> Pour chaque lot, (tantièmes ÷ total) × 2 400. Le tableau ci-dessus donne les montants exacts.
        </li>
        <li className={li}>
          <strong className={strong}>Identifier les charges spéciales</strong> et les ajouter selon leurs propres tantièmes pour les lots concernés.
        </li>
        <li className={li}>
          <strong className={strong}>Vérifier les soldes.</strong> Un copropriétaire avec un crédit existant (régularisation précédente) peut le déduire de son appel actuel. Un débiteur se voit rappeler le montant restant.
        </li>
        <li className={li}>
          <strong className={strong}>Envoyer l&apos;avis de paiement</strong> 10 à 15 jours avant la date d&apos;échéance. Voir le modèle ci-dessous.
        </li>
      </ol>

      <h2 id="template-avis" className={h2}>Modèle d&apos;avis de paiement : ce qu&apos;il faut obligatoirement mentionner</h2>
      <p className={p}>Aucun format légal imposé, mais ces éléments permettent d&apos;éviter toute contestation :</p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-8 text-sm leading-relaxed">
        <p className="text-gray-400 text-xs mb-4 font-sans uppercase tracking-wider">— Modèle d&apos;avis de paiement —</p>
        <p className="mb-2 text-gray-800 font-semibold">SYNDICAT DES COPROPRIÉTAIRES</p>
        <p className="mb-1 text-gray-700">Résidence du Parc — 12 rue des Lilas, 69001 Lyon</p>
        <p className="mb-4 text-gray-700">Syndic bénévole : Nathalie MOREL — nathalie.morel@email.fr — 06 XX XX XX XX</p>
        <p className="mb-1 text-gray-700"><span className="font-medium">À l&apos;attention de :</span> M. et Mme BERNARD</p>
        <p className="mb-4 text-gray-700"><span className="font-medium">Lot n° 2</span> — T3, 2e étage — 155/1000e</p>
        <p className="mb-2 text-gray-800 font-semibold">APPEL DE FONDS PROVISIONNEL — 2e TRIMESTRE 2025</p>
        <p className="mb-4 text-gray-600">Période : 1er avril — 30 juin 2025 &nbsp;|&nbsp; Échéance : <strong>1er avril 2025</strong></p>
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="mb-1 text-gray-700">Budget annuel voté en AG du 15 mars 2025 ............... 9 600,00 €</p>
          <p className="mb-1 text-gray-700">Votre quote-part (155/1000) ........................................ 15,5 %</p>
          <p className="mb-1 text-gray-700">Appel trimestriel charges courantes ............................ 372,00 €</p>
          <p className="mb-1 text-gray-700">Fonds de travaux ALUR (prorata trimestriel) ................. 18,60 € (5 % budget ÷ 4 × tantièmes)</p>
          <p className="mb-1 text-gray-700">Solde précédent ........................................................... 0,00 €</p>
          <p className="mt-2 border-t border-gray-300 pt-2 font-bold text-gray-900">TOTAL À RÉGLER : 390,60 €</p>
        </div>
        <div className="mt-4 text-gray-700">
          <p className="font-medium mb-1">Coordonnées bancaires :</p>
          <p>IBAN : FR76 XXXX XXXX XXXX XXXX XXXX XXX</p>
          <p>Référence virement : BERNARD-LOT2-Q2-2025</p>
        </div>
      </div>

      <p className={p}>Envoyez cet avis par <strong className={strong}>e-mail avec accusé de lecture</strong> — pas besoin de recommandé pour les appels ordinaires. Conservez une copie de chaque envoi (date + destinataire) pour le suivi en cas de litige.</p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Générez vos appels de fonds automatiquement — avis PDF inclus</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole calcule les quotes-parts, génère les avis de paiement et envoie les e-mails à tous vos copropriétaires en un clic — avec leur solde courant et leur historique. Essai gratuit 14 jours.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Générer mes appels de fonds automatiquement →
        </CtaLink>
      </div>

      <h2 id="appel-exceptionnel" className={h2}>L&apos;appel de fonds exceptionnel : même logique, calendrier différent</h2>
      <p className={p}>
        L&apos;AG vote des travaux non prévus au budget — disons le remplacement de la porte d&apos;entrée pour 4 800 €. Un appel exceptionnel est lancé, réparti selon les mêmes tantièmes généraux.
      </p>
      <p className={p}>
        Pour un chantier plus lourd (ravalement : 40 000 € sur un immeuble de 8 lots), l&apos;AG vote en général un <strong className={strong}>fractionnement en 3 tranches</strong> : 40 % à la signature du devis (16 000 €), 40 % en cours de chantier (16 000 €), 20 % à la réception (8 000 €). Pour le Lot 1 (180/1000), le premier appel : 16 000 × 18 % = <strong className={strong}>2 880 €</strong>.
      </p>
      <p className={p}>
        <strong className={strong}>Point souvent manqué :</strong> pour des travaux sur un équipement à usage partiel (ascenseur, chauffage collectif d&apos;un bâtiment), ce sont les <em>tantièmes spéciaux</em> qui s&apos;appliquent. Vérifiez votre règlement de copropriété avant d&apos;émettre.
      </p>

      <h2 id="impayes" className={h2}>Un copropriétaire ne paie pas : la procédure complète</h2>
      <p className={p}>
        Situation concrète : M. Léonard, Lot 5, n&apos;a pas payé son appel du 1er trimestre (295 €). Vous êtes au 20 mars. Voici la procédure étape par étape.
      </p>

      <h3 className={h3}>Étape 1 — Relance amiable (J+15 après échéance)</h3>
      <p className={p}>
        Un simple e-mail ou un mot dans la boîte aux lettres. 80 % des retards se règlent ici — les gens oublient, changent de compte bancaire, ont eu un problème ponctuel. Gardez le ton neutre et factuel.
      </p>

      <h3 className={h3}>Étape 2 — Mise en demeure par recommandé (J+45)</h3>
      <p className={p}>Si le silence persiste, envoyez une <strong className={strong}>lettre recommandée avec accusé de réception</strong>. Elle doit mentionner : le montant exact, la date d&apos;échéance, la référence à l&apos;appel de fonds, et la demande de régularisation sous 15 jours.</p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="font-semibold text-amber-800 mb-3 text-sm">Modèle de mise en demeure (extrait)</p>
        <p className="text-gray-700 text-sm italic leading-relaxed">
          &ldquo;Monsieur LÉONARD, en ma qualité de syndic bénévole du Syndicat des Copropriétaires de la Résidence du Parc (élu par l&apos;AG du [date]), je vous mets en demeure de régler sous 15 jours la somme de <strong>295,00 €</strong> correspondant à votre appel de fonds provisionnel du 1er janvier 2025 (1er trimestre), demeuré impayé à ce jour. À défaut de règlement dans ce délai, le syndicat engagera, sans nouveau préavis, les procédures légales à sa disposition, incluant une injonction de payer devant le tribunal judiciaire.&rdquo;
        </p>
        <p className="text-gray-600 mt-2 text-xs">Signature du syndic, date, mention &ldquo;Envoyée par LRAR n° [numéro de suivi]&rdquo;</p>
      </div>

      <h3 className={h3}>Étape 3 — Injonction de payer (J+90)</h3>
      <p className={p}>
        Si l&apos;impayé dépasse 3 mois et que la mise en demeure est sans effet, le syndic saisit le tribunal judiciaire par voie d&apos;<strong className={strong}>injonction de payer</strong> (formulaire Cerfa n° 12948). Procédure simplifiée, coût ~35 €, décision rendue en quelques semaines sans audience obligatoire. Le titre exécutoire obtenu permet une saisie sur compte bancaire ou sur salaire.
      </p>
      <p className={p}>
        À noter : les <strong className={strong}>intérêts au taux légal</strong> courent à compter de la mise en demeure (art. 36 du décret de 1967). Sur 295 €, cela représente quelques euros — mais la mention dans la lettre a souvent un effet déclencheur immédiat.
      </p>

      <h3 className={h3}>Ce que dit la loi sur l&apos;hypothèque légale</h3>
      <p className={p}>
        Le syndicat bénéficie d&apos;une <strong className={strong}>hypothèque légale sur le lot du débiteur</strong>. En cas de vente de l&apos;appartement, la somme due est prélevée sur le prix de cession avant tout autre créancier (hors banque hypothécaire). Cette protection existe de plein droit — vous n&apos;avez aucune démarche à faire pour en bénéficier.
      </p>

      <h2 id="regularisation" className={h2}>La régularisation annuelle : comment la présenter en AG</h2>
      <p className={p}>En fin d&apos;exercice, on compare les sommes appelées aux dépenses réelles. Deux scénarios :</p>
      <ul className={ul}>
        <li className={li}>
          <strong className={strong}>Dépenses réelles &gt; budget appelé :</strong> un appel de régularisation est émis pour combler l&apos;écart.
        </li>
        <li className={li}>
          <strong className={strong}>Dépenses réelles &lt; budget appelé :</strong> les copropriétaires ont trop versé. Le surplus reste à leur crédit et vient en déduction du premier appel de l&apos;exercice suivant.
        </li>
      </ul>

      <div className="my-6 rounded-xl border border-gray-200 overflow-x-auto">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 pt-4 mb-2">Exemple — Résidence du Parc, exercice 2025</p>
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50">
            <tr className="border-b border-gray-200">
              <th className="text-left py-2 px-4 text-gray-500 font-medium">Poste de charge</th>
              <th className="text-right py-2 px-4 text-gray-500 font-medium">Budget voté</th>
              <th className="text-right py-2 px-4 text-gray-500 font-medium">Dépenses réelles</th>
              <th className="text-right py-2 px-4 text-gray-500 font-medium">Écart</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            <tr><td className="py-2 px-4 text-gray-700">Assurance MRI</td><td className="py-2 px-4 text-right">1 800 €</td><td className="py-2 px-4 text-right">1 750 €</td><td className="py-2 px-4 text-right text-green-700">− 50 €</td></tr>
            <tr className="bg-gray-50"><td className="py-2 px-4 text-gray-700">Entretien parties communes</td><td className="py-2 px-4 text-right">2 400 €</td><td className="py-2 px-4 text-right">2 400 €</td><td className="py-2 px-4 text-right text-gray-400">0 €</td></tr>
            <tr><td className="py-2 px-4 text-gray-700">Contrat nettoyage</td><td className="py-2 px-4 text-right">1 800 €</td><td className="py-2 px-4 text-right">1 800 €</td><td className="py-2 px-4 text-right text-gray-400">0 €</td></tr>
            <tr className="bg-gray-50"><td className="py-2 px-4 text-gray-700">Électricité parties communes</td><td className="py-2 px-4 text-right">1 200 €</td><td className="py-2 px-4 text-right">1 250 €</td><td className="py-2 px-4 text-right text-red-600">+ 50 €</td></tr>
            <tr><td className="py-2 px-4 text-gray-700">Entretien espaces verts</td><td className="py-2 px-4 text-right">1 200 €</td><td className="py-2 px-4 text-right">1 200 €</td><td className="py-2 px-4 text-right text-gray-400">0 €</td></tr>
            <tr className="bg-gray-50"><td className="py-2 px-4 text-gray-700">Divers administration</td><td className="py-2 px-4 text-right">600 €</td><td className="py-2 px-4 text-right">600 €</td><td className="py-2 px-4 text-right text-gray-400">0 €</td></tr>
            <tr><td className="py-2 px-4 text-gray-700 font-medium">Réparation chaudière (urgence)</td><td className="py-2 px-4 text-right font-medium">0 €</td><td className="py-2 px-4 text-right font-medium">750 €</td><td className="py-2 px-4 text-right text-red-600 font-medium">+ 750 €</td></tr>
            <tr className="bg-blue-50 font-semibold border-t border-gray-200">
              <td className="py-3 px-4 text-gray-800">Total exercice</td>
              <td className="py-3 px-4 text-right">9 600 €</td>
              <td className="py-3 px-4 text-right">10 350 €</td>
              <td className="py-3 px-4 text-right text-red-600">+ 750 €</td>
            </tr>
          </tbody>
        </table>
        <div className="px-4 py-3 bg-red-50 border-t border-red-100">
          <p className="text-sm text-red-800">
            <strong>Appel de régularisation à émettre :</strong> 750 € répartis par tantièmes.{' '}
            Lot 1 (180/1 000) : 750 × 18 % = <strong>135 €</strong>.{' '}
            Lot 4 (72/1 000) : 750 × 7,2 % = <strong>54 €</strong>.
          </p>
        </div>
      </div>

      <p className={p}>
        En AG, présentez ce tableau ligne par ligne. Les copropriétaires comprennent les imprévus — ce qu&apos;ils ne tolèrent pas, c&apos;est l&apos;opacité. Le poste &ldquo;réparation chaudière&rdquo; avec une date et un devis en annexe désamorce 100 % des questions.
      </p>

      <h2 id="solution" className={h2}>La solution : arrêtez de recalculer ce qui peut être automatique</h2>
      <h2 id="manuel-vs-outil" className={h2}>Ce que ça représente de faire ça manuellement</h2>
      <p className={p}>Estimons le temps pour une copropriété de 8 lots sur un trimestre :</p>
      <ul className={ul}>
        <li className={li}>Ouvrir le tableau Excel, vérifier/recalculer les quotes-parts : 20 min</li>
        <li className={li}>Rédiger et mettre en forme 8 avis de paiement en PDF : 45 min</li>
        <li className={li}>Envoyer les 8 e-mails, noter les accusés de réception : 15 min</li>
        <li className={li}>Suivre les virements entrants sur le relevé bancaire, pointer chaque paiement : 20 min/mois × 3 = 60 min</li>
        <li className={li}>Relancer 1 à 2 retardataires (e-mail + éventuel recommandé) : 20 min</li>
        <li className={li}>Préparer le tableau de régularisation fin d&apos;exercice : 2 h</li>
      </ul>
      <p className={p}>Total estimé : <strong className={strong}>~6 heures par trimestre</strong>, soit 24 heures par an rien que sur les appels de fonds. Sans compter les erreurs sur les tantièmes que personne ne détecte avant l&apos;AG.</p>

      <h2 id="fonds-travaux-alur" className={h2}>Ne pas confondre appel courant et fonds de travaux ALUR</h2>
      <p className={p}>
        Depuis le <strong className={strong}>1er janvier 2025</strong> (loi Habitat dégradé du 9 avril 2024), <strong className={strong}>toutes les copropriétés</strong> ont l&apos;obligation de constituer un <strong className={strong}><a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a></strong> sur un compte bancaire séparé, alimenté chaque année d&apos;au moins 5 % du budget prévisionnel. Cette obligation existait depuis 2017 pour les copropriétés de plus de 10 lots — elle s&apos;étend désormais aux petites structures sans exception.
      </p>
      <p className={p}>
        Point critique à communiquer à vos copropriétaires : les sommes versées au fonds de travaux <strong className={strong}>ne sont pas remboursables lors d&apos;une vente</strong>. Elles restent acquises à la copropriété. C&apos;est une des sources de confusion les plus fréquentes — et elle génère des tensions si vous ne l&apos;anticipez pas.
      </p>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>À quelle date exactement envoyer les appels de fonds ?</h3>
      <p className={p}>Les appels provisionnels sont exigibles au premier jour de chaque trimestre : 1er janvier, 1er avril, 1er juillet, 1er octobre. En pratique, envoyez l&apos;avis 10 à 15 jours avant l&apos;échéance pour que les copropriétaires aient le temps de programmer leur virement.</p>

      <h3 className={h3}>Peut-on envoyer les appels par e-mail ou faut-il une lettre recommandée ?</h3>
      <p className={p}>L&apos;e-mail suffit pour les appels ordinaires — aucune obligation légale de recommandé à ce stade. Le recommandé s&apos;impose uniquement pour les mises en demeure en cas d&apos;impayé et pour les convocations d&apos;AG.</p>

      <h3 className={h3}>Comment gérer les arrondis quand les tantièmes donnent des centimes ?</h3>
      <p className={p}>Arrondissez à l&apos;euro inférieur pour chaque lot, puis affectez l&apos;écart cumulé sur le lot de référence (généralement le plus grand). Notez la méthode d&apos;arrondi utilisée pour que la vérification en AG soit possible.</p>

      <h3 className={h3}>Un immeuble avec ascenseur peut-il avoir plusieurs grilles de tantièmes ?</h3>
      <p className={p}>Oui — c&apos;est même courant. Un immeuble avec ascenseur, gardiennage et chauffage collectif peut avoir jusqu&apos;à 4 grilles différentes (généraux, ascenseur, chauffage, eau froide…). Chaque dépense est répartie selon la grille correspondante définie dans le règlement.</p>

      <h3 className={h3}>Un copropriétaire peut-il contester son appel de fonds ?</h3>
      <p className={p}>Il peut contester si la répartition ne correspond pas aux tantièmes du règlement. La contestation d&apos;une décision votée en AG doit intervenir dans les <strong className={strong}>deux mois suivant la notification du PV</strong>. Pour une erreur de calcul pure, régularisez dès que c&apos;est identifié — pas de délai légal dans ce cas.</p>

      <h3 className={h3}>Comment gérer un lot en indivision (plusieurs propriétaires) ?</h3>
      <p className={p}>L&apos;appel est adressé à l&apos;indivision dans son ensemble. Les co-indivisaires désignent un représentant unique vis-à-vis du syndic. Vous n&apos;avez pas à gérer la répartition interne entre eux.</p>

      <h3 className={h3}>Peut-on "sauter" un trimestre si la trésorerie est suffisante ?</h3>
      <p className={p}>Les appels provisionnels sont légalement dus à date fixe, quelle que soit la trésorerie. Si la copropriété a un excédent important, l&apos;AG peut voter un budget prévisionnel réduit pour l&apos;exercice suivant. Ne sautez pas un appel sans décision formelle de l&apos;AG — cela crée des problèmes comptables en fin d&apos;exercice.</p>

      <h2 id="ce-quil-faut-retenir" className={h2}>Ce qu&apos;il faut retenir</h2>
      <p className={p}>
        L&apos;appel de fonds est la colonne vertébrale financière de votre copropriété. Le principe de calcul est simple — c&apos;est le suivi dans le temps qui crée des difficultés sans outil adapté : qui a payé, qui est en retard, comment régulariser proprement en fin d&apos;exercice.
      </p>
      <p className={p}>
        Un copropriétaire qui comprend d&apos;où vient son montant, reçoit un avis clair avec la bonne date d&apos;échéance, et peut consulter son historique de paiement est un copropriétaire qui paie à temps et qui fait confiance au syndic.
      </p>
      <p className={p}>
        <strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> ou les <a href="/blog/obligations-syndic-benevole" className={a}>obligations complètes du syndic bénévole</a>.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-2">Générez vos appels de fonds automatiquement — en 30 secondes</p>
        <p className="text-sm text-blue-100 mb-4">Tantièmes, quotes-parts, avis de paiement, suivi des virements — tout en un. 14 jours d&apos;essai gratuit, sans carte bancaire.</p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Générer mes appels de fonds automatiquement →
        </CtaLink>
      </div>
    </>
  );
}
