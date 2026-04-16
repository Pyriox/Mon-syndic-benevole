import { jsPDF } from 'jspdf';

export type PdfColor = [number, number, number];
export type PdfDoc = jsPDF & { lastAutoTable?: { finalY: number } };

export const PDF_COLORS = {
  blue: [29, 78, 216] as PdfColor,
  indigo: [99, 102, 241] as PdfColor,
  green: [22, 163, 74] as PdfColor,
  red: [220, 38, 38] as PdfColor,
  amber: [180, 83, 9] as PdfColor,
  slate: [100, 116, 139] as PdfColor,
  light: [239, 246, 255] as PdfColor,
  gray: [248, 250, 252] as PdfColor,
  midGray: [241, 245, 249] as PdfColor,
} as const;

export function formatPdfEuros(value: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(value)
    .replace(/\u00A0|\u202F/g, ' ');
}

export function ensurePdfSpace(
  doc: jsPDF,
  y: number,
  minSpace = 30,
  onNewPage?: () => void,
): number {
  if (y + minSpace <= doc.internal.pageSize.height - 20) return y;
  doc.addPage();
  onNewPage?.();
  return 28;
}

export function drawPdfSectionTitle(
  doc: jsPDF,
  text: string,
  y: number,
  color: PdfColor = PDF_COLORS.blue,
  x = 14,
): number {
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(text.toUpperCase(), x, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(x, y + 2, x + Math.max(26, text.length * 2.3), y + 2);
  doc.setTextColor(30, 30, 30);
  return y + 8;
}

export function addPdfFooters(
  doc: jsPDF,
  options: {
    leftText?: string;
    centerText?: string;
  } = {},
): void {
  const width = doc.internal.pageSize.width;
  const height = doc.internal.pageSize.height;
  const totalPages = doc.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setFillColor(245, 247, 250);
    doc.rect(0, height - 12, width, 12, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    if (options.leftText) {
      doc.text(options.leftText, 14, height - 4.5);
    }
    doc.text(options.centerText ?? 'Généré via Mon Syndic Bénévole', width / 2, height - 4.5, { align: 'center' });
    if (totalPages > 1) {
      doc.text(`Page ${page} / ${totalPages}`, width - 14, height - 4.5, { align: 'right' });
    }
  }
}

export function drawPdfHero(
  doc: jsPDF,
  options: {
    title: string;
    subtitle: string;
    accent?: PdfColor;
    rightLines?: string[];
    badge?: string;
  },
): number {
  const width = doc.internal.pageSize.width;
  const accent = options.accent ?? PDF_COLORS.blue;
  const rightLines = options.rightLines ?? [];

  doc.setFillColor(...accent);
  doc.rect(0, 0, width, 42, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text(options.title, 14, 17);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.text(options.subtitle, 14, 27);

  if (rightLines.length > 0) {
    doc.setFontSize(8.5);
    rightLines.slice(0, 3).forEach((line, index) => {
      doc.text(line, width - 14, 14 + index * 5.5, { align: 'right' });
    });
  }

  if (options.badge) {
    doc.setDrawColor(255, 255, 255);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(width - 58, 28, 44, 8, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text(options.badge, width - 36, 33.5, { align: 'center' });
  }

  return 50;
}

export function drawPdfInfoCard(
  doc: jsPDF,
  options: {
    x: number;
    y: number;
    width: number;
    items: Array<{ label: string; value: string }>;
    background?: PdfColor;
    accent?: PdfColor;
    compact?: boolean;
  },
): number {
  const background = options.background ?? PDF_COLORS.light;
  const accent = options.accent ?? PDF_COLORS.blue;
  const compact = options.compact ?? false;
  const cardHeight = compact ? 20 : 24;
  const colWidth = options.width / Math.max(1, options.items.length);

  doc.setFillColor(...background);
  doc.roundedRect(options.x, options.y, options.width, cardHeight, 2, 2, 'F');

  options.items.forEach((item, index) => {
    const colX = options.x + 4 + index * colWidth;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...accent);
    doc.text(item.label, colX, options.y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(compact ? 9 : 9.5);
    doc.setTextColor(20, 20, 20);
    const lines = doc.splitTextToSize(item.value || '–', colWidth - 6);
    doc.text(lines[0] ?? '–', colX, options.y + 15);
    if (!compact && lines.length > 1) {
      doc.text(lines[1], colX, options.y + 20);
    }
  });

  return options.y + cardHeight + 8;
}