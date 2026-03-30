// ============================================================
// Client Component : Export PDF + sauvegarde dans documents
// ============================================================
'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';

interface Poste { libelle: string; categorie: string; montant: number }

export interface LigneForPDF {
  id: string;
  montant_du: number;
  regularisation_ajustement?: number;
  paye: boolean;
  coproprietaires: { nom: string; prenom: string } | null;
}

export interface AppelForPDF {
  id: string;
  titre: string;
  montant_total: number;
  date_echeance: string;
  description?: string | null;
  coproprietes?: { nom: string } | null;
  lignes_appels_de_fonds?: LigneForPDF[];
  copropriete_id?: string;
  type_appel?: string | null;
  ag_resolution_id?: string | null;
  montant_fonds_travaux?: number | null;
}

interface AppelFondsPDFProps {
  appel: AppelForPDF;
}

function parsePostes(description: string | null | undefined): Poste[] | null {
  if (!description) return null;
  try {
    const parsed = JSON.parse(description);
    if (Array.isArray(parsed) && parsed.length > 0 && 'libelle' in parsed[0]) return parsed;
  } catch { /* not JSON */ }
  return null;
}

const LABELS_TYPE_APPEL: Record<string, string> = {
  budget_previsionnel: 'Budget prévisionnel',
  revision_budget: 'Révision budgétaire',
  fonds_travaux: 'Fonds de travaux',
  exceptionnel: 'Appel exceptionnel',
};

// ─── Palette partagée ─────────────────────────────────────────────────────────
const PDF_BLUE: [number, number, number]   = [37, 99, 235];
const PDF_INDIGO: [number, number, number] = [99, 102, 241];
const PDF_AMBER: [number, number, number]  = [180, 83, 9];
const PDF_LIGHT: [number, number, number]  = [239, 246, 255];
const PDF_GRAY: [number, number, number]   = [248, 250, 252];
const PDF_MGRAY: [number, number, number]  = [241, 245, 249];
const PDF_SLATE: [number, number, number]  = [100, 116, 139];

const fmtEurPDF = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(n)
    .replace(/\u00A0|\u202F/g, ' ');

function pdfSectionTitle(doc: jsPDF, text: string, y: number, color: [number, number, number] = PDF_BLUE): number {
  const mL = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(text.toUpperCase(), mL, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.5);
  doc.line(mL, y + 2, mL + text.length * 2.2, y + 2);
  doc.setTextColor(30, 30, 30);
  return y + 9;
}

