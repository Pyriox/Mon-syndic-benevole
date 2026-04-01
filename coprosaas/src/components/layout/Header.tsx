// ============================================================
// Header du dashboard - Bandeau supérieur de la page
// ============================================================
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Bell, User, AlertTriangle, AlertCircle, CalendarDays, Wallet, Menu, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';
import type { AppNotification } from '@/types';

interface HeaderProps {
  title: string;
  userName?: string;
  notifications?: AppNotification[];
  onMenuOpen?: () => void;
}

const iconByType = {
  impaye: AlertCircle,
  incident: AlertTriangle,
  ag: CalendarDays,
  appel_fonds: Wallet,
  support: MessageSquare,
};

const colorBySeverity = {
  danger: 'text-red-500 bg-red-50',
  warning: 'text-amber-700 bg-amber-50',
  info: 'text-blue-500 bg-blue-50',
};

export default function Header({ title, userName, notifications = [], onMenuOpen }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  // Ferme le panel si clic en dehors ou touche Escape
  useEffect(() => {
    const clickHandler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', clickHandler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', clickHandler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, []);

  const nbNotifs = items.length;
  const unreadItems = items.filter((n) => n.isRead !== true);
  const nbUnread = unreadItems.length;
  const nbDanger = unreadItems.filter((n) => n.severity === 'danger').length;

  const keepOnlyLastThreeRead = (list: AppNotification[]) => {
    const unread = list.filter((n) => n.isRead !== true);
    const read = list.filter((n) => n.isRead === true).slice(0, 3);
    return [...unread, ...read];
  };

  const markAllRead = async () => {
    setItems((prev) => keepOnlyLastThreeRead(prev.map((n) => ({ ...n, isRead: true }))));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {
      // Non bloquant: l'utilisateur garde l'etat local courant.
    });
  };

  const markOneRead = async (id: string) => {
    setItems((prev) => keepOnlyLastThreeRead(prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [id] }),
    }).catch(() => {
      // Non bloquant.
    });
  };

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-center justify-between gap-2">
        {/* Titre : taille réduite sur mobile pour laisser de la place */}
        <h1 className="text-sm md:text-xl font-semibold text-gray-900 truncate flex-1 leading-tight">{title}</h1>

        {/* Zone droite */}
        <div className="flex items-center gap-2 md:gap-3">
          <CookiePreferencesButton
            className="hidden md:inline-flex text-xs font-medium text-gray-500 hover:text-gray-800 transition-colors"
            label="Cookies"
          />

          {/* Cloche notifications */}
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={nbUnread > 0 ? `Notifications : ${nbUnread} non lue${nbUnread > 1 ? 's' : ''}` : 'Notifications'}
              aria-expanded={open}
              aria-haspopup="true"
              className={cn(
                'relative p-2.5 rounded-lg transition-colors',
                open ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              )}
            >
              <Bell size={20} />
              {nbUnread > 0 && (
                <span className={cn(
                  'absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center leading-none',
                  nbDanger > 0 ? 'bg-red-500' : 'bg-amber-500'
                )}>
                  {nbUnread > 9 ? '9+' : nbUnread}
                </span>
              )}
            </button>

            {/* Panel dropdown — plein écran sur mobile */}
            {open && (
              <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-50 w-[min(340px,calc(100vw-2rem))]">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">Notifications</p>
                  <div className="flex items-center gap-3">
                    {nbUnread > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>
                </div>

                {nbNotifs === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell size={28} className="mx-auto text-gray-500 mb-2" />
                    <p className="text-sm text-gray-500">Aucune alerte en cours</p>
                  </div>
                ) : (
                  <ul className="max-h-[60vh] md:max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {items.map((notif) => {
                      const Icon = iconByType[notif.type as keyof typeof iconByType] ?? Bell;
                      const titleText = notif.title ?? notif.label ?? 'Notification';
                      const subtitleText = notif.body ?? notif.sublabel;
                      const unread = notif.isRead !== true;
                      return (
                        <li key={notif.id}>
                          <Link
                            href={notif.href}
                            onClick={() => {
                              setOpen(false);
                              void markOneRead(notif.id);
                            }}
                            className={cn(
                              'flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors',
                              unread ? 'bg-blue-50/50' : ''
                            )}
                          >
                            <div className={cn('mt-0.5 p-1.5 rounded-lg shrink-0', colorBySeverity[notif.severity])}>
                              <Icon size={13} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-800 truncate">{titleText}</p>
                              {subtitleText && (
                                <p className="text-xs text-gray-600 mt-0.5">{subtitleText}</p>
                              )}
                              {notif.createdAt && (
                                <p className="text-[11px] text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                              )}
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* Avatar utilisateur */}
          <div className="flex items-center gap-2 pl-2 md:pl-3 border-l border-gray-200">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
              <User size={16} className="text-blue-600" />
            </div>
            {userName && (
              <span className="text-sm font-medium text-gray-700 hidden lg:block">
                {userName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
