const DOCUMENTS_BUCKET = 'documents';
const PUBLIC_PATH_MARKER = `/storage/v1/object/public/${DOCUMENTS_BUCKET}/`;
const SIGNED_PATH_MARKER = `/storage/v1/object/sign/${DOCUMENTS_BUCKET}/`;

export function extractStoragePath(value: string): string {
  const trimmed = value.trim();

  try {
    const parsed = new URL(trimmed, 'http://local.test');
    const proxyPath = parsed.searchParams.get('path');
    if (proxyPath?.trim()) {
      return proxyPath.trim();
    }
  } catch {
    // Continue with marker-based extraction below.
  }

  for (const marker of [PUBLIC_PATH_MARKER, SIGNED_PATH_MARKER]) {
    const index = trimmed.indexOf(marker);
    if (index !== -1) {
      return trimmed.slice(index + marker.length).split('?')[0] ?? '';
    }
  }

  return trimmed.split('?')[0] ?? '';
}

export function buildCoproStorageDownloadHref(coproId: string, storageValue: string): string {
  const path = extractStoragePath(storageValue);
  const params = new URLSearchParams({ coproId, path });
  return `/api/storage/download?${params.toString()}`;
}

export function extractStorageBasename(storageValue: string): string {
  const path = extractStoragePath(storageValue);
  return decodeURIComponent(path.split('/').pop() ?? 'fichier');
}