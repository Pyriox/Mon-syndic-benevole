// ============================================================
// Composant Input réutilisable avec label et message d'erreur
// Supporte automatiquement le toggle de visibilité pour type="password"
// ============================================================
'use client';
import { InputHTMLAttributes, forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;        // Label affiché au-dessus
  error?: string;        // Message d'erreur affiché en rouge en dessous
  hint?: string;         // Texte d'aide affiché en gris en dessous
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, type, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
    const isPassword = type === 'password';
    const [showPassword, setShowPassword] = useState(false);

    return (
      <div className="flex flex-col gap-1.5">
        {/* Label */}
        {label && (
          <label htmlFor={inputId} className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            {label}
            {props.required && <span className="text-red-600 ml-1">*</span>}
          </label>
        )}

        {/* Champ input */}
        <div className={isPassword ? 'relative' : undefined}>
          <input
            ref={ref}
            id={inputId}
            type={isPassword ? (showPassword ? 'text' : 'password') : type}
            className={cn(
              'w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900',
              'placeholder:text-gray-500',
              'focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white',
              'disabled:bg-gray-100 disabled:text-gray-600 disabled:cursor-not-allowed',
              'transition-all duration-150',
              isPassword && 'pr-10',
              error
                ? 'border-red-400 bg-red-50 focus:ring-red-500/20 focus:border-red-500'
                : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-white',
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              aria-pressed={showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>

        {/* Message d'erreur */}
        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1.5">
            <AlertCircle size={12} className="shrink-0" /> {error}
          </p>
        )}

        {/* Texte d'aide */}
        {hint && !error && (
          <p className="text-xs text-gray-500">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
