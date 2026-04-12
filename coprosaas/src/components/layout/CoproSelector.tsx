'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2, ChevronDown, Check, Crown, User, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { selectCopropriete } from '@/lib/actions/select-copropriete';
import type { UserCopropriete } from '@/types';

interface CoproSelectorProps {
  coproprietes: UserCopropriete[];
  selectedId: string | null;
  userRole?: 'syndic' | 'copropriétaire';
}

export default function CoproSelector({ coproprietes, selectedId, userRole }: CoproSelectorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  // Au 1er rendu : si le layout a calculé un défaut mais que le cookie n'est pas encore posé,
  // on le persiste silencieusement puis on rafraîchit les pages modules.
  useEffect(() => {
    if (!selectedId) return;
    const hasCookie = document.cookie.split(';').some((c) => c.trim().startsWith('selected_copro_id='));
    if (!hasCookie) {
      startTransition(async () => {
        await selectCopropriete(selectedId);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = coproprietes.find((c) => c.id === selectedId) ?? null;
  const selectedBadgeRole = userRole ?? selected?.role ?? null;

  const handleSelect = (copro: UserCopropriete) => {
    setOpen(false);
    if (copro.id === selectedId) return;
    startTransition(async () => {
      await selectCopropriete(copro.id);
      router.refresh();
    });
  };

  if (coproprietes.length === 0) {
    if (userRole === 'syndic') {
      return (
        <div className="mx-3 mb-4">
          <Link
            href="/coproprietes/nouvelle"
            className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-blue-300 bg-blue-50 hover:bg-blue-100 hover:border-blue-400 transition-colors group"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-100 group-hover:bg-blue-200 flex items-center justify-center shrink-0 transition-colors">
              <Plus size={14} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-blue-700">Créer une copropriété</p>
              <p className="text-xs text-blue-700">Commencer la configuration</p>
            </div>
          </Link>
        </div>
      );
    }
    return (
      <div className="mx-3 mb-4 px-3 py-2.5 rounded-xl border border-dashed border-gray-200 text-center">
        <p className="text-xs text-gray-500">Aucune copropriété</p>
      </div>
    );
  }

  return (
    <div className="mx-3 mb-4 relative" onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false); }}>
      {/* Bouton principal */}
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={pending}
        className={cn(
          'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all',
          'bg-gray-50 border-gray-200 hover:bg-white hover:border-blue-200 hover:shadow-sm',
          open && 'bg-white border-blue-300 shadow-sm',
          pending && 'opacity-60 cursor-wait'
        )}
      >
        <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
          <Building2 size={14} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          {selected ? (
            <>
              <p className="text-xs font-semibold text-gray-800 truncate leading-tight">{selected.nom}</p>
              <p className="text-xs text-gray-500 leading-tight flex items-center gap-1 mt-0.5">
                {selectedBadgeRole === 'syndic' ? (
                  <><Crown size={9} className="text-amber-700" /> Syndic</>
                ) : (
                  <><User size={9} className="text-blue-600" /> Copropriétaire</>
                )}
              </p>
            </>
          ) : (
            <p className="text-xs text-gray-500">Sélectionner…</p>
          )}
        </div>
        <ChevronDown
          size={14}
          className={cn('text-gray-500 transition-transform flex-shrink-0', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          {coproprietes.map((copro) => (
            <button
              key={copro.id}
              onClick={() => handleSelect(copro)}
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                'hover:bg-gray-50',
                copro.id === selectedId && 'bg-blue-50'
              )}
            >
              <div className="flex-shrink-0 w-6 h-6 rounded-md bg-gray-100 flex items-center justify-center">
                <Building2 size={12} className="text-gray-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{copro.nom}</p>
                <p className="text-xs text-gray-500 truncate">{copro.ville}</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {copro.role === 'syndic' ? (
                  <span className="text-[10px] font-semibold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <Crown size={8} /> Syndic
                  </span>
                ) : (
                  <span className="text-[10px] font-semibold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                    <User size={8} /> Copro.
                  </span>
                )}
                {copro.id === selectedId && <Check size={12} className="text-blue-600" />}
              </div>
            </button>
          ))}
          <div className="border-t border-gray-100">
            <Link
              href="/coproprietes/nouvelle"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors w-full"
            >
              <Plus size={13} /> Nouvelle copropriété
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
