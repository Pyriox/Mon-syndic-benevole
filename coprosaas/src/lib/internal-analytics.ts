export type InternalAnalyticsArea = 'dashboard' | 'admin';
export type InternalAnalyticsRole = 'syndic' | 'copropriétaire' | 'admin';

const UUID_SEGMENT_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_SEGMENT_RE = /^\d+$/;
const STRIPE_LIKE_SEGMENT_RE = /^(?:cus|sub|cs|pi|pm|evt|seti|in|tok|src|card)_[a-zA-Z0-9]+$/;

function decodeSegment(segment: string) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

function normalizeSegment(segment: string) {
  const decoded = decodeSegment(segment);

  if (UUID_SEGMENT_RE.test(decoded)) return '[id]';
  if (NUMERIC_SEGMENT_RE.test(decoded)) return '[id]';
  if (STRIPE_LIKE_SEGMENT_RE.test(decoded)) return '[id]';

  return decoded;
}

export function normalizeInternalAnalyticsPath(pathname: string) {
  const cleanPath = pathname.split('?')[0]?.split('#')[0] ?? pathname;
  const segments = cleanPath
    .split('/')
    .filter(Boolean)
    .map(normalizeSegment);

  return segments.length > 0 ? `/${segments.join('/')}` : '/';
}

export function getInternalPageViewEventName(area: InternalAnalyticsArea) {
  return area === 'admin' ? 'admin_page_view' : 'dashboard_page_view';
}

export function getInternalAnalyticsContext(pathname: string, area: InternalAnalyticsArea) {
  const normalizedPath = normalizeInternalAnalyticsPath(pathname);
  const segments = normalizedPath.split('/').filter(Boolean);
  const logicalSegments = area === 'admin' && segments[0] === 'admin'
    ? segments.slice(1)
    : segments;

  const pageGroup = logicalSegments[0] ?? 'overview';
  const pageName = logicalSegments.length === 0
    ? area === 'admin' ? 'admin_home' : 'dashboard_home'
    : logicalSegments.join('_');

  return {
    normalizedPath,
    pageGroup,
    pageName,
    pageDepth: Math.max(logicalSegments.length, 1),
  };
}