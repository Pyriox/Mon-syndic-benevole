type QueryValue = string | number | boolean | null | undefined;

type QueryRecord = Record<string, QueryValue>;

export function buildAdminPath(basePath: string, values: QueryRecord = {}) {
  const params = new URLSearchParams();

  for (const [key, rawValue] of Object.entries(values)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;
    params.set(key, String(rawValue));
  }

  return `${basePath}${params.toString() ? `?${params.toString()}` : ''}`;
}

export function buildAdminListHref(
  basePath: string,
  values: QueryRecord,
  defaults: QueryRecord = {},
) {
  const normalizedValues: QueryRecord = {};

  for (const [key, rawValue] of Object.entries(values)) {
    if (rawValue === undefined || rawValue === null || rawValue === '') continue;

    const value = String(rawValue);
    const defaultValue = defaults[key];

    if (defaultValue !== undefined && value === String(defaultValue)) continue;
    normalizedValues[key] = value;
  }

  return buildAdminPath(basePath, normalizedValues);
}

export function appendAdminFrom(path: string, from?: string | null) {
  if (!from) return path;

  const [pathname, rawQuery = ''] = path.split('?');
  const params = new URLSearchParams(rawQuery);
  params.set('from', from);

  return `${pathname}${params.toString() ? `?${params.toString()}` : ''}`;
}

export function resolveAdminBackHref(from: string | null | undefined, fallback: string) {
  if (!from) return fallback;

  return from.startsWith('/admin') ? from : fallback;
}
