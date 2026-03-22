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
import Card from '@/components/ui/Card';
import { CoproprietaireEdit, CoproprietaireDelete, CoproprietaireInvite } from './CoproprietaireActions';
import { formatEuros } from '@/lib/utils';
import { GripVertical, Mail, Phone, UserCheck } from 'lucide-react';

function Avatar({ name }: { name: string }) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const initials = parts.length >= 2
    ? parts[0][0].toUpperCase() + parts[parts.length - 1][0].toUpperCase()
    : name.slice(0, 2).toUpperCase();
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-blue-100 text-blue-700 text-sm font-bold shrink-0">
      {initials || '?'}
    </span>
  );
}

interface CoproRow {
  id: string;
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
  email?: string | null;      // masqué en mode lecture seule
  telephone?: string | null;  // masqué en mode lecture seule
  adresse: string | null;
  code_postal: string | null;
  ville: string | null;
  solde?: number;             // masqué en mode lecture seule
  user_id: string | null;
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
  lotsForSelect?: LotForSelect[];
  totalTantiemes: number;
  readOnly?: boolean;
  coproprieteId?: string;
  currentUserId?: string;
}

// -------------------------------------------------------
// Carte mobile lecture seule (pas de contact, pas de solde, pas d'actions)
// -------------------------------------------------------
function ReadOnlyMobileCoproCard({
  cp,
  ownedLots,
  totalTantiemes,
  currentUserId,
}: {
  cp: CoproRow;
  ownedLots: LotEntry[];
  totalTantiemes: number;
  currentUserId?: string;
}) {
  const cpTantiemes = ownedLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const cpPct = totalTantiemes > 0 ? (cpTantiemes / totalTantiemes) * 100 : 0;
  const displayName = cp.raison_sociale
    ? cp.raison_sociale
    : `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim();
  const address = [cp.adresse, cp.code_postal, cp.ville].filter(Boolean).join(' ');

  return (
    <Card className={`space-y-3 ${cp.user_id === currentUserId ? 'ring-1 ring-blue-200 bg-blue-50/30' : ''}`}>
      {/* Avatar + nom */}
      <div className="flex items-center gap-3">
        <Avatar name={displayName || '?'} />
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 leading-tight truncate">
              {displayName || <span className="text-gray-400 italic">Sans nom</span>}
            </p>
            {cp.user_id && (
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">
                <UserCheck size={11} />Inscrit
              </span>
            )}
            {cp.user_id === currentUserId && (
              <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">Vous</span>
            )}
          </div>
          {cp.raison_sociale && (cp.prenom || cp.nom) && (
            <p className="text-xs text-gray-400 mt-0.5">{`${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim()}</p>
          )}
        </div>
      </div>
      {/* Lots + barre quote-part */}
      {ownedLots.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
            {ownedLots.map((lot) => (
              <span key={lot.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                {lot.numero}<span className="text-blue-400">· {lot.tantiemes} t.</span>
              </span>
            ))}
          </div>
          <div className="space-y-0.5">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{cpTantiemes} tantièmes</span>
              <span className="font-medium text-gray-700">{cpPct.toFixed(1)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${cpPct}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Aucun lot assigné</p>
      )}
      {/* Adresse masquée en vue copropriétaire — données personnelles */}
    </Card>
  );
}

