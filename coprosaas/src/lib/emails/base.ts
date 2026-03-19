// ============================================================
// Base layout partagé pour tous les e-mails transactionnels.
// Design : minimaliste, compatible tous clients mail.
// ============================================================

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.mon-syndic-benevole.fr';
export const CONTACT_EMAIL = 'contact@mon-syndic-benevole.fr';
export const BRAND_NAME = 'Mon Syndic Bénévole';

// Palette
export const COLOR = {
  blue:   '#1d4ed8',
  amber:  '#b45309',
  red:    '#b91c1c',
  green:  '#16a34a',
  text:   '#111827',
  muted:  '#6b7280',
  border: '#e5e7eb',
  bg:     '#f4f6f8',
  white:  '#ffffff',
} as const;

/**
 * Wraps `innerHtml` in the shared email shell.
 *
 * @param innerHtml  - The content between header and footer
 * @param accentColor - Top border accent color (hex)
 */
export function wrapEmail(innerHtml: string, accentColor: string = COLOR.blue): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};font-family:Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${COLOR.bg};padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px">

          <!-- CARD -->
          <tr>
            <td style="background:${COLOR.white};border-radius:10px;border-top:3px solid ${accentColor};box-shadow:0 1px 4px rgba(0,0,0,0.07);overflow:hidden">

              <!-- En-tête logo -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:22px 32px 18px;border-bottom:1px solid ${COLOR.border}">
                    <span style="font-size:14px;font-weight:700;color:${COLOR.text};letter-spacing:-0.2px">
                      Mon Syndic Bénévole
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Contenu -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding:28px 32px 32px">
                    ${innerHtml}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Pied de page -->
          <tr>
            <td style="padding:20px 0 4px" align="center">
              <p style="margin:0;font-size:12px;color:${COLOR.muted};line-height:1.6">
                ${BRAND_NAME} · <a href="${SITE_URL}" style="color:${COLOR.muted};text-decoration:underline">mon-syndic-benevole.fr</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---- Helpers ----------------------------------------------------------------

/** Échappe les caractères HTML dangereux */
export function h(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function formatDateFR(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
  });
}

export function formatEurosFR(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);
}

/** Bouton CTA inline-table pour compatibilité max */
export function ctaButton(label: string, href: string, color: string = COLOR.blue): string {
  return `
<table cellpadding="0" cellspacing="0" style="margin:24px 0">
  <tr>
    <td style="border-radius:7px;background:${color}">
      <a href="${href}"
         style="display:inline-block;padding:13px 28px;color:#fff;font-size:14px;font-weight:700;text-decoration:none;border-radius:7px;letter-spacing:0.1px">
        ${label}
      </a>
    </td>
  </tr>
</table>`;
}

/** Bloc info (label gris + valeur) */
export function infoRow(label: string, value: string, valueStyle = ''): string {
  return `
<tr>
  <td style="padding:7px 0;border-bottom:1px solid ${COLOR.border}">
    <span style="font-size:12px;color:${COLOR.muted};display:block;margin-bottom:2px">${label}</span>
    <span style="font-size:14px;font-weight:600;color:${COLOR.text}${valueStyle ? ';' + valueStyle : ''}">${value}</span>
  </td>
</tr>`;
}

/** Tableau de données (liste de infoRow) */
export function infoTable(rows: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border-top:1px solid ${COLOR.border}">
  ${rows}
</table>`;
}

/** Bannière d'alerte */
export function alertBanner(text: string, color: string, bgColor: string): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0">
  <tr>
    <td style="background:${bgColor};border-left:3px solid ${color};border-radius:0 6px 6px 0;padding:12px 16px">
      <p style="margin:0;font-size:13px;color:${color};font-weight:600;line-height:1.5">${text}</p>
    </td>
  </tr>
</table>`;
}
