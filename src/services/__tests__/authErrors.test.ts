import { authErrorKey } from '../authErrors';

describe('authErrorKey', () => {
  it.each([
    [{ code: 'invalid_credentials' }, 'wrongCredentials'],
    [{ message: 'Invalid login credentials' }, 'wrongCredentials'],
    [{ code: 'user_already_exists' }, 'alreadyRegistered'],
    [{ code: 'email_exists' }, 'alreadyRegistered'],
    [{ message: 'User already registered' }, 'alreadyRegistered'],
    [{ code: 'email_not_confirmed' }, 'emailNotConfirmed'],
    [{ message: 'Email not confirmed' }, 'emailNotConfirmed'],
    [{ code: 'weak_password' }, 'weakPassword'],
    [{ message: 'Password should be at least 6 characters.' }, 'weakPassword'],
    [{ code: 'email_address_invalid' }, 'invalidEmail'],
    [{ status: 429 }, 'rateLimited'],
    [{ code: 'over_email_send_rate_limit' }, 'rateLimited'],
    [{ message: 'Failed to fetch' }, 'network'],
    [{ code: 'something_new', status: 500 }, 'unknown'],
    [{}, 'unknown'],
  ] as const)('maps %j to %s', (error, expected) => {
    expect(authErrorKey(error)).toBe(expected);
  });
});
