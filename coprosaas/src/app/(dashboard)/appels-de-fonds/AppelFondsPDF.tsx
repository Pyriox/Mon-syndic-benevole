// ============================================================
// Client Component : Export PDF + sauvegarde dans documents
// ============================================================
'use client';

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FileDown } from 'lucide-react';
import { buildAppelFondsPdfFileName } from '@/lib/pdf-filenames';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';
import { addPdfFooters, drawPdfHero, drawPdfInfoCard, drawPdfSectionTitle, ensurePdfSpace, formatPdfEuros, PDF_COLORS } from '@/lib/pdf';

interface Poste { libelle: string; categorie: string; montant: number }
export interface PersonalPosteDetail { libelle: string; categorie?: string | null; montant: number }

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
  revision_fonds_travaux: 'Révision fonds de travaux',
  exceptionnel: 'Appel exceptionnel',
};

export function buildAppelFondsPDF(appel: AppelForPDF): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;

  const rightLines = [
    appel.coproprietes?.nom ?? '',
    appel.type_appel ? (LABELS_TYPE_APPEL[appel.type_appel] ?? appel.type_appel) : '',
  ].filter(Boolean);

  drawPdfHero(doc, {
    title: 'APPEL DE FONDS',
    subtitle: 'Gestion de copropriété',
    accent: PDF_COLORS.blue,
    rightLines,
    badge: 'DOCUMENT COMPTABLE',
  });

  // ── Titre de l'appel ──────────────────────────────────────
  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(appel.titre, mL, y);
  y += 10;

  // ── Bloc méta-données ─────────────────────────────────────
  const metaItems: { label: string; value: string }[] = [
    { label: 'ÉCHÉANCE', value: formatDate(appel.date_echeance) },
    { label: 'MONTANT TOTAL', value: formatPdfEuros(appel.montant_total) },
  ];
  if (appel.type_appel) {
    metaItems.push({ label: 'TYPE', value: LABELS_TYPE_APPEL[appel.type_appel] ?? appel.type_appel });
  }
  y = drawPdfInfoCard(doc, {
    x: mL,
    y,
    width: inner,
    items: metaItems,
    accent: PDF_COLORS.blue,
    compact: true,
  });

  // ── Postes de charges ─────────────────────────────────────
  const postes = parsePostes(appel.description);
  if (postes && postes.length > 0) {
    y = drawPdfSectionTitle(doc, 'Détail des postes de charges', y, PDF_COLORS.indigo);
    const ftAlurRow: [string, string, string][] =
      (appel.montant_fonds_travaux ?? 0) > 0
        ? [['Fonds travaux ALUR', 'Fonds travaux', formatPdfEuros(appel.montant_fonds_travaux!)]]
        : [];
    autoTable(doc, {
      startY: y,
      head: [['Libellé', 'Catégorie', 'Montant (€)']],
      body: [
        ...postes.map((p) => [
          p.libelle,
          LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie,
          formatPdfEuros(p.montant),
        ] as [string, string, string]),
        ...ftAlurRow,
      ],
      foot: [['TOTAL', '', formatPdfEuros(appel.montant_total)]],
      headStyles: { fillColor: PDF_COLORS.indigo, fontSize: 9, fontStyle: 'bold' },
      footStyles: { fillColor: PDF_COLORS.midGray, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
      alternateRowStyles: { fillColor: PDF_COLORS.gray },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'right' } },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: mL, right: mR },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  }

  // ── Répartition par copropriétaire ────────────────────────
  const lignes = appel.lignes_appels_de_fonds ?? [];
  y = drawPdfSectionTitle(doc, 'Répartition par copropriétaire', y, PDF_COLORS.blue);
  autoTable(doc, {
    startY: y,
    head: [['Copropriétaire', 'Montant dû (€)', 'Statut']],
    body: lignes.map((l) => [
      l.coproprietaires ? `${l.coproprietaires.prenom} ${l.coproprietaires.nom}` : 'N/A',
      formatPdfEuros(l.montant_du),
      l.paye ? 'Payé' : 'En attente',
    ]),
    foot: [['TOTAL', formatPdfEuros(appel.montant_total), '']],
    headStyles: { fillColor: PDF_COLORS.blue, fontSize: 9, fontStyle: 'bold' },
    footStyles: { fillColor: PDF_COLORS.midGray, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
    alternateRowStyles: { fillColor: PDF_COLORS.gray },
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

  addPdfFooters(doc, {
    leftText: `Appel de fonds — ${appel.coproprietes?.nom ?? ''}`,
    centerText: `Document généré le ${new Date().toLocaleDateString('fr-FR')} via Mon Syndic Bénévole`,
  });
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
  detailPostes?: PersonalPosteDetail[],
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

  drawPdfHero(doc, {
    title: "AVIS D'APPEL DE FONDS",
    subtitle: 'Avis personnel de paiement',
    accent: PDF_COLORS.blue,
    rightLines: [appel.coproprietes?.nom ?? ''].filter(Boolean),
    badge: 'ESPACE DOCUMENTS',
  });

  // ── Titre de l'appel ──────────────────────────────────────
  let y = 50;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(20, 20, 20);
  doc.text(appel.titre, mL, y);
  y += 10;

  y = drawPdfInfoCard(doc, {
    x: mL,
    y,
    width: inner,
    items: [
      { label: "À L'ATTENTION DE", value: nomCopro },
      { label: 'MONTANT À RÉGLER', value: formatPdfEuros(ligne.montant_du) },
      { label: 'ÉCHÉANCE', value: formatDate(appel.date_echeance) },
    ],
    accent: PDF_COLORS.blue,
  });

  doc.setFillColor(...PDF_COLORS.midGray);
  doc.roundedRect(mL, y, inner, 15, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.blue);
  doc.text(`Montant à régler : ${formatPdfEuros(ligne.montant_du)}`, mL + 4, y + 9.5);
  y += 23;

  // ── Quote-part ────────────────────────────────────────────
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...PDF_COLORS.slate);
  doc.text(
    `Quote-part : ${(ratio * 100).toFixed(2)} % du budget total (${formatPdfEuros(appel.montant_total)})`,
    mL, y,
  );
  y += 10;

  if (hasRegularisationAjustement) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...PDF_COLORS.slate);
    doc.text(
      `Régularisation imputée : ${regularisationAjustement > 0 ? 'débit' : 'crédit'} ${formatPdfEuros(regularisationAjustement)} (inclus dans le total à régler)`,
      mL,
      y,
    );
    y += 10;
  }

  // ── Postes ────────────────────────────────────────────────
  const ftAlurTotal = appel.montant_fonds_travaux ?? 0;
  const effectiveDetailRows: PersonalPosteDetail[] = detailPostes !== undefined
    ? detailPostes
    : [
        ...postes.map((p) => ({
          libelle: p.libelle,
          categorie: p.categorie,
          montant: Math.round(p.montant * ratio * 100) / 100,
        })),
        ...(ftAlurTotal > 0
          ? [{ libelle: 'Fonds travaux ALUR', categorie: 'fonds_travaux_alur', montant: Math.round(ftAlurTotal * ratio * 100) / 100 }]
          : []),
      ].filter((row) => Math.abs(row.montant) >= 0.01);

  if (effectiveDetailRows.length > 0) {
        y = drawPdfSectionTitle(doc, 'Détail de votre quote-part par poste', y, PDF_COLORS.indigo);
    autoTable(doc, {
      startY: y,
      head: [['Poste de charge', 'Catégorie', 'Votre part (€)']],
      body: effectiveDetailRows.map((detail) => ([
        detail.libelle,
        LABELS_CATEGORIE[(detail.categorie ?? 'autre') as keyof typeof LABELS_CATEGORIE] ?? (detail.categorie ?? 'Autre'),
            formatPdfEuros(detail.montant),
      ] as [string, string, string])),
          foot: [['TOTAL À RÉGLER', '', formatPdfEuros(ligne.montant_du)]],
          headStyles: { fillColor: PDF_COLORS.indigo, fontSize: 9, fontStyle: 'bold' },
          footStyles: { fillColor: PDF_COLORS.midGray, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 9 },
          alternateRowStyles: { fillColor: PDF_COLORS.gray },
      columnStyles: { 0: { fontStyle: 'bold' }, 2: { halign: 'right' } },
      styles: { fontSize: 9, cellPadding: 3 },
      margin: { left: mL, right: mR },
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12;
  } else {
        doc.setFillColor(...PDF_COLORS.midGray);
    doc.roundedRect(mL, y, inner, 16, 2, 2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
        doc.setTextColor(...PDF_COLORS.blue);
        doc.text(`Montant à régler : ${formatPdfEuros(ligne.montant_du)}`, mL + 4, y + 10);
    y += 24;
  }

      y = ensurePdfSpace(doc, y, 26);
      doc.setFillColor(...PDF_COLORS.gray);
      doc.roundedRect(mL, y, inner, 16, 2, 2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...PDF_COLORS.slate);
      doc.text('Consultation et archivage', mL + 4, y + 6.5);
      doc.setFont('helvetica', 'normal');
      doc.text('Cet avis reste disponible dans votre espace Documents pour consultation ultérieure.', mL + 4, y + 12);
      y += 24;

  // ── Bloc instruction paiement ─────────────────────────────
      const instrText = `Veuillez régler la somme de ${formatPdfEuros(ligne.montant_du)} avant le ${formatDate(appel.date_echeance)} selon les modalités communiquées par votre syndic bénévole.`;
  const instrLines = doc.splitTextToSize(instrText, inner - 10);
  const instrH = instrLines.length * 5.5 + 14;
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(mL, y, inner, instrH, 2, 2, 'F');
      doc.setDrawColor(...PDF_COLORS.amber);
  doc.setLineWidth(1.2);
  doc.line(mL, y, mL, y + instrH);
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
      doc.setTextColor(...PDF_COLORS.amber);
  doc.text('Instructions de paiement', mL + 5, y + 8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 50, 0);
  doc.setFontSize(8.5);
  doc.text(instrLines, mL + 5, y + 15);

      addPdfFooters(doc, {
        leftText: `Avis d'appel de fonds — ${appel.coproprietes?.nom ?? ''}`,
        centerText: `Document généré le ${new Date().toLocaleDateString('fr-FR')} via Mon Syndic Bénévole`,
      });
  return doc;
}

// ── Composant principal (PDF syndic) ───────────────────────
export default function AppelFondsPDF({ appel }: AppelFondsPDFProps) {
  const handleExport = () => {
    const doc = buildAppelFondsPDF(appel);
    doc.save(buildAppelFondsPdfFileName({
      coproprieteNom: appel.coproprietes?.nom,
      titreAppel: appel.titre,
      dateEcheance: appel.date_echeance,
    }));
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