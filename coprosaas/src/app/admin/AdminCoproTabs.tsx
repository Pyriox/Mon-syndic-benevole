'use client';

import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { Building2, CreditCard } from 'lucide-react';

const TABS = [
  { key: 'coproprietes', label: 'Copropriétés', icon: Building2 },
  { key: 'abonnements',  label: 'Abonnements',  icon: CreditCard },
];

export default function AdminCoproTabs({ activeTab }: { activeTab: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleClick(tab: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    params.delete('plan'); // reset plan filter when switching tabs
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => handleClick(key)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Icon size={14} />
          {label}
        </button>
      ))}
    </div>
  );
}
