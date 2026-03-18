// ============================================================
// Client Component : Export PDF + sauvegarde dans documents
// ============================================================
'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';
import { FileDown, Save } from 'lucide-react';
import { formatEuros, formatDate, LABELS_CATEGORIE } from '@/lib/utils';

interface Poste { libelle: string; categorie: string; montant: number }

export interface LigneForPDF {
  id: string;
  montant_du: number;
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

export function buildAppelFondsPDF(appel: AppelForPDF): jsPDF {
  const doc = new jsPDF();

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('APPEL DE FONDS', 14, 22);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(appel.titre, 14, 30);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Copropriete : ${appel.coproprietes?.nom ?? ''}`, 14, 42);
  doc.text(`Date d'echeance : ${formatDate(appel.date_echeance)}`, 14, 49);
  doc.text(`Montant total : ${formatEuros(appel.montant_total)}`, 14, 56);
  if (appel.type_appel) {
    doc.text(`Type : ${LABELS_TYPE_APPEL[appel.type_appel] ?? appel.type_appel}`, 14, 63);
  }

  let nextY = appel.type_appel ? 71 : 64;

  const postes = parsePostes(appel.description);
  if (postes && postes.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0);
    doc.text('Detail des postes de charges', 14, nextY);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Libelle', 'Categorie', 'Montant (EUR)']],
      body: postes.map((p) => [
        p.libelle,
        LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie,
        formatEuros(p.montant),
      ]),
      foot: [['TOTAL', '', formatEuros(appel.montant_total)]],
      headStyles: { fillColor: [99, 102, 241] },
      footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  const lignes = appel.lignes_appels_de_fonds ?? [];
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0);
  doc.text('Repartition par coproprietaire', 14, nextY);

  autoTable(doc, {
    startY: nextY + 4,
    head: [['Coproprietaire', 'Montant du (EUR)', 'Statut']],
    body: lignes.map((l) => [
      l.coproprietaires ? `${l.coproprietaires.prenom} ${l.coproprietaires.nom}` : 'N/A',
      formatEuros(l.montant_du),
      l.paye ? 'Paye' : 'En attente',
    ]),
    foot: [['TOTAL', formatEuros(appel.montant_total), '']],
    headStyles: { fillColor: [37, 99, 235] },
    footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
  });

