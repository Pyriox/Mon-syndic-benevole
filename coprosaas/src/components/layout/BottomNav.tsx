'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, Wallet, FileText,
  CalendarDays, AlertTriangle, MoreHorizontal,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomNavProps {
  userRole: 'syndic' | 'copropriétaire';
  onMenuOpen: () => void;
}

export default function BottomNav({ userRole, onMenuOpen }: BottomNavProps) {
  const pathname = usePathname();

  const syndicItems = [
    { href: '/dashboard',         label: 'Accueil',   icon: LayoutDashboard },
    { href: '/coproprietaires',   label: 'Membres',   icon: Users },
    { href: '/appels-de-fonds',   label: 'Finances',  icon: Wallet },
    { href: '/incidents',         label: 'Incidents', icon: AlertTriangle },
  ];

  const coproItems = [
    { href: '/dashboard',       label: 'Accueil',   icon: LayoutDashboard },
    { href: '/assemblees',      label: 'AG',        icon: CalendarDays },
    { href: '/appels-de-fonds', label: 'Charges',   icon: Wallet },
    { href: '/documents',       label: 'Documents', icon: FileText },
  ];

  const items = userRole === 'syndic' ? syndicItems : coproItems;

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-gray-200"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'relative flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-blue-600' : 'text-gray-400 active:text-gray-700'
              )}
            >
              {active && (
                <span className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-blue-600 rounded-b-full" />
              )}
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className="shrink-0"
              />
              <span className="text-[10px] font-medium leading-tight">{label}</span>
            </Link>
          );
        })}

        {/* Bouton "Menu" — ouvre la sidebar pour les sections secondaires */}
        <button
          onClick={onMenuOpen}
          aria-label="Ouvrir le menu de navigation"
          className="relative flex-1 flex flex-col items-center justify-center gap-0.5 text-gray-400 active:text-gray-700 transition-colors"
        >
          <MoreHorizontal size={22} strokeWidth={1.8} className="shrink-0" />
          <span className="text-[10px] font-medium leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
}
