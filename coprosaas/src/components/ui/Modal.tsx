// ============================================================
// Composant Modal / Dialog
// Mobile : bottom sheet (slide up)  |  Desktop (md+) : dialog centré
// ============================================================
'use client';

import { useEffect, ReactNode, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;             // Contrôle l'affichage
  onClose: () => void;         // Fonction appelée à la fermeture
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const desktopSizeClasses = {
  sm: 'md:max-w-sm',
  md: 'md:max-w-md',
  lg: 'md:max-w-lg',
  xl: 'md:max-w-2xl',
};

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const pointerStartedOnBackdrop = useRef(false);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

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

  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const isBackdrop = e.target === e.currentTarget;
    pointerStartedOnBackdrop.current = isBackdrop;
    pointerStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleOverlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const endedOnBackdrop = e.target === e.currentTarget;
    const started = pointerStart.current;
    pointerStart.current = null;

    if (!pointerStartedOnBackdrop.current || !endedOnBackdrop || !started) {
      pointerStartedOnBackdrop.current = false;
      return;
    }

    const moved = Math.hypot(e.clientX - started.x, e.clientY - started.y);
    pointerStartedOnBackdrop.current = false;

    // Ne ferme que sur un clic volontaire (sans glisser-déposer notable).
    if (moved <= 4) onClose();
  };

  return (
    // Overlay — mobile : aligne en bas | desktop : centre
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center md:justify-center md:p-4"
      onPointerDown={handleOverlayPointerDown}
      onPointerUp={handleOverlayPointerUp}
    >
      {/* Fond semi-transparent */}
      <div className="absolute inset-0 bg-black/50" />

      {/* Boîte du modal */}
      <div
        className={cn(
          // Commun
          'relative z-10 bg-white shadow-xl w-full flex flex-col',
          // Mobile : full width, arrondi en haut, hauteur max 90vh
          'rounded-t-2xl max-h-[90dvh]',
          // Desktop : arrondi partout, hauteur max réduite, largeur contrainte
          'md:rounded-xl md:max-h-[calc(100dvh-2rem)]',
          desktopSizeClasses[size]
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Poignée de drag (mobile uniquement) */}
        <div className="flex justify-center pt-3 pb-1 md:hidden" aria-hidden>
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {/* En-tête du modal */}
        {title && (
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors"
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
