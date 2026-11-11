/* eslint-disable @typescript-eslint/no-require-imports -- Jest module factories must use require() */
import {
  HANDOFF_TTL_MS,
  handoffUrl,
  normalizeCode,
  parseHandoffParams,
  parsePending,
  randomHex,
  randomUuid,
  safariUrl,
  sha256Hex,
} from '../googleHandoff';
import {
  HANDOFF_ID_PATTERN,
  HANDOFF_SECRET_PATTERN,
} from '../../../supabase/functions/_shared/loginHandoff';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock('@/services/supabase', () => ({ supabase: {} }));

const ID = '3f2b8c1e-9a4d-4c6b-8e1f-0a2b3c4d5e6f';
const SECRET = 'b'.repeat(64);
const NOW = 1_800_000_000_000;

describe('handoff secrets', () => {
  it('makes ids and secrets the server accepts', () => {
    expect(randomUuid()).toMatch(HANDOFF_ID_PATTERN);
    expect(randomHex(32)).toMatch(HANDOFF_SECRET_PATTERN);
    expect(randomHex(32)).not.toBe(randomHex(32));
  });

  it('hashes like the database does (sha256, lowercase hex)', async () => {
    // Same value Postgres gives for encode(digest('abc', 'sha256'), 'hex').
    await expect(sha256Hex('abc')).resolves.toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });
});

describe('links', () => {
  it('puts only the id and the hash in the Safari link', () => {
    const url = handoffUrl('https://ascendom.vercel.app', { id: ID, secretHash: SECRET });
    expect(url).toBe(`https://ascendom.vercel.app/auth/handoff?id=${ID}&h=${SECRET}`);
  });

  it('switches https links to the open-in-Safari scheme', () => {
    expect(safariUrl('https://ascendom.vercel.app/auth/handoff?id=1')).toBe(
      'x-safari-https://ascendom.vercel.app/auth/handoff?id=1',
    );
    expect(safariUrl('http://localhost:8081/x')).toBe('http://localhost:8081/x');
  });

  it('accepts only well-formed link params', () => {
    expect(parseHandoffParams(ID, SECRET)).toEqual({ id: ID, secretHash: SECRET });
    expect(parseHandoffParams(undefined, SECRET)).toBeNull();
    expect(parseHandoffParams(ID, 'short')).toBeNull();
    expect(parseHandoffParams(['x'], SECRET)).toBeNull();
  });
});

describe('parsePending', () => {
  const stored = (overrides: Record<string, unknown> = {}): string =>
    JSON.stringify({ id: ID, secret: SECRET, createdAt: NOW, returnTo: 'settings', ...overrides });

  it('reads a fresh handoff', () => {
    expect(parsePending(stored(), NOW + 1000)).toEqual({
      id: ID,
      secret: SECRET,
      createdAt: NOW,
      returnTo: 'settings',
    });
  });

  it('drops one older than ten minutes', () => {
    expect(parsePending(stored(), NOW + HANDOFF_TTL_MS)).not.toBeNull();
    expect(parsePending(stored(), NOW + HANDOFF_TTL_MS + 1)).toBeNull();
  });

  it('defaults an unknown return to the title screen', () => {
    expect(parsePending(stored({ returnTo: 'elsewhere' }), NOW)?.returnTo).toBe('title');
  });

  it.each([
    ['nothing', null],
    ['not JSON', '{oops'],
    ['bad id', stored({ id: 'nope' })],
    ['bad secret', stored({ secret: 'xyz' })],
    ['no timestamp', stored({ createdAt: 'yesterday' })],
  ])('ignores %s', (_label, raw) => {
    expect(parsePending(raw, NOW)).toBeNull();
  });
});

describe('normalizeCode', () => {
  it('keeps up to six digits and drops spaces or dashes', () => {
    expect(normalizeCode('123 456')).toBe('123456');
    expect(normalizeCode('123-4567')).toBe('123456');
    expect(normalizeCode('ab12')).toBe('12');
  });
});
