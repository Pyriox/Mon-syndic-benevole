import { describe, expect, it } from 'vitest';
import { formatRelativeDayLabel } from '../admin-date';
import {
  formatDateTime,
  formatFrenchDateInputValue,
  formatTime,
  getDefaultFundingCallDate,
  normalizeFrenchDateInputValue,
  parseFrenchDateInputValue,
  toParisISOString,
} from '../utils';

describe('formatRelativeDayLabel', () => {
  it('returns Hier for a date on the previous calendar day', () => {
    expect(formatRelativeDayLabel('2026-04-01T10:00:00.000Z', new Date('2026-04-02T08:00:00.000Z'))).toBe('Hier');
  });

  it('returns Aujourd\'hui for a date on the same calendar day', () => {
    expect(formatRelativeDayLabel('2026-04-02T01:15:00.000Z', new Date('2026-04-02T08:00:00.000Z'))).toBe("Aujourd'hui");
  });
});

describe('AG timezone helpers', () => {
  it('formats a stored UTC AG time in Europe/Paris', () => {
    expect(formatTime('2026-04-06T07:00:00.000Z')).toBe('09:00');
    expect(formatDateTime('2026-04-06T07:00:00.000Z')).toContain('09:00');
  });

  it('converts a selected Paris wall-clock time to the correct UTC ISO string', () => {
    expect(toParisISOString('2026-04-06', '09', '00')).toBe('2026-04-06T07:00:00.000Z');
    expect(toParisISOString('2026-01-15', '09', '00')).toBe('2026-01-15T08:00:00.000Z');
  });

  it('formats and parses a french text date input value', () => {
    expect(formatFrenchDateInputValue('2026-02-18')).toBe('18/02/2026');
    expect(normalizeFrenchDateInputValue('18022026')).toBe('18/02/2026');
    expect(parseFrenchDateInputValue('18/02/2026')).toBe('2026-02-18');
  });

  it('rejects invalid french text date input values', () => {
    expect(parseFrenchDateInputValue('31/02/2026')).toBe('');
    expect(parseFrenchDateInputValue('18/02/202')).toBe('');
  });
});

describe('getDefaultFundingCallDate', () => {
  it('defaults the first funding date to January 1st of year n+1 based on the AG date', () => {
    expect(getDefaultFundingCallDate([], '2026-11-18')).toBe('2027-01-01');
  });

  it('keeps added funding dates in year n+1 by extending the existing schedule', () => {
    expect(getDefaultFundingCallDate(['2027-01-01'], '2026-11-18')).toBe('2027-04-01');
    expect(getDefaultFundingCallDate(['2027-01-01', '2027-04-01'], '2026-11-18')).toBe('2027-07-01');
  });
});
