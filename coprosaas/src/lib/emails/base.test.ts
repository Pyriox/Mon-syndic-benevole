import { describe, expect, it } from 'vitest';
import { formatDateFR } from './base';

describe('formatDateFR', () => {
  it('formats full ISO datetimes without returning Invalid Date', () => {
    expect(formatDateFR('2026-04-10T22:00:00.000Z')).toBe('11 avril 2026');
  });

  it('keeps date-only values compatible', () => {
    expect(formatDateFR('2026-04-10')).toBe('10 avril 2026');
  });
});
