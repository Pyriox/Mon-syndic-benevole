import { jsPDF } from 'jspdf';
import { formatDate, formatTime } from '@/lib/utils';

type ConvocationResolutionPdf = {
  numero: number;
  titre: string;
  description?: string | null;
};

type PVResolutionPdf = {
  numero: number;
  titre: string;
  statut?: string | null;
  voix_pour?: number | null;
  voix_contre?: number | null;
  voix_abstention?: number | null;
};

function pdfText(value: string | null | undefined): string {
  return String(value ?? '—').replace(/\u00A0|\u202F/g, ' ');
}

function addWrappedText(doc: jsPDF, text: string, x: number, y: number, maxWidth: number, lineHeight = 6): number {
  const lines = doc.splitTextToSize(pdfText(text), maxWidth);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensurePage(doc: jsPDF, y: number, minSpace = 24): number {
  const pageHeight = doc.internal.pageSize.height;
  if (y + minSpace <= pageHeight - 16) return y;
  doc.addPage();
  return 20;
}

function base64Pdf(doc: jsPDF): string {
  return Buffer.from(doc.output('arraybuffer')).toString('base64');
}

export function buildConvocationPdfAttachment(params: {
  agId: string;
  coproprieteNom: string;
  titreAg: string;
  dateAg: string;
  lieu?: string | null;
  notes?: string | null;
  resolutions: ConvocationResolutionPdf[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - 30;
  const left = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Convocation a l\'Assemblee Generale', left, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 32;
  y = addWrappedText(doc, `Copropriete : ${params.coproprieteNom}`, left, y, contentWidth);
  y = addWrappedText(doc, `AG : ${params.titreAg}`, left, y + 2, contentWidth);
  y = addWrappedText(doc, `Date : ${formatDate(params.dateAg, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a ${formatTime(params.dateAg)}`, left, y + 2, contentWidth);
  if (params.lieu) {
    y = addWrappedText(doc, `Lieu : ${params.lieu}`, left, y + 2, contentWidth);
  }

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Ordre du jour', left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const resolution of params.resolutions) {
    y = ensurePage(doc, y, 20);
    y = addWrappedText(doc, `${resolution.numero}. ${resolution.titre}`, left, y, contentWidth, 5.5);
    if (resolution.description) {
      y = addWrappedText(doc, resolution.description, left + 4, y + 1, contentWidth - 4, 5);
    }
    y += 3;
  }

  if (params.notes) {
    y = ensurePage(doc, y, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Notes', left, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addWrappedText(doc, params.notes, left, y + 8, contentWidth, 5.5);
  }

  return {
    filename: `convocation-ag-${params.agId}.pdf`,
    content: base64Pdf(doc),
    contentType: 'application/pdf',
  };
}

export function buildPVPdfAttachment(params: {
  agId: string;
  coproprieteNom: string;
  titreAg: string;
  dateAg: string;
  lieu?: string | null;
  quorumAtteint: boolean;
  notes?: string | null;
  resolutions: PVResolutionPdf[];
}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const contentWidth = pageWidth - 30;
  const left = 15;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Proces-verbal d\'Assemblee Generale', left, 20);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  let y = 32;
  y = addWrappedText(doc, `Copropriete : ${params.coproprieteNom}`, left, y, contentWidth);
  y = addWrappedText(doc, `AG : ${params.titreAg}`, left, y + 2, contentWidth);
  y = addWrappedText(doc, `Date : ${formatDate(params.dateAg, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} a ${formatTime(params.dateAg)}`, left, y + 2, contentWidth);
  if (params.lieu) {
    y = addWrappedText(doc, `Lieu : ${params.lieu}`, left, y + 2, contentWidth);
  }
  y = addWrappedText(doc, `Quorum : ${params.quorumAtteint ? 'atteint' : 'non atteint'}`, left, y + 2, contentWidth);

  y += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Resolutions votees', left, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  for (const resolution of params.resolutions) {
    y = ensurePage(doc, y, 22);
    const statut = resolution.statut ?? 'en attente';
    const votes = `Pour ${resolution.voix_pour ?? 0} / Contre ${resolution.voix_contre ?? 0} / Abst. ${resolution.voix_abstention ?? 0}`;
    y = addWrappedText(doc, `${resolution.numero}. ${resolution.titre}`, left, y, contentWidth, 5.5);
    y = addWrappedText(doc, `Resultat : ${statut} — ${votes}`, left + 4, y + 1, contentWidth - 4, 5);
    y += 3;
  }

  if (params.notes) {
    y = ensurePage(doc, y, 24);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Notes', left, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addWrappedText(doc, params.notes, left, y + 8, contentWidth, 5.5);
  }

  return {
    filename: `pv-ag-${params.agId}.pdf`,
    content: base64Pdf(doc),
    contentType: 'application/pdf',
  };
}
