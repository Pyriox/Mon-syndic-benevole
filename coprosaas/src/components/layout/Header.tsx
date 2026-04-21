// ============================================================
// Header du dashboard - Bandeau supérieur de la page
// ============================================================
'use client';

import { useState, useRef, useEffect, useTransition, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell, User, AlertTriangle, AlertCircle, CalendarDays, Wallet, Menu, MessageSquare, Crown, LoaderCircle } from 'lucide-react';
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

type NotificationCategory = 'urgent' | 'action' | 'info';

const categoryMeta: Record<NotificationCategory, {
  title: string;
  description: string;
  headerClassName: string;
  titleClassName: string;
  descriptionClassName: string;
}> = {
  urgent: {
    title: 'Urgent',
    description: 'Actions prioritaires a traiter sans attendre.',
    headerClassName: 'bg-red-50/70 border-b border-red-100',
    titleClassName: 'text-red-800',
    descriptionClassName: 'text-red-700',
  },
  action: {
    title: 'A traiter',
    description: "Actions a suivre ou verifications en attente.",
    headerClassName: 'bg-amber-50/60 border-b border-amber-100',
    titleClassName: 'text-amber-800',
    descriptionClassName: 'text-amber-700',
  },
  info: {
    title: 'Info',
    description: 'Historique recent et confirmations de la plateforme.',
    headerClassName: 'bg-slate-50 border-b border-gray-100',
    titleClassName: 'text-slate-700',
    descriptionClassName: 'text-gray-500',
  },
};

