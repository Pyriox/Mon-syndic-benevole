// ============================================================
// DashboardShell — Wrapper client gérant la sidebar mobile
// Sépare la logique d'état (client) du fetching (serveur)
// ============================================================
'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import CookiePreferencesButton from '@/components/CookiePreferencesButton';
import ScrollToTopButton from '@/components/ui/ScrollToTopButton';
import type { UserCopropriete, AppNotification, Role } from '@/types';

interface DashboardShellProps {
  children: React.ReactNode;
  coproprietes: UserCopropriete[];
  selectedCoproId: string | null;
  userRole: 'syndic' | 'copropriétaire';
  availableViewRoles: Role[];
  title: string;
  userName: string;
  notifications: AppNotification[];
}

export default function DashboardShell({
  children,
  coproprietes,
  selectedCoproId,
  userRole,
  availableViewRoles,
  title,
  userName,
  notifications,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-gray-50">
      <div className="flex flex-1 overflow-x-hidden">
        {/* Overlay sombre — masque le contenu derrière la sidebar sur mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}

        <Sidebar
          coproprietes={coproprietes}
          selectedCoproId={selectedCoproId}
          userRole={userRole}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Zone principale */}
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header
            title={title}
            userRole={userRole}
            availableViewRoles={availableViewRoles}
            userName={userName}
            notifications={notifications}
            onMenuOpen={() => setSidebarOpen(true)}
          />
          {/* pb-20 sur mobile pour ne pas cacher le contenu derrière la bottom nav */}
          <main className="flex-1 min-w-0 overflow-x-hidden">
            <div className="p-4 md:p-6 pb-28 md:pb-6">
              {children}
            </div>
          </main>
        </div>
      </div>

      {/* Footer desktop pleine largeur avec colonne gauche alignée sur la sidebar */}
      <footer className="hidden md:grid md:grid-cols-[15rem_minmax(0,1fr)] border-t border-gray-100 bg-white">
        <div aria-hidden="true" className="border-r border-gray-100 bg-white" />
        <div className="flex items-center justify-center gap-4 px-6 py-3">
          <Link href="/cgu" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">CGU</Link>
          <span className="text-gray-200" aria-hidden="true">·</span>
          <Link href="/mentions-legales" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Mentions légales</Link>
          <span className="text-gray-200" aria-hidden="true">·</span>
          <Link href="/politique-confidentialite" className="text-xs text-gray-400 hover:text-gray-600 transition-colors">Confidentialité</Link>
          <span className="text-gray-200" aria-hidden="true">·</span>
          <CookiePreferencesButton className="text-xs text-gray-400 hover:text-gray-600 transition-colors" label="Cookies" />
        </div>
      </footer>

      <ScrollToTopButton />

      {/* Barre de navigation fixe en bas — mobile uniquement */}
      <BottomNav
        userRole={userRole}
        onMenuOpen={() => setSidebarOpen(true)}
      />
    </div>
  );
}
