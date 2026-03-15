// ============================================================
// Client Component : Affiche le type de majorité d'une résolution
// + bouton ? qui ouvre une fenêtre explicative
// ============================================================
'use client';

import { useState } from 'react';
import { HelpCircle } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface MajoriteInfo {
  label: string;
  badge: string;
  titre: string;
  lignes: string[];
}

const MAJORITE_INFO: Record<string, MajoriteInfo> = {
  article_24: {
    label: 'Art. 24',
    badge: 'bg-blue-100 text-blue-700',
    titre: 'Majorité simple — Article 24',
    lignes: [
      'La décision est adoptée à la majorité des voix exprimées par les copropriétaires présents ou représentés à l\'assemblée.',
      'Les abstentions et les copropriétaires absents ne sont pas pris en compte dans le calcul.',
      'C\'est la majorité la plus courante pour les décisions de gestion courante (comptes, budget, désignation de bureau...).',
    ],
  },
  article_25: {
    label: 'Art. 25',
    badge: 'bg-orange-100 text-orange-700',
    titre: 'Majorité absolue — Article 25',
    lignes: [
      'La décision doit recueillir la majorité des voix de TOUS les copropriétaires du syndicat (présents, représentés ET absents), soit plus de 50 % des tantièmes.',
      'Si la résolution obtient au moins 1/3 des voix sans atteindre la majorité absolue, un second vote à la majorité simple (Art. 24) peut être organisé immédiatement.',
      'Utilisée notamment pour la désignation du syndic.',
    ],
  },
  article_26: {
    label: 'Art. 26',
    badge: 'bg-red-100 text-red-700',
    titre: 'Double majorité — Article 26',
    lignes: [
      'La décision doit recueillir la majorité des membres du syndicat représentant au moins les 2/3 des tantièmes.',
      'Réservée aux décisions les plus importantes : modification du règlement de copropriété, aliénation de parties communes, travaux affectant la structure de l\'immeuble.',
    ],
  },
};

export default function MajoriteTooltip({ majorite }: { majorite: string | null }) {
  const [open, setOpen] = useState(false);

  if (!majorite || !MAJORITE_INFO[majorite]) return null;

  const info = MAJORITE_INFO[majorite];

  return (
    <>
      <span className={`inline-flex items-center text-xs font-semibold px-1.5 py-0.5 rounded-full ${info.badge}`}>
        {info.label}
      </span>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-gray-400 hover:text-blue-600 transition-colors"
        title="En savoir plus sur ce type de majorité"
      >
        <HelpCircle size={14} />
      </button>

      <Modal isOpen={open} onClose={() => setOpen(false)} title={info.titre}>
        <div className="space-y-3">
          {info.lignes.map((ligne, i) => (
            <p key={i} className="text-sm text-gray-700 leading-relaxed">{ligne}</p>
          ))}
        </div>
      </Modal>
    </>
  );
}