// -------------------------------------------------------
// Ligne lecture seule (pas de drag, pas de contact, pas de solde, pas d'actions)
// -------------------------------------------------------
function ReadOnlyCoproRow({
  cp,
  ownedLots,
  totalTantiemes,
  currentUserId,
}: {
  cp: CoproRow;
  ownedLots: LotEntry[];
  totalTantiemes: number;
  currentUserId?: string;
}) {
  const cpTantiemes = ownedLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const cpPct = totalTantiemes > 0 ? (cpTantiemes / totalTantiemes) * 100 : 0;
  const displayName = cp.raison_sociale
    ? cp.raison_sociale
    : `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim();
  const address = [cp.adresse, cp.code_postal, cp.ville].filter(Boolean).join(' ');

  return (
    <tr className={`border-b border-gray-100 last:border-0 transition-colors ${cp.user_id === currentUserId ? 'bg-blue-50/50 hover:bg-blue-50/70' : 'hover:bg-gray-50'}`}>
      <td className="py-3.5 px-5">
        <div className="flex items-center gap-3">
          <Avatar name={displayName || '?'} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{displayName || <span className="text-gray-400 italic">Sans nom</span>}</p>
              {cp.user_id && (
                <span title="Compte actif" className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">
                  <UserCheck size={11} />Inscrit
                </span>
              )}
              {cp.user_id === currentUserId && (
                <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">Vous</span>
              )}
            </div>
            {cp.raison_sociale && (
              <p className="text-xs text-gray-400 mt-0.5">
                {(cp.prenom || cp.nom) ? `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim() : 'Personne morale'}
              </p>
            )}
          </div>
        </div>
      </td>
      <td className="py-3.5 px-5">
        {ownedLots.length > 0 ? (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1">
              {ownedLots.map((lot) => (
                <span key={lot.id} className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                  {lot.numero}<span className="text-blue-400">· {lot.tantiemes} t.</span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${cpPct}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-600 w-10 text-right">{cpPct.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Aucun lot</span>
        )}
      </td>
      <td className="py-3.5 px-5 text-sm text-gray-500">
        {/* Adresse masquée — donnée personnelle non visible par les copropriétaires */}
      </td>
    </tr>
  );
}

// -------------------------------------------------------
// Carte mobile pour un copropriétaire
// -------------------------------------------------------
function MobileCoproCard({
  cp,
  ownedLots,
  lotsForSelect,
  totalTantiemes,
  currentUserId,
}: {
  cp: CoproRow;
  ownedLots: LotEntry[];
  lotsForSelect: LotForSelect[];
  totalTantiemes: number;
  currentUserId?: string;
}) {
  const cpTantiemes = ownedLots.reduce((sum, l) => sum + (l.tantiemes ?? 0), 0);
  const cpPercent = totalTantiemes > 0 ? ((cpTantiemes / totalTantiemes) * 100).toFixed(2) : '0.00';
  const displayName = cp.raison_sociale
    ? cp.raison_sociale
    : `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim();

  return (
    <div className={`border rounded-xl p-4 space-y-3 ${cp.user_id === currentUserId ? 'bg-blue-50/50 border-blue-200' : 'bg-white border-gray-200'}`}>
      {/* Ligne 1 : avatar + nom + actions */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={displayName || '?'} />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-gray-900 leading-tight truncate">{displayName}</p>
              {cp.user_id ? (
                <span
                  title="Compte actif"
                  className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                >
                  <UserCheck size={11} />
                  Inscrit
                </span>
              ) : (
                <CoproprietaireInvite coproprietaireId={cp.id} displayName={displayName} />
              )}
              {cp.user_id === currentUserId && (
                <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">Vous</span>
              )}
            </div>
            {cp.raison_sociale && (cp.prenom || cp.nom) && (
              <p className="text-xs text-gray-400 mt-0.5">
                {`${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim()}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <CoproprietaireEdit
            coproprietaire={{ ...cp, email: cp.email ?? '', telephone: cp.telephone ?? null, solde: cp.solde ?? 0 }}
            lots={lotsForSelect}
            assignedLotIds={ownedLots.map((l) => l.id)}
          />
          <CoproprietaireDelete id={cp.id} nom={displayName} />
        </div>
      </div>

      {/* Lots + barre quote-part */}
      {ownedLots.length > 0 ? (
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-1.5">
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
          <div className="flex items-center gap-2">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="bg-blue-400 h-full rounded-full" style={{ width: `${cpPercent}%` }} />
            </div>
            <span className="text-xs font-medium text-gray-600 w-10 text-right">{cpPercent}%</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic">Aucun lot assigné</p>
      )}

      {/* Contact + Solde */}
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <a
            href={`mailto:${cp.email}`}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-blue-600 transition-colors"
          >
            <Mail size={13} className="shrink-0" />
            <span className="truncate">{cp.email}</span>
          </a>
          {cp.telephone && (
            <a
              href={`tel:${cp.telephone}`}
              className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-blue-600 transition-colors"
            >
              <Phone size={13} className="shrink-0" />
              {cp.telephone}
            </a>
          )}
        </div>
        <Badge variant={(cp.solde ?? 0) < 0 ? 'danger' : (cp.solde ?? 0) > 0 ? 'success' : 'default'} className="shrink-0">
          {formatEuros(cp.solde ?? 0)}
        </Badge>
      </div>
    </div>
  );
}

