'use client';

import { useState } from 'react';
import {
  LayoutDashboard, Building2, Users, Wallet, Receipt,
  CalendarDays, FileText, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Shared browser-window wrapper ────────────────────────────────────────────
function MockScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 shadow-lg bg-white select-none">
      <div className="bg-gray-800 px-4 py-2.5 flex items-center gap-2.5">
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <div className="flex-1 bg-gray-700 rounded px-3 py-0.5 text-[10px] text-gray-400 text-center max-w-48 mx-auto">
          mon-syndic-benevole.fr
        </div>
      </div>
      <div className="bg-gray-50 p-3 space-y-2">{children}</div>
    </div>
  );
}

// ─── Mock UIs ─────────────────────────────────────────────────────────────────
function MockDashboard() {
  return (
    <MockScreen>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Trésorerie', value: '+2 340 €', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
          { label: 'Dépenses 2026', value: '4 870 €', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
          { label: 'Impayés', value: '450 €', color: 'text-red-500', bg: 'bg-red-50 border-red-100' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={cn('rounded-xl p-2.5 border', bg)}>
            <p className="text-[9px] text-gray-400 mb-0.5">{label}</p>
            <p className={cn('text-xs font-bold', color)}>{value}</p>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl border border-gray-100">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-3 pt-2.5 pb-1">Dépenses récentes</p>
        {[
          { label: 'Ravalement façade', cat: 'Travaux', amount: '1 200 €' },
          { label: 'Assurance MRI', cat: 'Assurance', amount: '380 €' },
          { label: 'Gardiennage mars', cat: 'Personnel', amount: '290 €' },
        ].map(({ label, cat, amount }) => (
          <div key={label} className="flex items-center gap-2 px-3 py-1.5 border-t border-gray-50">
            <p className="text-[10px] font-medium text-gray-700 flex-1 truncate">{label}</p>
            <span className="text-[8px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded shrink-0">{cat}</span>
            <p className="text-[10px] font-semibold text-gray-700 shrink-0">{amount}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <p className="text-[9px] text-gray-400">Incidents en cours</p>
          <p className="text-sm font-bold text-amber-600">2 ouverts</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-2.5">
          <p className="text-[9px] text-gray-400">Copropriétaires</p>
          <p className="text-sm font-bold text-blue-600">6 / 8 lots</p>
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
        <CalendarDays size={13} className="text-amber-500 shrink-0" />
        <p className="text-[10px] font-semibold text-amber-700">AGO 2026 dans 8 jours — 7 invités</p>
      </div>
    </MockScreen>
  );
}

function MockCopropriete() {
  return (
    <MockScreen>
      <div className="bg-white border border-gray-100 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
            <Building2 size={16} className="text-blue-600" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-gray-900">Résidence Les Acacias</p>
            <p className="text-[9px] text-gray-400">12 rue des Lilas, 75011 Paris</p>
          </div>
          <span className="ml-auto text-[8px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">Actif</span>
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-50">
          {[
            { label: 'Lots', value: '8' },
            { label: 'Tantièmes', value: '1 000' },
            { label: 'Copropriétaires', value: '6' },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-sm font-bold text-blue-600">{value}</p>
              <p className="text-[9px] text-gray-400">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-1">Lots & Bâtiment</p>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        {[
          { lot: 'A01', type: 'Appartement T3', owner: 'M. Dupont', tantiemes: '250' },
          { lot: 'A02', type: 'Appartement T2', owner: 'Mme Martin', tantiemes: '180' },
          { lot: 'B01', type: 'Appartement T3', owner: 'M. Bernard', tantiemes: '200' },
          { lot: 'Cave 1', type: 'Cave', owner: 'M. Dupont', tantiemes: '10' },
        ].map(({ lot, type, owner, tantiemes }) => (
          <div key={lot} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50 last:border-0">
            <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded shrink-0">{lot}</span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-700 truncate">{type}</p>
              <p className="text-[9px] text-gray-400 truncate">{owner}</p>
            </div>
            <p className="text-[9px] text-gray-400 shrink-0">{tantiemes} ‰</p>
          </div>
        ))}
      </div>
    </MockScreen>
  );
}

function MockAppelFonds() {
  return (
    <MockScreen>
      <div className="bg-white border border-gray-100 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-[11px] font-bold text-gray-800">Appel T1 2026 — Charges courantes</p>
            <p className="text-[9px] text-gray-400">Total : 1 500 € · Réparti par tantièmes</p>
          </div>
          <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded-full font-medium shrink-0">En cours</span>
        </div>
        {[
          { name: 'M. Dupont', montant: '375 €', tantiemes: '250 ‰', paid: true },
          { name: 'Mme Martin', montant: '270 €', tantiemes: '180 ‰', paid: true },
          { name: 'M. Bernard', montant: '300 €', tantiemes: '200 ‰', paid: false },
          { name: 'Mme Petit', montant: '255 €', tantiemes: '170 ‰', paid: false },
        ].map(({ name, montant, tantiemes, paid }) => (
          <div key={name} className="flex items-center gap-2 py-1.5 border-t border-gray-50">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-medium text-gray-700 truncate">{name}</p>
              <p className="text-[9px] text-gray-400">{tantiemes}</p>
            </div>
            <p className="text-[10px] font-semibold text-gray-700 shrink-0">{montant}</p>
            <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium shrink-0',
              paid ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'
            )}>
              {paid ? 'Payé ✓' : 'En att.'}
            </span>
          </div>
        ))}
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
        <CheckCircle2 size={13} className="text-green-600 shrink-0" />
        <p className="text-[10px] text-green-700 font-medium">PDF envoyé automatiquement à chaque copropriétaire</p>
      </div>
    </MockScreen>
  );
}

function MockAG() {
  return (
    <MockScreen>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="px-3 py-2.5 border-b border-gray-50 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-gray-800">AGO 2026 — Résidence Les Acacias</p>
            <p className="text-[9px] text-gray-400">30 mars 2026 · 10h00 · Salle commune</p>
          </div>
          <span className="text-[8px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-medium shrink-0">Planifiée</span>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">Ordre du jour</p>
          {['Approbation des comptes 2025', 'Budget prévisionnel 2026', 'Travaux ravalement façade'].map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[8px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
              <p className="text-[10px] text-gray-700">{item}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Vote — Travaux ravalement (résolution 3)</p>
        {[
          { label: 'Pour', pct: 72, color: 'bg-green-500', text: 'text-green-700' },
          { label: 'Contre', pct: 15, color: 'bg-red-400', text: 'text-red-600' },
          { label: 'Abstention', pct: 13, color: 'bg-gray-300', text: 'text-gray-500' },
        ].map(({ label, pct, color, text }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <p className={cn('text-[9px] font-semibold w-14 shrink-0', text)}>{label}</p>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={cn('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[9px] text-gray-500 w-6 text-right shrink-0">{pct}%</p>
          </div>
        ))}
      </div>
      <div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 flex items-center gap-2">
        <FileText size={13} className="text-green-600 shrink-0" />
        <p className="text-[10px] text-green-700 font-medium">PV de séance téléchargeable après l&apos;AG</p>
      </div>
    </MockScreen>
  );
}

function MockDepenses() {
  return (
    <MockScreen>
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="bg-gray-50 px-3 py-1.5 grid grid-cols-4 gap-2 border-b border-gray-100">
          {['Date', 'Libellé', 'Catégorie', 'Montant'].map((h) => (
            <p key={h} className="text-[8px] font-semibold text-gray-400 uppercase">{h}</p>
          ))}
        </div>
        {[
          { date: '15/03', label: 'Ravalement façade', cat: 'Travaux', amount: '1 200 €', c: 'bg-orange-100 text-orange-600' },
          { date: '01/02', label: 'Assurance MRI', cat: 'Assurance', amount: '380 €', c: 'bg-sky-100 text-sky-600' },
          { date: '01/01', label: 'Gardiennage janv.', cat: 'Personnel', amount: '290 €', c: 'bg-purple-100 text-purple-600' },
          { date: '12/01', label: 'Nettoyage parties', cat: 'Entretien', amount: '140 €', c: 'bg-teal-100 text-teal-600' },
        ].map(({ date, label, cat, amount, c }) => (
          <div key={label} className="grid grid-cols-4 gap-2 px-3 py-1.5 border-b border-gray-50 last:border-0 items-center">
            <p className="text-[9px] text-gray-400">{date}</p>
            <p className="text-[10px] font-medium text-gray-700 truncate">{label}</p>
            <span className={cn('text-[8px] px-1.5 py-0.5 rounded font-medium', c)}>{cat}</span>
            <p className="text-[10px] font-semibold text-gray-700">{amount}</p>
          </div>
        ))}
      </div>
      <div className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
        <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Répartition par catégorie</p>
        {[
          { label: 'Travaux', pct: 45, color: 'bg-orange-400' },
          { label: 'Personnel', pct: 25, color: 'bg-purple-400' },
          { label: 'Assurance', pct: 18, color: 'bg-sky-400' },
          { label: 'Entretien', pct: 12, color: 'bg-teal-400' },
        ].map(({ label, pct, color }) => (
          <div key={label} className="flex items-center gap-2 mb-1">
            <p className="text-[9px] text-gray-600 w-16 shrink-0">{label}</p>
            <div className="flex-1 bg-gray-100 rounded-full h-1.5">
              <div className={cn('h-1.5 rounded-full', color)} style={{ width: `${pct}%` }} />
            </div>
            <p className="text-[9px] text-gray-500 w-7 text-right shrink-0">{pct}%</p>
          </div>
        ))}
      </div>
    </MockScreen>
  );
}

function MockDocuments() {
  return (
    <MockScreen>
      {[
        { folder: 'Assemblées Générales', count: 4, files: ['PV AGO 2025.pdf', 'PV AGO 2024.pdf'], ic: 'bg-blue-100 text-blue-600' },
        { folder: 'Contrats', count: 6, files: ['Contrat gardiennage.pdf', 'Contrat entretien.pdf'], ic: 'bg-purple-100 text-purple-600' },
        { folder: 'Devis & Factures', count: 12, files: ['Devis ravalement.pdf', 'Facture eau 2026.pdf'], ic: 'bg-orange-100 text-orange-600' },
      ].map(({ folder, count, files, ic }) => (
        <div key={folder} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border-b border-gray-100">
            <div className={cn('w-5 h-5 rounded flex items-center justify-center shrink-0', ic)}>
              <FileText size={11} />
            </div>
            <p className="text-[10px] font-semibold text-gray-700 flex-1">{folder}</p>
            <span className="text-[8px] text-gray-400">{count} fichiers</span>
          </div>
          {files.map((file) => (
            <div key={file} className="flex items-center gap-2 px-3 py-1.5 border-b border-gray-50 last:border-0">
              <div className="w-1 h-1 rounded-full bg-gray-300 shrink-0 ml-1" />
              <p className="text-[9px] text-gray-600 flex-1 truncate">{file}</p>
              <span className="text-[8px] text-blue-500 font-medium">PDF</span>
            </div>
          ))}
        </div>
      ))}
    </MockScreen>
  );
}

function MockIncidents() {
  return (
    <MockScreen>
      {[
        { title: 'Fuite toiture — Bât. A', date: '10 mars 2026', status: 'En cours', sc: 'bg-amber-100 text-amber-700', urgency: '🔴 Urgent', updates: 2 },
        { title: 'Ascenseur en panne', date: '02 févr. 2026', status: 'Résolu', sc: 'bg-green-100 text-green-700', urgency: '🟡 Normal', updates: 5 },
        { title: 'Éclairage couloir B', date: '18 janv. 2026', status: 'Ouvert', sc: 'bg-blue-100 text-blue-700', urgency: '🟢 Faible', updates: 0 },
      ].map(({ title, date, status, sc, urgency, updates }) => (
        <div key={title} className="bg-white border border-gray-100 rounded-xl px-3 py-2.5">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-semibold text-gray-800 truncate">{title}</p>
              <p className="text-[9px] text-gray-400">{date}</p>
            </div>
            <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full font-medium shrink-0', sc)}>{status}</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-[9px] text-gray-500">{urgency}</p>
            {updates > 0 && (
              <p className="text-[9px] text-gray-400">{updates} mise{updates > 1 ? 's' : ''} à jour</p>
            )}
          </div>
        </div>
      ))}
    </MockScreen>
  );
}

// ─── Features config ──────────────────────────────────────────────────────────
const FEATURES: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  title: string;
  description: string;
  points: string[];
  mock: React.ComponentType;
}[] = [
  {
    id: 'dashboard',
    icon: LayoutDashboard,
    label: 'Tableau de bord',
    title: "Votre immeuble en un coup d'œil",
    description: "Le tableau de bord centralise en temps réel la santé financière de votre copropriété : solde de trésorerie, dépenses de l'année, impayés et incidents ouverts. Des alertes automatiques vous tiennent informé sans avoir à chercher.",
    points: [
      'Solde de trésorerie mis à jour en continu',
      'Alertes automatiques sur les impayés et incidents',
      'Rappel des AG planifiées dans les 30 prochains jours',
      'Répartition visuelle des charges par catégorie',
    ],
    mock: MockDashboard,
  },
  {
    id: 'copropriete',
    icon: Building2,
    label: 'Lots & Copropriétaires',
    title: "Créez la structure de votre immeuble",
    description: "Saisissez vos lots avec leurs tantièmes une seule fois. Invitez ensuite chaque copropriétaire par email — ils reçoivent un lien sécurisé pour créer leur compte et accéder à leur espace personnel.",
    points: [
      'Lots avec tantièmes (répartitions calculées automatiquement)',
      'Invitation par email avec lien sécurisé',
      'Plusieurs copropriétés gérées depuis le même compte',
      'Profil et coordonnées de chaque copropriétaire',
    ],
    mock: MockCopropriete,
  },
  {
    id: 'appels',
    icon: Wallet,
    label: 'Appels de fonds',
    title: "Répartition automatique par tantièmes",
    description: "Créez un appel de fonds en 30 secondes : saisissez le montant total, choisissez la période — le logiciel calcule automatiquement la part de chaque propriétaire selon ses tantièmes et envoie le PDF par email.",
    points: [
      'Répartition calculée instantanément selon les tantièmes',
      'Envoi PDF personnalisé à chaque copropriétaire',
      'Suivi des paiements (payé / en attente) en temps réel',
      'Historique complet de tous les appels',
    ],
    mock: MockAppelFonds,
  },
  {
    id: 'ag',
    icon: CalendarDays,
    label: 'Assemblées Générales',
    title: "Gérez vos AG de A à Z",
    description: "Planifiez votre assemblée générale, rédigez l'ordre du jour et envoyez les convocations en quelques clics. Enregistrez les votes résolution par résolution, puis téléchargez le PV généré automatiquement.",
    points: [
      'Convocation avec ordre du jour personnalisé',
      'Vote par résolution avec comptage en tantièmes',
      'PV de séance téléchargeable immédiatement',
      'Suivi du quorum et gestion des pouvoirs',
    ],
    mock: MockAG,
  },
  {
    id: 'depenses',
    icon: Receipt,
    label: 'Dépenses',
    title: "Toutes vos charges, toujours tracées",
    description: "Enregistrez chaque dépense avec sa catégorie, sa date et son justificatif. Visualisez en un graphique comment se répartissent vos charges, et comparez avec l'année précédente.",
    points: [
      'Catégories prédéfinies (travaux, entretien, assurance…)',
      'Justificatifs PDF joints à chaque dépense',
      'Graphique de répartition par poste de charge',
      'Comparaison N vs N-1 pour suivre les tendances',
    ],
    mock: MockDepenses,
  },
  {
    id: 'documents',
    icon: FileText,
    label: 'Documents',
    title: "Une GED pour votre immeuble",
    description: "Stockez et organisez tous vos documents en dossiers : PV d'AG, contrats, devis, factures. Partagez-les instantanément avec vos copropriétaires — ils y accèdent depuis leur espace personnel.",
    points: [
      'Dossiers personnalisables (AG, Contrats, Factures…)',
      'Accès partagé avec les copropriétaires',
      'Téléchargement sécurisé, disponible 24h/24',
      'Stockage illimité sur les plans Confort et Illimité',
    ],
    mock: MockDocuments,
  },
  {
    id: 'incidents',
    icon: AlertTriangle,
    label: 'Incidents',
    title: "Suivez chaque problème jusqu'à résolution",
    description: "Signalez fuites, pannes et dégradations, définissez la priorité et suivez l'avancement. Chaque incident dispose d'un fil de mises à jour — les copropriétaires concernés sont notifiés.",
    points: [
      'Statuts : Ouvert → En cours → Résolu',
      'Niveaux de priorité (urgent / normal / faible)',
      'Historique complet des actions et commentaires',
      'Notifications automatiques aux copropriétaires',
    ],
    mock: MockIncidents,
  },
];

// ─── Main export ──────────────────────────────────────────────────────────────
export default function FeatureShowcase() {
  const [active, setActive] = useState(0);
  const feature = FEATURES[active];
  const MockUI = feature.mock;

  return (
    <div>
      {/* Tab bar */}
      <div className="flex flex-wrap gap-2 mb-8 justify-center">
        {FEATURES.map(({ id, label, icon: Icon }, i) => (
          <button
            key={id}
            onClick={() => setActive(i)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all',
              i === active
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white border border-gray-200 text-gray-500 hover:border-blue-300 hover:text-blue-600'
            )}
          >
            <Icon size={15} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Content panel */}
      <div className="grid lg:grid-cols-2 gap-10 items-center">
        {/* Left: description */}
        <div>
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-sm font-semibold mb-4">
            <feature.icon size={15} />
            {feature.label}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
          <p className="text-gray-500 leading-relaxed mb-5">{feature.description}</p>
          <ul className="space-y-2.5">
            {feature.points.map((point) => (
              <li key={point} className="flex items-start gap-2.5">
                <CheckCircle2 size={16} className="text-blue-500 mt-0.5 shrink-0" />
                <span className="text-sm text-gray-700">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Right: mock UI */}
        <div>
          <MockUI />
        </div>
      </div>
    </div>
  );
}
