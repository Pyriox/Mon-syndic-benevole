'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { saveCoproprieteSettings } from './actions';
import { cn, collectAvailableRepartitionGroups, sanitizeTantiemesGroupesMap } from '@/lib/utils';
import {
  AlertCircle,
  CheckCircle2,
  Filter,
  Info,
  Plus,
  Save,
  Settings2,
  X,
} from 'lucide-react';

interface CoproprieteSettings {
  id: string;
  nom: string;
  adresse: string;
  code_postal: string;
  ville: string;
}

interface LotSettingRow {
  id: string;
  numero: string;
  type: string;
  tantiemes: number;
  coproprietaire_id: string | null;
  batiment?: string | null;
  groupes_repartition?: string[] | null;
  tantiemes_groupes?: Record<string, number> | null;
}

interface CoproprietaireSummary {
  nom: string | null;
  prenom: string | null;
  raison_sociale: string | null;
}

interface EditableLotRow {
  id: string;
  numero: string;
  type: string;
  tantiemes: string;
  coproprietaire_id: string | null;
  batiment: string;
  keyValues: Record<string, string>;
}

function normalizeKeyLabel(value: string | null | undefined): string {
  return (value ?? '').trim().replace(/\s+/g, ' ');
}

function formatBase(value: number): string {
  return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(Math.round(value * 100) / 100);
}

function parseNumericValue(value: string | null | undefined): number {
  return Number.parseFloat((value ?? '').replace(',', '.')) || 0;
}

function deriveKeyNames(lots: LotSettingRow[]): string[] {
  return collectAvailableRepartitionGroups(lots);
}

function buildEditableLots(lots: LotSettingRow[], keyNames: string[]): EditableLotRow[] {
  return lots.map((lot) => {
    const keyMap = sanitizeTantiemesGroupesMap(lot.tantiemes_groupes);
    const keyValues = Object.fromEntries(
      keyNames.map((key) => [key, keyMap[key] ? String(keyMap[key]) : ''])
    );

    return {
      id: lot.id,
      numero: lot.numero,
      type: lot.type,
      tantiemes: lot.tantiemes ? String(lot.tantiemes) : '',
      coproprietaire_id: lot.coproprietaire_id,
      batiment: lot.batiment ?? '',
      keyValues,
    };
  });
}

function getOwnerName(coproprietaireId: string | null, coproMap: Record<string, CoproprietaireSummary>): string {
  if (!coproprietaireId) return '';
  const owner = coproMap[coproprietaireId];
  return owner?.raison_sociale ?? [owner?.prenom, owner?.nom].filter(Boolean).join(' ');
}

function getLotTypeLabel(type: string): string {
  switch (type) {
    case 'appartement': return 'Appartement';
    case 'parking': return 'Parking';
    case 'cave': return 'Cave';
    case 'local_commercial': return 'Local commercial';
    default: return 'Autre';
  }
}

