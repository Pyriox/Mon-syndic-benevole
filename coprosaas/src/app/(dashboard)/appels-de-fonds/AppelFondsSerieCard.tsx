'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Building2, CheckCircle2, Clock } from 'lucide-react';
import { formatEuros, formatDate } from '@/lib/utils';

interface AppelInSerie {
  id: string;
  titre: string;
  montant_total: number;
  date_echeance: string;
  nbPayes: number;
  nbImpayes: number;
  pctPaye: number;
  lignesCount: number;
}

interface AppelFondsSerieCardProps {
  serieTitre: string;
  agResolutionId: string | null;
  total: number;
  appels: AppelInSerie[];
  appelCards: React.ReactNode[];
}

export default function AppelFondsSerieCard({
  serieTitre, total, appels, appelCards,
}: AppelFondsSerieCardProps) {
  const [expanded, setExpanded] = useState(false);

  const nbTotal = appels.length;
  const nbImpayes = appels.reduce((s, a) => s + a.nbImpayes, 0);
  const totalPaye = appels.reduce((s, a) => s + Math.round(a.montant_total * (a.pctPaye / 100) * 100) / 100, 0);
  const pctGlobal = total > 0 ? Math.round((totalPaye / total) * 100) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* En-tête de la série */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Building2 size={16} className="text-blue-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-sm font-bold text-gray-900 truncate">{serieTitre}</span>
            <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
              Série · {nbTotal} versements
            </span>
            {nbImpayes > 0 && (
              <span className="text-[11px] bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full font-semibold shrink-0">
                {nbImpayes} impayé{nbImpayes > 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Barre de progression */}
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${pctGlobal === 100 ? 'bg-green-500' : 'bg-blue-500'}`}
                style={{ width: `${pctGlobal}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 shrink-0 tabular-nums">{pctGlobal}% encaissé</span>
          </div>

          {/* Dots versements */}
          <div className="flex items-center gap-1">
            {appels.map((a, i) => (
              <span
                key={a.id}
                title={`Versement ${i + 1} — ${formatDate(a.date_echeance)} — ${a.pctPaye}%`}
                className={`w-2 h-2 rounded-full ${
                  a.pctPaye === 100
                    ? 'bg-green-500'
                    : a.nbImpayes > 0
                      ? 'bg-red-400'
                      : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="text-right shrink-0 flex flex-col items-end gap-1">
          <span className="text-base font-bold text-gray-900">{formatEuros(total)}</span>
          <span className="text-xs text-gray-400">{formatEuros(total / nbTotal)}/versement</span>
          {expanded
            ? <ChevronUp size={16} className="text-gray-400 mt-1" />
            : <ChevronDown size={16} className="text-gray-400 mt-1" />}
        </div>
      </button>

      {/* Détails des versements */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3 space-y-2 bg-gray-50">
          {appels.map((appel, i) => (
            <div key={appel.id} className="flex items-center gap-3 px-3 py-2 bg-white rounded-xl border border-gray-100">
              {appel.pctPaye === 100 ? (
                <CheckCircle2 size={15} className="text-green-500 shrink-0" />
              ) : (
                <Clock size={15} className={appel.nbImpayes > 0 ? 'text-red-400 shrink-0' : 'text-gray-300 shrink-0'} />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800">Versement {i + 1}</p>
                <p className="text-xs text-gray-500">{formatDate(appel.date_echeance)}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-gray-900 tabular-nums">{formatEuros(appel.montant_total)}</p>
                <p className={`text-xs tabular-nums ${
                  appel.pctPaye === 100 ? 'text-green-600' : appel.nbImpayes > 0 ? 'text-red-500' : 'text-gray-400'
                }`}>
                  {appel.pctPaye === 100
                    ? 'Soldé'
                    : appel.nbImpayes > 0
                      ? `${appel.nbImpayes} impayé${appel.nbImpayes > 1 ? 's' : ''}`
                      : `${appel.nbPayes}/${appel.lignesCount} payés`}
                </p>
              </div>
            </div>
          ))}
          {/* Full AppelFondsCards (payment + PDF) */}
          <div className="pt-2 space-y-2">
            {appelCards}
          </div>
        </div>
      )}
    </div>
  );
}
