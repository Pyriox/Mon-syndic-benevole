import { LifeBuoy } from 'lucide-react';

export default function AdminSupportPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-5">
        <LifeBuoy size={28} className="text-gray-400" />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Support — bientôt disponible</h1>
      <p className="text-sm text-gray-500 max-w-xs">
        Cette section permettra de suivre les tickets de support, consulter les messages de contact et gérer les demandes d&apos;aide.
      </p>
    </div>
  );
}
