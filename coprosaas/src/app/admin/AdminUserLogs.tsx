'use client';

import { useState } from 'react';
import { ClipboardList, X, Loader2 } from 'lucide-react';
import { getUserLogs, type UserEvent } from '@/lib/actions/admin-user-logs';

const EVENT_LABELS: Record<string, { icon: string; label: string; color: string }> = {
  account_confirmed:      { icon: '✓', label: 'Compte vérifié',       color: 'text-green-600 bg-green-50 border-green-200' },
  trial_started:          { icon: '↗', label: 'Essai démarré',         color: 'text-amber-600 bg-amber-50 border-amber-200' },
  subscription_created:   { icon: '↑', label: 'Abonnement activé',     color: 'text-blue-600 bg-blue-50 border-blue-200' },
  subscription_cancelled: { icon: '↓', label: 'Résiliation',           color: 'text-orange-600 bg-orange-50 border-orange-200' },
  payment_failed:         { icon: '✗', label: 'Paiement échoué',       color: 'text-red-600 bg-red-50 border-red-200' },
  ticket_created:         { icon: '✉', label: 'Ticket ouvert',         color: 'text-purple-600 bg-purple-50 border-purple-200' },
};

function fmtDatetime(s: string) {
  return new Date(s).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminUserLogs({ email }: { email: string }) {
  const [open, setOpen]     = useState(false);
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<UserEvent[] | null>(null);
  const [error, setError]   = useState('');

  const handleOpen = async () => {
    setOpen(true);
    if (events !== null) return; // already loaded
    setLoading(true);
    const res = await getUserLogs(email);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    setEvents(res.events ?? []);
  };

  return (
    <>
      <button
        onClick={handleOpen}
        title="Voir l'activité de cet utilisateur"
        className="inline-flex items-center justify-center text-gray-400 hover:text-indigo-600 transition-colors"
      >
        <ClipboardList size={13} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
              <div>
                <p className="text-sm font-semibold text-gray-900">Journal d'activité</p>
                <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{email}</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 px-5 py-4">
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 size={20} className="animate-spin text-indigo-500" />
                </div>
              )}
              {error && (
                <p className="text-sm text-red-500 text-center py-8">{error}</p>
              )}
              {!loading && !error && events?.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-8">Aucun événement enregistré</p>
              )}
              {!loading && !error && events && events.length > 0 && (
                <ol className="relative border-l border-gray-200 ml-2 space-y-4">
                  {events.map((ev) => {
                    const cfg = EVENT_LABELS[ev.event_type];
                    return (
                      <li key={ev.id} className="ml-4">
                        <div className="absolute -left-1.5 w-3 h-3 rounded-full border-2 border-white bg-gray-300" />
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className={`inline-flex items-center gap-1 text-xs font-medium border rounded px-1.5 py-0.5 ${cfg?.color ?? 'text-gray-600 bg-gray-50 border-gray-200'}`}>
                              {cfg?.icon ?? '·'} {cfg?.label ?? ev.event_type}
                            </span>
                            {ev.label && (
                              <p className="text-xs text-gray-500 mt-0.5 ml-0.5">{ev.label}</p>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-400 shrink-0 mt-0.5">{fmtDatetime(ev.created_at)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </div>

            {!loading && events && events.length > 0 && (
              <div className="px-5 py-3 border-t border-gray-100 shrink-0">
                <p className="text-[11px] text-gray-400">{events.length} événement{events.length > 1 ? 's' : ''} · 100 derniers max</p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
