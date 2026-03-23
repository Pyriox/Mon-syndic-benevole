'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Receipt,
  Wallet,
  FileText,
  CalendarDays,
  AlertTriangle,
  LogOut,
  UserCircle,
  CreditCard,
  HelpCircle,
  X,
  ArrowLeftRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import CoproSelector from './CoproSelector';
import SiteLogo from '@/components/ui/SiteLogo';
import type { UserCopropriete } from '@/types';

interface SidebarProps {
  coproprietes: UserCopropriete[];
  selectedCoproId: string | null;
  userRole: 'syndic' | 'copropriétaire';
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ coproprietes, selectedCoproId, userRole, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // Sections dynamiques : le lien "Lots" pointe vers la copropriété sélectionnée
  const coproDetailHref = selectedCoproId ? `/coproprietes/${selectedCoproId}` : '/coproprietes';

  const syndicNav = [
    {
      items: [
        { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Copropriété',
      items: [
        { href: coproDetailHref, label: 'Lots & bâtiment', icon: Building2, matchPrefix: '/coproprietes' },
        { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
      ],
    },
    {
      label: 'AG & Finances',
      items: [
        { href: '/assemblees', label: 'Assemblées Générales', icon: CalendarDays },
        { href: '/appels-de-fonds', label: 'Appels de fonds', icon: Wallet },
        { href: '/depenses', label: 'Dépenses', icon: Receipt },
        { href: '/regularisation', label: 'Régularisation', icon: ArrowLeftRight },
      ],
    },
    {
      label: 'Gestion',
      items: [
        { href: '/documents', label: 'Documents', icon: FileText },
        { href: '/incidents', label: 'Incidents / Travaux', icon: AlertTriangle },
      ],
    },
    {
      items: [
        { href: '/aide', label: 'Aide & Contact', icon: HelpCircle },
      ],
    },
  ];

  const coproprietaireNav = [
    {
      items: [
        { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
      ],
    },
    {
      label: 'Ma copropriété',
      items: [
        { href: '/lots', label: 'Lots & bâtiment', icon: Building2 },
        { href: '/coproprietaires', label: 'Copropriétaires', icon: Users },
        { href: '/assemblees', label: 'Assemblées Générales', icon: CalendarDays },
        { href: '/appels-de-fonds', label: 'Mes charges', icon: Wallet },
        { href: '/depenses', label: 'Dépenses', icon: Receipt },
        { href: '/regularisation', label: 'Régularisation', icon: ArrowLeftRight },
        { href: '/documents', label: 'Documents', icon: FileText },
      ],
    },
    {
      items: [
        { href: '/aide', label: 'Aide & Contact', icon: HelpCircle },
      ],
    },
  ];

  const navSections = userRole === 'syndic' ? syndicNav : coproprietaireNav;

  const NavLink = ({ href, label, icon: Icon, matchPrefix }: { href: string; label: string; icon: React.ElementType; matchPrefix?: string }) => {
    const prefix = matchPrefix ?? href;
    const isActive = pathname === href || pathname.startsWith(prefix + '/') || pathname === prefix;
    return (
      <Link
        href={href}
        onClick={onClose}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm transition-all duration-150 group relative',
          isActive
            ? 'bg-blue-50 text-blue-700 font-semibold'
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'
        )}
      >
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-600 rounded-full" />
        )}
        <Icon
          size={17}
          className={cn(
            'shrink-0 transition-colors',
            isActive ? 'text-blue-600' : 'text-gray-500 group-hover:text-gray-700'
          )}
        />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        // Base : colonne flex, fond blanc, bordure droite
        'flex flex-col bg-white border-r border-gray-100 h-full',
        // Mobile : drawer fixe superposé, largeur légèrement plus grande pour le confort tactile
        'fixed top-0 left-0 bottom-0 z-40 w-72 transition-transform duration-300 ease-in-out',
        // Desktop : position normale dans le flux flex, largeur standard
        'md:static md:w-60 md:z-auto md:translate-x-0 md:min-h-screen',
        // Ouverture / fermeture mobile
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0',
      )}
    >
      {/* Logo + bouton fermer (mobile) */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <SiteLogo size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-bold text-gray-900 leading-tight truncate">Mon Syndic</p>
            <p className="text-[11px] font-semibold text-blue-600 leading-tight">Bénévole</p>
          </div>
          {/* Bouton fermer visible uniquement sur mobile */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors shrink-0"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Sélecteur de copropriété */}
      <CoproSelector coproprietes={coproprietes} selectedId={selectedCoproId} userRole={userRole} />

      {/* Navigation */}
      <nav className="flex-1 px-3 pb-4 space-y-5 overflow-y-auto">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {section.label && (
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-500">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink key={item.href} {...item} />
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bas de sidebar : abonnement, profil + déconnexion */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        {userRole === 'syndic' && (
          <NavLink href="/abonnement" label="Abonnement" icon={CreditCard} />
        )}
        <NavLink href="/profil" label="Mon profil" icon={UserCircle} />
        <button
          onClick={() => { onClose?.(); handleLogout(); }}
          className="flex items-center gap-3 px-3 py-2.5 md:py-2 rounded-lg text-sm font-medium w-full
                     text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all duration-150 group"
        >
          <LogOut size={17} className="shrink-0 text-gray-500 group-hover:text-red-500 transition-colors" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
