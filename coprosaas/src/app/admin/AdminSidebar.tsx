'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ElementType } from 'react';
import { LayoutDashboard, Users, CreditCard, Building2, LifeBuoy } from 'lucide-react';

type NavItem = { href: string; label: string; icon: ElementType; soon?: boolean };

const NAV: NavItem[] = [
  { href: '/admin/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/admin/utilisateurs',  label: 'Utilisateurs',   icon: Users },
  { href: '/admin/abonnements',   label: 'Abonnements',    icon: CreditCard },
  { href: '/admin/coproprietes',  label: 'Copropriétés',   icon: Building2 },
  { href: '/admin/support',       label: 'Support',        icon: LifeBuoy, soon: true },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  return (
    <nav className="w-52 shrink-0 flex flex-col gap-0.5 pt-1">
      {NAV.map(({ href, label, icon: Icon, soon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={soon ? '#' : href}
            aria-disabled={soon}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              active
                ? 'bg-white shadow-sm text-gray-900 border border-gray-200'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/70'
            } ${soon ? 'opacity-50 pointer-events-none' : ''}`}
          >
            <Icon size={15} className={active ? 'text-indigo-600' : 'text-gray-400'} />
            <span className="flex-1">{label}</span>
            {soon && (
              <span className="text-[9px] font-semibold bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded uppercase tracking-wide">
                Bientôt
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
