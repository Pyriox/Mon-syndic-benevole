// ============================================================
// Types TypeScript pour CoproSaaS
// Ces types reflètent exactement la structure de la base de données Supabase
// ============================================================

// --- Notification ---
export type NotificationType = 'impaye' | 'incident' | 'ag' | 'appel_fonds' | 'support';

export interface AppNotification {
  id: string;
  type: NotificationType;
  label: string;
  sublabel?: string;
  href: string;
  severity: 'danger' | 'warning' | 'info';
}

// --- Profil utilisateur ---
export type Role = 'syndic' | 'copropriétaire';

export interface Profile {
  id: string;          // UUID lié à auth.users
  email: string;
  full_name: string;
  role: Role;
  created_at: string;
  trial_used: boolean; // true si l'utilisateur a déjà activé un essai gratuit
}

// --- Copropriété avec rôle de l'utilisateur courant ---
export interface UserCopropriete {
  id: string;
  nom: string;
  adresse: string;
  ville: string;
  role: 'syndic' | 'copropriétaire';
}

// --- Copropriété ---
export interface Copropriete {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
  nombre_lots: number;
  syndic_id: string;   // UUID du syndic propriétaire
  created_at: string;
  // Abonnement (1 abonnement Stripe par copropriété)
  stripe_customer_id?: string | null;
  stripe_subscription_id?: string | null;
  plan?: string | null;             // null     = aucun moyen de paiement enregistré (accès gratuit)
                                    // 'essai'  = période d'essai 14j (CB enregistrée, paiement non encore prélevé)
                                    // 'actif'  = abonnement payant actif
                                    // 'inactif'= abonnement résilié
                                    // 'passe_du'= paiement en retard
  plan_id?: string | null;          // 'essentiel' | 'confort' | 'illimite'
  plan_period_end?: string | null;  // ISO date string
}

// --- Lot (appartement/local) ---
export interface Lot {
  id: string;
  copropriete_id: string;
  numero: string;       // ex: "Apt 3B"
  type: string;         // ex: "appartement", "parking", "cave"
  tantiemes: number;    // quote-part sur 1000 par exemple
  created_at: string;
}

// --- Copropriétaire ---
export interface Coproprietaire {
  id: string;
  copropriete_id: string;
  lot_id: string;
  user_id: string | null;  // peut être null si pas encore inscrit
  nom: string;
  prenom: string;
  email: string;
  telephone: string | null;
  solde: number;           // solde comptable (positif = créditeur)
  created_at: string;
  // Relations jointes (optionnel)
  lot?: Lot;
}

// --- Catégories de dépenses ---
export type CategorieDependense =
  | 'entretien'
  | 'assurance'
  | 'eau'
  | 'electricite'
  | 'ascenseur'
  | 'espaces_verts'
  | 'nettoyage'
  | 'administration'
  | 'travaux'
  | 'autre';

// --- Dépense ---
export interface Depense {
  id: string;
  copropriete_id: string;
  titre: string;
  categorie: CategorieDependense;
  montant: number;          // en euros
  date_depense: string;     // ISO date string
  description: string | null;
  piece_jointe_url: string | null;
  created_by: string;       // UUID syndic
  created_at: string;
}

// --- Ligne de répartition d'une dépense ---
export interface RepartitionDepense {
  id: string;
  depense_id: string;
  coproprietaire_id: string;
  lot_id: string;
  montant_du: number;       // montant calculé selon les tantièmes
  paye: boolean;
  date_paiement: string | null;
  // Relations jointes
  coproprietaire?: Coproprietaire;
  lot?: Lot;
}

// --- Appel de fonds ---
export interface AppelDeFonds {
  id: string;
  copropriete_id: string;
  titre: string;
  montant_total: number;
  date_echeance: string;
  description: string | null;
  created_by: string;
  created_at: string;
  // Relations
  lignes?: LigneAppelDeFonds[];
}

