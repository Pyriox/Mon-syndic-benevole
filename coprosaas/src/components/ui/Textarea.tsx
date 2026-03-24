// ============================================================
// Composant Textarea réutilisable
// ============================================================
import { TextareaHTMLAttributes, forwardRef } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, rows = 3, ...props }, ref) => {
    const textareaId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={textareaId} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          className={cn(
            'w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 resize-y',
            'placeholder:text-gray-500',
            'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white',
            'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
            'transition-all duration-150',
            error
              ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white',
            className
          )}
          {...props}
        />

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}
        {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
export default Textarea;
