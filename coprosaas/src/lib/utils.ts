// ============================================================
// Fonctions utilitaires générales
// ============================================================
import { type ClassValue, clsx } from 'clsx';

const APP_TIME_ZONE = 'Europe/Paris';

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}

function getTimeZoneParts(value: string | Date, timeZone: string = APP_TIME_ZONE) {
  const date = value instanceof Date ? value : new Date(value);
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value ?? '0');

  return {
    year: pick('year'),
    month: pick('month'),
    day: pick('day'),
    hour: pick('hour'),
    minute: pick('minute'),
    second: pick('second'),
  };
}

function getTimeZoneOffsetMilliseconds(value: Date, timeZone: string = APP_TIME_ZONE): number {
  const zoned = getTimeZoneParts(value, timeZone);
  const zonedUtc = Date.UTC(zoned.year, zoned.month - 1, zoned.day, zoned.hour, zoned.minute, zoned.second);
  return zonedUtc - value.getTime();
}

function formatInParis(value: string | null | undefined, options: Intl.DateTimeFormatOptions): string {
  if (!value) return '—';
  return new Intl.DateTimeFormat('fr-FR', { timeZone: APP_TIME_ZONE, ...options }).format(new Date(value));
}

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

// ---- Formatage de date en français (fuseau Europe/Paris) ----
export function formatDate(dateString: string, options: Intl.DateTimeFormatOptions = {}): string {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: APP_TIME_ZONE,
    ...options,
  }).format(new Date(dateString));
}