function pdfAddFooters(doc: jsPDF): void {
  const W = doc.internal.pageSize.width;
  const H = doc.internal.pageSize.height;
  const total = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFillColor(245, 247, 250);
    doc.rect(0, H - 12, W, 12, 'F');
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Document généré le ${new Date().toLocaleDateString('fr-FR')} via Mon Syndic Bénévole`,
      W / 2, H - 4.5, { align: 'center' },
    );
    if (total > 1) {
      doc.text(`Page ${i} / ${total}`, W - 14, H - 4.5, { align: 'right' });
    }
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export function buildAppelFondsPDF(appel: AppelForPDF): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;

  // ── Bandeau coloré ────────────────────────────────────────
  doc.setFillColor(...PDF_BLUE);
  doc.rect(0, 0, W, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('APPEL DE FONDS', mL, 17);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Gestion de copropriété', mL, 27);
  if (appel.coproprietes?.nom) {
    doc.setFontSize(9);
    doc.text(appel.coproprietes.nom, W - mR, 14, { align: 'right' });
  }
  if (appel.type_appel) {
    doc.setFontSize(8);
    doc.text(LABELS_TYPE_APPEL[appel.type_appel] ?? appel.type_appel, W - mR, 23, { align: 'right' });
  }

  // ── Titre de l'appel ──────────────────────────────────────
  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(appel.titre, mL, y);
  y += 10;

  // ── Bloc méta-données ─────────────────────────────────────
  doc.setFillColor(...PDF_LIGHT);
  doc.roundedRect(mL, y, inner, 20, 2, 2, 'F');
  const metaItems: { label: string; value: string }[] = [
    { label: 'ÉCHÉANCE', value: formatDate(appel.date_echeance) },
    { label: 'MONTANT TOTAL', value: fmtEurPDF(appel.montant_total) },
  ];
  if (appel.type_appel) {
    metaItems.push({ label: 'TYPE', value: LABELS_TYPE_APPEL[appel.type_appel] ?? appel.type_appel });
  }
  const colW = inner / metaItems.length;
  metaItems.forEach((item, i) => {
    const ix = mL + 4 + i * colW;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_BLUE);
    doc.text(item.label, ix, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(20, 20, 20);
    doc.text(item.value, ix, y + 15);
  });
  y += 28;

  // ── Postes de charges ─────────────────────────────────────
  const postes = parsePostes(appel.description);
  if (postes && postes.length > 0) {
    y = pdfSectionTitle(doc, 'Détail des postes de charges', y, PDF_INDIGO);
    const ftAlurRow: [string, string, string][] =
      (appel.montant_fonds_travaux ?? 0) > 0
        ? [['Fonds travaux ALUR', 'Fonds travaux', fmtEurPDF(appel.montant_fonds_travaux!)]]
        : [];
    autoTable(doc, {
      startY: y,
      head: [['Libellé', 'Catégorie', 'Montant (€)']],
      body: [
        ...postes.map((p) => [
          p.libelle,
          LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie,
          fmtEurPDF(p.montant),
        ] as [string, string, string]),
        ...ftAlurRow,
      ],
      foot: [['TOTAL', '', fmtEurPDF(appel.montant_total)]],
      headStyles: { fillColor: PDF_INDIGO, fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: PDF_MGRAY, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: PDF_GRAY },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'right' } },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: mL, right: mR },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ── Répartition par copropriétaire ────────────────────────
  const lignes = appel.lignes_appels_de_fonds ?? [];
  y = pdfSectionTitle(doc, 'Répartition par copropriétaire', y, PDF_BLUE);
  autoTable(doc, {
    startY: y,
    head: [['Copropriétaire', 'Montant dû (€)', 'Statut']],
    body: lignes.map((l) => [
      l.coproprietaires ? `${l.coproprietaires.prenom} ${l.coproprietaires.nom}` : 'N/A',
      fmtEurPDF(l.montant_du),
      l.paye ? 'Payé' : 'En attente',
    ]),
    foot: [['TOTAL', fmtEurPDF(appel.montant_total), '']],
    headStyles: { fillColor: PDF_BLUE, fontSize: 9, fontStyle: 'bold' },
    footStyles: { fillColor: PDF_MGRAY, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: PDF_GRAY },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' }, 2: { halign: 'center' } },
    styles: { fontSize: 9, cellPadding: 3 },
    margin: { left: mL, right: mR },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 2) {
        const isPaid = lignes[data.row.index]?.paye;
        data.cell.styles.textColor = isPaid ? [22, 163, 74] : [180, 83, 9];
        data.cell.styles.fontStyle = 'bold';
      }
    },
  });

  pdfAddFooters(doc);
  return doc;
}

// ── PDF personnel par copropriétaire ────────────────────────
export interface AvisPersonnelInput {
  titre: string;
  montant_total: number;
  date_echeance: string;
  coproprietes?: { nom: string } | null;
  description?: string | null;
  montant_fonds_travaux?: number | null;
}

export function buildAvisPersonnelPDF(
  appel: AvisPersonnelInput,
  ligne: { montant_du: number; regularisation_ajustement?: number; coproprietaires: { nom: string; prenom: string } | null },
): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;
  const postes = parsePostes(appel.description) ?? [];
  const nomCopro = ligne.coproprietaires
    ? `${ligne.coproprietaires.prenom} ${ligne.coproprietaires.nom}`
    : 'Copropriétaire';
  const ratio = appel.montant_total > 0 ? ligne.montant_du / appel.montant_total : 0;
  const regularisationAjustement = ligne.regularisation_ajustement ?? 0;
  const hasRegularisationAjustement = Math.abs(regularisationAjustement) > 0.0001;

  // ── Bandeau coloré ────────────────────────────────────────
  doc.setFillColor(...PDF_BLUE);
  doc.rect(0, 0, W, 40, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text("AVIS D'APPEL DE FONDS", mL, 17);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Avis personnel de paiement', mL, 27);
  if (appel.coproprietes?.nom) {
    doc.setFontSize(9);
    doc.text(appel.coproprietes.nom, W - mR, 14, { align: 'right' });
  }

  // ── Titre de l'appel ──────────────────────────────────────
  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(appel.titre, mL, y);
  y += 10;

  // ── Bloc destinataire (3 colonnes) ────────────────────────
  doc.setFillColor(...PDF_LIGHT);
  doc.roundedRect(mL, y, inner, 22, 2, 2, 'F');

  // Colonne gauche : destinataire
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_BLUE);
  doc.text("À L'ATTENTION DE", mL + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(20, 20, 20);
  doc.text(nomCopro, mL + 4, y + 16);

  // Colonne centre : montant
  const midX = mL + inner * 0.52;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_BLUE);
  doc.text('MONTANT À RÉGLER', midX, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(fmtEurPDF(ligne.montant_du), midX, y + 16);

  // Colonne droite : échéance
  const farX = mL + inner * 0.78;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...PDF_BLUE);
  doc.text('ÉCHÉANCE', farX, y + 7);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(20, 20, 20);
  doc.text(formatDate(appel.date_echeance), farX, y + 16);

  y += 30;

  // ── Quote-part ────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_SLATE);
  doc.text(
    `Quote-part : ${(ratio * 100).toFixed(2)} % du budget total (${fmtEurPDF(appel.montant_total)})`,
    mL, y,
  );
  y += 10;

  if (hasRegularisationAjustement) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_SLATE);
    doc.text(
      `Régularisation imputée : ${regularisationAjustement > 0 ? 'débit' : 'crédit'} ${fmtEurPDF(regularisationAjustement)} (inclus dans le total à régler)`,
      mL,
      y,
    );
    y += 10;
  }

  // ── Postes ────────────────────────────────────────────────
  const ftAlurTotal = appel.montant_fonds_travaux ?? 0;
  if (postes.length > 0 || ftAlurTotal > 0) {
    y = pdfSectionTitle(doc, 'Détail de votre quote-part par poste', y, PDF_INDIGO);
    const ftAvisRow: [string, string, string][] =
      ftAlurTotal > 0
        ? [['Fonds travaux ALUR', 'Fonds travaux', fmtEurPDF(Math.round(ftAlurTotal * ratio * 100) / 100)]]
        : [];
    autoTable(doc, {
      startY: y,
      head: [['Poste de charge', 'Catégorie', 'Votre part (€)']],
      body: [
        ...postes.map((p) => {
          const part = Math.round(p.montant * ratio * 100) / 100;
          return [
            p.libelle,
            LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie,
            fmtEurPDF(part),
          ] as [string, string, string];
        }),
        ...ftAvisRow,
      ],
      foot: [['TOTAL À RÉGLER', '', fmtEurPDF(ligne.montant_du)]],
      headStyles: { fillColor: PDF_INDIGO, fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: PDF_MGRAY, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: PDF_GRAY },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'right' } },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: mL, right: mR },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
    doc.setFillColor(...PDF_MGRAY);
    doc.roundedRect(mL, y, inner, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...PDF_BLUE);
    doc.text(`Montant à régler : ${fmtEurPDF(ligne.montant_du)}`, mL + 4, y + 10);
    y += 24;
  }

  // ── Bloc instruction paiement ─────────────────────────────
  const instrText = `Veuillez régler la somme de ${fmtEurPDF(ligne.montant_du)} avant le ${formatDate(appel.date_echeance)} selon les modalités communiquées par votre syndic bénévole.`;
  const instrLines = doc.splitTextToSize(instrText, inner - 10);
  const instrH = instrLines.length * 5.5 + 14;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(mL, y, inner, instrH, 2, 2, 'F');
  doc.setDrawColor(...PDF_AMBER);
  doc.setLineWidth(1.2);
  doc.line(mL, y, mL, y + instrH);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...PDF_AMBER);
  doc.text('Instructions de paiement', mL + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 50, 0);
  doc.setFontSize(8.5);
  doc.text(instrLines, mL + 5, y + 15);

  pdfAddFooters(doc);
  return doc;
}

// ── Composant principal (PDF syndic) ───────────────────────
export default function AppelFondsPDF({ appel }: AppelFondsPDFProps) {
  const handleExport = () => {
    const doc = buildAppelFondsPDF(appel);
    doc.save(`appel-de-fonds-${appel.titre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  return (
    <div className="shrink-0">
      <button
        type="button"
        onClick={handleExport}
        title="Télécharger le PDF"
        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <FileDown size={15} />
      </button>
    </div>
  );
}