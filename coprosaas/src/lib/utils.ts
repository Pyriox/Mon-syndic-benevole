// ============================================================
// Fonctions utilitaires générales
// ============================================================
import { type ClassValue, clsx } from 'clsx';

// ---- Fusion de classes CSS Tailwind ----
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// ---- Formatage monétaire en euros ----
export function formatEuros(montant: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(montant);
}

// ---- Formatage de date en français ----
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateString));
}

// ---- Calcul de la répartition des charges selon les tantièmes ----
export function calculerPart(
  montantTotal: number,
  tantieme: number,
  totalTantiemes: number
): number {
  if (totalTantiemes === 0) return 0;
  return Math.round((montantTotal * tantieme) / totalTantiemes * 100) / 100;
}

// ---- Calcul du total des tantièmes d'une copropriété ----
export function totalTantiemes(lots: { tantiemes: number }[]): number {
  return lots.reduce((sum, lot) => sum + lot.tantiemes, 0);
}

// ---- Initiales d'un nom complet ----
export function initiales(nom: string, prenom?: string): string {
  if (prenom) return `${prenom[0]}${nom[0]}`.toUpperCase();
  const parts = nom.trim().split(' ');
  return parts.map((p) => p[0]).join('').toUpperCase().slice(0, 2);
}

// ---- Couleurs par statut d'incident ----
export function couleurStatutIncident(statut: string): string {
  const map: Record<string, string> = {
    ouvert: 'bg-red-100 text-red-800',
    en_cours: 'bg-yellow-100 text-yellow-800',
    resolu: 'bg-green-100 text-green-800',
  };
  return map[statut] ?? 'bg-gray-100 text-gray-800';
}

// ---- Couleurs par priorité d'incident ----
export function couleurPriorite(priorite: string): string {
  const map: Record<string, string> = {
    faible: 'bg-blue-100 text-blue-800',
    moyenne: 'bg-yellow-100 text-yellow-800',
    haute: 'bg-orange-100 text-orange-800',
    urgente: 'bg-red-100 text-red-800',
  };
  return map[priorite] ?? 'bg-gray-100 text-gray-800';
}

// ---- Couleurs par statut d'AG ----
export function couleurStatutAG(statut: string): string {
  const map: Record<string, string> = {
    planifiee: 'bg-blue-100 text-blue-800',
    en_cours: 'bg-yellow-100 text-yellow-800',
    terminee: 'bg-green-100 text-green-800',
  };
  return map[statut] ?? 'bg-gray-100 text-gray-800';
}

// ---- Labels lisibles en français ----
export const LABELS_CATEGORIE: Record<string, string> = {
  entretien: 'Entretien',
  assurance: 'Assurance',
  eau: 'Eau',
  electricite: 'Électricité',
  ascenseur: 'Ascenseur',
  espaces_verts: 'Espaces verts',
  nettoyage: 'Nettoyage',
  administration: 'Administration',
  travaux: 'Travaux',
  fonds_travaux_alur: 'Fonds travaux ALUR',
  syndic_benevole: 'Mon Syndic Bénévole',
  autre: 'Autre',
};

export const LABELS_STATUT_INCIDENT: Record<string, string> = {
  ouvert: 'Ouvert',
  devis_demande: 'Devis demandé',
  devis_recu: 'Devis reçu',
  en_cours: 'En cours',
  resolu: 'Résolu',
};

export const LABELS_TYPE_INCIDENT: Record<string, string> = {
  plomberie: 'Plomberie',
  electricite: 'Électricité',
  parties_communes: 'Parties communes',
  ascenseur: 'Ascenseur',
  toiture: 'Toiture',
  securite: 'Sécurité',
  espaces_verts: 'Espaces verts',
  autre: 'Autre',
};

export const LABELS_PRIORITE: Record<string, string> = {
  faible: 'Faible',
  moyenne: 'Moyenne',
  haute: 'Haute',
  urgente: 'Urgente',
};

export const LABELS_TYPE_DOCUMENT: Record<string, string> = {
  pv_ag: "PV d'AG",
  convocation_ag: 'Convocation AG',
  facture: 'Facture',
  contrat: 'Contrat',
  assurance: 'Assurance',
  reglement: 'Règlement',
  autre: 'Autre',
};

export const LABELS_STATUT_AG: Record<string, string> = {
  creation: 'Création',
  planifiee: 'Planifiée',
  en_cours: 'En cours',
  terminee: 'Terminée',
  annulee: 'Annulée',
};

// ---- Types de résolutions prédéfinis ----
export interface TypeResolutionConfig {
  label: string;
  majorite: string;
  designation: boolean;     // Résultat = désignation d'une ou plusieurs personnes
  multiple: boolean;        // Désignation multiple (scrutateurs, conseil syndical)
  optional: boolean;        // Peut être passée (reportée) sans vote
  hasBudget: boolean;       // Nécessite la saisie de postes budgétaires
  hasFondsTravaux: boolean; // Nécessite un montant en €
}

export const TYPES_RESOLUTION: Record<string, TypeResolutionConfig> = {
  libre: {
    label: 'Résolution libre',
    majorite: '', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  president_seance: {
    label: 'Désignation du président de séance',
    majorite: 'article_24', designation: true, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  secretaire_seance: {
    label: 'Désignation du secrétaire de séance',
    majorite: 'article_24', designation: true, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  scrutateurs: {
    label: 'Désignation des scrutateurs',
    majorite: 'article_24', designation: true, multiple: true, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  approbation_comptes: {
    label: "Approbation des comptes de l'exercice",
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  quitus_syndic: {
    label: 'Quitus au syndic',
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  revision_budget: {
    label: "Révision du budget de l'exercice en cours",
    majorite: 'article_24', designation: false, multiple: false, optional: true,
    hasBudget: true, hasFondsTravaux: false,
  },
  budget_previsionnel: {
    label: 'Vote du budget prévisionnel',
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: true, hasFondsTravaux: false,
  },
  fonds_travaux: {
    label: 'Cotisation fonds de travaux (art. L.731-4 ALUR)',
    majorite: 'article_25', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: true,
  },
  calendrier_financement: {
    label: 'Calendrier de financement du budget prévisionnel et du fonds travaux',
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  designation_syndic: {
    label: 'Désignation ou renouvellement du syndic',
    majorite: 'article_25', designation: true, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: false,
  },
  conseil_syndical: {
    label: 'Désignation ou renouvellement du conseil syndical',
    majorite: 'article_24', designation: true, multiple: true, optional: true,
    hasBudget: false, hasFondsTravaux: false,
  },
};