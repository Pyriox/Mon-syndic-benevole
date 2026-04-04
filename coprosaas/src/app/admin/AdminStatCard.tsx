import type { ElementType } from 'react';

interface Props {
  label: string;
  value: string | number;
  sub?: string;
  icon: ElementType;
  color: string;
  danger?: boolean;
}

export default function AdminStatCard({ label, value, sub, icon: Icon, color, danger = false }: Props) {
  return (
    <div className={`bg-white rounded-xl border shadow-sm p-5 flex items-start gap-4 ${danger ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
      <div className={`p-3 rounded-xl ${color} shrink-0`}><Icon size={18} /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${danger ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        {sub && <p className="text-xs text-gray-500">{sub}</p>}
      </div>
    </div>
  );
}
