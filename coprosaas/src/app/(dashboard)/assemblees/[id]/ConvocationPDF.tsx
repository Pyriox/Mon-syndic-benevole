// ============================================================
// Client Component : Génération de la convocation AG en PDF
// + envoi par email aux copropriétaires
// ============================================================
'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '@/components/ui/Button';
import { FileDown, Send } from 'lucide-react';

interface Resolution {
  numero: number;
  titre: string;
  description: string | null;
  type_resolution?: string | null;
  budget_postes?: { libelle: string; montant: number }[] | null;
  fonds_travaux_montant?: number | null;
}

interface ConvocationPDFProps {
  ag: {
    id: string;
    titre: string;
    date_ag: string;
    lieu: string | null;
    notes: string | null;
    coproprietes?: { nom: string; adresse?: string; ville?: string; code_postal?: string } | null;
  };
  resolutions: Resolution[];
}

const BLUE: [number, number, number]  = [29, 78, 216];
const LIGHT: [number, number, number] = [239, 246, 255];
const GRAY: [number, number, number]  = [248, 250, 252];

const fmtEur = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(n);

function checkPage(doc: jsPDF, y: number, needed = 30): number {
  if (y + needed > doc.internal.pageSize.height - 20) {
    doc.addPage();
    return 20;
  }
  return y;
}

function genererConvocationDoc(ag: ConvocationPDFProps['ag'], resolutions: ConvocationPDFProps['resolutions']): jsPDF {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.width;
  const mL = 14;
  const mR = 14;
  const inner = W - mL - mR;
  let y = 0;

  // ── Bandeau de titre ───────────────────────────────────────
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('CONVOCATION', mL, 16);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text("Assemblée Générale de copropriété", mL, 25);

  // Nom copropriété à droite
  if (ag.coproprietes?.nom) {
    doc.setFontSize(9);
    doc.text(ag.coproprietes.nom, W - mR, 16, { align: 'right' });
    if (ag.coproprietes.adresse) {
      doc.text(`${ag.coproprietes.adresse}`, W - mR, 21, { align: 'right' });
      doc.text(`${ag.coproprietes.code_postal ?? ''} ${ag.coproprietes.ville ?? ''}`.trim(), W - mR, 26, { align: 'right' });
    }
  }
  y = 46;

  // ── Bloc infos AG ───────────────────────────────────────────
  doc.setFillColor(...LIGHT);
  doc.roundedRect(mL, y, inner, 24, 2, 2, 'F');

  const dateFormatted = new Date(ag.date_ag).toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
  const heureFormatted = new Date(ag.date_ag).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  doc.setTextColor(29, 78, 216);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('DATE', mL + 4, y + 7);
  doc.text('HEURE', mL + 70, y + 7);
  doc.text('LIEU', mL + 120, y + 7);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(9);
  doc.text(dateFormatted, mL + 4, y + 14);
  doc.text(heureFormatted, mL + 70, y + 14);
  doc.text(ag.lieu ?? '–', mL + 120, y + 14);
  y += 32;

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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(29, 78, 216);
  doc.text('ORDRE DU JOUR', mL, y);
  doc.setDrawColor(...BLUE);
  doc.setLineWidth(0.5);
  doc.line(mL, y + 2, mL + 50, y + 2);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [['N°', 'Résolution', 'Précisions / informations budgétaires']],
    body: resolutions.map((r) => {
      const parts: string[] = [];
      if (r.description) parts.push(r.description);
      if (r.budget_postes && r.budget_postes.length > 0) {
        const total = r.budget_postes.reduce((s, p) => s + p.montant, 0);
        parts.push(`Budget proposé : ${fmtEur(total)}`);
        r.budget_postes.forEach((p) => parts.push(`  • ${p.libelle} : ${fmtEur(p.montant)}`));
      }
      if (r.fonds_travaux_montant != null) {
        parts.push(`Cotisation fonds de travaux : ${fmtEur(r.fonds_travaux_montant)}`);
      }
      return [r.numero, r.titre, parts.join('\n') || '–'];
    }),
    headStyles: { fillColor: BLUE, fontSize: 9, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: GRAY },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 75, fontStyle: 'bold' },
      2: { cellWidth: inner - 10 - 75 - 4, fontSize: 8 },
    },
    styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak', valign: 'top' },
    margin: { left: mL, right: mR },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  // ── Notes / observations ────────────────────────────────────
  if (ag.notes) {
    y = checkPage(doc, y, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(29, 78, 216);
    doc.text('OBSERVATIONS', mL, y);
    doc.line(mL, y + 2, mL + 46, y + 2);
    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60);
    const notesLines = doc.splitTextToSize(ag.notes, inner);
    doc.text(notesLines, mL, y);
    y += notesLines.length * 5 + 8;
  }

  // ── Formule de politesse ────────────────────────────────────
  y = checkPage(doc, y, 30);
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

  // ── Pied de page ────────────────────────────────────────────
  const pH = doc.internal.pageSize.height;
  doc.setFontSize(7);
  doc.setTextColor(160);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Document généré le ${new Date().toLocaleDateString('fr-FR')} via Mon Syndic Bénévole`,
    W / 2,
    pH - 8,
    { align: 'center' }
  );

  return doc;
}

export default function ConvocationPDF({ ag, resolutions }: ConvocationPDFProps) {
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleDownload = () => {
    const doc = genererConvocationDoc(ag, resolutions);
    doc.save(`convocation-ag-${ag.id}.pdf`);
  };

  const handleSendEmails = async () => {
    setSendLoading(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/ag/${ag.id}/envoyer-convocation`, { method: 'POST' });
      const json = await res.json();
      setSendResult({ ok: res.ok, message: json.message ?? (res.ok ? 'Emails envoyés !' : 'Erreur') });
    } catch {
      setSendResult({ ok: false, message: 'Erreur réseau.' });
    }
    setSendLoading(false);
  };

  return (
    <div className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={handleDownload}>
        <FileDown size={14} /> Convocation PDF
      </Button>
      <Button size="sm" onClick={handleSendEmails} loading={sendLoading}>
        <Send size={14} /> Envoyer les convocations
      </Button>
      {sendResult && (
        <span className={`text-xs font-medium ${sendResult.ok ? 'text-green-600' : 'text-red-600'}`}>
          {sendResult.message}
        </span>
      )}
    </div>
  );
}
