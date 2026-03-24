// ============================================================
// Composant EmptyState : affichage quand une liste est vide
// ============================================================
import { ReactNode } from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;   // Bouton d'action (ex: "Ajouter le premier élément")
  icon?: ReactNode;
}

export default function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {/* Icône */}
      <div className="mb-4 text-gray-500">
        {icon ?? <InboxIcon size={48} strokeWidth={1.5} />}
      </div>

      <h3 className="text-base font-semibold text-gray-700">{title}</h3>

      {description && (
        <p className="mt-1 text-sm text-gray-500 max-w-xs">{description}</p>
      )}

      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