export default function Header({ title, userRole, availableViewRoles, userName, notifications = [], onMenuOpen }: HeaderProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [switchPending, startSwitchTransition] = useTransition();
  const [switchTargetRole, setSwitchTargetRole] = useState<Role | null>(null);
  const [items, setItems] = useState<AppNotification[]>(notifications);
  const ref = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement | null>(null);
  const pendingReadIdsRef = useRef<Set<string>>(new Set());
  const flushTimerRef = useRef<number | null>(null);
  const canSwitchView = hasDualDashboardView(availableViewRoles);

  const isMarkReadEnabled = (notification: AppNotification) => notification.canMarkRead !== false && notification.source !== 'dynamic' && notification.source !== 'support';
  const bySeverity = (severity: AppNotification['severity']) => {
    if (severity === 'danger') return 0;
    if (severity === 'warning') return 1;
    return 2;
  };
  const sortByPriority = (a: AppNotification, b: AppNotification) => {
    const severityDelta = bySeverity(a.severity) - bySeverity(b.severity);
    if (severityDelta !== 0) return severityDelta;
    if (a.createdAt && b.createdAt) return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (a.createdAt) return -1;
    if (b.createdAt) return 1;
    return 0;
  };
  const getCategory = (notification: AppNotification): NotificationCategory => {
    if (notification.severity === 'danger') return 'urgent';
    if (!isMarkReadEnabled(notification) || notification.severity === 'warning') return 'action';
    return 'info';
  };

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  useEffect(() => {
    if (switchTargetRole === userRole) {
      setSwitchTargetRole(null);
    }
  }, [switchTargetRole, userRole]);

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
    if (!open) return undefined;

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
  }, [open]);

  const nbNotifs = items.length;
  const unreadItems = items.filter((n) => !isMarkReadEnabled(n) || n.isRead !== true);
  const nbUnread = unreadItems.length;
  const nbDanger = unreadItems.filter((n) => n.severity === 'danger').length;
  const nbUnreadMarkable = items.filter((n) => isMarkReadEnabled(n) && n.isRead !== true).length;
  const categorizedItems: Record<NotificationCategory, AppNotification[]> = {
    urgent: [],
    action: [],
    info: [],
  };

  for (const item of [...items].sort(sortByPriority)) {
    categorizedItems[getCategory(item)].push(item);
  }

  const orderedCategories = (Object.keys(categoryMeta) as NotificationCategory[]).filter((key) => categorizedItems[key].length > 0);

  const flushQueuedReadIds = useCallback(async () => {
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    const ids = Array.from(pendingReadIdsRef.current);
    if (ids.length === 0) return;

    pendingReadIdsRef.current.clear();

    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    }).catch(() => {
      // Non bloquant.
    });
  }, []);

  const queueReadId = useCallback((id: string) => {
    pendingReadIdsRef.current.add(id);

    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
    }

    flushTimerRef.current = window.setTimeout(() => {
      void flushQueuedReadIds();
    }, 220);
  }, [flushQueuedReadIds]);

  useEffect(() => {
    return () => {
      if (flushTimerRef.current !== null) {
        window.clearTimeout(flushTimerRef.current);
      }
    };
  }, []);

  const markAllRead = async () => {
    pendingReadIdsRef.current.clear();
    if (flushTimerRef.current !== null) {
      window.clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;
    }

    setItems((prev) => prev.map((n) => (isMarkReadEnabled(n) ? { ...n, isRead: true } : n)));
    await fetch('/api/notifications/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true }),
    }).catch(() => {
      // Non bloquant: l'utilisateur garde l'etat local courant.
    });
  };

  const markOneRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id && isMarkReadEnabled(n) ? { ...n, isRead: true } : n)));
    queueReadId(id);
  };

  const handleNotificationClick = (notification: AppNotification) => {
    setOpen(false);
    if (isMarkReadEnabled(notification)) {
      void markOneRead(notification.id);
    }
  };

  const handleViewSwitch = (nextRole: Role) => {
    if (nextRole === userRole || switchTargetRole) return;

    setSwitchTargetRole(nextRole);
    void setDashboardViewMode(toDashboardViewMode(nextRole))
      .then(() => {
        startSwitchTransition(() => {
          router.refresh();
        });
      })
      .catch(() => {
        setSwitchTargetRole(null);
      });
  };

  const isSwitchingView = switchTargetRole !== null || switchPending;
  const switchLoadingLabel = switchTargetRole
    ? `Chargement de la vue ${switchTargetRole === 'syndic' ? 'syndic' : 'copropriétaire'}...`
    : null;

  return (
    <header ref={headerRef} className="sticky top-0 z-10 border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-3 md:px-6 md:py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-2 lg:items-center">
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
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:gap-3">
              <h1 className="truncate text-lg font-semibold leading-tight text-gray-900 md:text-[1.75rem]">{title}</h1>
              {canSwitchView && (
                <div className="flex flex-col items-start gap-1.5">
                  <div className="inline-flex items-center rounded-2xl border border-gray-200 bg-gray-50/90 p-1">
                    <button
                      type="button"
                      onClick={() => handleViewSwitch('syndic')}
                      disabled={isSwitchingView}
                      aria-pressed={userRole === 'syndic'}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-70',
                        userRole === 'syndic' ? 'bg-white text-amber-700 shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <Crown size={13} />
                      Syndic
                    </button>
                    <button
                      type="button"
                      onClick={() => handleViewSwitch('copropriétaire')}
                      disabled={isSwitchingView}
                      aria-pressed={userRole === 'copropriétaire'}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors disabled:cursor-wait disabled:opacity-70',
                        userRole === 'copropriétaire' ? 'bg-white text-blue-700 shadow-sm ring-1 ring-black/5' : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      <User size={13} />
                      Copropriétaire
                    </button>
                  </div>
                  {switchLoadingLabel && (
                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500" aria-live="polite">
                      <LoaderCircle size={12} className="animate-spin" />
                      {switchLoadingLabel}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Zone droite */}
        <div className="flex shrink-0 items-center gap-2 self-end lg:self-auto md:gap-2.5">
          {/* Cloche notifications */}
          <div ref={ref} className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              aria-label={nbUnread > 0 ? `Notifications : ${nbUnread} non lue${nbUnread > 1 ? 's' : ''}` : 'Notifications'}
              aria-expanded={open}
              aria-haspopup="true"
              className={cn(
                'relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors',
                open ? 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
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
                      {nbUnreadMarkable > 0 && (
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
                    <div className="flex-1 overflow-y-auto md:max-h-80">
                      {orderedCategories.map((category, index) => {
                        const notificationsForCategory = categorizedItems[category];
                        const meta = categoryMeta[category];
                        return (
                          <div key={category} className={cn(index < orderedCategories.length - 1 ? 'border-b border-gray-100' : '')}>
                            <div className={cn('px-4 py-2.5', meta.headerClassName)}>
                              <p className={cn('text-xs font-semibold uppercase tracking-wide', meta.titleClassName)}>{meta.title}</p>
                              <p className={cn('text-[11px] mt-0.5', meta.descriptionClassName)}>{meta.description}</p>
                            </div>
                            <ul className="divide-y divide-gray-50">
                              {notificationsForCategory.map((notif) => {
                                const Icon = iconByType[notif.type as keyof typeof iconByType] ?? Bell;
                                const titleText = notif.title ?? notif.label ?? 'Notification';
                                const subtitleText = notif.body ?? notif.sublabel;
                                const unread = notif.isRead !== true;
                                const showActionLabel = category !== 'info' && !isMarkReadEnabled(notif);
                                return (
                                  <li key={notif.id}>
                                    <Link
                                      href={notif.href}
                                      onClick={() => handleNotificationClick(notif)}
                                      className={cn(
                                        'flex items-start gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors',
                                        unread ? 'bg-blue-50/40' : ''
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
                                        {showActionLabel && (
                                          <p className={cn(
                                            'text-[11px] mt-1 font-medium',
                                            category === 'urgent' ? 'text-red-700' : 'text-amber-700'
                                          )}>
                                            {category === 'urgent' ? 'Priorite immediate' : 'Action requise'}
                                          </p>
                                        )}
                                        {!showActionLabel && notif.createdAt && (
                                          <p className="text-[11px] text-gray-500 mt-1">{new Date(notif.createdAt).toLocaleString('fr-FR')}</p>
                                        )}
                                      </div>
                                    </Link>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Avatar utilisateur */}
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-2.5 py-1.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 shrink-0">
              <User size={16} className="text-blue-600" />
            </div>
            {userName && (
              <span className="hidden text-sm font-medium text-gray-700 lg:block">
                {userName}
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
