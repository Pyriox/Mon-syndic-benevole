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
    expect(getInternalAnalyticsContext('/admin/coproprietes/3fa85f64-5717-4562-b3fc-2c963f66afa6', 'admin')).toEqual({
      normalizedPath: '/admin/coproprietes/[id]',
      pageGroup: 'coproprietes',
      pageName: 'coproprietes_[id]',
      pageDepth: 2,
    });

    expect(getInternalPageViewEventName('dashboard')).toBe('dashboard_page_view');
    expect(getInternalPageViewEventName('admin')).toBe('admin_page_view');
  });
});