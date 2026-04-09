'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import LotActions, { LotDelete } from './LotActions';
import { saveCoproprieteSettings } from './actions';
import { collectAvailableRepartitionGroups, sanitizeTantiemesGroupesMap } from '@/lib/utils';
import { Info, Plus, Save, Settings2, X } from 'lucide-react';

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

function deriveKeyNames(lots: LotSettingRow[]): string[] {
  const keys = new Set<string>(collectAvailableRepartitionGroups(lots));

  for (const lot of lots) {
    const batiment = normalizeKeyLabel(lot.batiment);
    if (batiment) keys.add(batiment);

    for (const [key, amount] of Object.entries(sanitizeTantiemesGroupesMap(lot.tantiemes_groupes))) {
      if (amount > 0) keys.add(key);
    }
  }

  return Array.from(keys).sort((a, b) => a.localeCompare(b, 'fr'));
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

export default function CoproSettingsPanel({
  copropriete,
  initialLots,
  coproMap,
}: {
  copropriete: CoproprieteSettings;
  initialLots: LotSettingRow[];
  coproMap: Record<string, CoproprietaireSummary>;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newKeyName, setNewKeyName] = useState('');

  const [coproForm, setCoproForm] = useState({
    nom: copropriete.nom,
    adresse: copropriete.adresse,
    code_postal: copropriete.code_postal,
    ville: copropriete.ville,
  });

  const [keyNames, setKeyNames] = useState<string[]>(() => deriveKeyNames(initialLots));
  const [lots, setLots] = useState<EditableLotRow[]>(() => buildEditableLots(initialLots, deriveKeyNames(initialLots)));

  const generalTotal = useMemo(
    () => lots.reduce((sum, lot) => sum + (Number.parseFloat(lot.tantiemes.replace(',', '.')) || 0), 0),
    [lots],
  );

  const totalsByKey = useMemo(
    () => Object.fromEntries(
      keyNames.map((key) => [
        key,
        lots.reduce((sum, lot) => sum + (Number.parseFloat((lot.keyValues[key] ?? '').replace(',', '.')) || 0), 0),
      ])
    ) as Record<string, number>,
    [keyNames, lots],
  );

  const handleCoproChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCoproForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleLotChange = (lotId: string, field: 'batiment' | 'tantiemes', value: string) => {
    setLots((prev) => prev.map((lot) => (
      lot.id === lotId ? { ...lot, [field]: value } : lot
    )));
  };

  const handleKeyValueChange = (lotId: string, key: string, value: string) => {
    setLots((prev) => prev.map((lot) => (
      lot.id === lotId
        ? { ...lot, keyValues: { ...lot.keyValues, [key]: value } }
        : lot
    )));
  };

  const handleAddKey = () => {
    const normalized = normalizeKeyLabel(newKeyName);
    if (!normalized) return;

    if (keyNames.includes(normalized)) {
      setError('Cette clé existe déjà.');
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
  };

  const handleRemoveKey = (keyToRemove: string) => {
    setKeyNames((prev) => prev.filter((key) => key !== keyToRemove));
    setLots((prev) => prev.map((lot) => {
      const nextValues = { ...lot.keyValues };
      delete nextValues[keyToRemove];
      return { ...lot, keyValues: nextValues };
    }));
    setError('');
    setSuccess('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    const payloadLots = lots.map((lot) => {
      const tantiemes = Number.parseFloat(lot.tantiemes.replace(',', '.')) || 0;
      const batiment = normalizeKeyLabel(lot.batiment) || null;
      const tantiemesGroupes = Object.fromEntries(
        keyNames
          .map((key) => {
            const rawValue = (lot.keyValues[key] ?? '').trim();
            const amount = Number.parseFloat(rawValue.replace(',', '.'));
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

    setSuccess('Paramétrage enregistré. Les AG, appels de fonds et régularisations utiliseront ces clés.');
    setSaving(false);
    router.refresh();
  };

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-blue-50 p-2.5">
            <Settings2 size={18} className="text-blue-600" />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900">Paramétrage de la copropriété</h3>
            <p className="mt-1 text-sm text-gray-600">
              Créez ici vos clés de répartition spéciales puis attribuez-les aux lots concernés en renseignant leur base.
              Ce paramétrage est ensuite repris automatiquement dans l&apos;AG, les appels de fonds,
              les dépenses et la régularisation.
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input label="Nom de la copropriété" name="nom" value={coproForm.nom} onChange={handleCoproChange} required />
          <Input label="Adresse" name="adresse" value={coproForm.adresse} onChange={handleCoproChange} required />
          <Input label="Code postal" name="code_postal" value={coproForm.code_postal} onChange={handleCoproChange} required />
          <Input label="Ville" name="ville" value={coproForm.ville} onChange={handleCoproChange} required />
        </div>
      </Card>

      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Clés de répartition et affectation des lots</h3>
            <p className="mt-1 text-sm text-gray-600">
              Créez vos clés spéciales puis renseignez une valeur uniquement pour les lots concernés. Si la case est vide, le lot n&apos;est pas affecté à cette clé.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" onClick={handleSave} loading={saving}>
              <Save size={14} /> Enregistrer le paramétrage
            </Button>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <div className="flex items-start gap-2">
            <Info size={14} className="mt-0.5 shrink-0" />
            <p>
              Les colonnes ci-dessous correspondent aux <strong>clés de répartition déjà créées</strong>. Saisir une base dans une cellule affecte automatiquement le lot à cette clé ; laisser vide signifie qu&apos;il n&apos;est pas concerné (ex. <em>Bâtiment B</em>, <em>Ascenseur C</em>, <em>Eau chaude</em>).
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 md:flex-row md:items-end">
          <div className="flex-1">
            <Input
              label="Ajouter une clé spéciale"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Ex. Ascenseur C, Eau chaude, Bâtiment B"
            />
          </div>
          <Button type="button" variant="secondary" onClick={handleAddKey} className="md:mb-[1px]">
            <Plus size={14} /> Ajouter la clé
          </Button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
            Charges générales · base {formatBase(generalTotal)}
          </span>
          {keyNames.map((key) => (
            <span key={key} className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
              {key} · base {formatBase(totalsByKey[key] ?? 0)}
            </span>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </div>
        )}

        {lots.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
            Ajoutez d&apos;abord vos lots depuis la vue d&apos;ensemble de la copropriété, puis revenez ici pour définir les clés de répartition.
          </div>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-[920px] w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600">
                <tr>
                  <th className="px-3 py-3 text-left font-semibold">Lot</th>
                  <th className="px-3 py-3 text-right font-semibold">Charges générales</th>
                  {keyNames.map((key) => (
                    <th key={key} className="px-3 py-3 text-right font-semibold min-w-[140px]">
                      <div className="flex items-center justify-end gap-1">
                        <span>{key}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKey(key)}
                          className="rounded p-0.5 text-gray-400 hover:bg-white hover:text-red-600"
                          title={`Retirer la clé ${key}`}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {lots.map((lot) => {
                  const owner = lot.coproprietaire_id ? coproMap[lot.coproprietaire_id] : null;
                  const ownerName = owner?.raison_sociale ?? [owner?.prenom, owner?.nom].filter(Boolean).join(' ');

                  return (
                    <tr key={lot.id} className="align-top">
                      <td className="px-3 py-3">
                        <div className="min-w-[180px]">
                          <p className="font-semibold text-gray-900">{lot.numero}</p>
                          <p className="text-xs text-gray-500">{lot.type}</p>
                          {ownerName && (
                            <p className="mt-1 text-xs text-gray-500">{ownerName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3 min-w-[130px]">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={lot.tantiemes}
                          onChange={(e) => handleLotChange(lot.id, 'tantiemes', e.target.value)}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-right text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
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
                            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-2 text-right text-sm text-gray-900 focus:border-blue-500 focus:bg-white focus:outline-none"
                          />
                        </td>
                      ))}
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <LotActions
                            coproprieteId={copropriete.id}
                            lot={{
                              id: lot.id,
                              numero: lot.numero,
                              type: lot.type,
                              tantiemes: Number.parseFloat(lot.tantiemes.replace(',', '.')) || 0,
                              batiment: lot.batiment,
                              groupes_repartition: keyNames.filter((key) => Number.parseFloat((lot.keyValues[key] ?? '').replace(',', '.')) > 0),
                              tantiemes_groupes: Object.fromEntries(
                                keyNames
                                  .map((key) => {
                                    const amount = Number.parseFloat((lot.keyValues[key] ?? '').replace(',', '.'));
                                    if (!Number.isFinite(amount) || amount <= 0) return null;
                                    return [key, amount] as const;
                                  })
                                  .filter(Boolean) as Array<readonly [string, number]>
                              ),
                            }}
                          />
                          <LotDelete lotId={lot.id} lotNumero={lot.numero} coproprieteId={copropriete.id} />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 text-sm font-semibold text-slate-700">
                <tr>
                  <td className="px-3 py-3">Base totale</td>
                  <td className="px-3 py-3 text-right">{formatBase(generalTotal)}</td>
                  {keyNames.map((key) => (
                    <td key={`total-${key}`} className="px-3 py-3 text-right">{formatBase(totalsByKey[key] ?? 0)}</td>
                  ))}
                  <td className="px-3 py-3 text-right text-gray-500">—</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
