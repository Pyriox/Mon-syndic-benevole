'use client';

import { useEffect } from 'react';
import { trackAnonymousEvent } from '@/lib/gtag';

interface Props {
  slug: string;
  title: string;
}

export default function ArticleViewTracker({ slug, title }: Props) {
  useEffect(() => {
    trackAnonymousEvent('view_article', { article_slug: slug, article_title: title });
  }, [slug, title]);
  return null;
}