// --- Ligne d'appel de fonds (une par copropriétaire) ---
export interface LigneAppelDeFonds {
  id: string;
  appel_de_fonds_id: string;
  coproprietaire_id: string;
  lot_id: string;
  montant_du: number;
  paye: boolean;
  date_paiement: string | null;
  // Relations
  coproprietaire?: Coproprietaire;
  lot?: Lot;
}

// --- Document ---
export type TypeDocument =
  | 'pv_ag'
  | 'facture'
  | 'contrat'
  | 'assurance'
  | 'reglement'
  | 'autre';

export interface Document {
  id: string;
  copropriete_id: string;
  nom: string;
  type: TypeDocument;
  url: string;             // URL dans Supabase Storage
  taille: number | null;   // en bytes
  uploaded_by: string;
  created_at: string;
}

// --- Assemblée Générale ---
export type StatutAG = 'planifiee' | 'en_cours' | 'terminee';

export interface AssembleeGenerale {
  id: string;
  copropriete_id: string;
  titre: string;
  date_ag: string;
  lieu: string | null;
  statut: StatutAG;
  quorum_atteint: boolean;
  notes: string | null;
  created_by: string;
  created_at: string;
  // Relations
  resolutions?: Resolution[];
}

// --- Résolution d'AG ---
export type StatutResolution = 'approuvee' | 'refusee' | 'reportee' | 'en_attente';

export interface Resolution {
  id: string;
  ag_id: string;
  numero: number;
  titre: string;
  description: string | null;
  majorite: string | null;
  statut: StatutResolution;
  voix_pour: number;
  voix_contre: number;
  voix_abstention: number;
}

// --- Incident / Travaux ---
export type StatutIncident = 'ouvert' | 'devis_demande' | 'devis_recu' | 'en_cours' | 'resolu';
export type PrioriteIncident = 'faible' | 'moyenne' | 'haute' | 'urgente';
export type TypeIncident =
  | 'plomberie' | 'electricite' | 'parties_communes' | 'ascenseur'
  | 'toiture' | 'securite' | 'espaces_verts' | 'autre';

export interface Incident {
  id: string;
  copropriete_id: string;
  titre: string;
  description: string;
  statut: StatutIncident;
  priorite: PrioriteIncident;
  type_incident: TypeIncident | null;
  localisation: string | null;
  artisan_nom: string | null;
  artisan_contact: string | null;
  montant_devis: number | null;
  montant_final: number | null;
  date_intervention_prevue: string | null;
  notes_internes: string | null;   // JSON array of { date, texte }
  photo_url: string | null;
  declare_par: string;             // UUID utilisateur
  assigne_a: string | null;
  date_declaration: string;
  date_resolution: string | null;
  created_at: string;
}

// ============================================================
// Types utilitaires pour les formulaires
// ============================================================

export type CreateCopropriete = Omit<Copropriete, 'id' | 'created_at' | 'syndic_id'>;
export type UpdateCopropriete = Partial<CreateCopropriete>;

export type CreateLot = Omit<Lot, 'id' | 'created_at'>;
export type UpdateLot = Partial<CreateLot>;

export type CreateCoproprietaire = Omit<Coproprietaire, 'id' | 'created_at' | 'solde' | 'lot'>;
export type UpdateCoproprietaire = Partial<CreateCoproprietaire>;

export type CreateDepense = Omit<Depense, 'id' | 'created_at' | 'created_by'>;
export type UpdateDepense = Partial<CreateDepense>;

export type CreateDocument = Omit<Document, 'id' | 'created_at' | 'uploaded_by'>;

export type CreateIncident = Omit<Incident, 'id' | 'created_at' | 'date_resolution'>;
export type UpdateIncident = Partial<CreateIncident>;

export type CreateAG = Omit<AssembleeGenerale, 'id' | 'created_at' | 'created_by' | 'resolutions'>;
export type UpdateAG = Partial<CreateAG>;

export type CreateResolution = Omit<Resolution, 'id'>;
export type UpdateResolution = Partial<CreateResolution>;
