import { describe, expect, it } from 'vitest';

import type { Ga4AdminAnalytics } from '@/lib/ga4-admin';

import {
  buildAdminAnalyticsMetrics,
  type AdminRow,
  type CoproActivityRow,
  type ProfileActivityRow,
  type UserEventRow,
} from './metrics';

function createAnalyticsStub(): Ga4AdminAnalytics {
  return {
    configured: true,
    propertyId: '1234',
    fetchedAt: '2026-04-23T12:00:00.000Z',
    missingVars: [],
    error: null,
    last7d: { activeUsers: 10, sessions: 20, pageViews: 30 },
    last30d: { activeUsers: 50, sessions: 80, pageViews: 120 },
    businessEvents7d: { sign_up: 2, sign_up_anonymous: 1, login: 3, login_anonymous: 2, begin_checkout: 4, purchase: 1, onboarding_complete: 2, dashboard_page_view: 8 },
    businessEvents30d: { sign_up: 5, sign_up_anonymous: 2, login: 7, login_anonymous: 4, begin_checkout: 9, purchase: 3, onboarding_complete: 4, dashboard_page_view: 20 },
    topPages: [],
    topEvents: [],
    internalPlatformPages: [],
    measurementModes: [],
    consentStates: [],
    deviceCategories: [],
    notes: [],
  };
}

describe('buildAdminAnalyticsMetrics', () => {
  it('exclut les admins par user_id et filtre les copros créées par des admins', () => {
    const nowMs = Date.parse('2026-04-23T12:00:00.000Z');
    const adminRows: AdminRow[] = [{ user_id: 'admin-2' }];
    const recentUserEvents: UserEventRow[] = [
      { event_type: 'login_success', created_at: '2026-04-22T10:00:00.000Z', user_email: 'client@example.com', user_id: 'user-1' },
      { event_type: 'login_success', created_at: '2026-04-22T11:00:00.000Z', user_email: 'someone@example.com', user_id: 'admin-2' },
      { event_type: 'user_registered', created_at: '2026-04-21T10:00:00.000Z', user_email: 'admin-secondary@example.com', user_id: 'admin-2' },
      { event_type: 'begin_checkout', created_at: '2026-04-20T10:00:00.000Z', user_email: 'client@example.com', user_id: 'user-1' },
      { event_type: 'trial_started', created_at: '2026-04-19T10:00:00.000Z', user_email: 'client@example.com', user_id: 'user-1' },
      { event_type: 'subscription_created', created_at: '2026-04-18T10:00:00.000Z', user_email: 'client@example.com', user_id: 'user-1' },
    ];
    const recentCopros: CoproActivityRow[] = [
      { created_at: '2026-04-22T09:00:00.000Z', syndic_id: 'user-1' },
      { created_at: '2026-04-21T09:00:00.000Z', syndic_id: 'admin-2' },
    ];
    const recentProfiles: ProfileActivityRow[] = [
      { id: 'user-1', full_name: 'Client Actif', last_active_at: '2026-04-23T11:00:00.000Z' },
      { id: 'admin-2', full_name: 'Admin Interne', last_active_at: '2026-04-23T11:30:00.000Z' },
    ];

    const metrics = buildAdminAnalyticsMetrics({
      analytics: createAnalyticsStub(),
      recentUserEvents,
      recentCopros,
      recentProfiles,
      adminRows,
      nowMs,
    });

    expect(metrics.internalLoginForms30d).toBe(1);
    expect(metrics.internalRegistrations30d).toBe(0);
    expect(metrics.internalOnboarding30d).toBe(1);
    expect(metrics.latestActivityUser).toBe('Client Actif');
  });
});