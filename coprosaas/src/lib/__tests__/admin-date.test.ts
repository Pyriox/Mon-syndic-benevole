import { describe, expect, it } from 'vitest';
import { formatRelativeDayLabel } from '../admin-date';

describe('formatRelativeDayLabel', () => {
  it('returns Hier for a date on the previous calendar day', () => {
    expect(formatRelativeDayLabel('2026-04-01T10:00:00.000Z', new Date('2026-04-02T08:00:00.000Z'))).toBe('Hier');
  });

  it('returns Aujourd\'hui for a date on the same calendar day', () => {
    expect(formatRelativeDayLabel('2026-04-02T01:15:00.000Z', new Date('2026-04-02T08:00:00.000Z'))).toBe("Aujourd'hui");
  });
});
