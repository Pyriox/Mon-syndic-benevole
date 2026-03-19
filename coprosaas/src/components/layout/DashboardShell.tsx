// ============================================================
// DashboardShell — Wrapper client gérant la sidebar mobile
// Sépare la logique d'état (client) du fetching (serveur)
// ============================================================
'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';
import type { UserCopropriete, AppNotification } from '@/types';

interface DashboardShellProps {
  children: React.ReactNode;
  coproprietes: UserCopropriete[];
  selectedCoproId: string | null;
  userRole: 'syndic' | 'copropriétaire';
  title: string;
  userName: string;
  notifications: AppNotification[];
}

export default function DashboardShell({
  children,
  coproprietes,
  selectedCoproId,
  userRole,
  title,
  userName,
  notifications,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50">
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
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header
          title={title}
          userName={userName}
          notifications={notifications}
          onMenuOpen={() => setSidebarOpen(true)}
        />
        {/* pb-20 sur mobile pour ne pas cacher le contenu derrière la bottom nav */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Barre de navigation fixe en bas — mobile uniquement */}
      <BottomNav
        userRole={userRole}
        onMenuOpen={() => setSidebarOpen(true)}
      />
    </div>
  );
}
