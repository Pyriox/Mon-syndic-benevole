'use client';

import Link from 'next/link';
import type { ComponentProps } from 'react';
import { trackAnonymousEvent } from '@/lib/gtag';

type CtaLinkProps = ComponentProps<typeof Link> & {
  ctaLocation: string;
};

export default function CtaLink({ ctaLocation, onClick, ...props }: CtaLinkProps) {
  return (
    <Link
      {...props}
      onClick={(e) => {
        trackAnonymousEvent('click_cta', { location: ctaLocation });
        onClick?.(e);
      }}
    />
  );
}
