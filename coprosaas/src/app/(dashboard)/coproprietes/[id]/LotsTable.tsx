'use client';

import { useState } from 'react';
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
import Badge from '@/components/ui/Badge';
import LotActions, { LotDelete } from './LotActions';
import { GripVertical } from 'lucide-react';

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
}

interface LotsTableProps {
  initialLots: LotRow[];
  coproMap: Record<string, CoproEntry>;
  coproprieteId: string;
}

// -------------------------------------------------------
// Ligne sortable (dnd-kit useSortable)
// -------------------------------------------------------
function SortableLotRow({
  lot,
  totalTantiemes,
  coproMap,
  coproprieteId,
}: {
  lot: LotRow;
  totalTantiemes: number;
  coproMap: Record<string, CoproEntry>;
  coproprieteId: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lot.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const quotePart =
    totalTantiemes > 0 ? ((lot.tantiemes / totalTantiemes) * 100).toFixed(2) : '0.00';

  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
  const ownerName = owner
    ? owner.raison_sociale ?? `${owner.prenom ?? ''} ${owner.nom ?? ''}`.trim()
    : null;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 last:border-0 ${
        isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <td className="py-3 px-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-700 focus:outline-none touch-none"
          aria-label="Réordonner"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="py-3 px-3 font-medium text-gray-900">{lot.numero}</td>
      <td className="py-3 px-3 text-gray-600">
        <Badge variant="default">{lot.type}</Badge>
      </td>
      <td className="py-3 px-3 text-right text-gray-900">{lot.tantiemes}</td>
      <td className="py-3 px-3 text-right text-gray-600">{quotePart}%</td>
      <td className="py-3 px-3 text-gray-600">
        {ownerName ? ownerName : <span className="text-gray-400 italic">Non assigné</span>}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center justify-end gap-1">
          <LotActions
            coproprieteId={coproprieteId}
            lot={{ id: lot.id, numero: lot.numero, type: lot.type, tantiemes: lot.tantiemes }}
          />
          <LotDelete lotId={lot.id} lotNumero={lot.numero} />
        </div>
      </td>
    </tr>
  );
}

export default function LotsTable({ initialLots, coproMap, coproprieteId }: LotsTableProps) {
  const [lots, setLots] = useState<LotRow[]>(initialLots);
  const supabase = createClient();

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
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="py-3 px-2 w-6"></th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">Numéro</th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">Type</th>
            <th className="text-right py-3 px-3 font-medium text-gray-500">Tantièmes</th>
            <th className="text-right py-3 px-3 font-medium text-gray-500">Quote-part</th>
            <th className="text-left py-3 px-3 font-medium text-gray-500">Copropriétaire</th>
            <th className="py-3 px-3"></th>
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
            />
          ))}
        </tbody>
      </table>
    </div>
      </SortableContext>
    </DndContext>
  );
}
