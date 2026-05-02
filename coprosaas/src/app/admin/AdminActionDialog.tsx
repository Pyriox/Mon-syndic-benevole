'use client';

import type { ReactNode } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';

type Tone = 'primary' | 'danger';

const confirmButtonClasses: Record<Tone, string> = {
  primary: 'bg-indigo-600 hover:bg-indigo-700 text-white',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
};

export function AdminDialogNotice({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="mb-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
      {message}
    </div>
  );
}

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
  tone?: Tone;
}

export function AdminConfirmDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Annuler',
  onConfirm,
  isLoading = false,
  tone = 'primary',
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title={title} size="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-3 py-3 text-sm text-gray-700">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
          <div>{description}</div>
        </div>

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${confirmButtonClasses[tone]}`}
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface PromptDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onConfirm: () => void;
  confirmLabel: string;
  placeholder?: string;
  cancelLabel?: string;
  isLoading?: boolean;
  error?: string;
  tone?: Tone;
  inputType?: string;
  requiredValue?: string;
}

export function AdminPromptDialog({
  isOpen,
  onClose,
  title,
  description,
  label,
  value,
  onChange,
  onConfirm,
  confirmLabel,
  placeholder,
  cancelLabel = 'Annuler',
  isLoading = false,
  error,
  tone = 'primary',
  inputType = 'email',
  requiredValue,
}: PromptDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title={title} size="sm">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm();
        }}
      >
        {description ? <div className="text-sm text-gray-600">{description}</div> : null}
        <AdminDialogNotice message={error} />
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-700">{label}</label>
          <input
            type={inputType}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={isLoading || (requiredValue !== undefined && value !== requiredValue)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors disabled:opacity-50 ${confirmButtonClasses[tone]}`}
          >
            {isLoading && <Loader2 size={13} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}
