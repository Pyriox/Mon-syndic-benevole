import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const TONE_STYLES = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

export default function PageHelp({
  children,
  tone = 'blue',
  className,
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_STYLES;
  className?: string;
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-3', TONE_STYLES[tone], className)}>
      <div className="flex items-start gap-2.5">
        <Info size={16} className="mt-0.5 shrink-0" />
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
