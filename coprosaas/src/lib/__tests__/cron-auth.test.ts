import { describe, expect, it } from 'vitest';
import { getCronAuthState, isValidCronSecret } from '../cron-auth';

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

  it('accepts previous secret during rotation', () => {
    process.env.CRON_SECRET = 'new_secret';
    process.env.CRON_SECRET_PREVIOUS = 'old_secret';

    const request = {
      headers: {
        get: (header: string) => {
          if (header.toLowerCase() === 'authorization') {
            return 'Bearer old_secret';
          }

          return null;
        },
      },
    } as unknown as Request;

    const state = getCronAuthState(request as never);
    expect(state.ok).toBe(true);
  });
});
