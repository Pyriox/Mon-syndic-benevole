'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

import { trackAnonymousEvent } from '@/lib/gtag';
import {
  getInternalAnalyticsContext,
  getInternalPageViewEventName,
  type InternalAnalyticsArea,
  type InternalAnalyticsRole,
} from '@/lib/internal-analytics';

type Props = {
  area: InternalAnalyticsArea;
  role?: InternalAnalyticsRole;
};

export default function InternalPageTracker({ area, role }: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (area === 'admin') return;

    const fullPath = `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;
    if (fullPath === prevPathRef.current) return;
    prevPathRef.current = fullPath;

    const context = getInternalAnalyticsContext(pathname, area);

    trackAnonymousEvent(getInternalPageViewEventName(area), {
      platform_area: area,
      platform_group: context.pageGroup,
      platform_name: context.pageName,
      platform_path: context.normalizedPath,
      platform_depth: context.pageDepth,
      ...(role ? { platform_role: role } : {}),
    });
  }, [area, pathname, role, searchParams]);

  return null;
}