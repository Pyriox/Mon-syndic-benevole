// ============================================================
// Client Component : Génération de la convocation AG en PDF
// + envoi par email aux copropriétaires
// ============================================================
'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '@/components/ui/Button';
import { formatDate, formatTime } from '@/lib/utils';
import { addPdfFooters, drawPdfHero, drawPdfInfoCard, drawPdfSectionTitle, ensurePdfSpace, formatPdfEuros, PDF_COLORS } from '@/lib/pdf';
import { FileDown } from 'lucide-react';

interface Resolution {
  numero: number;
  titre: string;
  description: string | null;
  type_resolution?: string | null;
  budget_postes?: { libelle: string; montant: number }[] | null;
  fonds_travaux_montant?: number | null;
}

export interface ConvocationAGData {
  id: string;
  titre: string;
  date_ag: string;
  lieu: string | null;
  notes: string | null;
  convocation_envoyee_le?: string | null;
  coproprietes?: { nom: string; adresse?: string; ville?: string; code_postal?: string } | null;
}

interface ConvocationPDFProps {
  ag: ConvocationAGData;
  resolutions: Resolution[];
}

function genererConvocationDoc(ag: ConvocationAGData, resolutions: Resolution[]): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;
  const rightLines = [
    ag.coproprietes?.nom ?? '',
    ag.coproprietes?.adresse ?? '',
    `${ag.coproprietes?.code_postal ?? ''} ${ag.coproprietes?.ville ?? ''}`.trim(),
  ].filter(Boolean);

  const headerTitle = ag.convocation_envoyee_le ? 'CONVOCATION OFFICIELLE' : 'CONVOCATION';
  let y = drawPdfHero(doc, {
    title: headerTitle,
    subtitle: "Assemblée Générale de copropriété",
    accent: PDF_COLORS.blue,
    rightLines,
    badge: 'ORDRE DU JOUR',
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  const agTitleLines = doc.splitTextToSize(ag.titre, inner);
  doc.text(agTitleLines, mL, y);
  y += agTitleLines.length * 6 + 4;

  const dateFormatted = formatDate(ag.date_ag, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const heureFormatted = formatTime(ag.date_ag);

  y = drawPdfInfoCard(doc, {
    x: mL,
    y,
    width: inner,
    items: [
      { label: 'DATE', value: dateFormatted },
      { label: 'HEURE', value: heureFormatted },
      { label: 'LIEU', value: ag.lieu ?? '–' },
    ],
    accent: PDF_COLORS.blue,
  });

  // ── Corps de lettre ─────────────────────────────────────────
  doc.setFontSize(10);
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.text('Madame, Monsieur,', mL, y);
  y += 8;

  const intro = doc.splitTextToSize(
    `Nous avons l'honneur de vous convoquer à l'assemblée générale de la copropriété "${ag.coproprietes?.nom ?? ''}" qui se tiendra le ${dateFormatted} à ${heureFormatted}${ag.lieu ? ` — ${ag.lieu}` : ''}.`,
    inner
  );
  doc.setFontSize(10);
  doc.text(intro, mL, y);
  y += intro.length * 5.5 + 5;

  doc.setFillColor(...PDF_COLORS.gray);
  doc.roundedRect(mL, y, inner, 18, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.slate);
  doc.text('Contenu de la convocation', mL + 4, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Date, lieu, ordre du jour détaillé et informations utiles à consulter avant l’assemblée.', mL + 4, y + 13);
  y += 26;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80);
  const ref = doc.splitTextToSize(
    "Conformément à l'article 9 du décret du 17 mars 1967, vous trouverez ci-dessous l'ordre du jour de cette assemblée.",
    inner
  );
  doc.text(ref, mL, y);
  y += ref.length * 5.5 + 8;

  // ── Ordre du jour ───────────────────────────────────────────
  y = drawPdfSectionTitle(doc, 'Ordre du jour', y, PDF_COLORS.blue);

  autoTable(doc, {
    startY: y,
    head: [['N°', 'Résolution', 'Précisions / informations budgétaires']],
    body: resolutions.map((r) => {
      const parts: string[] = [];
      if (r.description) parts.push(r.description);
      if (r.budget_postes && r.budget_postes.length > 0) {
        const total = r.budget_postes.reduce((s, p) => s + p.montant, 0);
        parts.push(`Budget proposé : ${formatPdfEuros(total)}`);
        r.budget_postes.forEach((p) => parts.push(`  • ${p.libelle} : ${formatPdfEuros(p.montant)}`));
      }
      if (r.fonds_travaux_montant != null) {
        parts.push(`Cotisation fonds de travaux : ${formatPdfEuros(r.fonds_travaux_montant)}`);
      }
      return [r.numero, r.titre, parts.join('\n') || '–'];
    }),
    headStyles: { fillColor: PDF_COLORS.blue, fontSize: 9, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: PDF_COLORS.gray },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 74, fontStyle: 'bold' },
      2: { cellWidth: inner - 10 - 74 - 4, fontSize: 8 },
    },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    margin: { left: mL, right: mR },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Notes / observations ────────────────────────────────────
  if (ag.notes) {
    y = ensurePdfSpace(doc, y, 30, () => undefined);
    y = drawPdfSectionTitle(doc, 'Observations', y, PDF_COLORS.indigo);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    const notesLines = doc.splitTextToSize(ag.notes, inner);
    doc.text(notesLines, mL, y);
    y += notesLines.length * 5 + 8;
  }

  y = ensurePdfSpace(doc, y, 24, () => undefined);
  doc.setFillColor(...PDF_COLORS.midGray);
  doc.roundedRect(mL, y, inner, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.slate);
  doc.text('Consultation des documents', mL + 4, y + 6.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Les pièces associées à l’assemblée restent consultables dans votre espace Documents.', mL + 4, y + 12);
  y += 24;

  // ── Formule de politesse ────────────────────────────────────
  y = ensurePdfSpace(doc, y, 30, () => undefined);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(40);
  doc.text('Veuillez agréer, Madame, Monsieur, l\'expression de nos salutations distinguées.', mL, y);
  y += 14;

  // Signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('Le Syndic bénévole', mL, y);
  doc.setLineWidth(0.3);
  doc.setDrawColor(180);
  doc.line(mL, y + 12, mL + 60, y + 12);

  // ── Pied de page (toutes les pages) ─────────────────────────
  addPdfFooters(doc, {
    leftText: `Convocation — ${ag.coproprietes?.nom ?? ''}`,
    centerText: `Document généré le ${new Date().toLocaleDateString('fr-FR')} via Mon Syndic Bénévole`,
  });

  return doc;
}

export { genererConvocationDoc };
export type { Resolution as ConvocationResolution };

export default function ConvocationPDF({ ag, resolutions }: ConvocationPDFProps) {
  const handleDownload = () => {
    const doc = genererConvocationDoc(ag, resolutions);
    doc.save(`convocation-ag-${ag.id}.pdf`);
  };

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload}>
      <FileDown size={14} /> Convocation PDF
    </Button>
  );
}
