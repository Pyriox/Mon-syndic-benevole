import { describe, expect, it } from 'vitest';
import { hasAddonAccess, hasChargesSpecialesAddon, type CoproAddon } from '../subscription';

describe('subscription add-ons', () => {
  it('considers an active add-on as enabled', () => {
    const addon: CoproAddon = {
      addon_key: 'charges_speciales',
      status: 'active',
      current_period_end: '2030-12-31T00:00:00.000Z',
      cancel_at_period_end: false,
    };

    expect(hasAddonAccess(addon)).toBe(true);
    expect(hasChargesSpecialesAddon([addon])).toBe(true);
  });

  it('keeps access until the paid period ends when cancellation is scheduled', () => {
    const addon: CoproAddon = {
      addon_key: 'charges_speciales',
      status: 'inactive',
      current_period_end: '2030-12-31T00:00:00.000Z',
      cancel_at_period_end: true,
    };

    expect(hasAddonAccess(addon, '2030-06-01T00:00:00.000Z')).toBe(true);
  });

  it('disables access once the paid period has ended', () => {
    const addon: CoproAddon = {
      addon_key: 'charges_speciales',
      status: 'inactive',
      current_period_end: '2030-12-31T00:00:00.000Z',
      cancel_at_period_end: true,
    };

    expect(hasAddonAccess(addon, '2031-01-01T00:00:00.000Z')).toBe(false);
    expect(hasChargesSpecialesAddon([addon], '2031-01-01T00:00:00.000Z')).toBe(false);
  });
});
