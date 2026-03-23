// Utilitaire de validation de fichiers par magic bytes
// Partagé entre upload-document et les tests

/** Signatures magiques par type MIME (premiers octets attendus) */
export const MAGIC_SIGNATURES: Record<string, number[][]> = {
  'application/pdf':         [[0x25, 0x50, 0x44, 0x46]],                       // %PDF
  'image/jpeg':              [[0xFF, 0xD8, 0xFF]],
  'image/png':               [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
  'image/gif':               [[0x47, 0x49, 0x46, 0x38, 0x37, 0x61], [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]], // GIF87a, GIF89a
  'image/webp':              [[0x52, 0x49, 0x46, 0x46]],                        // RIFF header
  'application/msword':      [[0xD0, 0xCF, 0x11, 0xE0]],                       // OLE
  'application/vnd.ms-excel': [[0xD0, 0xCF, 0x11, 0xE0]],                      // OLE
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // ZIP
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':       [[0x50, 0x4B, 0x03, 0x04]], // ZIP
  // text/plain, text/csv : pas de signature fiable, vérification ignorée
};

/**
 * Vérifie que l'ArrayBuffer correspond aux magic bytes attendus pour le type MIME.
 * Retourne true pour les types sans signature connue (texte plat).
 */
export function hasMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const signatures = MAGIC_SIGNATURES[mimeType];
  if (!signatures) return true; // texte plat — pas de vérification
  const bytes = new Uint8Array(buffer, 0, Math.min(buffer.byteLength, 8));
  return signatures.some(sig => sig.every((b, i) => bytes[i] === b));
}