// -------------------------------------------------------
// Ligne sortable
// -------------------------------------------------------
function SortableCoproRow({
  cp,
  ownedLots,
  lotsForSelect,
  totalTantiemes,
  currentUserId,
}: {
  cp: CoproRow;
  ownedLots: LotEntry[];
  lotsForSelect: LotForSelect[];
  totalTantiemes: number;
  currentUserId?: string;
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
        isDragging ? 'bg-blue-50' : cp.user_id === currentUserId ? 'bg-indigo-50/60 hover:bg-indigo-50' : 'hover:bg-gray-50'
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
        <div className="flex items-center gap-2.5">
          <Avatar name={displayName || '?'} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-gray-900">{displayName}</p>
              {cp.user_id ? (
                <span
                  title="Compte actif"
                  className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0"
                >
                  <UserCheck size={11} />
                  Inscrit
                </span>
              ) : (
                <CoproprietaireInvite coproprietaireId={cp.id} displayName={displayName} />
              )}
              {cp.user_id === currentUserId && (
                <span className="inline-flex items-center bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium shrink-0">Vous</span>
              )}
            </div>
            {cp.raison_sociale && (
              <p className="text-xs text-gray-400 mt-0.5">
                {(cp.prenom || cp.nom)
                  ? `${cp.prenom ?? ''} ${cp.nom ?? ''}`.trim()
                  : 'Personne morale'}
              </p>
            )}
          </div>
        </div>
      </td>

      {/* Lots */}
      <td className="py-3 px-4">
        {ownedLots.length > 0 ? (
          <div className="space-y-1.5">
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
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: `${cpPercent}%` }} />
              </div>
              <span className="text-xs font-medium text-gray-600 w-10 text-right">{cpPercent}%</span>
            </div>
          </div>
        ) : (
          <span className="text-xs text-gray-400 italic">Aucun lot</span>
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
        <Badge variant={(cp.solde ?? 0) < 0 ? 'danger' : (cp.solde ?? 0) > 0 ? 'success' : 'default'}>
          {formatEuros(cp.solde ?? 0)}
        </Badge>
      </td>

      {/* Actions */}
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-0.5">
          <CoproprietaireEdit
            coproprietaire={{ ...cp, email: cp.email ?? '', telephone: cp.telephone ?? null, solde: cp.solde ?? 0 }}
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
  lotsForSelect = [],
  totalTantiemes,
  readOnly = false,
  currentUserId,
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

  // ── Mode lecture seule (copropriétaire) ───────────────────────────────────
  if (readOnly) {
    return (
      <>
        {/* Cartes mobile */}
        <div className="md:hidden divide-y divide-gray-100">
          {coproprietaires.map((cp) => (
            <div key={cp.id} className="p-3">
              <ReadOnlyMobileCoproCard
                cp={cp}
                ownedLots={lotsByOwner[cp.id] ?? []}
                totalTantiemes={totalTantiemes}
                currentUserId={currentUserId}
              />
            </div>
          ))}
        </div>
        {/* Tableau desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-3 px-5 font-medium text-gray-500">Copropriétaire</th>
                <th className="text-left py-3 px-5 font-medium text-gray-500">Lots &amp; quote-part</th>
              </tr>
            </thead>
            <tbody>
              {coproprietaires.map((cp) => (
                <ReadOnlyCoproRow
                  key={cp.id}
                  cp={cp}
                  ownedLots={lotsByOwner[cp.id] ?? []}
                  totalTantiemes={totalTantiemes}
                  currentUserId={currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  // ── Mode édition (syndic) ─────────────────────────────────────────────────
  return (
    <>
      {/* ── Vue cartes : mobile uniquement ── */}
      <div className="md:hidden divide-y divide-gray-100">
        {coproprietaires.map((cp) => (
          <div key={cp.id} className="p-3">
            <MobileCoproCard
              cp={cp}
              ownedLots={lotsByOwner[cp.id] ?? []}
              lotsForSelect={lotsForSelect}
              totalTantiemes={totalTantiemes}
              currentUserId={currentUserId}
            />
          </div>
        ))}
      </div>

      {/* ── Vue tableau : md+ uniquement ── */}
      <div className="hidden md:block">
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={coproprietaires.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="py-3 px-2 w-6"></th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Copropriétaire</th>
                <th className="text-left py-3 px-4 font-medium text-gray-500">Lots &amp; tantièmes</th>
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
                  currentUserId={currentUserId}
                />
              ))}
            </tbody>
          </table>
        </div>
      </SortableContext>
    </DndContext>
      </div>
    </>
  );
}
