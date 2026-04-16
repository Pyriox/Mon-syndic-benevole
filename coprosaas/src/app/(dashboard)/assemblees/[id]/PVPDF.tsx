// ============================================================
// Client Component : Génération du PV (Procès-Verbal) en PDF
// ============================================================
'use client';

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import Button from '@/components/ui/Button';
import { FileDown, Send } from 'lucide-react';
import { formatDate, formatTime, getParisYear, TYPES_RESOLUTION } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface Resolution {
  id: string;
  numero: number;
  titre: string;
  description: string | null;
  statut: string;
  voix_pour: number;
  voix_contre: number;
  voix_abstention: number;
  majorite?: string | null;
  budget_postes?: { libelle: string; montant: number }[] | null;
  type_resolution?: string | null;
  designation_resultats?: { id: string; nom: string; prenom: string }[] | null;
  fonds_travaux_montant?: number | null;
}

interface PresenceRecord {
  coproprietaire_id: string;
  statut: string;
  represente_par_id: string | null;
  represente_par_nom?: string | null;
}

interface VoteCoproRecord {
  resolution_id: string;
  coproprietaire_id: string;
  vote: string;
}

interface CoproRecord {
  id: string;
  nom: string;
  prenom: string;
}

interface PVPDFProps {
  ag: {
    id: string;
    titre: string;
    date_ag: string;
    lieu: string | null;
    notes: string | null;
    quorum_atteint: boolean;
    coproprietes?: { nom: string; adresse?: string; ville?: string; code_postal?: string } | null;
  };
  coproprieteId: string;
  resolutions: Resolution[];
  presences?: PresenceRecord[];
  votesCopro?: VoteCoproRecord[];
  coproprietaires?: CoproRecord[];
  tantiemesParCopro?: Record<string, number>;
}

// ---- Helper : trouver ou créer un sous-dossier ----
async function getOrCreateSubDossierPV(
  supabase: ReturnType<typeof createClient>,
  nom: string,
  parentId: string | null,
  syndicId: string
): Promise<string | null> {
  const baseQuery = supabase
    .from('document_dossiers')
    .select('id')
    .eq('nom', nom)
    .eq('syndic_id', syndicId);

  const { data: existing } = parentId
    ? await baseQuery.eq('parent_id', parentId).maybeSingle()
    : await baseQuery.is('parent_id', null).maybeSingle();

  if (existing?.id) return existing.id;

  const payload = parentId
    ? { nom, syndic_id: syndicId, is_default: false, parent_id: parentId }
    : { nom, syndic_id: syndicId, is_default: false };

  const { data: created } = await supabase
    .from('document_dossiers')
    .insert(payload as never)
    .select('id')
    .single();

  return created?.id ?? null;
}

// ─── Couleurs ─────────────────────────────────────────────
const BLUE: [number, number, number]    = [29, 78, 216];
const GREEN: [number, number, number]   = [22, 163, 74];
const RED: [number, number, number]     = [220, 38, 38];
const AMBER: [number, number, number]   = [180, 83, 9];
const PURPLE: [number, number, number]  = [99, 102, 241];
const SLATE: [number, number, number]   = [100, 116, 139];
const LGRAY: [number, number, number]   = [248, 250, 252];
const MGRAY: [number, number, number]   = [241, 245, 249];

// Remplace l'espace fine insécable (U+202F) que jsPDF ne sait pas encoder par une espace normale
const fmtEur = (n: number) =>
  new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
    .format(n)
    .replace(/\u202f/g, ' ')
    .replace(/\u00a0/g, ' ');

type Doc = jsPDF & { lastAutoTable: { finalY: number } };

function checkPage(doc: Doc, y: number, needed = 35): number {
  if (y + needed > doc.internal.pageSize.height - 20) {
    doc.addPage();
    addPageHeader(doc);
    return 28;
  }
  return y;
}

function addPageHeader(doc: Doc) {
  const W = doc.internal.pageSize.width;
  doc.setFillColor(...BLUE);
  doc.rect(0, 0, W, 8, 'F');
  doc.setFontSize(7);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCÈS-VERBAL D\'ASSEMBLÉE GÉNÉRALE', W / 2, 5.5, { align: 'center' });
}

function sectionTitle(doc: Doc, text: string, y: number, color: [number, number, number] = BLUE): number {
  const mL = 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...color);
  doc.text(text.toUpperCase(), mL, y);
  doc.setDrawColor(...color);
  doc.setLineWidth(0.4);
  doc.line(mL, y + 2, 14 + text.length * 2.4, y + 2);
  doc.setTextColor(30, 30, 30);
  return y + 8;
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

