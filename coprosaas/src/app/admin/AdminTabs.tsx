'use client';

import { useState } from 'react';
import { LayoutDashboard, Building2, Users, CreditCard, UserCheck } from 'lucide-react';

export type TabId = 'overview' | 'syndics' | 'members' | 'subscriptions' | 'copros';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',       label: 'Vue d\'ensemble', icon: LayoutDashboard },
  { id: 'syndics',        label: 'Syndics',         icon: UserCheck },
  { id: 'members',        label: 'Membres',         icon: Users },
  { id: 'subscriptions',  label: 'Abonnements',     icon: CreditCard },
  { id: 'copros',         label: 'Copropriétés',    icon: Building2 },
];

interface Props {
  panels: Record<TabId, React.ReactNode>;
}

export default function AdminTabs({ panels }: Props) {
  const [active, setActive] = useState<TabId>('overview');

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActive(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all flex-1 justify-center ${
              active === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>
      {panels[active]}
    </div>
  );
}
