const PRODUCTION_SITE_URL = 'https://www.mon-syndic-benevole.fr';

function normalize(url: string): string {
  return url.trim().replace(/\/$/, '');
}

function isPreviewHost(url: string): boolean {
  return /\.vercel\.app$/i.test(new URL(url).hostname);
}

export function getCanonicalSiteUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.SITE_URL,
    process.env.APP_URL,
  ].filter((value): value is string => Boolean(value?.trim()));

  for (const candidate of candidates) {
    try {
      const normalized = normalize(candidate);
      if (!isPreviewHost(normalized)) {
        return normalized;
      }
    } catch {
      // Ignore invalid URLs and continue to the canonical fallback.
    }
  }

  return PRODUCTION_SITE_URL;
}
