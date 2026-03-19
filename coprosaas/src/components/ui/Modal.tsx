// ============================================================
// Composant Modal / Dialog
// Affiche un contenu en overlay sur la page
// ============================================================
'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;             // Contrôle l'affichage
  onClose: () => void;         // Fonction appelée à la fermeture
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // Fermer avec la touche Échap
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Empêche le scroll de la page en arrière-plan
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    // Overlay sombre
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Fond semi-transparent */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Boîte du modal */}
      <div
        className={cn(
          'relative z-10 bg-white rounded-xl shadow-xl w-full flex flex-col',
          'max-h-[calc(100dvh-2rem)]',
          sizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()} // Empêche la fermeture au clic sur le contenu
      >
        {/* En-tête du modal */}
        {title && (
          <div className="flex items-center justify-between p-5 border-b border-gray-200 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        )}

        {/* Corps du modal */}
        <div className="p-5 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
}
