'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { trackAnonymousEvent } from '@/lib/gtag';
import {
  getInternalAnalyticsContext,
  getInternalPageViewEventName,
  type InternalAnalyticsRole,
} from '@/lib/internal-analytics';

type Props = {
  role?: InternalAnalyticsRole;
};

export default function InternalPageTracker({ role }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (fullPath === prevPathRef.current) return;
    prevPathRef.current = fullPath;

    const context = getInternalAnalyticsContext(pathname);

    trackAnonymousEvent(getInternalPageViewEventName(), {
      platform_area: 'dashboard',
      platform_group: context.pageGroup,
      platform_name: context.pageName,
      platform_path: context.normalizedPath,
      platform_depth: context.pageDepth,
      ...(role ? { platform_role: role } : {}),
    });
  }, [pathname, role, searchParams]);

  return null;
}