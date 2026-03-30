'use client';

import { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createClient } from '@/lib/supabase/client';
import LotActions, { LotDelete } from './LotActions';
import {
  GripVertical,
  Building2, Car, Archive, ShoppingBag, Briefcase, LayoutGrid,
} from 'lucide-react';

// ── Config par type ───────────────────────────────────────────────────────────
const LOT_TYPE_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  bgColor: string;
  iconColor: string;
  badgeBg: string;
  badgeText: string;
  barColor: string;
}> = {
  appartement: { label: 'Appartement', icon: Building2,   bgColor: 'bg-blue-50',   iconColor: 'text-blue-500',   badgeBg: 'bg-blue-100',   badgeText: 'text-blue-700',   barColor: 'bg-blue-400' },
  parking:     { label: 'Parking',     icon: Car,         bgColor: 'bg-slate-50',  iconColor: 'text-slate-500',  badgeBg: 'bg-slate-100',  badgeText: 'text-slate-700',  barColor: 'bg-slate-400' },
  cave:        { label: 'Cave',        icon: Archive,     bgColor: 'bg-amber-50',  iconColor: 'text-amber-600',  badgeBg: 'bg-amber-100',  badgeText: 'text-amber-700',  barColor: 'bg-amber-400' },
  commerce:    { label: 'Commerce',    icon: ShoppingBag, bgColor: 'bg-green-50',  iconColor: 'text-green-600',  badgeBg: 'bg-green-100',  badgeText: 'text-green-700',  barColor: 'bg-green-400' },
  bureau:      { label: 'Bureau',      icon: Briefcase,   bgColor: 'bg-purple-50', iconColor: 'text-purple-500', badgeBg: 'bg-purple-100', badgeText: 'text-purple-700', barColor: 'bg-purple-400' },
  autre:       { label: 'Autre',       icon: LayoutGrid,  bgColor: 'bg-gray-50',   iconColor: 'text-gray-500',   badgeBg: 'bg-gray-100',   badgeText: 'text-gray-600',   barColor: 'bg-gray-300' },
};
const defaultConfig = LOT_TYPE_CONFIG.autre;
function getConfig(type: string) { return LOT_TYPE_CONFIG[type] ?? defaultConfig; }

function OwnerAvatar({ name, isMe = false }: { name: string; isMe?: boolean }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-sm font-bold shrink-0 ${
      isMe ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
    }`}>
      {initials || '?'}
    </span>
  );
}

interface LotRow {
  id: string;
  numero: string;
  type: string;
  tantiemes: number;
  coproprietaire_id: string | null;
}

interface CoproEntry {
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  user_id?: string | null;
}

interface LotsTableProps {
  initialLots: LotRow[];
  coproMap: Record<string, CoproEntry>;
  coproprieteId: string;
  currentUserId?: string | null;
}

// ── Ligne sortable ────────────────────────────────────────────────────────────
function SortableLotRow({
  lot,
  totalTantiemes,
  coproMap,
  coproprieteId,
  currentUserId,
}: {
  lot: LotRow;
  totalTantiemes: number;
  coproMap: Record<string, CoproEntry>;
  coproprieteId: string;
  currentUserId?: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lot.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const quotePart = totalTantiemes > 0 ? (lot.tantiemes / totalTantiemes) * 100 : 0;
  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
  const ownerName = owner ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim() : null;
  const isMyLot = !!currentUserId && !!owner?.user_id && owner.user_id === currentUserId;
  const cfg = getConfig(lot.type);
  const Icon = cfg.icon;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 last:border-0 transition-colors ${isDragging ? 'bg-blue-50' : isMyLot ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'}`}
    >
      {/* Grip */}
      <td className="py-3.5 px-2 w-7">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 focus:outline-none touch-none"
          aria-label="Réordonner"
        >
          <GripVertical size={16} />
        </button>
      </td>
      {/* Lot */}
      <td className="py-3.5 px-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-1.5 ${cfg.bgColor} rounded-lg`}>
            <Icon size={14} className={cfg.iconColor} />
          </div>
          <span className="font-semibold text-gray-900">{lot.numero}</span>
        </div>
      </td>
      {/* Type */}
      <td className="py-3.5 px-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badgeBg} ${cfg.badgeText}`}>
          {cfg.label}
        </span>
      </td>
      {/* Tantièmes */}
      <td className="py-3.5 px-3 text-right font-medium text-gray-900">{lot.tantiemes}</td>
      {/* Quote-part */}
      <td className="py-3.5 px-3 w-36">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className={`${cfg.barColor} h-full rounded-full`} style={{ width: `${quotePart}%` }} />
          </div>
          <span className="text-xs font-medium text-gray-600 w-10 text-right">{quotePart.toFixed(1)}%</span>
        </div>
      </td>
      {/* Copropriétaire */}
      <td className="py-3.5 px-3">
        {ownerName ? (
          <div className="flex items-center gap-2">
            <OwnerAvatar name={ownerName} isMe={isMyLot} />
            <span className="text-gray-700 text-sm">{ownerName}</span>
          </div>
        ) : (
          <span className="text-orange-700 italic text-xs font-medium">Non assigné</span>
        )}
      </td>
      {/* Actions */}
      <td className="py-3.5 px-3">
        <div className="flex items-center justify-end gap-1">
          <LotActions
            coproprieteId={coproprieteId}
            lot={{ id: lot.id, numero: lot.numero, type: lot.type, tantiemes: lot.tantiemes }}
          />
          <LotDelete lotId={lot.id} lotNumero={lot.numero} coproprieteId={coproprieteId} />
        </div>
      </td>
    </tr>
  );
}