export default function CoproSettingsPanel({
  copropriete,
  initialLots,
  coproMap,
  specialChargesEnabled = true,
}: {
  copropriete: CoproprieteSettings;
  initialLots: LotSettingRow[];
  coproMap: Record<string, CoproprietaireSummary>;
  specialChargesEnabled?: boolean;
}) {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState<'repartition' | 'copro'>('repartition');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newKeyName, setNewKeyName] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [assignmentFilter, setAssignmentFilter] = useState<'all' | 'configured' | 'unconfigured' | 'missing-general'>('all');
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [pendingNavigationHref, setPendingNavigationHref] = useState<string | null>(null);

  const initialKeyNames = useMemo(() => deriveKeyNames(initialLots), [initialLots]);
  const initialEditableLots = useMemo(() => buildEditableLots(initialLots, initialKeyNames), [initialKeyNames, initialLots]);

  const [coproForm, setCoproForm] = useState({
    nom: copropriete.nom,
    adresse: copropriete.adresse,
    code_postal: copropriete.code_postal,
    ville: copropriete.ville,
  });

  const [keyNames, setKeyNames] = useState<string[]>(() => initialKeyNames);
  const [lots, setLots] = useState<EditableLotRow[]>(() => initialEditableLots);

  const initialSnapshot = useMemo(
    () => JSON.stringify({
      coproForm: {
        nom: copropriete.nom,
        adresse: copropriete.adresse,
        code_postal: copropriete.code_postal,
        ville: copropriete.ville,
      },
      keyNames: initialKeyNames,
      lots: initialEditableLots,
    }),
    [copropriete, initialEditableLots, initialKeyNames],
  );
  const [savedSnapshot, setSavedSnapshot] = useState(initialSnapshot);

  const currentSnapshot = useMemo(
    () => JSON.stringify({ coproForm, keyNames, lots }),
    [coproForm, keyNames, lots],
  );
  const isDirty = currentSnapshot !== savedSnapshot;

  useEffect(() => {
    if (!isDirty) {
      setLeaveModalOpen(false);
      setPendingNavigationHref(null);
      return undefined;
    }

    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const link = target.closest('a[href]');
      if (!(link instanceof HTMLAnchorElement)) return;
      if (link.target === '_blank' || link.hasAttribute('download')) return;

      const href = link.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

      const nextUrl = new URL(link.href, window.location.href);
      if (nextUrl.href === window.location.href) return;

      event.preventDefault();
      event.stopPropagation();
      setPendingNavigationHref(nextUrl.toString());
      setLeaveModalOpen(true);
    };

    document.addEventListener('click', handleDocumentClick, true);

    return () => {
      document.removeEventListener('click', handleDocumentClick, true);
    };
  }, [isDirty]);

  const generalTotal = useMemo(
    () => lots.reduce((sum, lot) => sum + parseNumericValue(lot.tantiemes), 0),
    [lots],
  );

  const totalsByKey = useMemo(
    () => Object.fromEntries(
      keyNames.map((key) => [
        key,
        lots.reduce((sum, lot) => sum + parseNumericValue(lot.keyValues[key]), 0),
      ])
    ) as Record<string, number>,
    [keyNames, lots],
  );

  const configuredLotsCount = useMemo(
    () => lots.filter((lot) => keyNames.some((key) => parseNumericValue(lot.keyValues[key]) > 0)).length,
    [keyNames, lots],
  );

  const lotsWithoutGeneralBase = useMemo(
    () => lots.filter((lot) => parseNumericValue(lot.tantiemes) <= 0),
    [lots],
  );

  const emptyKeyNames = useMemo(
    () => keyNames.filter((key) => (totalsByKey[key] ?? 0) <= 0),
    [keyNames, totalsByKey],
  );

  const visibleValidationIssues = lotsWithoutGeneralBase.length + emptyKeyNames.length;

  const lotTypes = useMemo(
    () => Array.from(new Set(lots.map((lot) => lot.type))).sort((a, b) => a.localeCompare(b, 'fr')),
    [lots],
  );

  const filteredLots = useMemo(() => {
    const query = search.toLowerCase().trim();

    return lots.filter((lot) => {
      const ownerName = getOwnerName(lot.coproprietaire_id, coproMap).toLowerCase();
      const hasSpecialKey = keyNames.some((key) => parseNumericValue(lot.keyValues[key]) > 0);
      const hasGeneralBase = parseNumericValue(lot.tantiemes) > 0;

      const matchesSearch = !query
        || lot.numero.toLowerCase().includes(query)
        || getLotTypeLabel(lot.type).toLowerCase().includes(query)
        || ownerName.includes(query);
      const matchesType = typeFilter === 'all' || lot.type === typeFilter;
      const matchesAssignment = assignmentFilter === 'all'
        || (assignmentFilter === 'configured' && hasSpecialKey)
        || (assignmentFilter === 'unconfigured' && !hasSpecialKey)
        || (assignmentFilter === 'missing-general' && !hasGeneralBase);

      return matchesSearch && matchesType && matchesAssignment;
    });
  }, [assignmentFilter, coproMap, keyNames, lots, search, typeFilter]);

  const handleCoproChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoproForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleLotChange = (lotId: string, field: 'batiment' | 'tantiemes', value: string) => {
    setLots((prev) => prev.map((lot) => (
      lot.id === lotId ? { ...lot, [field]: value } : lot
    )));
    setError('');
    setSuccess('');
  };

  const handleKeyValueChange = (lotId: string, key: string, value: string) => {
    if (!specialChargesEnabled) {
      setError('Activez l’option Charges spéciales pour modifier ces clés de répartition.');
      setSuccess('');
      return;
    }

    setLots((prev) => prev.map((lot) => (
      lot.id === lotId
        ? { ...lot, keyValues: { ...lot.keyValues, [key]: value } }
        : lot
    )));
    setError('');
    setSuccess('');
  };

  const handleAddKey = () => {
    if (!specialChargesEnabled) {
      setError('Activez l’option Charges spéciales pour ajouter une clé de répartition.');
      setActiveSection('repartition');
      return;
    }

    const normalized = normalizeKeyLabel(newKeyName);
    if (!normalized) return;

    if (keyNames.includes(normalized)) {
      setError('Cette clé existe déjà.');
      setActiveSection('repartition');
      return;
    }

    setError('');
    setSuccess('');
    setKeyNames((prev) => [...prev, normalized].sort((a, b) => a.localeCompare(b, 'fr')));
    setLots((prev) => prev.map((lot) => ({
      ...lot,
      keyValues: { ...lot.keyValues, [normalized]: '' },
    })));
    setNewKeyName('');
    setActiveSection('repartition');
  };

  const handleRemoveKey = (keyToRemove: string) => {
    if (!specialChargesEnabled) {
      setError('Activez l’option Charges spéciales pour modifier les clés existantes.');
      setActiveSection('repartition');
      return;
    }

    setKeyNames((prev) => prev.filter((key) => key !== keyToRemove));
    setLots((prev) => prev.map((lot) => {
      const nextValues = { ...lot.keyValues };
      delete nextValues[keyToRemove];
      return { ...lot, keyValues: nextValues };
    }));
    setError('');
    setSuccess('');
  };

  const handleResetChanges = () => {
    const parsed = JSON.parse(savedSnapshot) as {
      coproForm: typeof coproForm;
      keyNames: string[];
      lots: EditableLotRow[];
    };

    setCoproForm(parsed.coproForm);
    setKeyNames(parsed.keyNames);
    setLots(parsed.lots);
    setError('');
    setSuccess('');
    setLeaveModalOpen(false);
    setPendingNavigationHref(null);
  };

  const closeLeaveModal = () => {
    if (saving) return;
    setLeaveModalOpen(false);
    setPendingNavigationHref(null);
  };

  const proceedToPendingNavigation = () => {
    if (!pendingNavigationHref) return;

    const nextUrl = new URL(pendingNavigationHref, window.location.href);
    const isInternal = nextUrl.origin === window.location.origin;

    setLeaveModalOpen(false);
    setPendingNavigationHref(null);

    if (isInternal) {
      router.push(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
      return;
    }

    window.location.assign(nextUrl.toString());
  };

  const handleSave = async (navigateAfterSave = false) => {
    setSaving(true);
    setError('');
    setSuccess('');

    const payloadLots = lots.map((lot) => {
      const tantiemes = parseNumericValue(lot.tantiemes);
      const batiment = normalizeKeyLabel(lot.batiment) || null;
      const tantiemesGroupes = Object.fromEntries(
        keyNames
          .map((key) => {
            const rawValue = (lot.keyValues[key] ?? '').trim();
            const amount = parseNumericValue(rawValue);
            if (!rawValue || !Number.isFinite(amount) || amount <= 0) return null;
            return [key, amount] as const;
          })
          .filter(Boolean) as Array<readonly [string, number]>
      );

      return {
        id: lot.id,
        numero: lot.numero,
        type: lot.type,
        tantiemes,
        batiment,
        groupesRepartition: Object.keys(tantiemesGroupes),
        tantiemesGroupes,
      };
    });

    const invalidLot = payloadLots.find((lot) => !lot.numero.trim());
    if (invalidLot) {
      setError('Chaque lot doit avoir un numéro ou un nom.');
      setSaving(false);
      return;
    }

    const result = await saveCoproprieteSettings({
      coproprieteId: copropriete.id,
      nom: coproForm.nom,
      adresse: coproForm.adresse,
      code_postal: coproForm.code_postal,
      ville: coproForm.ville,
      lots: payloadLots,
    });

    if (result?.error) {
      setError(result.error);
      setSaving(false);
      return;
    }

    setSavedSnapshot(currentSnapshot);
    setSuccess('Paramétrage enregistré. Les AG, appels de fonds et régularisations utiliseront ces clés.');
    setSaving(false);

    if (navigateAfterSave) {
      proceedToPendingNavigation();
      return;
    }

    router.refresh();
  };

  return (
    <div className="space-y-5">
      <div
        className="sticky z-30 space-y-3"
        style={{ top: 'calc(var(--dashboard-header-height, 0px) + 0.75rem)' }}
      >
        <Card className="border-blue-100 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className={cn(
                'rounded-xl p-2.5',
                isDirty ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700',
              )}>
                {isDirty ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {isDirty ? 'Modifications non enregistrées' : 'Aucun changement en attente'}
                </p>
                <p className="text-xs text-gray-600">
                  {isDirty
                    ? 'Vos ajustements ne seront utilisés dans les AG et appels de fonds qu’après enregistrement.'
                    : `${visibleValidationIssues} point${visibleValidationIssues > 1 ? 's' : ''} à vérifier dans la configuration actuelle.`}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setActiveSection('repartition')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    activeSection === 'repartition' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Répartition des charges
                </button>
                <button
                  type="button"
                  onClick={() => setActiveSection('copro')}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                    activeSection === 'copro' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900',
                  )}
                >
                  Fiche copropriété
                </button>
              </div>

              <Button
                type="button"
                onClick={() => {
                  void handleSave();
                }}
                loading={saving}
                variant={isDirty ? 'primary' : 'secondary'}
              >
                <Save size={14} /> {isDirty ? 'Enregistrer les modifications' : 'Enregistrer le paramétrage'}
              </Button>
            </div>
          </div>
        </Card>

        {isDirty && (
          <div className="fixed inset-x-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-40 md:inset-x-auto md:right-6 md:bottom-6 md:w-[min(430px,calc(100vw-3rem))]">
            <Card className="border-amber-200 bg-amber-50/95 shadow-2xl backdrop-blur supports-[backdrop-filter]:bg-amber-50/90">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-semibold text-amber-900">Enregistrez avant de quitter cette page</p>
                  <p className="text-xs text-amber-800 mt-1">
                    Vos dernières modifications seront perdues si vous changez d’écran sans enregistrer.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <Button type="button" variant="secondary" onClick={handleResetChanges}>
                    Annuler mes modifications
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      void handleSave();
                    }}
                    loading={saving}
                  >
                    <Save size={14} /> Enregistrer maintenant
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          {success}
        </div>
      )}

      <Modal isOpen={leaveModalOpen} onClose={closeLeaveModal} title="Modifications non enregistrées" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-700">
            Vous avez des modifications non enregistrées. Enregistrez-les maintenant ou quittez la page en les abandonnant.
          </p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" onClick={closeLeaveModal}>
              Rester sur la page
            </Button>
            <Button type="button" variant="secondary" onClick={proceedToPendingNavigation}>
              Quitter sans enregistrer
            </Button>
            <Button
              type="button"
              onClick={() => {
                void handleSave(true);
              }}
              loading={saving}
            >
              <Save size={14} /> Enregistrer et quitter
            </Button>
          </div>
        </div>
      </Modal>

      {activeSection === 'repartition' ? (
        <Card className="border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5">
              <Settings2 size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">Répartition des charges</h3>
              <p className="mt-1 text-sm text-gray-600">
                Indiquez seulement les bases utiles : les tantièmes généraux pour tous les lots, puis les clés spéciales pour les seuls lots concernés.
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
              Base générale · {formatBase(generalTotal)}
            </span>
            <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              Lots avec clé spéciale · {configuredLotsCount}/{lots.length}
            </span>
            {visibleValidationIssues > 0 && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                {visibleValidationIssues} point{visibleValidationIssues > 1 ? 's' : ''} à vérifier
              </span>
            )}
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            <div className="flex items-start gap-2">
              <Info size={16} className="mt-0.5 shrink-0 text-slate-500" />
              <p>
                Laissez une cellule vide si le lot n’est pas concerné par la clé. Exemple : une clé <em>Ascenseur</em> ne s’applique qu’aux lots desservis.
              </p>
            </div>
          </div>

          {visibleValidationIssues > 0 && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              <div className="space-y-1">
                {lotsWithoutGeneralBase.length > 0 && (
                  <p>• {lotsWithoutGeneralBase.length} lot{lotsWithoutGeneralBase.length > 1 ? 's' : ''} sans tantièmes généraux.</p>
                )}
                {emptyKeyNames.length > 0 && (
                  <p>• {emptyKeyNames.length} clé{emptyKeyNames.length > 1 ? 's' : ''} sans base affectée : {emptyKeyNames.join(', ')}.</p>
                )}
              </div>
            </div>
          )}

          <div className="mt-4 max-w-2xl">
            <label htmlFor="new-special-key" className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Ajouter une clé spéciale
              </span>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  id="new-special-key"
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Ex. Ascenseur, Eau chaude, Parking"
                  disabled={!specialChargesEnabled}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                />
                <Button type="button" variant="secondary" onClick={handleAddKey} className="shrink-0 whitespace-nowrap" disabled={!specialChargesEnabled}>
                  <Plus size={14} /> Ajouter la clé
                </Button>
              </div>
            </label>
            <p className="mt-1.5 text-xs text-gray-500">
              Saisissez librement une clé utile à votre copropriété. Exemples courants : ascenseur, chauffage, parking, bâtiment A.
            </p>
          </div>

          {keyNames.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Clés créées</span>
              {keyNames.map((key) => (
                <span key={key} className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  <span>{key} · base {formatBase(totalsByKey[key] ?? 0)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveKey(key)}
                    disabled={!specialChargesEnabled}
                    className="rounded p-0.5 text-blue-500 hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                    title={`Retirer la clé ${key}`}
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {lots.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
              Ajoutez d&apos;abord vos lots depuis la vue d&apos;ensemble de la copropriété, puis revenez ici pour définir les bases de répartition.
            </div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.5fr_0.8fr_0.9fr]">
                <Input
                  label="Recherche"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher un lot, un copropriétaire ou un type"
                />

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Type de lot</span>
                  <div className="relative">
                    <Filter size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      aria-label="Filtrer par type"
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                    >
                      <option value="all">Tous les types</option>
                      {lotTypes.map((type) => (
                        <option key={type} value={type}>{getLotTypeLabel(type)}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">Statut</span>
                  <select
                    aria-label="Filtrer par statut"
                    value={assignmentFilter}
                    onChange={(e) => setAssignmentFilter(e.target.value as 'all' | 'configured' | 'unconfigured' | 'missing-general')}
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                  >
                    <option value="all">Tous les lots</option>
                    <option value="configured">Avec clé spéciale</option>
                    <option value="unconfigured">Sans clé spéciale</option>
                    <option value="missing-general">Sans base générale</option>
                  </select>
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{filteredLots.length} lot{filteredLots.length > 1 ? 's' : ''} affiché{filteredLots.length > 1 ? 's' : ''}</span>
                {(search || typeFilter !== 'all' || assignmentFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearch('');
                      setTypeFilter('all');
                      setAssignmentFilter('all');
                    }}
                    className="text-blue-600 hover:underline"
                  >
                    Réinitialiser les filtres
                  </button>
                )}
              </div>

              {keyNames.length === 0 ? (
                <div className="mt-4 space-y-3">
                  {filteredLots.map((lot) => {
                    const ownerName = getOwnerName(lot.coproprietaire_id, coproMap);

                    return (
                      <div
                        key={lot.id}
                        className="rounded-xl border border-gray-200 bg-white px-3 py-3 shadow-sm"
                      >
                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-6">
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900">{lot.numero}</p>
                            <p className="text-xs text-gray-500">{getLotTypeLabel(lot.type)}</p>
                            {ownerName && <p className="mt-1 text-xs text-gray-500">{ownerName}</p>}
                          </div>

                          <label className="block w-full md:w-[220px] md:shrink-0">
                            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Charges générales</span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={lot.tantiemes}
                              onChange={(e) => handleLotChange(lot.id, 'tantiemes', e.target.value)}
                              className={cn(
                                'w-full rounded-lg border px-2.5 py-2 text-right text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none',
                                parseNumericValue(lot.tantiemes) <= 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50',
                              )}
                            />
                          </label>
                        </div>
                      </div>
                    );
                  })}

                  <div className="flex justify-stretch md:justify-end">
                    <div className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700 md:w-[220px] md:shrink-0">
                      <span>Base totale</span>
                      <span>{formatBase(generalTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
                  <table className={cn('w-full text-sm', keyNames.length > 2 ? 'min-w-[920px]' : 'min-w-[760px]')}>
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                      <tr>
                        <th className="sticky left-0 z-10 bg-slate-50 px-3 py-3 text-left font-semibold">Lot</th>
                        <th className="px-3 py-3 text-right font-semibold">Charges générales</th>
                        {keyNames.map((key) => (
                          <th key={key} className="px-3 py-3 text-right font-semibold min-w-[140px]">{key}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredLots.map((lot) => {
                        const ownerName = getOwnerName(lot.coproprietaire_id, coproMap);

                        return (
                          <tr key={lot.id} className="align-top">
                            <td className="sticky left-0 bg-white px-3 py-3">
                              <div className="min-w-[200px]">
                                <p className="font-semibold text-gray-900">{lot.numero}</p>
                                <p className="text-xs text-gray-500">{getLotTypeLabel(lot.type)}</p>
                                {ownerName && <p className="mt-1 text-xs text-gray-500">{ownerName}</p>}
                              </div>
                            </td>
                            <td className="px-3 py-3 min-w-[130px]">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={lot.tantiemes}
                                onChange={(e) => handleLotChange(lot.id, 'tantiemes', e.target.value)}
                                className={cn(
                                  'w-full rounded-lg border px-2.5 py-2 text-right text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none',
                                  parseNumericValue(lot.tantiemes) <= 0 ? 'border-amber-300 bg-amber-50' : 'border-gray-200 bg-gray-50',
                                )}
                              />
                            </td>
                            {keyNames.map((key) => (
                              <td key={`${lot.id}-${key}`} className="px-3 py-3 min-w-[130px]">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={lot.keyValues[key] ?? ''}
                                  onChange={(e) => handleKeyValueChange(lot.id, key, e.target.value)}
                                  placeholder="0"
                                  disabled={!specialChargesEnabled}
                                  className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-right text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </td>
                            ))}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot className="bg-slate-50 text-sm font-semibold text-slate-700">
                      <tr>
                        <td className="sticky left-0 bg-slate-50 px-3 py-3">Base totale</td>
                        <td className="px-3 py-3 text-right">{formatBase(generalTotal)}</td>
                        {keyNames.map((key) => (
                          <td key={`total-${key}`} className="px-3 py-3 text-right">{formatBase(totalsByKey[key] ?? 0)}</td>
                        ))}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </>
          )}
        </Card>
      ) : (
        <Card className="border-blue-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-slate-100 p-2.5">
              <Settings2 size={18} className="text-slate-700" />
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900">Fiche copropriété</h3>
              <p className="mt-1 text-sm text-gray-600">
                Modifiez ici uniquement les informations d’identité de la copropriété qui seront reprises dans les documents générés.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700">
            Gardez une adresse et un nom à jour : ces informations sont utilisées dans les appels de fonds, convocations et autres documents officiels.
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input label="Nom de la copropriété" name="nom" value={coproForm.nom} onChange={handleCoproChange} required />
            <Input label="Adresse" name="adresse" value={coproForm.adresse} onChange={handleCoproChange} required />
            <Input label="Code postal" name="code_postal" value={coproForm.code_postal} onChange={handleCoproChange} required />
            <Input label="Ville" name="ville" value={coproForm.ville} onChange={handleCoproChange} required />
          </div>
        </Card>
      )}
    </div>
  );
}
