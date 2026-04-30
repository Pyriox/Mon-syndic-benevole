import type { ReactNode } from 'react';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const TONE_STYLES = {
  blue: 'border-blue-200 bg-blue-50 text-blue-800',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-800',
} as const;

export default function PageHelp({
  children,
  tone = 'blue',
  className,
  helpHref,
}: {
  children: ReactNode;
  tone?: keyof typeof TONE_STYLES;
  className?: string;
  /** Lien vers la section FAQ correspondante dans /aide */
  helpHref?: string;
}) {
  return (
    <div className={cn('rounded-xl border px-4 py-3', TONE_STYLES[tone], className)}>
      <div className="flex items-start gap-2.5">
        <Info size={16} className="mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm leading-relaxed">{children}</p>
          {helpHref && (
            <Link
              href={helpHref}
              className="inline-flex items-center gap-1 mt-1 text-xs font-medium underline opacity-70 hover:opacity-100 transition-opacity"
            >
              Voir l&apos;aide →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
