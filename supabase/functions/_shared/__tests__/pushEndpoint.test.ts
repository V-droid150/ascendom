import { isAllowedPushEndpoint } from '../pushEndpoint';

describe('isAllowedPushEndpoint', () => {
  it.each([
    'https://fcm.googleapis.com/fcm/send/abc123',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
    'https://web.push.apple.com/QGuQyavXutnMH5',
    'https://wns2-par02p.notify.windows.com/w/?token=BQYAAA',
  ])('accepts the real push service %s', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(true);
  });

  it.each([
    'http://fcm.googleapis.com/fcm/send/abc', // not https
    'https://fcm.googleapis.com:8443/fcm/send/abc', // odd port
    'https://evil.example.com/hook',
    'https://fcm.googleapis.com.evil.example.com/x', // look-alike prefix
    'https://evilpush.apple.com/x', // suffix without the dot boundary
    'https://push.apple.com/x', // bare suffix, not a subdomain
    'https://user:pass@fcm.googleapis.com/x',
    'https://169.254.169.254/latest/meta-data',
    'http://localhost:54321/rest/v1/',
    'not a url',
    '',
    42,
    null,
  ])('refuses %p', (endpoint) => {
    expect(isAllowedPushEndpoint(endpoint)).toBe(false);
  });

  it('refuses an absurdly long endpoint', () => {
    expect(isAllowedPushEndpoint(`https://fcm.googleapis.com/${'a'.repeat(3000)}`)).toBe(false);
  });
});
