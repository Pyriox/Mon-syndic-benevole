// ============================================================
// Article : Obligations du syndic bénévole
// Target KW : "obligations syndic bénévole"
// Silo : SILO 3 — Obligations légales
// ============================================================

import Link from 'next/link';
import { h2, h3, p, ul, li, strong, a } from './styles';

export default function ArticleObligationsSyndicBenevole() {
  return (
    <>
      <p className={p}>
        Vous venez d&apos;être élu syndic bénévole lors de l&apos;AG. Félicitations — et bonne chance. Parce que dès le lendemain, les mêmes obligations légales qu&apos;un cabinet professionnel pèsent sur vous. Mêmes délais, mêmes responsabilités, même risque de mise en cause.
      </p>
      <p className={p}>
        Ce guide liste <strong className={strong}>toutes les obligations du syndic bénévole</strong> — administratives, financières et opérationnelles — avec les références légales pour chacune. Considérez-le comme votre base de référence permanente.
      </p>

      {/* Section 1 */}
      <h2 id="cadre-legal" className={h2}>D&apos;où viennent ces obligations&nbsp;? Le cadre légal en deux textes</h2>
      <p className={p}>
        Les obligations du syndic bénévole découlent principalement de deux textes&nbsp;:
      </p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>La loi du 10 juillet 1965</strong> (loi sur la copropriété des immeubles bâtis) — elle définit le rôle, les pouvoirs et les responsabilités du syndic.</li>
        <li className={li}><strong className={strong}>Le décret du 17 mars 1967</strong> (décret d&apos;application) — il précise les modalités pratiques&nbsp;: délais, forme des convocations, contenu des comptes rendus.</li>
      </ul>
      <p className={p}>
        La loi ALUR (mars 2014) et ses ordonnances ont complété ce cadre, notamment en rendant le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux</a> obligatoire et en renforçant les exigences comptables. En tant que syndic bénévole, vous êtes soumis à l&apos;intégralité de ces textes — au même titre qu&apos;un cabinet.
      </p>

      {/* Section 2 */}
      <h2 id="obligations-administratives" className={h2}>Obligations administratives</h2>

      <h3 className={h3}>Convoquer et organiser l&apos;assemblée générale annuelle</h3>
      <p className={p}>
        L&apos;AG ordinaire doit se tenir chaque année, dans les <strong className={strong}>6 mois suivant la clôture de l&apos;exercice comptable</strong>. La convocation doit être envoyée à chaque copropriétaire avec un préavis minimum de <strong className={strong}>21 jours</strong> (article 9 du décret de 1967), par lettre recommandée avec accusé de réception ou remise en main propre contre signature.
      </p>
      <p className={p}>La convocation doit obligatoirement inclure&nbsp;:</p>
      <ul className={ul}>
        <li className={li}>L&apos;ordre du jour complet (chaque résolution doit être clairement formulée),</li>
        <li className={li}>Les justificatifs des dépenses et le budget prévisionnel,</li>
        <li className={li}>L&apos;état des impayés, le cas échéant,</li>
        <li className={li}>Le projet de contrat si un vote porte sur un nouveau prestataire.</li>
      </ul>

      <h3 className={h3}>Rédiger et diffuser le procès-verbal</h3>
      <p className={p}>
        Le PV de l&apos;AG doit être rédigé et adressé à chaque copropriétaire dans un délai d&apos;<strong className={strong}>un mois</strong> suivant la tenue de l&apos;AG (article 17-1 A du décret de 1967). Ce document a une valeur légale&nbsp;: il est la preuve des décisions prises et sert de référence en cas de litige.
      </p>

      <h3 className={h3}>Tenir le carnet d&apos;entretien de l&apos;immeuble</h3>
      <p className={p}>
        Obligatoire depuis la loi SRU (2000), le carnet d&apos;entretien répertorie l&apos;historique des travaux effectués, les contrats de maintenance en cours et les équipements collectifs. Il doit être mis à jour à chaque intervention significative et transmitted au syndic suivant lors d&apos;un changement.
      </p>

      <h3 className={h3}>Conserver les archives pendant 10 ans</h3>
      <p className={p}>
        PV des AG, contrats, factures, baux, correspondances importantes — tous ces documents doivent être conservés pendant <strong className={strong}>au moins 10 ans</strong>. Un archivage numérique bien structuré facilite grandement cette obligation.
      </p>

      {/* Section 3 */}
      <h2 id="obligations-financieres" className={h2}>Obligations financières</h2>

      <h3 className={h3}>Ouvrir et tenir un compte bancaire séparé</h3>
      <p className={p}>
        La loi impose que le compte bancaire de la copropriété soit ouvert au nom du <strong className={strong}>syndicat des copropriétaires</strong> — pas en votre nom personnel (article 18-2 de la loi de 1965). Ce compte doit être distinct du compte fonds de travaux (obligatoire pour les copropriétés de plus de 10 lots).
      </p>

      <h3 className={h3}>Émettre les appels de fonds provisionnels</h3>
      <p className={p}>
        Conformément au <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>budget prévisionnel voté en AG</a>, les appels de fonds sont émis chaque trimestre (ou selon la fréquence votée). Le calcul de la quote-part de chaque copropriétaire doit être basé sur les tantièmes définis dans le règlement de copropriété.
      </p>

      <h3 className={h3}>Établir et présenter les comptes annuels</h3>
      <p className={p}>
        Le syndic doit tenir une comptabilité en <strong className={strong}>parties doubles</strong> pour les copropriétés de plus de 10 lots (arrêté du 14 mars 2005). Pour les structures plus petites, une comptabilité de trésorerie simplifiée est acceptée. Dans tous les cas, les comptes doivent être présentés à l&apos;AG pour approbation.
      </p>

      <h3 className={h3}>Gérer le fonds de travaux ALUR</h3>
      <p className={p}>
        Obligatoire depuis le 1er janvier 2017 pour les copropriétés de plus de 10 lots, le fonds de travaux doit représenter <strong className={strong}>au minimum 5&nbsp;% du budget prévisionnel</strong> chaque année (article 14-2 de la loi de 1965). Les sommes doivent être déposées sur un compte bancaire <em>distinct</em> du compte courant.
      </p>

      {/* Inline CTA */}
      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Toutes ces obligations vous semblent complexes à suivre&nbsp;?</p>
        <p className="text-sm text-gray-600 mb-4">
          Mon Syndic Bénévole couvre l&apos;intégralité de ces obligations&nbsp;: appels de fonds générés automatiquement, fonds de travaux suivi séparément, convocations et PV d&apos;AG générés en un clic.
        </p>
        <Link
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Découvrir Mon Syndic Bénévole gratuitement →
        </Link>
      </div>

      {/* Section 4 */}
      <h2 id="obligations-operationnelles" className={h2}>Obligations opérationnelles</h2>

      <h3 className={h3}>Assurer et maintenir l&apos;immeuble</h3>
      <p className={p}>
        Le syndic est responsable de la souscription et du maintien de l&apos;<strong className={strong}>assurance multirisques immeuble (MRI)</strong>, qui couvre les sinistres touchant les parties communes. L&apos;absence d&apos;assurance l&apos;expose à une responsabilité personnelle en cas de dommage.
      </p>

      <h3 className={h3}>Gérer les contrats de prestataires</h3>
      <p className={p}>
        Entretien des parties communes, maintenance de l&apos;ascenseur, vérification des extincteurs, contrat de nettoyage — le syndic passe les contrats au nom du syndicat et en supervise l&apos;exécution. Il doit les noter dans le carnet d&apos;entretien et les présenter à l&apos;AG.
      </p>

      <h3 className={h3}>Déclarer les sinistres dans les délais</h3>
      <p className={p}>
        En cas de dégât des eaux, d&apos;incendie ou d&apos;autre sinistre, le syndic doit déclarer l&apos;événement à l&apos;assurance dans les délais contractuels (souvent 5 jours ouvrés). Un retard peut conduire à une déchéance de garantie.
      </p>

      {/* Section 5 */}
      <h2 id="obligations-information" className={h2}>Obligations d&apos;information envers les copropriétaires</h2>

      <h3 className={h3}>L&apos;espace en ligne sécurisé (extranet) depuis 2015</h3>
      <p className={p}>
        La loi ALUR oblige les syndics professionnels à mettre à disposition des copropriétaires un espace en ligne permettant d&apos;accéder aux documents de la copropriété. Pour les syndics bénévoles, cette obligation formelle ne s&apos;applique pas strictement, mais elle est une bonne pratique que toute solution logicielle moderne intègre.
      </p>

      <h3 className={h3}>Informer en cas de mutations (ventes de lots)</h3>
      <p className={p}>
        Lors de la vente d&apos;un lot, le syndic doit délivrer un <strong className={strong}>état daté</strong> (article 5 du décret de 1967) incluant les charges courantes dues par le vendeur, les travaux votés non encore exécutés, le montant du fonds de travaux affecté au lot. Ce document est obligatoire avant la signature de l&apos;acte de vente.
      </p>

      {/* Section 6 — Checklist récap */}
      <h2 id="checklist" className={h2}>Checklist récapitulative des obligations par fréquence</h2>

      <h3 className={h3}>Chaque trimestre</h3>
      <ul className={ul}>
        <li className={li}>✓ Émettre les appels de fonds provisionnels</li>
        <li className={li}>✓ Suivre les paiements et relancer les retardataires</li>
        <li className={li}>✓ Enregistrer les dépenses dans la comptabilité</li>
        <li className={li}>✓ Vérifier les soldes du compte courant et du compte fonds de travaux</li>
      </ul>

      <h3 className={h3}>Chaque année</h3>
      <ul className={ul}>
        <li className={li}>✓ Clôturer l&apos;exercice comptable et préparer les comptes annuels</li>
        <li className={li}>✓ Convoquer l&apos;AG avec 21 jours de préavis minimum</li>
        <li className={li}>✓ Présenter le budget prévisionnel et les comptes de l&apos;exercice</li>
        <li className={li}>✓ Voter le montant du fonds de travaux (si applicable)</li>
        <li className={li}>✓ Envoyer le PV dans le mois suivant l&apos;AG</li>
        <li className={li}>✓ Renouveler ou renégocier les contrats arrivant à échéance</li>
        <li className={li}>✓ Mettre à jour le carnet d&apos;entretien</li>
      </ul>

      <h3 className={h3}>À chaque événement</h3>
      <ul className={ul}>
        <li className={li}>✓ Déclarer les sinistres à l&apos;assurance dans les délais</li>
        <li className={li}>✓ Émettre l&apos;état daté en cas de vente d&apos;un lot</li>
        <li className={li}>✓ Relancer par mise en demeure après 90 jours d&apos;impayés</li>
        <li className={li}>✓ Convoquer une AG extraordinaire si nécessaire</li>
      </ul>

      {/* Section 7 — Risques */}
      <h2 id="risques-manquement" className={h2}>Ce que vous risquez en cas de manquement</h2>
      <p className={p}>
        Le syndic bénévole engage sa responsabilité civile dans l&apos;exercice de son mandat, comme tout mandataire. En cas de faute (oubli de convoquer l&apos;AG dans les délais, absence d&apos;assurance, comptabilité irrégulière), les copropriétaires lésés peuvent engager une action en responsabilité.
      </p>
      <p className={p}>Exemples de manquements ayant conduit à des condamnations&nbsp;:</p>
      <ul className={ul}>
        <li className={li}>Non-déclaration d&apos;un sinistre dans les délais → déchéance de garantie assurance, coût supporté par la copropriété</li>
        <li className={li}>AG convoquée hors délai → annulation judiciaire de résolutions votées</li>
        <li className={li}>Compte bancaire non séparé → responsabilité personnelle sur les fonds</li>
        <li className={li}>Fonds de travaux non constitué → mise en demeure et amende potentielle</li>
      </ul>

      {/* FAQ */}
      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Un syndic bénévole est-il responsable sur ses biens personnels&nbsp;?</h3>
      <p className={p}>En cas de faute simple, le syndic bénévole engage sa responsabilité civile — ce qui peut théoriquement aller jusqu&apos;à une indemnisation sur ses biens propres. En pratique, les condamnations sont rares pour les erreurs de bonne foi. Une assurance de protection juridique est fortement recommandée.</p>

      <h3 className={h3}>Le syndic bénévole doit-il tenir une comptabilité en parties doubles&nbsp;?</h3>
      <p className={p}>Oui, si la copropriété comporte plus de 10 lots (arrêté du 14 mars 2005). Pour les structures de 10 lots et moins, une comptabilité simplifiée de trésorerie est acceptable. Dans tous les cas, les comptes doivent être clairs et présentés à l&apos;AG.</p>

      <h3 className={h3}>Peut-on exonérer le syndic bénévole de certaines obligations par vote en AG&nbsp;?</h3>
      <p className={p}>Non pour les obligations d&apos;ordre public (ouvrir un compte séparé, tenir les comptes, convoquer l&apos;AG). L&apos;AG peut adapter certaines modalités pratiques, mais elle ne peut pas dispenser le syndic de ses obligations légales fondamentales.</p>

      <h3 className={h3}>Que se passe-t-il si le syndic démissionne en cours de mandat&nbsp;?</h3>
      <p className={p}>Il doit en informer les copropriétaires et convoquer une AG dans les meilleurs délais pour élire son successeur. Il reste responsable jusqu&apos;à la passation effective de pouvoir. En cas d&apos;urgence, le conseil syndical peut prendre les mesures conservatoires nécessaires.</p>

      {/* Conclusion */}
      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Le syndic bénévole porte les mêmes obligations qu&apos;un professionnel agréé — sans les outils ni le back-office d&apos;un cabinet. Ce qui change la donne, c&apos;est l&apos;organisation&nbsp;: un calendrier rigoureux, un outil qui automatise les tâches répétitives (appels de fonds, relances, convocations), et une bonne documentation.
      </p>
      <p className={p}><strong className={strong}>Pour aller plus loin :</strong> consultez notre guide sur <a href="/blog/comment-devenir-syndic-benevole" className={a}>comment devenir syndic bénévole</a>, ou sur le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a>.</p>
    </>
  );
}
