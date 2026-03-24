'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/gtag';

interface Props {
  slug: string;
  title: string;
}

export default function ArticleViewTracker({ slug, title }: Props) {
  useEffect(() => {
    trackEvent('view_article', { article_slug: slug, article_title: title });
  }, [slug, title]);
  return null;
}
