import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingStateProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageLoadingState({ children }: PageLoadingStateProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-800">
        <Loader2 size={16} className="shrink-0 animate-spin text-blue-600" />
        <p>Ouverture de la page…</p>
      </div>
      {children}
    </div>
  );
}
