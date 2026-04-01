// ============================================================
// Article : Migrer vers Mon Syndic Bénévole
// Target KW : "migrer logiciel syndic bénévole", "reprendre gestion copropriété"
// ============================================================

import CtaLink from '@/components/ui/CtaLink';
import { h2, h3, p, ul, ol, li, strong, a } from './styles';

export default function ArticleMigrer() {
  return (
    <>
      <h2 id="avant-de-commencer" className={h2}>Ce que vous devez rassembler avant de commencer</h2>
      <p className={p}>
        La migration est rapide si vous avez les bonnes pièces sous la main. Voici ce dont vous aurez besoin — la plupart de ces documents sont dans les archives remises par votre ancien syndic, ou dans vos propres classeurs.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="font-semibold text-amber-800 mb-3 text-sm">Documents à préparer avant de démarrer</p>
        <div className="space-y-3">
          {[
            {
              label: 'Règlement de copropriété + état descriptif de division',
              detail: 'La source des tantièmes de chaque lot — généraux et spéciaux. Sans ça, vous ne pouvez pas calculer les quotes-parts.',
            },
            {
              label: 'Liste des copropriétaires',
              detail: 'Nom, adresse, numéro de lot, e-mail de contact. Si vous en avez plusieurs, prenez l\'e-mail qu\'ils consultent.',
            },
            {
              label: 'Relevés bancaires récents',
              detail: 'Le solde du compte courant à la date de migration, pour renseigner les soldes de départ des copropriétaires.',
            },
            {
              label: 'Dernier budget prévisionnel voté en AG',
              detail: 'C\'est la base du premier appel de fonds. Si vous n\'en avez pas, vous pourrez saisir manuellement le montant de chaque poste de charges.',
            },
            {
              label: 'Documents importants à archiver',
              detail: 'PV d\'AG des 3 dernières années, contrats d\'entretien, attestations d\'assurance — à importer une fois l\'espace créé.',
            },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <span className="flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 border-amber-400 bg-white" aria-hidden="true" />
              <div>
                <p className="text-sm font-semibold text-gray-900">{item.label}</p>
                <p className="text-xs text-gray-600 mt-0.5">{item.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <p className={p}>
        Si vous migrez depuis Excel, ces informations sont probablement dispersées dans plusieurs fichiers. Si vous venez d&apos;un syndic professionnel, elles doivent figurer dans les archives qu&apos;il est légalement tenu de vous remettre dans les 15 jours suivant la fin de son mandat (art. 18-2 de la loi du 10 juillet 1965). Consultez notre <a href="/blog/comment-devenir-syndic-benevole" className={a}>guide sur les 30 premiers jours du syndic bénévole</a> si vous venez de reprendre le mandat, ou notre <a href="/blog/gerer-copropriete-sans-syndic-professionnel" className={a}>guide complet pour gérer sa copropriété sans syndic professionnel</a> si vous êtes dans la phase de réflexion.
      </p>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">Vous avez vos documents ? C&apos;est parti.</p>
        <p className="text-sm text-gray-600 mb-4">
          Créez votre espace en moins d&apos;une minute. Aucune installation nécessaire, aucune carte bancaire requise pour démarrer.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Créer mon espace gratuit →
        </CtaLink>
      </div>

      <h2 id="etape-1" className={h2}>Étape 1 — Créer la copropriété</h2>
      <p className={p}>
        Depuis votre tableau de bord, cliquez sur <strong className={strong}>&ldquo;Nouvelle copropriété&rdquo;</strong>. Renseignez le nom de l&apos;immeuble, l&apos;adresse complète et le code postal. C&apos;est tout pour l&apos;étape de création initiale — vous affinerez les détails en ajoutant les lots.
      </p>
      <p className={p}>
        Si vous gérez plusieurs immeubles (un propriétaire qui gère le bâtiment A et le bâtiment B du même ensemble, par exemple), créez autant de copropriétés que nécessaire. Chaque copropriété dispose de son propre espace avec ses lots, ses appels de fonds, ses copropriétaires et ses documents — entièrement cloisonnés.
      </p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm">
        <p className="font-semibold text-blue-800 mb-1">Le sélecteur multi-copropriétés</p>
        <p className="text-gray-600">En haut à gauche du tableau de bord, un sélecteur vous permet de basculer d&apos;une copropriété à l&apos;autre en un clic. Chacune a son propre abonnement et ses propres données.</p>
      </div>

      <h2 id="etape-2" className={h2}>Étape 2 — Saisir les lots et les tantièmes</h2>
      <p className={p}>
        C&apos;est l&apos;étape la plus importante de la migration : <strong className={strong}>toute la répartition des charges repose sur cette base</strong>. Chaque erreur sur les tantièmes se répercutera automatiquement sur tous les <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appels de fonds</a> futurs.
      </p>
      <p className={p}>
        Pour chaque lot, saisissez :
      </p>
      <ul className={ul}>
        <li className={li}><strong className={strong}>Le numéro de lot</strong> tel qu&apos;il figure au règlement de copropriété</li>
        <li className={li}><strong className={strong}>La désignation</strong> (appartement, cave, parking, local commercial…)</li>
        <li className={li}><strong className={strong}>Les tantièmes</strong> — la quote-part de chaque lot, tels qu&apos;ils figurent au règlement de copropriété (exprimés sur 1 000 ou 10 000 selon l&apos;immeuble)</li>
      </ul>
      <p className={p}>
        La source de référence est toujours le <strong className={strong}>règlement de copropriété et son état descriptif de division</strong> — pas le tableau de votre ancien syndic, qui peut contenir des erreurs historiques non corrigées.
      </p>

      <h3 className={h3}>Comment Mon Syndic Bénévole utilise vos tantièmes</h3>
      <p className={p}>
        Une fois les tantièmes saisis, la plateforme les utilise automatiquement pour calculer la quote-part de chaque copropriétaire sur chaque <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>appel de fonds</a>, sur chaque dépense et sur la régularisation annuelle des charges. Vous ne recalculerez plus jamais une répartition à la main.
      </p>

      <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 mb-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Exemple — Immeuble de 5 lots, 1&nbsp;000 tantièmes généraux</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse min-w-[380px]">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-3 text-gray-500 font-medium">Lot</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Tantièmes</th>
                <th className="text-right py-2 px-3 text-gray-500 font-medium">Quote-part (charges 5 000 €)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { lot: 'Appartement 1 (RDC)', t: 180, charges: 900 },
                { lot: 'Appartement 2 (1er)', t: 220, charges: 1100 },
                { lot: 'Appartement 3 (1er)', t: 220, charges: 1100 },
                { lot: 'Appartement 4 (2e)', t: 240, charges: 1200 },
                { lot: 'Cave / parking', t: 140, charges: 700 },
              ].map((row) => (
                <tr key={row.lot}>
                  <td className="py-2 px-3 text-gray-700">{row.lot}</td>
                  <td className="py-2 px-3 text-right text-gray-700">{row.t} / 1000</td>
                  <td className="py-2 px-3 text-right font-medium text-blue-700">{row.charges.toLocaleString('fr-FR')} €</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-gray-400 mt-3">Ce calcul est effectué automatiquement par Mon Syndic Bénévole dès qu&apos;un appel de fonds est créé.</p>
      </div>

      <h2 id="etape-3" className={h2}>Étape 3 — Inviter les copropriétaires</h2>
      <p className={p}>
        Depuis la section <strong className={strong}>&ldquo;Copropriétaires&rdquo;</strong>, ajoutez chaque copropriétaire en saisissant son nom, son adresse postale et son e-mail. Associez-le à son ou ses lots.
      </p>
      <p className={p}>
        Une fois le copropriétaire créé, vous pouvez lui envoyer une invitation par e-mail via le bouton <strong className={strong}>&ldquo;Inviter&rdquo;</strong>. Il accède alors à <strong className={strong}>son espace personnel</strong> : il peut y consulter ses appels de fonds, son historique de paiement, les comptes de la copropriété et les documents que vous y déposez. L&apos;invitation reste optionnelle — vous pouvez très bien gérer la copropriété seul et envoyer les documents par e-mail sans que vos copropriétaires aient à créer un compte.</p>

      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 text-sm">
        <p className="font-semibold text-blue-800 mb-1">Ce que voient les copropriétaires depuis leur espace</p>
        <ul className="space-y-1 text-gray-700 mt-1">
          {[
            'Leurs appels de fonds avec statut de paiement (payé / en attente / en retard)',
            'L\'historique de leurs soldes et paiements',
            'Les derniers comptes annuels',
            'Les documents déposés par le syndic (PV d\'AG, contrats, factures)',
            'L\'état de l\'immeuble (incidents signalés et leur statut)',
          ].map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">✓</span> {item}
            </li>
          ))}
        </ul>
      </div>

      <p className={p}>
        En pratique, 60 à 80 % des questions répétitives que reçoit un syndic (&ldquo;ai-je payé mon dernier appel ?&rdquo;, &ldquo;quel est mon solde ?&rdquo;, &ldquo;avez-vous le PV de l&apos;AG de l&apos;an dernier ?&rdquo;) trouvent leur réponse directement dans cet espace — sans intervention du syndic.
      </p>

      <h2 id="etape-4" className={h2}>Étape 4 — Reprendre le solde comptable de départ</h2>
      <p className={p}>
        Il ne s&apos;agit pas de ressaisir tout l&apos;historique comptable des années précédentes. Vous n&apos;avez besoin que du <strong className={strong}>solde de chaque copropriétaire à la date de votre migration</strong> : qui doit encore combien sur les appels précédents, et qui a un crédit éventuel.
      </p>
      <p className={p}>
        Ces informations se trouvent dans l&apos;état des impayés que l&apos;ancien syndic doit vous avoir remis. Si vous migrez depuis Excel, c&apos;est le solde de la dernière colonne de votre tableau de suivi.
      </p>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6">
        <p className="font-semibold text-amber-800 mb-2 text-sm">Bonne pratique sur le solde de départ</p>
        <p className="text-sm text-gray-700">
          Choisissez une date de migration qui coïncide avec le début d&apos;un trimestre ou d&apos;un exercice — ça simplifie la réconciliation. Si vous démarrez au milieu d&apos;un trimestre, renseignez le solde à la date exacte de migration et notez-la dans vos archives.
        </p>
      </div>

      <div className="my-8 rounded-2xl bg-blue-50 border border-blue-100 p-6">
        <p className="text-sm font-semibold text-blue-700 mb-1">À ce stade, votre copropriété est déjà structurée.</p>
        <p className="text-sm text-gray-600 mb-4">
          Lots, tantièmes, copropriétaires, soldes de départ — la structure de base est en place. Vous pouvez envoyer votre premier appel de fonds le jour même.
        </p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl transition-colors"
        >
          Démarrer ma migration →
        </CtaLink>
      </div>

      <h2 id="etape-5" className={h2}>Étape 5 — Créer le premier appel de fonds</h2>
      <p className={p}>
        C&apos;est souvent l&apos;étape la plus redoutée — et la plus simple une fois la structure en place. Pour comprendre en détail comment fonctionne le calcul et la répartition, consultez notre <a href="/blog/appel-de-fonds-copropriete-calcul-repartition" className={a}>guide complet sur les appels de fonds en copropriété</a>. Depuis la section <strong className={strong}>&ldquo;Appels de fonds&rdquo;</strong>, cliquez sur <strong className={strong}>&ldquo;Créer&rdquo;</strong>. La plateforme vous propose deux options :
      </p>

      <div className="my-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
          <p className="text-sm font-bold text-blue-800 mb-2">Depuis une AG avec budget approuvé</p>
          <p className="text-sm text-gray-600">Si vous avez une assemblée générale terminée avec un budget voté, la plateforme le présélectionne automatiquement. Elle importe le montant total et le calcul de répartition. Il suffit de choisir la date d&apos;échéance et de publier.</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <p className="text-sm font-bold text-gray-800 mb-2">Appel exceptionnel sans AG</p>
          <p className="text-sm text-gray-600">Pour une provision exceptionnelle, un rattrapage, ou si vous n&apos;avez pas encore créé d&apos;AG. Saisissez le montant total et la date d&apos;échéance — la répartition par tantièmes est calculée automatiquement.</p>
        </div>
      </div>

      <p className={p}>
        Une fois l&apos;appel de fonds <strong className={strong}>publié</strong>, la plateforme génère automatiquement un avis d&apos;appel de fonds individuel pour chaque copropriétaire (PDF) et peut l&apos;envoyer par e-mail en un clic. Chaque copropriétaire peut aussi le retrouver dans son espace personnel.
      </p>

      <h3 className={h3}>Le suivi des paiements</h3>
      <p className={p}>
        Depuis la liste des appels de fonds, vous visualisez en temps réel quel copropriétaire a payé, lequel est en attente, lequel est en retard. Le tableau de bord affiche un récapitulatif des impayés avec un indicateur d&apos;alerte. À partir d&apos;un certain délai, un bouton <strong className={strong}>&ldquo;Envoyer un rappel&rdquo;</strong> génère un e-mail de relance directement depuis l&apos;interface — sans avoir à ouvrir votre messagerie.
      </p>

      <h2 id="etape-6" className={h2}>Étape 6 — Importer les documents clés</h2>
      <p className={p}>
        La section <strong className={strong}>&ldquo;Documents&rdquo;</strong> centralise tous les fichiers de la copropriété : PV d&apos;AG, contrats prestataires, diagnostics, attestations d&apos;assurance, règlement de copropriété. Ils sont accessibles depuis le tableau de bord du syndic et, selon les droits que vous configurez, depuis l&apos;espace personnel de chaque copropriétaire.
      </p>
      <p className={p}>
        Inutile de tout importer le premier jour. Pour démarrer, concentrez-vous sur les documents les plus demandés :
      </p>
      <ul className={ul}>
        <li className={li}>PV de la dernière AG (copropriétaires le demandent régulièrement)</li>
        <li className={li}>Attestation d&apos;assurance multirisques immeuble en cours (demandée à chaque vente de lot)</li>
        <li className={li}>Règlement de copropriété (référence en cas de litige)</li>
        <li className={li}>Carnet d&apos;entretien de l&apos;immeuble (état des travaux réalisés)</li>
      </ul>
      <p className={p}>
        L&apos;obligation légale d&apos;archivage couvre <strong className={strong}>10 ans</strong> pour les PV d&apos;AG, contrats et factures — c&apos;est l&apos;une des <a href="/blog/obligations-syndic-benevole" className={a}>obligations légales du syndic bénévole</a>. Centraliser progressivement dans l&apos;outil évite le classeur physique difficile à retrouver.
      </p>

      <h2 id="etape-7" className={h2}>Étape 7 — Vérification avant le premier envoi</h2>
      <p className={p}>
        Avant d&apos;envoyer votre premier appel de fonds ou votre première convocation d&apos;AG, prenez 10 minutes pour vérifier :
      </p>

      <div className="my-6 rounded-xl border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 px-5 py-3 border-b border-gray-200">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Checklist — Avant le premier envoi</p>
        </div>
        <div className="divide-y divide-gray-100">
          {[
            {
              category: 'Structure',
              items: [
                'Tous les lots sont créés avec les bons numéros et tantièmes',
                'Le total des tantièmes généraux correspond au total du règlement (souvent 1 000 ou 10 000)',
                'Chaque copropriétaire est associé à son ou ses lots',
              ],
            },
            {
              category: 'Contacts',
              items: [
                'Les e-mails de tous les copropriétaires sont saisis et corrects',
                'Les adresses postales sont à jour (utile pour les LRAR)',
              ],
            },
            {
              category: 'Finances',
              items: [
                'Le solde de départ de chaque copropriétaire correspond à l\'état des impayés de l\'ancien syndic',
              ],
            },
            {
              category: 'Premier appel de fonds',
              items: [
                'Le montant total correspond au budget prévisionnel / 4 (si appel trimestriel)',
                'La date d\'échéance est cohérente avec votre calendrier habituel',
                'La répartition individuelle semble cohérente (vérifiez 2 ou 3 copropriétaires)',
              ],
            },
          ].map(({ category, items }) => (
            <div key={category} className="px-5 py-4">
              <p className="text-xs font-semibold text-blue-600 mb-2">{category}</p>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <span className="mt-0.5 flex-shrink-0 w-4 h-4 rounded border border-gray-300 bg-white" aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <p className={p}>
        Si tout est en ordre, votre migration est terminée. Vous pouvez publier votre premier appel de fonds et inviter vos copropriétaires.
      </p>

      <h2 id="ce-que-vous-gagnez" className={h2}>Ce que vous gagnez concrètement le premier mois</h2>

      <div className="my-6 space-y-3">
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-base text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Appels de fonds calculés automatiquement</p>
            <p className="text-xs text-gray-600">Fini les formules Excel à vérifier manuellement. La répartition par tantièmes est calculée à chaque appel, pour chaque lot, sans erreur possible.</p>
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-base text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Suivi des impayés en temps réel</p>
            <p className="text-xs text-gray-600">Le tableau de bord signale dès le premier jour de retard. Vous ne découvrez plus les impayés 3 mois après en vérifiant vos relevés bancaires.</p>
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-base text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Copropriétaires autonomes sur leurs documents</p>
            <p className="text-xs text-gray-600">Chaque copropriétaire accède à son espace dès son invitation. Les demandes &ldquo;quel est mon solde ?&rdquo; disparaissent progressivement.</p>
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-base text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">AG préparée en 2 heures au lieu de 6</p>
            <p className="text-xs text-gray-600">Les convocations sont générées depuis l&apos;outil avec vérification automatique du délai de 21 jours. Les comptes sont déjà en ordre — vous n&apos;avez plus à les reconstituer la veille.</p>
          </div>
        </div>
        <div className="rounded-xl border border-green-100 bg-green-50 p-4 flex gap-3">
          <span className="flex-shrink-0 text-base text-green-500 mt-0.5">✓</span>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-0.5">Régularisation annuelle automatisée</p>
            <p className="text-xs text-gray-600">En fin d&apos;exercice, la plateforme compare les provisions appelées aux dépenses réelles et calcule automatiquement le solde de chaque copropriétaire — complément à payer ou trop-perçu à rembourser. Le <a href="/blog/fonds-de-travaux-alur-obligations-montant-gestion" className={a}>fonds de travaux ALUR</a> est suivi séparément, conformément à la loi.</p>
          </div>
        </div>
      </div>

      <h2 id="questions-frequentes" className={h2}>Questions fréquentes</h2>

      <h3 className={h3}>Combien de temps faut-il pour migrer depuis un syndic professionnel ?</h3>
      <p className={p}>
        Pour une copropriété de 10 à 20 lots, comptez environ 2 heures si vous avez tous vos documents en main. La majorité du temps est consacrée à la saisie des tantièmes et des données copropriétaires. Une fois fait, vous ne recommencez pas. Si vous venez de décider de gérer vous-même, lisez d&apos;abord notre <a href="/blog/comment-devenir-syndic-benevole" className={a}>guide sur les démarches pour devenir syndic bénévole</a>.
      </p>

      <h3 className={h3}>Faut-il ressaisir tout l&apos;historique comptable des années précédentes ?</h3>
      <p className={p}>
        Non. Seul le solde de départ à la date de migration est nécessaire. L&apos;historique des exercices précédents peut rester dans vos archives Excel ou papier — il n&apos;impacte pas la gestion courante sur Mon Syndic Bénévole.
      </p>

      <h3 className={h3}>Peut-on migrer en cours d&apos;année, sans attendre le 1er janvier ?</h3>
      <p className={p}>
        Oui. La migration est indépendante du calendrier de l&apos;exercice. Si vous démarrez en cours de trimestre, renseignez le solde à la date exacte de migration. L&apos;exercice en cours se poursuit normalement depuis cette date dans la plateforme.
      </p>

      <h3 className={h3}>Que se passe-t-il si j&apos;ai plusieurs copropriétaires sur le même lot (indivision) ?</h3>
      <p className={p}>
        Créez chaque copropriétaire séparément et associez-les tous au même lot. Pour les appels de fonds, l&apos;avis est adressé à chaque indivisaire — à vous de clarifier avec eux la répartition interne, qui ne concerne pas la copropriété dans son ensemble.
      </p>

      <h3 className={h3}>Les données sont-elles sécurisées lors de la migration ?</h3>
      <p className={p}>
        Mon Syndic Bénévole est hébergé sur infrastructure européenne conforme au RGPD, avec chiffrement en transit et au repos. Vos données comptables et les coordonnées de vos copropriétaires ne sont jamais partagées ni utilisées à des fins commerciales. Des sauvegardes automatiques quotidiennes protègent contre toute perte accidentelle.
      </p>

      <h3 className={h3}>Que se passe-t-il si je souhaite arrêter Mon Syndic Bénévole plus tard ?</h3>
      <p className={p}>
        Vos données (copropriétaires, lots, appels de fonds, documents) restent accessibles tant que votre compte est actif. En cas de résiliation, les PDF générés — avis d&apos;appel de fonds, convocations, PV — sont téléchargeables depuis chaque section et peuvent être archivés avant de quitter. Aucun engagement de durée minimum au-delà de chaque mois souscrit.
      </p>

      <h2 id="en-resume" className={h2}>En résumé</h2>
      <p className={p}>
        Migrer vers Mon Syndic Bénévole ne demande pas de jours de configuration ni de formation technique. Avec vos documents en main — règlement de copropriété, liste des copropriétaires, relevés bancaires, dernier budget — vous pouvez être opérationnel en une demi-journée. Si vous hésitez encore sur le choix de l&apos;outil, notre <a href="/blog/logiciel-syndic-benevole" className={a}>comparatif des logiciels pour syndic bénévole</a> vous aidera à trancher.
      </p>
      <p className={p}>
        L&apos;investissement de départ (2 heures de saisie) se rentabilise dès le premier trimestre : plus aucun calcul manuel, plus aucune heure passée à reconstituer les comptes avant l&apos;AG, plus aucune demande de solde à traiter à la main.
      </p>

      <div className="mt-8 rounded-2xl bg-blue-600 p-6 text-center">
        <p className="text-base font-semibold text-white mb-1">Opérationnel en une demi-journée.</p>
        <p className="text-sm text-blue-100 mb-4">Lots, tantièmes, appels de fonds, relances, AG, espace copropriétaires — tout est prêt le jour même.</p>
        <CtaLink
          ctaLocation="blog_article"
          href="/register"
          className="inline-block text-sm font-semibold bg-white hover:bg-blue-50 text-blue-700 px-6 py-3 rounded-xl transition-colors"
        >
          Démarrer ma migration →
        </CtaLink>
        <p className="text-xs text-blue-200 mt-2">Essai gratuit 14 jours · Sans carte bancaire · Résiliable à tout moment</p>
      </div>
    </>
  );
}
