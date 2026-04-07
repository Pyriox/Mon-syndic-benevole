import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingStateProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export default function PageLoadingState({
  title = 'Ouverture de la page…',
  subtitle = 'Les données se chargent. Cela ne prend généralement qu’un instant.',
  children,
}: PageLoadingStateProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
        <Loader2 size={16} className="shrink-0 animate-spin text-blue-600" />
        <div>
          <p className="font-semibold">{title}</p>
          <p className="text-xs text-blue-700/80">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}
