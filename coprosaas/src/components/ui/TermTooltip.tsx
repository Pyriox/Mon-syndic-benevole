// ============================================================
// TermTooltip : affiche une définition au survol d'un terme métier.
// Utilisation : <TermTooltip term="tantiemes" />
//               <TermTooltip term="solde">solde</TermTooltip>
// ============================================================
'use client';

import { useState, useId, useRef, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { HelpCircle } from 'lucide-react';

// ── Dictionnaire des termes métier ──────────────────────────
const GLOSSARY: Record<string, { label: string; definition: string }> = {
  tantiemes: {
    label: 'tantièmes',
    definition:
      `Fraction de la valeur totale de l'immeuble attribuée à chaque lot. Ils déterminent la quote-part de chaque copropriétaire dans les charges et les votes d'AG. La somme des tantièmes vaut généralement 1 000 ou 10 000.`,
  },
  solde: {
    label: 'solde',
    definition:
      'Montant positif = avance ou crédit enregistré en faveur du copropriétaire. Montant négatif = somme restant à régler. Le solde est mis à jour à chaque paiement ou appel de fonds.',
  },
  charges_speciales: {
    label: 'charges spéciales',
    definition:
      'Répartition alternative réservée aux charges liées à un équipement ou service dont tous les copropriétaires ne bénéficient pas (ex. ascenseur, parking). Nécessite une clé de répartition dédiée.',
  },
  regularisation: {
    label: 'régularisation',
    definition:
      `Opération annuelle comparant les provisions appelées pendant l'exercice aux dépenses réelles. Elle génère soit un complément à payer, soit un trop-perçu à créditer sur le solde de chaque copropriétaire.`,
  },
  quote_part: {
    label: 'quote-part',
    definition:
      'Fraction des charges imputée à un copropriétaire, proportionnelle à ses tantièmes (ou à sa clé spéciale si applicable).',
  },
  appel_fonds: {
    label: 'appel de fonds',
    definition:
      'Demande de versement émise par le syndic à destination des copropriétaires, pour couvrir les charges prévisionnelles votées en AG ou une dépense exceptionnelle.',
  },
  postes: {
    label: 'postes',
    definition:
      `Lignes de détail d'un appel de fonds ou d'un budget d'AG. Chaque poste correspond à une nature de dépense (ex. entretien courant, assurance, travaux) avec son propre montant et sa clé de répartition.`,
  },
  fonds_travaux: {
    label: 'fonds de travaux',
    definition:
      'Épargne obligatoire (loi ALUR) constituée par la copropriété pour financer des travaux futurs. Cotisation minimum de 5 % du budget prévisionnel, collectée via les appels de fonds.',
  },
  quorum: {
    label: 'quorum',
    definition:
      `Nombre minimal de voix (en tantièmes) nécessaire pour que l'assemblée générale puisse valablement délibérer. Sans quorum, l'AG doit être reconvoquée.`,
  },
};

export type TermKey = keyof typeof GLOSSARY;

interface TermTooltipProps {
  /** Clé du glossaire (ex. "tantiemes") */
  term: TermKey;
  /** Texte affiché. Par défaut : le label du glossaire. */
  children?: ReactNode;
  /** Style supplémentaire sur le conteneur inline */
  className?: string;
}

export default function TermTooltip({ term, children, className }: TermTooltipProps) {
  const entry = GLOSSARY[term];
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const tooltipId = useId();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!entry) return <>{children ?? term}</>;

  const label = children ?? entry.label;

  const show = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setCoords({ top: r.top + window.scrollY, left: r.left + window.scrollX });
    }
    setVisible(true);
  };
  const hide = () => setVisible(false);

  return (
    <span
      className={`relative inline-flex items-center gap-0.5 ${className ?? ''}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {/* Terme souligné en pointillés */}
      <span className="underline decoration-dotted decoration-gray-400 cursor-help">
        {label}
      </span>

      {/* Icône d'aide accessible */}
      <button
        ref={btnRef}
        type="button"
        aria-describedby={tooltipId}
        tabIndex={0}
        className="shrink-0 text-gray-400 hover:text-blue-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded"
        onClick={(e) => { e.stopPropagation(); visible ? hide() : show(); }}
        aria-label={`Définition : ${entry.label}`}
      >
        <HelpCircle size={13} />
      </button>

      {/* Bulle — rendue dans body pour échapper aux overflow:hidden */}
      {mounted && visible && coords && createPortal(
        <span
          id={tooltipId}
          role="tooltip"
          style={{
            position: 'absolute',
            top: coords.top - 8,
            left: coords.left,
            transform: 'translateY(-100%)',
          }}
          className="z-[9999] w-64 rounded-xl border border-blue-100 bg-white shadow-lg px-3 py-2.5 text-xs text-gray-700 leading-relaxed pointer-events-none"
        >
          <span className="block font-semibold text-blue-700 mb-1 capitalize">{entry.label}</span>
          {entry.definition}
          <span
            className="absolute top-full left-4 -translate-y-px w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid white',
              filter: 'drop-shadow(0 1px 0 #bfdbfe)',
            }}
          />
        </span>,
        document.body
      )}
    </span>
  );
}