export function formatTime(dateString: string | null | undefined): string {
  return formatInParis(dateString, {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDateTime(dateString: string | null | undefined): string {
  return formatInParis(dateString, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function toParisISOString(dateValue: string, hourValue: string, minuteValue: string): string {
  if (!dateValue) return '';

  const [year, month, day] = dateValue.split('-').map(Number);
  const hour = Number(hourValue || '0');
  const minute = Number(minuteValue || '0');
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
  const offset = getTimeZoneOffsetMilliseconds(utcGuess, APP_TIME_ZONE);

  return new Date(utcGuess.getTime() - offset).toISOString();
}

export function getParisDateInputValue(value: string | null | undefined): string {
  if (!value) return '';

  const parts = getTimeZoneParts(value, APP_TIME_ZONE);
  return `${parts.year}-${padDatePart(parts.month)}-${padDatePart(parts.day)}`;
}

export function formatFrenchDateInputValue(value: string | null | undefined): string {
  if (!value) return '';

  const dateInputValue = isDateInputValue(value) ? value : getParisDateInputValue(value);
  if (!isDateInputValue(dateInputValue)) return '';

  const [year, month, day] = dateInputValue.split('-');
  return `${day}/${month}/${year}`;
}

export function normalizeFrenchDateInputValue(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  return [day, month, year].filter(Boolean).join('/');
}

export function parseFrenchDateInputValue(value: string): string {
  const normalizedValue = normalizeFrenchDateInputValue(value);
  const match = normalizedValue.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return '';

  const [, dayPart, monthPart, yearPart] = match;
  const day = Number(dayPart);
  const month = Number(monthPart);
  const year = Number(yearPart);
  if (year < 2000 || year > 2100) return '';
  const candidate = new Date(Date.UTC(year, month - 1, day));

  if (
    candidate.getUTCFullYear() !== year
    || candidate.getUTCMonth() !== month - 1
    || candidate.getUTCDate() !== day
  ) {
    return '';
  }

  return `${yearPart}-${monthPart}-${dayPart}`;
}

export function getParisTimeInputValue(value: string | null | undefined): { hour: string; minute: string } {
  if (!value) {
    return { hour: '00', minute: '00' };
  }

  const parts = getTimeZoneParts(value, APP_TIME_ZONE);
  return {
    hour: padDatePart(parts.hour),
    minute: padDatePart(parts.minute),
  };
}

export function getParisYear(value: string | null | undefined): number | null {
  if (!value) return null;
  return getTimeZoneParts(value, APP_TIME_ZONE).year;
}

function isDateInputValue(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function addMonthsToDateInputValue(value: string, months: number): string {
  if (!isDateInputValue(value)) return '';

  const [year, month, day] = value.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCMonth(shifted.getUTCMonth() + months);

  return `${shifted.getUTCFullYear()}-${padDatePart(shifted.getUTCMonth() + 1)}-${padDatePart(shifted.getUTCDate())}`;
}

export function getDefaultFundingCallDate(existingDates: string[], agDateValue?: string | null): string {
  const validDates = existingDates.filter(isDateInputValue);

  if (validDates.length >= 2) {
    const previousDate = validDates[validDates.length - 2];
    const lastDate = validDates[validDates.length - 1];
    const [previousYear, previousMonth] = previousDate.split('-').map(Number);
    const [lastYear, lastMonth] = lastDate.split('-').map(Number);
    const inferredMonthStep = (lastYear - previousYear) * 12 + (lastMonth - previousMonth);

    return addMonthsToDateInputValue(lastDate, inferredMonthStep > 0 ? inferredMonthStep : 3);
  }

  if (validDates.length === 1) {
    return addMonthsToDateInputValue(validDates[0], 3);
  }

  const agDate = agDateValue?.slice(0, 10) ?? '';
  const fallbackYear = isDateInputValue(agDate) ? Number(agDate.slice(0, 4)) : new Date().getFullYear();
  return `${fallbackYear + 1}-01-01`;
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

/**
 * Répartit un montant total entre copropriétaires selon leurs tantièmes.
 * Règle d'arrondi : floor au centime inférieur (0,01 €) pour chaque lot ;
 * l'écart cumulé est affecté au lot de référence (celui qui a le plus de tantièmes).
 */
export function repartirMontant<T extends { tantiemes: number }>(
  montantTotal: number,
  groupes: T[]
): (T & { montant: number })[] {
  const totalTant = groupes.reduce((s, g) => s + g.tantiemes, 0);
  if (totalTant === 0) return groupes.map((g) => ({ ...g, montant: 0 }));

  // Arrondi au centime inférieur pour chaque lot
  const result = groupes.map((g) => ({
    ...g,
    montant: Math.floor((montantTotal * g.tantiemes / totalTant) * 100) / 100,
  }));

  // Écart cumulé → affecté au lot de référence (plus grand tantième)
  const somme = result.reduce((s, r) => s + r.montant, 0);
  const ecart = Math.round((montantTotal - somme) * 100) / 100;
  if (ecart !== 0) {
    let refIdx = 0;
    for (let i = 1; i < result.length; i++) {
      if (result[i].tantiemes > result[refIdx].tantiemes) refIdx = i;
    }
    result[refIdx] = {
      ...result[refIdx],
      montant: Math.round((result[refIdx].montant + ecart) * 100) / 100,
    };
  }

  return result;
}

export type RepartitionType = 'generale' | 'groupe';

export interface RepartitionLotLike {
  id: string;
  numero?: string | null;
  tantiemes: number;
  coproprietaire_id: string | null;
  batiment?: string | null;
  groupes_repartition?: string[] | null;
  tantiemes_groupes?: Record<string, number> | null;
}

export interface RepartitionPosteInput {
  libelle: string;
  montant: number;
  repartition_type?: RepartitionType | null;
  repartition_cible?: string | null;
}

export interface RepartitionDetailItem {
  libelle: string;
  categorie?: string | null;
  montant: number;
  repartition_type?: RepartitionType | null;
  repartition_cible?: string | null;
}

export interface RepartitionDetailedRow {
  copId: string;
  lotId: string | null;
  tantiemes: number;
  montant: number;
  details: RepartitionDetailItem[];
}

export interface BudgetPosteDescription extends RepartitionPosteInput {
  categorie?: string | null;
}

function normalizeRepartitionLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export type TantiemesGroupesMap = Record<string, number>;

export function sanitizeTantiemesGroupesMap(value: unknown): TantiemesGroupesMap {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([rawKey, rawValue]) => {
      const key = normalizeRepartitionLabel(rawKey);
      const amount = typeof rawValue === 'number'
        ? rawValue
        : Number.parseFloat(String(rawValue ?? '').replace(',', '.'));

      if (!key || !Number.isFinite(amount) || amount <= 0) return null;
      return [key, Math.round(amount * 100) / 100] as const;
    })
    .filter(Boolean) as Array<readonly [string, number]>;

  return Object.fromEntries(entries);
}

export function parseTantiemesGroupesInput(input: string | null | undefined): TantiemesGroupesMap {
  if (!input) return {};

  const parsedEntries = input
    .split(/\r?\n|;/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separatorIndex = line.includes(':') ? line.indexOf(':') : line.indexOf('=');
      if (separatorIndex < 0) return null;

      const key = normalizeRepartitionLabel(line.slice(0, separatorIndex));
      const rawValue = line.slice(separatorIndex + 1).trim().replace(',', '.');
      const amount = Number.parseFloat(rawValue);

      if (!key || !Number.isFinite(amount) || amount <= 0) return null;
      return [key, Math.round(amount * 100) / 100] as const;
    })
    .filter(Boolean) as Array<readonly [string, number]>;

  return Object.fromEntries(parsedEntries);
}

export function stringifyTantiemesGroupesInput(value: unknown): string {
  const map = sanitizeTantiemesGroupesMap(value);

  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b, 'fr'))
    .map(([key, amount]) => `${key}: ${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(amount)}`)
    .join('\n');
}

function hasPositiveRepartitionWeight(lot: RepartitionLotLike): boolean {
  return (lot.tantiemes ?? 0) > 0 || Object.keys(sanitizeTantiemesGroupesMap(lot.tantiemes_groupes)).length > 0;
}

export function getLotTantiemesForRepartitionScope(
  lot: RepartitionLotLike,
  type?: RepartitionType | null,
  target?: string | null,
): number {
  const fallbackTantiemes = Number(lot.tantiemes ?? 0);
  if (type !== 'groupe') return fallbackTantiemes;

  const normalizedTarget = normalizeRepartitionLabel(target);
  if (!normalizedTarget) return fallbackTantiemes;

  const customTantiemes = sanitizeTantiemesGroupesMap(lot.tantiemes_groupes)[normalizedTarget];
  return typeof customTantiemes === 'number' && customTantiemes > 0 ? customTantiemes : fallbackTantiemes;
}

export function parseBudgetPostesFromDescription(description: string | null | undefined): BudgetPosteDescription[] {
  if (!description) return [];

  try {
    const parsed = JSON.parse(description);
    if (!Array.isArray(parsed)) return [];

    const normalized = parsed
      .map((poste) => {
        if (!poste || typeof poste !== 'object') return null;

        const raw = poste as Record<string, unknown>;
        const libelle = typeof raw.libelle === 'string' ? raw.libelle.trim() : '';
        const montant = typeof raw.montant === 'number'
          ? raw.montant
          : Number.parseFloat(String(raw.montant ?? '0'));
        const repartitionType = raw.repartition_type === 'groupe' ? 'groupe' : 'generale';
        const repartitionCible = normalizeRepartitionLabel(
          typeof raw.repartition_cible === 'string' ? raw.repartition_cible : null
        );

        if (!libelle || !(montant > 0)) return null;

        return {
          libelle,
          montant,
          categorie: typeof raw.categorie === 'string' ? raw.categorie : null,
          repartition_type: repartitionType,
          repartition_cible: repartitionType === 'groupe' ? repartitionCible : null,
        } as BudgetPosteDescription;
      })
      .filter(Boolean) as BudgetPosteDescription[];

    return normalized;
  } catch {
    return [];
  }
}

export function getLotRepartitionGroups(
  lot: Pick<RepartitionLotLike, 'groupes_repartition' | 'tantiemes_groupes'>
): string[] {
  const groups = [
    ...((lot.groupes_repartition ?? []).map((group) => normalizeRepartitionLabel(group)).filter(Boolean) as string[]),
    ...Object.keys(sanitizeTantiemesGroupesMap(lot.tantiemes_groupes)),
  ];

  return Array.from(new Set(groups.filter((group): group is string => Boolean(group)))).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function collectAvailableRepartitionGroups(lots: RepartitionLotLike[]): string[] {
  const seen = new Set<string>();

  for (const lot of lots) {
    for (const group of getLotRepartitionGroups(lot)) {
      seen.add(group);
    }
  }

  return Array.from(seen).sort((a, b) => a.localeCompare(b, 'fr'));
}

export function formatRepartitionScope(type?: RepartitionType | null, target?: string | null): string {
  if (type === 'groupe') {
    return normalizeRepartitionLabel(target) ?? 'Clé spéciale';
  }

  return 'Charges communes';
}

export function filterLotsByRepartitionScope<T extends RepartitionLotLike>(
  lots: T[],
  type?: RepartitionType | null,
  target?: string | null,
): T[] {
  const eligibleLots = lots.filter((lot) => lot.coproprietaire_id && hasPositiveRepartitionWeight(lot));
  if (type !== 'groupe') return eligibleLots;

  const normalizedTarget = normalizeRepartitionLabel(target);
  if (!normalizedTarget) return eligibleLots;

  const scopedLots = eligibleLots.filter((lot) => getLotRepartitionGroups(lot).includes(normalizedTarget));
  return scopedLots.length > 0 ? scopedLots : eligibleLots;
}

export function groupLotsByCoproprietaire<T extends { id: string; tantiemes: number; coproprietaire_id: string | null }>(lots: T[]) {
  const coproMap = new Map<string, { copId: string; lotId: string | null; tantiemes: number }>();

  for (const lot of lots) {
    if (!lot.coproprietaire_id) continue;

    if (coproMap.has(lot.coproprietaire_id)) {
      const existing = coproMap.get(lot.coproprietaire_id)!;
      existing.tantiemes += lot.tantiemes ?? 0;
      existing.lotId = null;
      continue;
    }

    coproMap.set(lot.coproprietaire_id, {
      copId: lot.coproprietaire_id,
      lotId: lot.id,
      tantiemes: lot.tantiemes ?? 0,
    });
  }

  return Array.from(coproMap.values());
}

export function repartitionParPostesDetailed(
  montantTotal: number,
  lots: RepartitionLotLike[],
  postes: RepartitionPosteInput[],
): RepartitionDetailedRow[] {
  const postesValides = postes.filter((poste) => (poste.montant ?? 0) > 0);
  const lotsEligibles = lots.filter((lot) => lot.coproprietaire_id && hasPositiveRepartitionWeight(lot));

  if (lotsEligibles.length === 0) return [];

  if (postesValides.length === 0) {
    return repartirMontant(montantTotal, groupLotsByCoproprietaire(lotsEligibles)).map((row) => ({
      ...row,
      details: [],
    }));
  }

  const amountsByOwner = new Map<string, RepartitionDetailedRow>();

  for (const poste of postesValides) {
    const scopedLots = filterLotsByRepartitionScope(lotsEligibles, poste.repartition_type ?? 'generale', poste.repartition_cible ?? null)
      .map((lot) => ({
        ...lot,
        tantiemes: getLotTantiemesForRepartitionScope(lot, poste.repartition_type ?? 'generale', poste.repartition_cible ?? null),
      }));
    const groupedLots = groupLotsByCoproprietaire(scopedLots);

    for (const share of repartirMontant(poste.montant, groupedLots)) {
      const detailItem: RepartitionDetailItem = {
        libelle: poste.libelle,
        categorie: (poste as { categorie?: string | null }).categorie ?? null,
        montant: share.montant,
        repartition_type: poste.repartition_type ?? 'generale',
        repartition_cible: poste.repartition_cible ?? null,
      };

      if (amountsByOwner.has(share.copId)) {
        const existing = amountsByOwner.get(share.copId)!;
        existing.montant = Math.round((existing.montant + share.montant) * 100) / 100;
        existing.details.push(detailItem);
      } else {
        amountsByOwner.set(share.copId, {
          ...share,
          details: [detailItem],
        });
      }
    }
  }

  const result = Array.from(amountsByOwner.values());
  const distributedTotal = Math.round(result.reduce((sum, row) => sum + row.montant, 0) * 100) / 100;
  const targetTotal = Math.round(((montantTotal > 0 ? montantTotal : postesValides.reduce((sum, poste) => sum + poste.montant, 0))) * 100) / 100;
  const diff = Math.round((targetTotal - distributedTotal) * 100) / 100;

  if (diff !== 0 && result.length > 0) {
    let refIndex = 0;
    for (let index = 1; index < result.length; index += 1) {
      if (result[index].tantiemes > result[refIndex].tantiemes) refIndex = index;
    }

    const refRow = result[refIndex];
    refRow.montant = Math.round((refRow.montant + diff) * 100) / 100;
    if (refRow.details.length > 0) {
      const lastDetailIndex = refRow.details.length - 1;
      refRow.details[lastDetailIndex] = {
        ...refRow.details[lastDetailIndex],
        montant: Math.round((refRow.details[lastDetailIndex].montant + diff) * 100) / 100,
      };
    }
  }

  return result.map((row) => ({
    ...row,
    details: row.details.filter((detail) => Math.abs(detail.montant) >= 0.01),
  }));
}

export function repartitionParPostes(
  montantTotal: number,
  lots: RepartitionLotLike[],
  postes: RepartitionPosteInput[],
) {
  return repartitionParPostesDetailed(montantTotal, lots, postes).map(({ details, ...row }) => row);
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

export const LABELS_NATURE_INCIDENT: Record<string, string> = {
  incident: 'Incident',
  travaux: 'Travaux',
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
  optional: boolean;        // Peut être passée (reportée) sans vote en séance — bouton "Passer" affiché
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
    majorite: 'article_24', designation: true, multiple: true, optional: true,
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
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: true, hasFondsTravaux: false,
  },
  revision_fonds_travaux: {
    label: "Révision du fonds de travaux de l'exercice en cours",
    majorite: 'article_24', designation: false, multiple: false, optional: false,
    hasBudget: false, hasFondsTravaux: true,
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