const MAJORITE_LABELS: Record<string, string> = {
  article_24: 'Art. 24',
  article_25: 'Art. 25',
  article_26: 'Art. 26',
};

export default function PVPDF({ ag, coproprieteId, resolutions, presences = [], votesCopro = [], coproprietaires = [], tantiemesParCopro = {} }: PVPDFProps) {
  const supabase = createClient();
  const [sendLoading, setSendLoading] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handleExport = async () => {
    const doc = new jsPDF() as Doc;
    const W = doc.internal.pageSize.width;
    const mL = 14;
    const mR = 14;
    const inner = W - mL - mR;

    const getName = (id: string) => {
      const c = coproprietaires.find((x) => x.id === id);
      return c ? `${c.prenom} ${c.nom}` : '–';
    };

    // Total tantièmes des voteurs (présents + représentés)
    const voteurs = presences.filter((p) => p.statut !== 'absent');
    const tantiemesPresents = voteurs.reduce((sum, p) => sum + (tantiemesParCopro[p.coproprietaire_id] ?? 0), 0);
    // Total tantièmes de toute la copropriété (pour Art. 25 passerelle)
    const totalTantiemes = Object.values(tantiemesParCopro).reduce((s, t) => s + t, 0);

    // Helper : recalcule le statut effectif d'une résolution Art. 25
    // en appliquant automatiquement la passerelle si les conditions sont remplies
    const effectifStatut = (r: { majorite?: string | null; statut: string; voix_pour: number; voix_contre: number }) => {
      if (
        r.majorite === 'article_25' &&
        r.statut === 'refusee' &&
        totalTantiemes > 0 &&
        r.voix_pour * 3 >= totalTantiemes &&   // ≥ 1/3 des tantièmes totaux
        r.voix_pour > r.voix_contre             // majorité simple atteinte
      ) {
        return 'approuvee'; // passerelle Art. 25-1 s'applique
      }
      return r.statut;
    };

    // ════════════════════════════════════════════════════════
    // PAGE 1 — EN-TÊTE
    // ════════════════════════════════════════════════════════
    doc.setFillColor(...BLUE);
    doc.rect(0, 0, W, 45, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('PROCÈS-VERBAL', mL, 18);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text("d'Assemblée Générale de copropriété", mL, 27);

    // Infos copropriété (droite)
    doc.setFontSize(9);
    if (ag.coproprietes?.nom) {
      doc.text(ag.coproprietes.nom, W - mR, 14, { align: 'right' });
      if (ag.coproprietes.adresse) {
        doc.text(ag.coproprietes.adresse, W - mR, 20, { align: 'right' });
        doc.text(`${ag.coproprietes.code_postal ?? ''} ${ag.coproprietes.ville ?? ''}`.trim(), W - mR, 26, { align: 'right' });
      }
    }

    // Quorum pastille
    doc.setFillColor(ag.quorum_atteint ? 34 : 180, ag.quorum_atteint ? 197 : 180, ag.quorum_atteint ? 94 : 180);
    doc.circle(W - mR - 3, 36, 3, 'F');
    doc.setFontSize(8);
    doc.text(`Quorum : ${ag.quorum_atteint ? 'atteint' : 'non atteint'}`, W - mR, 37, { align: 'right' });

    let y = 53;

    // ── Bloc méta-données ───────────────────────────────────
    const dateFormatted = formatDate(ag.date_ag, {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
    const heureFormatted = formatTime(ag.date_ag);

    doc.setFillColor(239, 246, 255);
    doc.roundedRect(mL, y, inner, 46, 2, 2, 'F');

    // Titre de l'AG
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(20, 20, 20);
    const titreAGClipped = doc.splitTextToSize(ag.titre, inner - 8);
    doc.text(titreAGClipped[0] ?? ag.titre, mL + 4, y + 11);

    // Séparateur
    doc.setDrawColor(...BLUE);
    doc.setLineWidth(0.3);
    doc.line(mL + 3, y + 16, mL + inner - 3, y + 16);

    // DATE / HEURE / LIEU — 3 colonnes
    const infoColW = inner / 3;
    const infoItems: { label: string; value: string }[] = [
      { label: 'DATE', value: dateFormatted },
      { label: 'HEURE', value: heureFormatted },
      { label: 'LIEU', value: ag.lieu ?? '–' },
    ];
    infoItems.forEach((info, i) => {
      const ix = mL + 4 + i * infoColW;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...BLUE);
      doc.text(info.label, ix, y + 25);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      const vlines = doc.splitTextToSize(info.value, infoColW - 6);
      doc.text(vlines[0], ix, y + 33);
      if (vlines.length > 1) doc.text(vlines[1], ix, y + 39);
    });

    y += 54;

    // ════════════════════════════════════════════════════════
    // FEUILLE DE PRÉSENCE
    // ════════════════════════════════════════════════════════
    if (presences.length > 0 && coproprietaires.length > 0) {
      y = checkPage(doc, y, 40);
      y = sectionTitle(doc, 'Feuille de présence', y);

      const statLabels: Record<string, string> = {
        present:    'Présent(e)',
        absent:     'Absent(e)',
        represente: 'Représenté(e)',
      };

      const presentsGrp    = presences.filter((p) => p.statut === 'present');
      const representesGrp = presences.filter((p) => p.statut === 'represente');
      const absentsGrp     = presences.filter((p) => p.statut === 'absent');
      const totalTantCopro = Object.values(tantiemesParCopro).reduce((s, v) => s + v, 0);
      const tantPres = presentsGrp.reduce((s, p)    => s + (tantiemesParCopro[p.coproprietaire_id] ?? 0), 0);
      const tantRepr = representesGrp.reduce((s, p) => s + (tantiemesParCopro[p.coproprietaire_id] ?? 0), 0);
      const tantAbs  = absentsGrp.reduce((s, p)     => s + (tantiemesParCopro[p.coproprietaire_id] ?? 0), 0);

      // Résumé avec tantièmes sur total copropriété
      doc.setFontSize(8.5);
      doc.setTextColor(60);
      doc.setFont('helvetica', 'normal');
      const summaryTantLine = totalTantCopro > 0
        ? `Présents : ${presentsGrp.length} (${tantPres}/${totalTantCopro} tant.)    |    Représentés : ${representesGrp.length} (${tantRepr}/${totalTantCopro} tant.)    |    Absents : ${absentsGrp.length} (${tantAbs}/${totalTantCopro} tant.)`
        : `Présents : ${presentsGrp.length}  |  Représentés : ${representesGrp.length}  |  Absents : ${absentsGrp.length}`;
      const summaryTantLines = doc.splitTextToSize(summaryTantLine, inner);
      doc.text(summaryTantLines, mL, y);
      y += summaryTantLines.length * 5 + 2;

      const sortedPresences = [...presentsGrp, ...representesGrp, ...absentsGrp];

      autoTable(doc, {
        startY: y,
        head: [['Copropriétaire', 'Tant.', 'Statut', 'Représenté par']],
        body: sortedPresences.map((p) => [
          getName(p.coproprietaire_id),
          String(tantiemesParCopro[p.coproprietaire_id] ?? 0),
          statLabels[p.statut] ?? p.statut,
          p.statut === 'represente'
            ? (p.represente_par_id ? getName(p.represente_par_id) : (p.represente_par_nom || '–'))
            : '–',
        ]),
        headStyles: { fillColor: SLATE, fontSize: 8.5 },
        alternateRowStyles: { fillColor: LGRAY },
        styles: { fontSize: 8.5, cellPadding: 2.5 },
        columnStyles: {
          0: { fontStyle: 'bold' },
          1: { cellWidth: 18, halign: 'right' },
          2: { cellWidth: 30, halign: 'center' },
          3: { cellWidth: 50 },
        },
        margin: { left: mL, right: mR },
        didParseCell: (data) => {
          if (data.section === 'body' && data.column.index === 2) {
            const statut = sortedPresences[data.row.index]?.statut;
            if (statut === 'present')    { data.cell.styles.textColor = [22, 163, 74];   data.cell.styles.fontStyle = 'bold'; }
            if (statut === 'represente') { data.cell.styles.textColor = [29, 78, 216];   data.cell.styles.fontStyle = 'bold'; }
            if (statut === 'absent')     { data.cell.styles.textColor = [100, 116, 139]; }
          }
        },
      });
      y = doc.lastAutoTable.finalY + 10;
    }

    // ════════════════════════════════════════════════════════
    // NOTES / ORDRE DU JOUR
    // ════════════════════════════════════════════════════════
    if (ag.notes) {
      y = checkPage(doc, y, 30);
      y = sectionTitle(doc, 'Ordre du jour', y);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(50);
      const noteLines = doc.splitTextToSize(ag.notes, inner);
      doc.text(noteLines, mL, y);
      y += noteLines.length * 5 + 10;
    }

    // ════════════════════════════════════════════════════════
    // RÉSOLUTIONS — une par une avec résultat visuel
    // ════════════════════════════════════════════════════════
    y = checkPage(doc, y, 40);
    y = sectionTitle(doc, 'Résolutions', y);

    for (const res of resolutions) {
      // ── Estimer la hauteur totale de la résolution pour éviter une coupure de page ──
      {
        const eLines = doc.splitTextToSize(res.titre, inner - 80);
        const eIsDesig = !!(res.designation_resultats && res.designation_resultats.length > 0);
        const eHasBudget = !!(res.budget_postes && res.budget_postes.length > 0);
        let estH = Math.max(10, eLines.length * 5 + 4) + 2; // rect titre
        if (eIsDesig) {
          const eDesigStr = res.designation_resultats!.map((d) => `${d.prenom} ${d.nom}`).join(', ');
          const eDesigLines = doc.splitTextToSize(`Désigné(s) : ${eDesigStr}`, inner - 8);
          estH += eDesigLines.length * 5 + 7;
        }
        estH += 22; // 3 lignes de résultats de vote (pour toutes les résolutions)
        if (res.fonds_travaux_montant != null) estH += 10;
        if (eHasBudget) estH += 4 + 12 + (res.budget_postes?.length ?? 0) * 7 + 10;
        estH += 6; // espacement final
        y = checkPage(doc, y, estH);
      }

      const resStatutEffectif = effectifStatut(res);
      const badge = statutBadge(resStatutEffectif);
      const isDesig = !!(res.designation_resultats && res.designation_resultats.length > 0);
      const hasBudget = !!(res.budget_postes && res.budget_postes.length > 0);

      // ── Numéro + titre ────────────────────────────────────
      const hasMajorite = !!(res.majorite && MAJORITE_LABELS[res.majorite]);
      const titreLines = doc.splitTextToSize(res.titre, inner - (hasMajorite ? 100 : 80));
      const rectH = Math.max(10, titreLines.length * 5 + 4);

      doc.setFillColor(...MGRAY);
      doc.roundedRect(mL, y, inner, rectH, 1.5, 1.5, 'F');

      // Badge numéro
      doc.setFillColor(...BLUE);
      doc.roundedRect(mL + 1, y + (rectH - 8) / 2, 12, 8, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text(`#${res.numero}`, mL + 7, y + rectH / 2 + 1.5, { align: 'center' });

      // Titre
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(20, 20, 20);
      doc.text(titreLines, mL + 16, y + (rectH - (titreLines.length - 1) * 5) / 2 + 1.5);

      // Majorité (placé à gauche du badge, assez éloigné)
      if (res.majorite && MAJORITE_LABELS[res.majorite]) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...SLATE);
        doc.text(MAJORITE_LABELS[res.majorite], W - mR - 60, y + rectH / 2 + 1.5);
      }

      // Badge statut
      doc.setFillColor(...badge.color);
      doc.roundedRect(W - mR - 28, y + (rectH - 7) / 2, 27, 7, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(255, 255, 255);
      doc.text(badge.label, W - mR - 14.5, y + rectH / 2 + 1.5, { align: 'center' });

      y += rectH + 2;


      // ── Désignation ───────────────────────────────────────
      if (isDesig) {
        doc.setFillColor(238, 242, 255);
        const desigStr = res.designation_resultats!.map((d) => `${d.prenom} ${d.nom}`).join(', ');
        const desigLines = doc.splitTextToSize(`Désigné(s) : ${desigStr}`, inner - 8);
        doc.roundedRect(mL + 1, y, inner - 2, desigLines.length * 5 + 5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...PURPLE);
        doc.text(desigLines, mL + 4, y + 4.5);
        y += desigLines.length * 5 + 7;
      }

      // ── Résultat votes ────────────────────────────────────
      {
        // Pour les désignations : tous les voteurs ont approuvé → tantièmes calculés live
        const tantDesig = isDesig
          ? voteurs.reduce((s, p) => s + (tantiemesParCopro[p.coproprietaire_id] ?? 0), 0)
          : 0;
        const nbVotesPour   = isDesig ? voteurs.length : votesCopro.filter((v) => v.resolution_id === res.id && v.vote === 'pour').length;
        const nbVotesContre = isDesig ? 0 : votesCopro.filter((v) => v.resolution_id === res.id && v.vote === 'contre').length;
        const nbVotesAbst   = isDesig ? 0 : votesCopro.filter((v) => v.resolution_id === res.id && v.vote === 'abstention').length;
        const tantPour  = isDesig ? tantDesig : res.voix_pour;
        const tantContre = isDesig ? 0 : res.voix_contre;
        const tantAbst   = isDesig ? 0 : res.voix_abstention;
        const pctPour   = tantiemesPresents > 0 ? Math.round((tantPour   / tantiemesPresents) * 100) : 0;
        const pctContre = tantiemesPresents > 0 ? Math.round((tantContre / tantiemesPresents) * 100) : 0;
        const pctAbst   = tantiemesPresents > 0 ? Math.round((tantAbst   / tantiemesPresents) * 100) : 0;

        const voteRows: { label: string; nb: number; tant: number; pct: number; col: [number,number,number] }[] = [
          { label: 'Pour',       nb: nbVotesPour,   tant: tantPour,   pct: pctPour,   col: GREEN },
          { label: 'Contre',     nb: nbVotesContre, tant: tantContre, pct: pctContre, col: RED   },
          { label: 'Abstention', nb: nbVotesAbst,   tant: tantAbst,   pct: pctAbst,   col: SLATE },
        ];
        for (const vr of voteRows) {
          doc.setFillColor(...vr.col);
          doc.circle(mL + 4, y + 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(...vr.col);
          doc.text(vr.label, mL + 8, y + 3);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(50, 50, 50);
          doc.text(
            `${vr.nb} vote${vr.nb !== 1 ? 's' : ''}  \u2014  ${vr.tant} tant. sur ${tantiemesPresents} tant. soit ${vr.pct} %`,
            mL + 34, y + 3
          );
          y += 6;
        }
        y += 2;
      }

      // ── Fonds travaux ─────────────────────────────────────
      if (res.fonds_travaux_montant != null) {
        doc.setFillColor(254, 243, 199);
        doc.roundedRect(mL + 1, y, inner - 2, 8, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...AMBER);
        doc.text(`Cotisation fonds de travaux : ${fmtEur(res.fonds_travaux_montant)}`, mL + 4, y + 5.5);
        y += 10;
      }

      // ── Budget postes ─────────────────────────────────────
      if (hasBudget) {
        y = checkPage(doc, y, 25);
        const total = (res.budget_postes ?? []).reduce((s, p) => s + p.montant, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...PURPLE);
        doc.text(`Budget voté — Total : ${fmtEur(total)}`, mL + 2, y);
        y += 4;
        autoTable(doc, {
          startY: y,
          head: [['Poste de dépense', 'Montant']],
          body: (res.budget_postes ?? []).map((p) => [p.libelle, fmtEur(p.montant)]),
          foot: [['TOTAL', fmtEur(total)]],
          headStyles: { fillColor: PURPLE, fontSize: 8 },
          footStyles: { fillColor: MGRAY, textColor: [17, 24, 39], fontStyle: 'bold', fontSize: 8 },
          alternateRowStyles: { fillColor: LGRAY },
          styles: { fontSize: 8, cellPadding: 2 },
          columnStyles: { 1: { halign: 'right', cellWidth: 35 } },
          margin: { left: mL + 4, right: mR + 4 },
        });
        y = doc.lastAutoTable.finalY + 8;
      }

      // ── Votes individuels supprimés — les résultats agrégés suffisent ─────

      y += 6;
    }

    // ════════════════════════════════════════════════════════
    // SYNTHÈSE DES VOTES
    // ════════════════════════════════════════════════════════
    const treated = resolutions.filter((r) => r.statut !== 'en_attente');
    if (treated.length > 0) {
      y = checkPage(doc, y, 50);
      y = sectionTitle(doc, 'Synthèse', y);

      autoTable(doc, {
        startY: y,
        head: [['N°', 'Résolution', 'Résultat', 'Majorité', 'Pour', 'Contre', 'Abst.']],
        body: resolutions.map((r) => {
          const rStatutEff = effectifStatut(r);
          const b = statutBadge(rStatutEff);
          // isDesig basé sur le type (et non sur designation_resultats qui peut être nul)
          const isDesig = !!(r.type_resolution && TYPES_RESOLUTION[r.type_resolution]?.designation);
          // Pour les désignations, voix_pour en base peut être obsolète (= 1) → recalcul live
          const tantPourAffiche = isDesig ? tantiemesPresents : r.voix_pour;
          return [
            r.numero,
            r.titre,
            rStatutEff === 'approuvee' && r.statut === 'refusee' ? 'APPROUVÉE (Art.25-1)' : b.label,
            r.majorite ? (MAJORITE_LABELS[r.majorite] ?? r.majorite) : '–',
            tantPourAffiche,
            isDesig ? 0 : r.voix_contre,
            isDesig ? 0 : r.voix_abstention,
          ];
        }),
        headStyles: { fillColor: BLUE, fontSize: 8 },
        alternateRowStyles: { fillColor: LGRAY },
        styles: { fontSize: 8, cellPadding: 2.5 },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 65 },
          2: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 16, halign: 'right' },
          5: { cellWidth: 16, halign: 'right' },
          6: { cellWidth: 16, halign: 'right' },
        },
        margin: { left: mL, right: mR },
        didParseCell: (data) => {
          if (data.column.index === 2 && data.section === 'body') {
            const r = resolutions[data.row.index];
            const b = statutBadge(r ? effectifStatut(r) : '');
            data.cell.styles.textColor = b.color;
          }
        },
      });
      y = doc.lastAutoTable.finalY + 12;
    }

    // ════════════════════════════════════════════════════════
    // SIGNATURES
    // ════════════════════════════════════════════════════════
    y = checkPage(doc, y, 45);
    y = sectionTitle(doc, 'Signatures', y);

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

    // ── Pied de page sur toutes les pages ──────────────────
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      const pH = doc.internal.pageSize.height;
      doc.setFillColor(245, 247, 250);
      doc.rect(0, pH - 12, W, 12, 'F');
      doc.setFontSize(7);
      doc.setTextColor(150, 150, 150);
      doc.setFont('helvetica', 'normal');
      doc.text(`PV — ${ag.coproprietes?.nom ?? ''} — ${formatDate(ag.date_ag)}`, mL, pH - 4.5);
      doc.text(`Page ${i} / ${totalPages}`, W - mR, pH - 4.5, { align: 'right' });
      doc.text('Généré via Mon Syndic Bénévole', W / 2, pH - 4.5, { align: 'center' });
    }

    const filename = `pv-ag-${ag.titre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}.pdf`;
    doc.save(filename);

    // Sauvegarder dans Documents : Assemblées Générales / Année / AG
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const year = String(getParisYear(ag.date_ag) ?? new Date().getFullYear());
        const rootId = await getOrCreateSubDossierPV(supabase, 'Assemblées Générales', null, user.id);
        if (rootId) {
          const yearId = await getOrCreateSubDossierPV(supabase, year, rootId, user.id);
          if (yearId) {
            const dateFr = formatDate(ag.date_ag, { day: 'numeric', month: 'long', year: 'numeric' });
            const agFolderName = `${ag.titre} — ${dateFr}`;
            const agDossierId = await getOrCreateSubDossierPV(supabase, agFolderName, yearId, user.id);
            if (agDossierId) {
              const pdfBytes = doc.output('arraybuffer');
              const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
              const uploadForm = new FormData();
              uploadForm.append('file', pdfBlob, filename);
              uploadForm.append('copropriete_id', coproprieteId);
              uploadForm.append('nom', `PV AG — ${ag.coproprietes?.nom ?? ''} — ${year}`);
              uploadForm.append('type', 'pv_ag');
              uploadForm.append('dossier_id', agDossierId);
              await fetch('/api/upload-document', { method: 'POST', body: uploadForm });
            }
          }
        }
      }
    } catch {
      // non-bloquant — le téléchargement réussit même si la sauvegarde échoue
    }
  };

  const handleSendPV = async () => {
    setSendLoading(true);
    setSendResult(null);
    try {
      const res = await fetch(`/api/ag/${ag.id}/envoyer-pv`, { method: 'POST' });
      const json = await res.json();
      setSendResult({ ok: res.ok, message: json.message ?? (res.ok ? 'PV envoyé !' : 'Erreur') });
    } catch {
      setSendResult({ ok: false, message: 'Erreur réseau.' });
    }
    setSendLoading(false);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Button variant="secondary" size="sm" onClick={handleExport}>
        <FileDown size={14} /> Exporter PV
      </Button>
      {sendResult && (
        <span className={`text-xs font-medium ${sendResult.ok ? 'text-green-600' : 'text-red-600'}`}>
          {sendResult.message}
        </span>
      )}
    </div>
  );
}
