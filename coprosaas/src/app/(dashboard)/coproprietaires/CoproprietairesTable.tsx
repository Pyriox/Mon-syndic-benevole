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
import Badge from '@/components/ui/Badge';
import { CoproprietaireEdit, CoproprietaireDelete } from './CoproprietaireActions';
import { formatEuros } from '@/lib/utils';
import { GripVertical, Mail, Phone } from 'lucide-react';

interface CoproRow {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  email: string;
  telephone: string | null;
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  solde: number;
}

interface LotEntry {
  id: string;
  numero: string;
  type: string;
  tantiemes: number;
}

interface LotForSelect {
  id: string;
  numero: string;
  coproprietaire_id: string | null;
}

interface CoproprietairesTableProps {
  initialCoproprietaires: CoproRow[];
  lotsByOwner: Record<string, LotEntry[]>;
  lotsForSelect: LotForSelect[];
  totalTantiemes: number;
}

// -------------------------------------------------------
// Ligne sortable
// -------------------------------------------------------
function SortableCoproRow({
  cp,
  ownedLots,
  lotsForSelect,
  totalTantiemes,
}: {
  cp: CoproRow;
  ownedLots: LotEntry[];
  lotsForSelect: LotForSelect[];
  totalTantiemes: number;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: cp.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: isDragging ? ('relative' as const) : undefined,
    zIndex: isDragging ? 10 : undefined,
  };

  const cpTantiemes = ownedLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const cpPercent = totalTantiemes > 0 ? ((cpTantiemes / totalTantiemes) * 100).toFixed(2) : '0.00';

  const displayName = cp.raison_sociale
    ? cp.raison_sociale
    : `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim();

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-100 last:border-0 ${
        isDragging ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      {/* Poignée */}
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

      {/* Nom */}
      <td className="py-3 px-4">
        <p className="font-medium text-gray-900">{displayName}</p>
        {cp.raison_sociale && (
          <p className="text-xs text-gray-400 mt-0.5">
            {(cp.prenom || cp.nom)
              ? `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim()
              : 'Personne morale'}
          </p>
        )}
      </td>

      {/* Lots */}
      <td className="py-3 px-4">
        {ownedLots.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {ownedLots.map((lot) => (
              <span
                key={lot.id}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full"
              >
                {lot.numero}
                <span className="text-blue-400">· {lot.tantiemes} t.</span>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Aucun lot</span>
        )}
        {ownedLots.length > 0 && (
          <p className="text-xs text-gray-400 mt-1">
            {cpTantiemes} / {totalTantiemes} t. &mdash; <span className="font-medium text-gray-600">{cpPercent}%</span>
          </p>
        )}
      </td>

      {/* Contact */}
      <td className="py-3 px-4">
        <a
          href={`mailto:${cp.email}`}
          className="flex items-center gap-1.5 text-gray-600 hover:text-blue-600 transition-colors"
        >
          <Mail size={13} className="shrink-0" />
          <span className="truncate max-w-[180px]">{cp.email}</span>
        </a>
        {cp.telephone && (
          <a
            href={`tel:${cp.telephone}`}
            className="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors mt-0.5"
          >
            <Phone size={13} className="shrink-0" />
            {cp.telephone}
          </a>
        )}
      </td>

      {/* Solde */}
      <td className="py-3 px-4 text-right">
        <Badge variant={cp.solde < 0 ? 'danger' : cp.solde > 0 ? 'success' : 'default'}>
          {formatEuros(cp.solde)}
        </Badge>
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-0.5">
          <CoproprietaireEdit
            coproprietaire={cp}
            lots={lotsForSelect}
            assignedLotIds={ownedLots.map((l) => l.id)}
          />
          <CoproprietaireDelete id={cp.id} nom={displayName} />
        </div>
      </td>
    </tr>
  );
}

// -------------------------------------------------------
// Tableau principal
// -------------------------------------------------------
export default function CoproprietairesTable({
  initialCoproprietaires,
  lotsByOwner,
  lotsForSelect,
  totalTantiemes,
}: CoproprietairesTableProps) {
  const [coproprietaires, setCoproprietaires] = useState<CoproRow[]>(initialCoproprietaires);
  const supabase = createClient();

  useEffect(() => {
    setCoproprietaires(initialCoproprietaires);
  }, [initialCoproprietaires]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = coproprietaires.findIndex((c) => c.id === active.id);
    const newIndex = coproprietaires.findIndex((c) => c.id === over.id);
    const reordered = arrayMove(coproprietaires, oldIndex, newIndex);
    setCoproprietaires(reordered);

    await Promise.all(
      reordered.map((cp, idx) =>
        supabase.from('coproprietaires').update({ position: idx + 1 } as never).eq('id', cp.id)
      )
    );
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={coproprietaires.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 px-2 w-6"></th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Nom</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Lots</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Contact</th>
                <th className="text-right py-3 px-4 font-medium text-gray-500">Solde</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {coproprietaires.map((cp) => (
                <SortableCoproRow
                  key={cp.id}
                  cp={cp}
                  ownedLots={lotsByOwner[cp.id] ?? []}
                  lotsForSelect={lotsForSelect}
                  totalTantiemes={totalTantiemes}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
  );
}