  const pageCount = (doc as jsPDF & { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')} — Mon Syndic Bénévole`, 14, doc.internal.pageSize.height - 10);
  doc.text(`Page 1/${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);

  return doc;
}

// ── PDF personnel par copropriétaire ────────────────────────
export interface AvisPersonnelInput {
  titre: string;
  montant_total: number;
  date_echeance: string;
  coproprietes?: { nom: string } | null;
  description?: string | null;
}

export function buildAvisPersonnelPDF(
  appel: AvisPersonnelInput,
  ligne: { montant_du: number; coproprietaires: { nom: string; prenom: string } | null },
): jsPDF {
  const doc = new jsPDF();
  const postes = parsePostes(appel.description) ?? [];
  const nomCopro = ligne.coproprietaires
    ? `${ligne.coproprietaires.prenom} ${ligne.coproprietaires.nom}`
    : 'Copropriétaire';
  const ratio = appel.montant_total > 0 ? ligne.montant_du / appel.montant_total : 0;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("AVIS D'APPEL DE FONDS", 14, 22);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100);
  doc.text(`Copropriete : ${appel.coproprietes?.nom ?? ''}`, 14, 34);
  doc.text(`A l'attention de : ${nomCopro}`, 14, 41);
  doc.text(`Objet : ${appel.titre}`, 14, 48);
  doc.text(`Date d'echeance : ${formatDate(appel.date_echeance)}`, 14, 55);
  doc.text(
    `Quote-part : ${(ratio * 100).toFixed(2)} % du budget total (${formatEuros(appel.montant_total)})`,
    14, 62
  );

  let nextY = 72;
  doc.setTextColor(0);

  if (postes.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Detail de votre quote-part par poste', 14, nextY);

    autoTable(doc, {
      startY: nextY + 4,
      head: [['Poste de charge', 'Categorie', 'Votre part (EUR)']],
      body: postes.map((p) => {
        const part = Math.round(p.montant * ratio * 100) / 100;
        return [
          p.libelle,
          LABELS_CATEGORIE[p.categorie as keyof typeof LABELS_CATEGORIE] ?? p.categorie,
          formatEuros(part),
        ];
      }),
      foot: [['TOTAL A REGLER', '', formatEuros(ligne.montant_du)]],
      headStyles: { fillColor: [37, 99, 235] },
      footStyles: { fillColor: [243, 244, 246], textColor: [17, 24, 39], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] },
    });

    nextY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  } else {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Montant a regler : ${formatEuros(ligne.montant_du)}`, 14, nextY);
    nextY += 12;
  }

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60);
  doc.text(
    `Veuillez regler la somme de ${formatEuros(ligne.montant_du)} avant le ${formatDate(appel.date_echeance)}.`,
    14, nextY
  );

  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    `Genere le ${new Date().toLocaleDateString('fr-FR')} — Mon Syndic Benevole`,
    14, doc.internal.pageSize.height - 10
  );

  return doc;
}

// ── Composant principal (PDF syndic) ───────────────────────
export default function AppelFondsPDF({ appel }: AppelFondsPDFProps) {
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [saveOk, setSaveOk] = useState<boolean | null>(null);

  const handleExport = () => {
    const doc = buildAppelFondsPDF(appel);
    doc.save(`appel-de-fonds-${appel.titre.toLowerCase().replace(/\s+/g, '-')}.pdf`);
  };

  const handleSaveToDocuments = async () => {
    setSaving(true);
    setSaveMsg('');
    setSaveOk(null);

    try {
      const doc = buildAppelFondsPDF(appel);
      const pdfBlob = doc.output('blob');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaveMsg('Non connecté.'); setSaveOk(false); setSaving(false); return; }

      const coproprieteId = appel.copropriete_id;
      if (!coproprieteId) { setSaveMsg('Copropriété non identifiée.'); setSaveOk(false); setSaving(false); return; }

      const { data: dossier } = await supabase
        .from('dossiers')
        .select('id')
        .eq('nom', 'Appels de fonds')
        .eq('created_by', user.id)
        .maybeSingle();

      const fileName = `${coproprieteId}/${Date.now()}-appel-de-fonds-${appel.titre.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, pdfBlob, { contentType: 'application/pdf', upsert: false });

      if (uploadError) { setSaveMsg('Erreur upload : ' + uploadError.message); setSaveOk(false); setSaving(false); return; }

      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(uploadData.path);

      const { error: dbError } = await supabase.from('documents').insert({
        copropriete_id: coproprieteId,
        dossier_id: dossier?.id ?? null,
        nom: `Appel de fonds - ${appel.titre}`,
        type: 'autre',
        url: publicUrl,
        taille: pdfBlob.size,
        uploaded_by: user.id,
      });

      if (dbError) { setSaveMsg('Erreur enregistrement : ' + dbError.message); setSaveOk(false); setSaving(false); return; }

      setSaveMsg('Document enregistré dans les documents.');
      setSaveOk(true);
    } catch (e: unknown) {
      setSaveMsg('Erreur : ' + (e instanceof Error ? e.message : 'inconnue'));
      setSaveOk(false);
    }
    setSaving(false);
  };

  return (
    <div className="ml-4 shrink-0 flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <Button size="sm" variant="secondary" onClick={handleExport}>
          <FileDown size={14} /> Exporter PDF
        </Button>
        <Button size="sm" variant="secondary" onClick={handleSaveToDocuments} loading={saving}>
          <Save size={14} /> Sauvegarder
        </Button>
      </div>
      {saveMsg && (
        <p className={`text-xs ${saveOk ? 'text-green-600' : 'text-red-600'}`}>{saveMsg}</p>
      )}
    </div>
  );
}