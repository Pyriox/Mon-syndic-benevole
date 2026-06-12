import 'server-only';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { buildConvocationPdfFileName, buildPvPdfFileName } from '@/lib/pdf-filenames';
import { formatDate, formatTime } from '@/lib/utils';
import { addPdfFooters, drawPdfHero, drawPdfInfoCard, drawPdfSectionTitle, PDF_COLORS } from '@/lib/pdf';

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
    filename: buildConvocationPdfFileName({
      coproprieteNom: params.coproprieteNom,
      titreAg: params.titreAg,
      dateAg: params.dateAg,
    }),
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
  type Doc = jsPDF & { lastAutoTable: { finalY: number } };
  const doc = new jsPDF() as Doc;
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;

  const BLUE  = PDF_COLORS.blue;
  const GREEN = PDF_COLORS.green;
  const RED   = PDF_COLORS.red;
  const AMBER = PDF_COLORS.amber;
  const SLATE = PDF_COLORS.slate;
  const LGRAY = PDF_COLORS.gray;
  const MGRAY = PDF_COLORS.midGray;

  function addPageHeader() {
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, W, 8, 'F');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PROCÈS-VERBAL D\'ASSEMBLÉE GÉNÉRALE', W / 2, 5.5, { align: 'center' });
  }

  function checkPage(y: number, needed = 35): number {
    if (y + needed > doc.internal.pageSize.height - 20) {
      doc.addPage();
      addPageHeader();
      return 28;
    }
    return y;
  }

  function statutBadge(statut: string): { label: string; color: [number, number, number] } {
    const map: Record<string, { label: string; color: [number, number, number] }> = {
      approuvee:  { label: 'APPROUVÉE',  color: GREEN },
      refusee:    { label: 'REFUSÉE',    color: RED },
      reportee:   { label: 'REPORTÉE',   color: AMBER },
      en_attente: { label: 'EN ATTENTE', color: SLATE },
    };
    return map[statut] ?? { label: statut.toUpperCase(), color: SLATE };
  }

  // ════════════════════════════════════════════════════════
  // PAGE 1 — EN-TÊTE
  // ════════════════════════════════════════════════════════
  drawPdfHero(doc, {
    title: 'PROCÈS-VERBAL',
    subtitle: 'd\'Assemblée Générale de copropriété',
    accent: BLUE,
    rightLines: [params.coproprieteNom],
    badge: params.quorumAtteint ? 'QUORUM ATTEINT' : 'QUORUM NON ATTEINT',
  });

  let y = 53;

  // ── Titre de l'AG ────────────────────────────────────────
  const titreLines = doc.splitTextToSize(pdfText(params.titreAg), inner - 8);
  const titreRectH = Math.max(12, titreLines.length * 5 + 6);
  doc.setFillColor(...MGRAY);
  doc.roundedRect(mL, y, inner, titreRectH, 1.5, 1.5, 'F');
  doc.setFillColor(...BLUE);
  doc.roundedRect(mL, y, 3, titreRectH, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(20, 20, 20);
  doc.text(titreLines, mL + 7, y + (titreRectH - (titreLines.length - 1) * 5) / 2 + 1.5);
  y += titreRectH + 6;

  // ── DATE / HEURE / LIEU ──────────────────────────────────
  const dateFormatted = formatDate(params.dateAg, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const heureFormatted = formatTime(params.dateAg);

  y = drawPdfInfoCard(doc, {
    x: mL,
    y,
    width: inner,
    items: [
      { label: 'DATE',  value: dateFormatted },
      { label: 'HEURE', value: heureFormatted },
      { label: 'LIEU',  value: pdfText(params.lieu ?? '–') },
    ],
    accent: BLUE,
  });

  // ── Statistiques résolutions ─────────────────────────────
  const nbApprouvees = params.resolutions.filter((r) => (r.statut ?? '') === 'approuvee').length;
  const nbRefusees   = params.resolutions.filter((r) => (r.statut ?? '') === 'refusee').length;
  const nbReportees  = params.resolutions.filter((r) => (r.statut ?? '') === 'reportee').length;

  y = drawPdfInfoCard(doc, {
    x: mL,
    y,
    width: inner,
    items: [
      { label: 'RÉSOLUTIONS APPROUVÉES', value: String(nbApprouvees) },
      { label: 'REFUSÉES / REPORTÉES',   value: `${nbRefusees} / ${nbReportees}` },
      { label: 'TOTAL',                  value: String(params.resolutions.length) },
    ],
    accent: PDF_COLORS.indigo,
  });

  // ════════════════════════════════════════════════════════
  // NOTES
  // ════════════════════════════════════════════════════════
  if (params.notes) {
    y = checkPage(y, 30);
    y = drawPdfSectionTitle(doc, 'Notes et rappels de séance', y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(50);
    const noteLines = doc.splitTextToSize(pdfText(params.notes), inner);
    doc.text(noteLines, mL, y);
    y += noteLines.length * 5 + 10;
  }

  // ════════════════════════════════════════════════════════
  // RÉSOLUTIONS
  // ════════════════════════════════════════════════════════
  y = checkPage(y, 40);
  y = drawPdfSectionTitle(doc, 'Résolutions votées', y);

  for (const res of params.resolutions) {
    const statut = res.statut ?? 'en_attente';
    const badge = statutBadge(statut);
    const titreResLines = doc.splitTextToSize(pdfText(res.titre), inner - 80);
    const rectH = Math.max(10, titreResLines.length * 5 + 4);
    const estH = rectH + 2 + 22 + 8;
    y = checkPage(y, estH);

    // ── Titre ─────────────────────────────────────────────
    doc.setFillColor(...MGRAY);
    doc.roundedRect(mL, y, inner, rectH, 1.5, 1.5, 'F');

    // Badge numéro
    doc.setFillColor(...BLUE);
    doc.roundedRect(mL + 1, y + (rectH - 8) / 2, 12, 8, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`#${res.numero}`, mL + 7, y + rectH / 2 + 1.5, { align: 'center' });

    // Titre de la résolution
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(titreResLines, mL + 16, y + (rectH - (titreResLines.length - 1) * 5) / 2 + 1.5);

    // Badge statut
    doc.setFillColor(...badge.color);
    doc.roundedRect(W - mR - 28, y + (rectH - 7) / 2, 27, 7, 1, 1, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(255, 255, 255);
    doc.text(badge.label, W - mR - 14.5, y + rectH / 2 + 1.5, { align: 'center' });

    y += rectH + 2;

    // ── Résultats votes ────────────────────────────────────
    const voteRows: { label: string; val: number; col: [number, number, number] }[] = [
      { label: 'Pour',       val: res.voix_pour ?? 0,        col: GREEN },
      { label: 'Contre',     val: res.voix_contre ?? 0,      col: RED   },
      { label: 'Abstention', val: res.voix_abstention ?? 0,  col: SLATE },
    ];
    for (const vr of voteRows) {
      doc.setFillColor(...LGRAY);
      doc.roundedRect(mL + 2, y - 1, inner - 4, 6.5, 1.5, 1.5, 'F');
      doc.setFillColor(...vr.col);
      doc.circle(mL + 6, y + 1.8, 1.5, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...vr.col);
      doc.text(vr.label, mL + 10, y + 3.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(50, 50, 50);
      doc.text(
        `${vr.val} tantième${vr.val !== 1 ? 's' : ''}`,
        mL + 36, y + 3.2,
      );
      y += 6;
    }
    y += 8;
  }

  // ════════════════════════════════════════════════════════
  // SYNTHÈSE
  // ════════════════════════════════════════════════════════
  const treated = params.resolutions.filter((r) => r.statut && r.statut !== 'en_attente');
  if (treated.length > 0) {
    y = checkPage(y, 50);
    y = drawPdfSectionTitle(doc, 'Synthèse', y);

    autoTable(doc, {
      startY: y,
      head: [['N°', 'Résolution', 'Résultat', 'Pour', 'Contre', 'Abst.']],
      body: params.resolutions.map((r) => {
        const b = statutBadge(r.statut ?? 'en_attente');
        return [r.numero, pdfText(r.titre), b.label, r.voix_pour ?? 0, r.voix_contre ?? 0, r.voix_abstention ?? 0];
      }),
      headStyles: { fillColor: BLUE, fontSize: 8 },
      alternateRowStyles: { fillColor: LGRAY },
      styles: { fontSize: 8, cellPadding: 2.5 },
      columnStyles: {
        0: { cellWidth: 8,  halign: 'center' },
        1: { cellWidth: 85 },
        2: { cellWidth: 25, halign: 'center', fontStyle: 'bold' },
        3: { cellWidth: 16, halign: 'right' },
        4: { cellWidth: 16, halign: 'right' },
        5: { cellWidth: 16, halign: 'right' },
      },
      margin: { left: mL, right: mR },
      didParseCell: (data) => {
        if (data.column.index === 2 && data.section === 'body') {
          const r = params.resolutions[data.row.index];
          if (r) {
            const b = statutBadge(r.statut ?? 'en_attente');
            data.cell.styles.textColor = b.color;
          }
        }
      },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // ════════════════════════════════════════════════════════
  // SIGNATURES
  // ════════════════════════════════════════════════════════
  y = checkPage(y, 45);
  y = drawPdfSectionTitle(doc, 'Signatures', y);

  const sigBoxes = [
    { x: mL,       label: 'Le Président de séance' },
    { x: mL + 60,  label: 'Le Secrétaire de séance' },
    { x: mL + 120, label: 'Le(s) Scrutateur(s)' },
  ];
  for (const s of sigBoxes) {
    doc.setFillColor(...LGRAY);
    doc.roundedRect(s.x, y, 52, 28, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(80);
    doc.text(s.label, s.x + 26, y + 5.5, { align: 'center' });
    doc.setDrawColor(180);
    doc.setLineWidth(0.3);
    doc.line(s.x + 8, y + 22, s.x + 44, y + 22);
  }
  y += 34;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text(`Fait le ${new Date().toLocaleDateString('fr-FR')}`, mL, y);

  // ── Pieds de page ───────────────────────────────────────
  addPdfFooters(doc, {
    leftText: `PV — ${params.coproprieteNom} — ${formatDate(params.dateAg)}`,
    centerText: 'Généré via Mon Syndic Bénévole',
  });

  return {
    filename: buildPvPdfFileName({
      coproprieteNom: params.coproprieteNom,
      titreAg: params.titreAg,
      dateAg: params.dateAg,
    }),
    content: base64Pdf(doc),
    contentType: 'application/pdf',
  };
}
