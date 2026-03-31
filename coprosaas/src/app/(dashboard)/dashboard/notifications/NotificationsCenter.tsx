'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, AlertTriangle, AlertCircle, CalendarDays, Wallet, MessageSquare } from 'lucide-react';

type Notif = {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'danger';
  title: string;
  body: string | null;
  href: string;
  action_label: string | null;
  is_read: boolean;
  created_at: string;
};

const iconByType: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  impaye: AlertCircle,
  incident: AlertTriangle,
  ag: CalendarDays,
  appel_fonds: Wallet,
  support: MessageSquare,
  preuve_email: Bell,
  admin_alert: AlertTriangle,
};

export default function NotificationsCenter({ initialItems }: { initialItems: Notif[] }) {
  const [items, setItems] = useState(initialItems);

  const unreadCount = useMemo(() => items.filter((n) => !n.is_read).length, [items]);

  const markAllRead = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true })));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    });
  };

  const markOneRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Centre de notifications</h2>
          <p className="text-sm text-gray-500 mt-1">Historique persistant, suivi lu/non lu et actions rapides.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={markAllRead}
            disabled={unreadCount === 0}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <CheckCheck size={15} /> Tout marquer lu
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-10 text-center text-gray-500">
          <Bell size={24} className="mx-auto mb-2" />
          Aucune notification pour le moment.
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
          {items.map((item) => {
            const Icon = iconByType[item.type] ?? Bell;
            return (
              <li key={item.id} className={item.is_read ? '' : 'bg-blue-50/50'}>
                <div className="px-4 py-3 flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-gray-100 text-gray-700 shrink-0">
                    <Icon size={14} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                    {item.body && <p className="text-sm text-gray-600 mt-0.5">{item.body}</p>}
                    <p className="text-xs text-gray-500 mt-1">{new Date(item.created_at).toLocaleString('fr-FR')}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={item.href}
                      onClick={() => void markOneRead(item.id)}
                      className="text-xs font-medium text-blue-600 hover:text-blue-800"
                    >
                      {item.action_label ?? 'Ouvrir'}
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
