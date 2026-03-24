// ============================================================
// Composant Select (liste déroulante) réutilisable
// ============================================================
import { SelectHTMLAttributes, forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];     // Liste des options
  placeholder?: string;        // Option vide par défaut
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder = 'Sélectionner...', className, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              'w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-9 text-sm text-gray-900 bg-gray-50',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white',
              'disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed',
              'transition-all duration-150',
              error
                ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 hover:border-gray-300 hover:bg-white',
              className
            )}
            {...props}
          >
            <option value="">{placeholder}</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
export default Select;
