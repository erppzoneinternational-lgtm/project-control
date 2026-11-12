import { describe, it, expect } from 'vitest';
import { isE2EBypassAllowed } from '../e2e-bypass';

const withHeader = (v: string | null) => ({
  header: (name: string) => (name === 'x-pzone-e2e' ? v : null),
  cookie: () => undefined,
});
const withCookie = (v: string | undefined) => ({
  header: () => null,
  cookie: (name: string) => (name === 'pzone-e2e-bypass' ? v : undefined),
});

describe('isE2EBypassAllowed', () => {
  it('denies header bypass when server flag is NOT set (production default)', () => {
    expect(isE2EBypassAllowed(withHeader('true'), {})).toBe(false);
  });

  it('denies cookie bypass when server flag is NOT set (production default)', () => {
    expect(isE2EBypassAllowed(withCookie('true'), {})).toBe(false);
  });

  it('denies when flag is set to anything other than "true"', () => {
    expect(isE2EBypassAllowed(withHeader('true'), { PZONE_E2E_ENABLED: '1' })).toBe(false);
    expect(isE2EBypassAllowed(withHeader('true'), { PZONE_E2E_ENABLED: 'false' })).toBe(false);
  });

  it('denies on Vercel even if the flag is accidentally set', () => {
    expect(
      isE2EBypassAllowed(withHeader('true'), { PZONE_E2E_ENABLED: 'true', VERCEL: '1' }),
    ).toBe(false);
  });

  it('denies when NODE_ENV is production AND VERCEL_ENV is production', () => {
    expect(
      isE2EBypassAllowed(withCookie('true'), {
        PZONE_E2E_ENABLED: 'true',
        VERCEL_ENV: 'production',
      }),
    ).toBe(false);
  });

  it('allows header bypass when flag is on and not on Vercel', () => {
    expect(isE2EBypassAllowed(withHeader('true'), { PZONE_E2E_ENABLED: 'true' })).toBe(true);
  });

  it('allows cookie bypass when flag is on and not on Vercel', () => {
    expect(isE2EBypassAllowed(withCookie('true'), { PZONE_E2E_ENABLED: 'true' })).toBe(true);
  });

  it('denies when flag is on but request carries no bypass marker', () => {
    expect(isE2EBypassAllowed(withHeader(null), { PZONE_E2E_ENABLED: 'true' })).toBe(false);
    expect(isE2EBypassAllowed(withCookie(undefined), { PZONE_E2E_ENABLED: 'true' })).toBe(false);
  });

  it('denies when marker value is not exactly "true"', () => {
    expect(isE2EBypassAllowed(withHeader('yes'), { PZONE_E2E_ENABLED: 'true' })).toBe(false);
    expect(isE2EBypassAllowed(withCookie('1'), { PZONE_E2E_ENABLED: 'true' })).toBe(false);
  });
});
