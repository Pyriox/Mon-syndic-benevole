import { describe, expect, it } from 'vitest';
import { isValidCronSecret } from '../cron-auth';

describe('isValidCronSecret', () => {
  it('accepts a standard Bearer header', () => {
    expect(isValidCronSecret('Bearer secret123', 'secret123')).toBe(true);
  });

  it('accepts lowercase bearer and trims surrounding whitespace', () => {
    expect(isValidCronSecret('  bearer   secret123   ', '  secret123  ')).toBe(true);
  });

  it('rejects mismatched secrets', () => {
    expect(isValidCronSecret('Bearer wrong', 'secret123')).toBe(false);
  });
});
