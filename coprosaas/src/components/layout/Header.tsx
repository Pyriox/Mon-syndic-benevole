// ============================================================
// Header du dashboard - Bandeau supérieur de la page
// ============================================================
'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, User, AlertTriangle, AlertCircle, CalendarDays, Wallet, Menu, MessageSquare, Crown } from 'lucide-react';
import { setDashboardViewMode } from '@/lib/actions/set-dashboard-view-mode';
import { cn } from '@/lib/utils';
import { hasDualDashboardView, toDashboardViewMode } from '@/lib/dashboard-view-mode';
import type { AppNotification, Role } from '@/types';

interface HeaderProps {
  title: string;
  userRole: Role;
  availableViewRoles: Role[];
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

export default function Header({ title, userRole, availableViewRoles, userName, notifications = [], onMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchPending, startSwitchTransition] = useTransition();
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const canSwitchView = hasDualDashboardView(availableViewRoles);

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    const headerEl = headerRef.current;
    if (!headerEl) return undefined;

    const updateHeaderHeight = () => {
      document.documentElement.style.setProperty('--dashboard-header-height', `${headerEl.offsetHeight}px`);
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => updateHeaderHeight());
      resizeObserver.observe(headerEl);
    }

    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      resizeObserver?.disconnect();
    };
  }, [canSwitchView, title, userRole]);

  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

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

  const handleViewSwitch = (nextRole: Role) => {
    if (nextRole === userRole) return;

    startSwitchTransition(() => {
      void setDashboardViewMode(toDashboardViewMode(nextRole)).then(() => {
        router.refresh();
      });
    });
  };

  return (
    <header ref={headerRef} className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 md:px-6 md:py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          {onMenuOpen && (
            <button
              type="button"
              onClick={onMenuOpen}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Ouvrir le menu"
            >
              <Menu size={18} />
            </button>
          )}

          <div className="min-w-0 flex-1">
            <h1 className="text-sm md:text-xl font-semibold text-gray-900 truncate leading-tight">{title}</h1>
            {canSwitchView && (
              <div className="mt-2 flex items-center justify-start">
                <div className="inline-flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1">
                  <button
                    type="button"
                    onClick={() => handleViewSwitch('syndic')}
                    disabled={switchPending}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      userRole === 'syndic' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <Crown size={13} />
                    Syndic
                  </button>
                  <button
                    type="button"
                    onClick={() => handleViewSwitch('copropriétaire')}
                    disabled={switchPending}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors',
                      userRole === 'copropriétaire' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    )}
                  >
                    <User size={13} />
                    Copropriétaire
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Zone droite */}
        <div className="flex items-center gap-2 md:gap-3">
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

            {/* Panel notifications — feuille mobile, dropdown desktop */}
            {open && (
              <>
                <button
                  type="button"
                  aria-label="Fermer les notifications"
                  onClick={() => setOpen(false)}
                  className="fixed inset-0 z-40 bg-slate-950/20 md:hidden"
                />

                <div className="fixed inset-x-2 top-16 bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-50 flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl md:absolute md:inset-auto md:right-0 md:top-full md:mt-2 md:w-[min(340px,calc(100vw-2rem))] md:max-h-none md:rounded-xl">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between shrink-0">
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
                    <ul className="flex-1 overflow-y-auto divide-y divide-gray-50 md:max-h-80">
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
              </>
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
