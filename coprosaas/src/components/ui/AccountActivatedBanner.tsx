'use client';

import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function AccountActivatedBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (searchParams.get('compte') === 'active') {
      setVisible(true);

      // Retirer le paramètre de l'URL sans recharger la page
      const params = new URLSearchParams(searchParams.toString());
      params.delete('compte');
      const newUrl = params.size > 0 ? `${pathname}?${params.toString()}` : pathname;
      router.replace(newUrl, { scroll: false });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) return null;

  return (
    <div className="flex items-start gap-3 bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
      <CheckCircle2 size={18} className="shrink-0 text-green-600 mt-0.5" />
      <p className="flex-1 font-medium">
        Votre adresse e-mail a été confirmée et votre compte est activé. Bienvenue !
      </p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="shrink-0 text-green-600 hover:text-green-800 transition-colors"
        aria-label="Fermer"
      >
        <X size={16} />
      </button>
    </div>
  );
}
