'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Props {
  placeholder?: string;
  defaultValue?: string;
  debounceMs?: number;
}

export default function AdminSearch({ placeholder = 'Rechercher…', defaultValue = '', debounceMs = 250 }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmedValue = value.trim();
      const currentValue = (searchParams.get('q') ?? '').trim();

      if (trimmedValue === currentValue) return;

      const params = new URLSearchParams(searchParams.toString());
      if (trimmedValue) {
        params.set('q', trimmedValue);
      } else {
        params.delete('q');
      }

      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }, debounceMs);

    return () => window.clearTimeout(timeout);
  }, [value, debounceMs, router, pathname, searchParams]);

  return (
    <div className="relative">
      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      <input
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        className="pl-8 pr-7 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 min-w-[220px]"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Effacer"
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
