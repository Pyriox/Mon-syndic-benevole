function compactValue(value: string | null | undefined): string {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function extractDateParts(value: string | null | undefined): { year: string; month: string; day: string } | null {
  const normalized = compactValue(value);
  const isoMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return { year: isoMatch[1], month: isoMatch[2], day: isoMatch[3] };
  }

  const parsed = new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;

  return {
    year: String(parsed.getUTCFullYear()),
    month: String(parsed.getUTCMonth() + 1).padStart(2, '0'),
    day: String(parsed.getUTCDate()).padStart(2, '0'),
  };
}

function formatDateForFile(value: string | null | undefined): string {
  const parts = extractDateParts(value);
  if (!parts) return '';
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function formatDateForDisplay(value: string | null | undefined): string {
  const parts = extractDateParts(value);
  if (!parts) return '';
  return `${parts.day}-${parts.month}-${parts.year}`;
}

function toSlugSegment(value: string | null | undefined, maxLength = 48): string {
  const slug = compactValue(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();

  if (!slug) return '';
  return slug.slice(0, maxLength).replace(/-+$/g, '');
}

function toDisplaySegment(value: string | null | undefined, maxLength = 80): string {
  return compactValue(value).slice(0, maxLength);
}

function buildPdfFileName(prefix: string, parts: Array<string | null | undefined>): string {
  const segments = [prefix, ...parts].map((part) => toSlugSegment(part)).filter(Boolean);
  return `${segments.join('-') || 'document'}.pdf`;
}

function buildDisplayName(prefix: string, parts: Array<string | null | undefined>): string {
  const segments = parts.map((part) => toDisplaySegment(part)).filter(Boolean);
  return [prefix, ...segments].join(' — ');
}

export function buildConvocationPdfFileName(params: {
  coproprieteNom?: string | null;
  titreAg?: string | null;
  dateAg?: string | null;
}): string {
  return buildPdfFileName('convocation-ag', [formatDateForFile(params.dateAg), params.coproprieteNom, params.titreAg]);
}

export function buildConvocationPdfDisplayName(params: {
  coproprieteNom?: string | null;
  titreAg?: string | null;
  dateAg?: string | null;
}): string {
  return buildDisplayName('Convocation AG', [params.coproprieteNom, params.titreAg, formatDateForDisplay(params.dateAg)]);
}

export function buildPvPdfFileName(params: {
  coproprieteNom?: string | null;
  titreAg?: string | null;
  dateAg?: string | null;
}): string {
  return buildPdfFileName('pv-ag', [formatDateForFile(params.dateAg), params.coproprieteNom, params.titreAg]);
}

export function buildPvPdfDisplayName(params: {
  coproprieteNom?: string | null;
  titreAg?: string | null;
  dateAg?: string | null;
}): string {
  return buildDisplayName('PV AG', [params.coproprieteNom, params.titreAg, formatDateForDisplay(params.dateAg)]);
}

export function buildAppelFondsPdfFileName(params: {
  coproprieteNom?: string | null;
  titreAppel?: string | null;
  dateEcheance?: string | null;
}): string {
  return buildPdfFileName('appel-de-fonds', [formatDateForFile(params.dateEcheance), params.coproprieteNom, params.titreAppel]);
}

export function buildAvisAppelFondsPdfFileName(params: {
  coproprietaireNom?: string | null;
  titreAppel?: string | null;
  dateEcheance?: string | null;
}): string {
  return buildPdfFileName('avis-appel-de-fonds', [formatDateForFile(params.dateEcheance), params.coproprietaireNom, params.titreAppel]);
}

export function buildAvisAppelFondsPdfDisplayName(params: {
  coproprietaireNom?: string | null;
  titreAppel?: string | null;
  dateEcheance?: string | null;
}): string {
  return buildDisplayName("Avis d'appel de fonds", [params.coproprietaireNom, params.titreAppel, formatDateForDisplay(params.dateEcheance)]);
}