import { describe, expect, it } from 'vitest';

import {
  getInternalAnalyticsContext,
  getInternalPageViewEventName,
  normalizeInternalAnalyticsPath,
} from '../internal-analytics';

describe('internal analytics helpers', () => {
  it('normalise les routes dynamiques dashboard/admin pour éviter le bruit dans GA4', () => {
    expect(normalizeInternalAnalyticsPath('/coproprietes/3fa85f64-5717-4562-b3fc-2c963f66afa6/parametrage')).toBe('/coproprietes/[id]/parametrage');
    expect(normalizeInternalAnalyticsPath('/admin/utilisateurs/12345')).toBe('/admin/utilisateurs/[id]');
  });

  it('calcule un contexte stable pour les vues internes', () => {
    expect(getInternalAnalyticsContext('/coproprietes/3fa85f64-5717-4562-b3fc-2c963f66afa6/parametrage')).toEqual({
      normalizedPath: '/coproprietes/[id]/parametrage',
      pageGroup: 'coproprietes',
      pageName: 'coproprietes_[id]_parametrage',
      pageDepth: 3,
    });

    expect(getInternalAnalyticsContext('/')).toEqual({
      normalizedPath: '/',
      pageGroup: 'overview',
      pageName: 'dashboard_home',
      pageDepth: 1,
    });

    expect(getInternalPageViewEventName()).toBe('dashboard_page_view');
  });
});