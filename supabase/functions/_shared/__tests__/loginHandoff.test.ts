import { failureStatus, parseFailure, parseRedeemRequest } from '../loginHandoff';

const ID = '3f2b8c1e-9a4d-4c6b-8e1f-0a2b3c4d5e6f';
const SECRET = 'a'.repeat(64);

describe('parseRedeemRequest', () => {
  it('accepts a well-formed request', () => {
    expect(parseRedeemRequest({ id: ID, secret: SECRET, code: '012345' })).toEqual({
      id: ID,
      secret: SECRET,
      code: '012345',
    });
  });

  it.each([
    ['not an object', 'nope'],
    ['null', null],
    ['missing code', { id: ID, secret: SECRET }],
    ['code too short', { id: ID, secret: SECRET, code: '12345' }],
    ['code with letters', { id: ID, secret: SECRET, code: '12a456' }],
    ['code as a number', { id: ID, secret: SECRET, code: 123456 }],
    ['uppercase id', { id: ID.toUpperCase(), secret: SECRET, code: '123456' }],
    ['id not a uuid', { id: 'abc', secret: SECRET, code: '123456' }],
    ['short secret', { id: ID, secret: 'a'.repeat(63), code: '123456' }],
    ['secret not hex', { id: ID, secret: 'g'.repeat(64), code: '123456' }],
    ['SQL in the id', { id: `${ID}' or 1=1`, secret: SECRET, code: '123456' }],
  ])('rejects %s', (_label, body) => {
    expect(parseRedeemRequest(body)).toBeNull();
  });
});

describe('failures', () => {
  it('gives each failure its own status', () => {
    expect(failureStatus('invalid')).toBe(400);
    expect(failureStatus('wrong_code')).toBe(401);
    expect(failureStatus('not_found')).toBe(404);
    expect(failureStatus('expired')).toBe(410);
    expect(failureStatus('locked')).toBe(429);
  });

  it('reads known failures back and treats anything else as invalid', () => {
    expect(parseFailure('locked')).toBe('locked');
    expect(parseFailure('wrong_code')).toBe('wrong_code');
    expect(parseFailure('toString')).toBe('invalid');
    expect(parseFailure(undefined)).toBe('invalid');
    expect(parseFailure(42)).toBe('invalid');
  });
});