// ── Carte mobile sortable ─────────────────────────────────────────────────────
function SortableLotCard({
  lot,
  totalTantiemes,
  coproMap,
  coproprieteId,
  currentUserId,
}: {
  lot: LotRow;
  totalTantiemes: number;
  coproMap: Record<string, CoproEntry>;
  coproprieteId: string;
  currentUserId?: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lot.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const quotePart = totalTantiemes > 0 ? (lot.tantiemes / totalTantiemes) * 100 : 0;
  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
  const ownerName = owner ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim() : null;
  const isMyLot = !!currentUserId && !!owner?.user_id && owner.user_id === currentUserId;
  const cfg = getConfig(lot.type);
  const Icon = cfg.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border rounded-xl p-4 ${isDragging ? 'border-blue-300 shadow-md bg-white' : isMyLot ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white'}`}
    >
      <div className="flex items-start gap-3">
        {/* Grip */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-700 focus:outline-none touch-none mt-0.5"
          aria-label="Réordonner"
        >
          <GripVertical size={16} />
        </button>
        {/* Icon */}
        <div className={`p-2.5 ${cfg.bgColor} rounded-xl shrink-0`}>
          <Icon size={18} className={cfg.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-semibold text-gray-900 truncate">Lot {lot.numero}</p>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${cfg.badgeBg} ${cfg.badgeText}`}>
              {cfg.label}
            </span>
          </div>
          {/* Tantièmes + barre */}
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{lot.tantiemes} tantièmes</span>
              <span className="font-medium text-gray-700">{quotePart.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className={`${cfg.barColor} h-full rounded-full`} style={{ width: `${quotePart}%` }} />
            </div>
          </div>
          {/* Propriétaire + actions */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div>
              {ownerName ? (
                <div className="flex items-center gap-1.5">
                  <OwnerAvatar name={ownerName} isMe={isMyLot} />
                  <span className="text-sm text-gray-700 truncate">{ownerName}</span>
                </div>
              ) : (
                <span className="text-xs text-orange-700 italic font-medium">Non assigné</span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <LotActions
                coproprieteId={coproprieteId}
                lot={{ id: lot.id, numero: lot.numero, type: lot.type, tantiemes: lot.tantiemes }}
              />
              <LotDelete lotId={lot.id} lotNumero={lot.numero} coproprieteId={coproprieteId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function LotsTable({ initialLots, coproMap, coproprieteId, currentUserId }: LotsTableProps) {
  const [lots, setLots] = useState<LotRow[]>(initialLots);
  const supabase = createClient();

  // Sync avec les données serveur après router.refresh()
  useEffect(() => {
    setLots(initialLots);
  }, [initialLots]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const totalTantiemes = lots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lots.findIndex((l) => l.id === active.id);
    const newIndex = lots.findIndex((l) => l.id === over.id);
    const reordered = arrayMove(lots, oldIndex, newIndex);
    setLots(reordered);
    await Promise.all(
      reordered.map((lot, idx) =>
        supabase.from('lots').update({ position: idx + 1 } as never).eq('id', lot.id)
      )
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={lots.map((l) => l.id)} strategy={verticalListSortingStrategy}>
        {/* ── Vue cartes : mobile ── */}
        <div className="md:hidden space-y-3">
          {lots.map((lot) => (
            <SortableLotCard
              key={lot.id}
              lot={lot}
              totalTantiemes={totalTantiemes}
              coproMap={coproMap}
              coproprieteId={coproprieteId}
              currentUserId={currentUserId}
            />
          ))}
        </div>

        {/* ── Vue tableau : desktop ── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-2 w-7" />
                <th className="text-left py-3 px-3 font-medium text-gray-500">Lot</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Type</th>
                <th className="text-right py-3 px-3 font-medium text-gray-500">Tantièmes</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500 w-36">Quote-part</th>
                <th className="text-left py-3 px-3 font-medium text-gray-500">Copropriétaire</th>
                <th className="py-3 px-3" />
              </tr>
            </thead>
            <tbody>
              {lots.map((lot) => (
                <SortableLotRow
                  key={lot.id}
                  lot={lot}
                  totalTantiemes={totalTantiemes}
                  coproMap={coproMap}
                  coproprieteId={coproprieteId}
                  currentUserId={currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>

      </SortableContext>
    </DndContext>
  );
}
